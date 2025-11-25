import { Request, Response } from 'express';
import db from '../db';
import axios from 'axios';

interface AIResponse {
  is_toxic: boolean;
  duplicate_detected: boolean;
  toxicity_score: number;
}

// ------------------------------------------------------------------
// 1. CREAR INCIDENCIA
// ------------------------------------------------------------------
export const createIncident = async (req: Request, res: Response) => {
  const { title, description, category, location } = req.body;
  
  // CORRECCIÓN 1: Usamos (req as any) aquí
  const userId = (req as any).user?.id; 
  
  // CORRECCIÓN 2: Usamos (req as any) para files
  const files = (req as any).files; 

  // Validación de satisfacción
  let satisfaction: number | null = null;
  if (req.body.satisfaction !== undefined && req.body.satisfaction !== null && req.body.satisfaction !== '') {
    const parsed = Number(req.body.satisfaction);
    if (!Number.isFinite(parsed) || parsed < 1 || parsed > 5) {
      return res.status(400).json({ message: 'La satisfacción debe ser un número entre 1 y 5.' });
    }
    satisfaction = Math.round(parsed);
  }

  if (!title || !description || !category || !location) {
    return res.status(400).json({ message: 'Todos los campos son requeridos.' });
  }

  // --- CONEXIÓN IA ---
  let aiResult: AIResponse = {
    is_toxic: false,
    duplicate_detected: false,
    toxicity_score: 0
  };

  try {
    const prevIncidents = await db.query('SELECT title FROM incidents ORDER BY created_at DESC LIMIT 50');
    const existingTitles = prevIncidents.rows.map((row: any) => row.title);

    const aiUrl = process.env.AI_SERVICE_URL || 'http://localhost:5000';
    
    // Solo intentamos conectar si axios está disponible
    if (axios) {
      console.log(`📡 Consultando IA en: ${aiUrl}`);
      const response = await axios.post(`${aiUrl}/moderate`, {
        text: `${title} ${description}`,
        existing_titles: existingTitles
      });
      aiResult = response.data;
    }
  } catch (error) {
    console.error("⚠️ Error IA (continuando):", error);
  }

  try {
    const newIncident = await db.query(
      `INSERT INTO incidents 
       (title, description, category, location, user_id, satisfaction,
        ai_moderated, ai_is_toxic, ai_toxicity_score, is_duplicate)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        title, 
        description, 
        category, 
        location, 
        userId, 
        satisfaction,
        true,
        aiResult.is_toxic,
        aiResult.toxicity_score,
        aiResult.duplicate_detected
      ]
    );

    const incidentId = newIncident.rows[0].id;

    if (files && files.length > 0) {
      for (const file of files) {
        // Tipamos el archivo como 'any' para evitar errores de TS con Multer
        const f = file as any;
        const imageUrl = `/uploads/${f.filename}`;
        await db.query(
          'INSERT INTO incident_images (incident_id, image_url) VALUES ($1, $2)',
          [incidentId, imageUrl]
        );
      }
    }

    res.status(201).json({
      ...newIncident.rows[0],
      ai_analysis: aiResult
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear la incidencia.' });
  }
};

// ------------------------------------------------------------------
// 2. OBTENER INCIDENCIAS DEL USUARIO
// ------------------------------------------------------------------
export const getUserIncidents = async (req: Request, res: Response) => {

  const userId = (req as any).user?.id; 
  
  try {
    const result = await db.query('SELECT * FROM incidents WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor.' });
  }
};

// ------------------------------------------------------------------
// 3. OBTENER TODAS (ADMIN)
// ------------------------------------------------------------------
export const getAllIncidents = async (req: Request, res: Response) => {
  try {
    const result = await db.query(`
    SELECT
        i.*,
        u.name AS user_name,
        u.email AS user_email,
        COALESCE(ARRAY_AGG(ii.image_url) FILTER (WHERE ii.image_url IS NOT NULL), '{}') AS images
    FROM
        incidents i
    JOIN
        users u ON i.user_id = u.id
    LEFT JOIN
        incident_images ii ON i.id = ii.incident_id
    GROUP BY
        i.id, u.id
    ORDER BY
        i.created_at DESC
`);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor.' });
  }
};

// ------------------------------------------------------------------
// 4. ELIMINAR
// ------------------------------------------------------------------
export const deleteIncident = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM incidents WHERE id = $1 RETURNING id', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Incidencia no encontrada.' });
    }
    return res.json({ message: 'Incidencia eliminada correctamente.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error al eliminar la incidencia.' });
  }
};

// ------------------------------------------------------------------
// 5. ACTUALIZAR ESTADO
// ------------------------------------------------------------------
export const updateIncidentStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !['pending', 'in_progress', 'resolved'].includes(status)) {
    return res.status(400).json({ message: 'Estado inválido.' });
  }

  try {
    const result = await db.query(
      'UPDATE incidents SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Incidencia no encontrada.' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor.' });
  }
};