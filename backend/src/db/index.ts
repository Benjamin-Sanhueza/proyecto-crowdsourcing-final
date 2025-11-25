import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER as string,    
  host: process.env.DB_HOST as string,
  database: process.env.DB_NAME as string,
  password: process.env.DB_PASSWORD as string,
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: {
    rejectUnauthorized: false
  }
});

pool.on('connect', () => {
  console.log('✅ Base de Datos conectada');
});

pool.on('error', (err) => {
  console.error('❌ Error en Base de Datos:', err);
});

export default {
  query: (text: string, params?: any[]) => pool.query(text, params),
};