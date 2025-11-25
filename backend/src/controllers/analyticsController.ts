import { Request, Response } from 'express';
import db from '../db';

export const upsertActiveStudents = async (req: Request, res: Response) => {
  const { month, active_students } = req.body;

  if (!month || typeof active_students !== 'number' || active_students < 0) {
    return res.status(400).json({ message: 'month (YYYY-MM) y active_students >= 0 son requeridos.' });
  }
  const monthDate = `${month}-01`;

  try {
    const result = await db.query(
      `INSERT INTO monthly_active_students (month, active_students)
       VALUES ($1::date, $2)
       ON CONFLICT (month) DO UPDATE SET active_students = EXCLUDED.active_students
       RETURNING id, to_char(month,'YYYY-MM') AS month, active_students`,
      [monthDate, active_students]
    );
    res.status(201).json(result.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error al guardar estudiantes activos.' });
  }
};

export const listActiveStudents = async (_req: Request, res: Response) => {
  try {
    const result = await db.query(
      `SELECT to_char(month,'YYYY-MM') AS month, active_students
       FROM monthly_active_students
       ORDER BY month ASC`
    );
    res.json(result.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error al listar estudiantes activos.' });
  }
};

export const multiRegressionDataset = async (req: Request, res: Response) => {
  const allowed = ['equipment', 'infrastructure', 'services', 'other'] as const;
  const target = (req.query.target as string) || 'equipment';
  if (!allowed.includes(target as any)) {
    return res.status(400).json({ message: 'target inválido. Use equipment|infrastructure|services|other' });
  }

  try {
    const result = await db.query(
      `
      WITH w AS (
        SELECT
          i.*,
          LAG(i.category) OVER (PARTITION BY i.user_id ORDER BY i.created_at) AS prev_category,
          (COUNT(*) OVER (
             PARTITION BY i.user_id
             ORDER BY i.created_at
             ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
           ))::int AS prior_count
        FROM incidents i
      )
      SELECT
        w.id,
        w.user_id,
        w.category::text AS category,                         -- enum -> text
        COALESCE((w.prev_category)::text, 'none') AS prev_category, -- enum -> text + 'none'
        w.prior_count,
        u.education_level::text AS education_level,           -- enum -> text
        CASE u.education_level
          WHEN 'year1' THEN 1 WHEN 'year2' THEN 2 WHEN 'year3' THEN 3
          WHEN 'year4' THEN 4 WHEN 'year5' THEN 5 ELSE 1 END AS level_num,
        CASE WHEN w.category = $1::incident_category THEN 1 ELSE 0 END AS y
      FROM w
      JOIN users u ON u.id = w.user_id
      ORDER BY w.created_at ASC
      `,
      [target]
    );
    res.json({ target, rows: result.rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error al generar dataset de regresión múltiple.' });
  }
};


export const regressionDataset = async (_req: Request, res: Response) => {
  try {
    const result = await db.query(
      `
      WITH counts AS (
        SELECT date_trunc('month', created_at)::date AS month, COUNT(*) AS reports
        FROM incidents
        GROUP BY 1
      )
      SELECT
        to_char(a.month, 'YYYY-MM') AS month,
        a.active_students,
        COALESCE(c.reports, 0) AS reports
      FROM monthly_active_students a
      LEFT JOIN counts c ON c.month = a.month
      ORDER BY a.month ASC
      `
    );
    res.json(result.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error al obtener dataset de regresión.' });
  }
};
