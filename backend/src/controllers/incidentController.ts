import { Request, Response } from 'express';
import db from '../db';
import axios from 'axios';

/**
 * Estructura de respuesta esperada del microservicio de Inteligencia Artificial.
 */
interface AIResponse {
  is_toxic: boolean;
  duplicate_detected: boolean;
  toxicity_score: number;
  moderation_flag?: boolean;
}

// ------------------------------------------------------------------
// 1. CREAR INCIDENCIA (Orquestación con IA y Persistencia)
// ------------------------------------------------------------------
export const createIncident = async (req: Request, res: Response) => {
  const { title, description, category, location } = req.body;
  
  // Extracción segura de datos adjuntos y usuario (Casting a any para compatibilidad con middlewares)
  const userId = (req as any).user?.id; 
  const files = (req as any).files; 

  // Validación y normalización del nivel de satisfacción (opcional)
  let satisfaction: number | null = null;
  if (req.body.satisfaction !== undefined && req.body.satisfaction !== null && req.body.satisfaction !== '') {
    const parsed = Number(req.body.satisfaction);
    if (!Number.isFinite(parsed) || parsed < 1 || parsed > 5) {
      return res.status(400).json({ message: 'La satisfacción debe ser un número entre 1 y 5.' });
    }
    satisfaction = Math.round(parsed);
  }

  // Validación de campos obligatorios
  if (!title || !description || !category || !location) {
    return res.status(400).json({ message: 'Todos los campos son requeridos.' });
  }

  // --- FASE DE ANÁLISIS INTELIGENTE (IA) ---
  // Inicializamos con valores por defecto (Fail-safe)
  let aiResult: AIResponse = {
    is_toxic: false,
    duplicate_detected: false,
    toxicity_score: 0
  };

  try {
    // 1. Recuperación de contexto histórico para deduplicación.
    // SELECCIONAMOS TÍTULO Y DESCRIPCIÓN para mayor precisión en la comparación semántica.
    const prevIncidents = await db.query(
      'SELECT title, description FROM incidents ORDER BY created_at DESC LIMIT 50'
    );

    // 2. Preprocesamiento de datos históricos (Concatenación)
    // Combinamos título y descripción para que la IA tenga más texto donde buscar similitudes.
    const existingTexts = prevIncidents.rows.map((row: any) => `${row.title} ${row.description}`);

    // 3. Comunicación con el Microservicio de IA
    const aiUrl = process.env.AI_SERVICE_URL || 'http://localhost:5000';
    
    // Verificamos disponibilidad de axios antes de la llamada
    if (axios) {
      console.log(`[IncidentController] Solicitando análisis a IA en: ${aiUrl}`);
      
      const response = await axios.post(`${aiUrl}/moderate`, {
        text: `${title} ${description}`, // Texto actual completo
        existing_titles: existingTexts   // Contexto histórico completo
      });
      
      aiResult = response.data;
      console.log("[IncidentController] Resultado IA:", aiResult);
    }
  } catch (error) {
    // Manejo de error no bloqueante: Si la IA falla, se permite la creación de la incidencia.
    console.error("[IncidentController] Advertencia: Fallo en conexión con IA, procediendo sin análisis.", error);
  }

  // --- FASE DE PERSISTENCIA (BASE DE DATOS) ---
  try {
    // Inserción de la incidencia incluyendo metadatos de IA
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
        true, // Flag ai_moderated (True pues se intentó el análisis)
        aiResult.is_toxic,
        aiResult.toxicity_score,
        aiResult.duplicate_detected
      ]
    );

    const incidentId = newIncident.rows[0].id;

    // Procesamiento de imágenes adjuntas
    if (files && files.length > 0) {
      for (const file of files) {
        // Tipamos el archivo como 'any' para evitar conflictos de tipos con Multer
        const f = file as any;
        const imageUrl = `/uploads/${f.filename}`;
        
        await db.query(
          'INSERT INTO incident_images (incident_id, image_url) VALUES ($1, $2)',
          [incidentId, imageUrl]
        );
      }
    }

    // Respuesta exitosa (201 Created) incluyendo el análisis para feedback inmediato
    res.status(201).json({
      ...newIncident.rows[0],
      ai_analysis: aiResult
    });

  } catch (error) {
    console.error("[IncidentController] Error crítico en DB:", error);
    res.status(500).json({ message: 'Error al crear la incidencia en base de datos.' });
  }
};

// ------------------------------------------------------------------
// 2. OBTENER INCIDENCIAS DEL USUARIO
// ------------------------------------------------------------------
export const getUserIncidents = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id; 
  
  try {
    const result = await db.query(
      'SELECT * FROM incidents WHERE user_id = $1 ORDER BY created_at DESC', 
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error interno al obtener incidencias.' });
  }
};

// ------------------------------------------------------------------
// 3. OBTENER TODAS LAS INCIDENCIAS (VISTA ADMINISTRADOR)
// ------------------------------------------------------------------
export const getAllIncidents = async (req: Request, res: Response) => {
  try {
    // Consulta con JOIN para enriquecer la respuesta con datos de usuario e imágenes
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
    res.status(500).json({ message: 'Error interno al listar incidencias.' });
  }
};

// ------------------------------------------------------------------
// 4. ELIMINAR INCIDENCIA
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
// 5. ACTUALIZAR ESTADO DE INCIDENCIA
// ------------------------------------------------------------------
export const updateIncidentStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  // Validación estricta de estados permitidos
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
    res.status(500).json({ message: 'Error al actualizar el estado.' });
  }
};