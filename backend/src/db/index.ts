import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// --- ZONA DE DEPURACIÓN  ---
console.log("---------------------------------------------------------");
console.log("🔍 DIAGNÓSTICO DE BASE DE DATOS INICIADO");
console.log("1. ¿Existe DATABASE_URL?:", process.env.DATABASE_URL ? "SÍ ✅" : "NO ❌");
if (process.env.DATABASE_URL) {
    console.log("2. Inicio de la URL:", process.env.DATABASE_URL.substring(0, 20) + "...");
} else {
    console.log("2. Variables sueltas encontradas:", {
        host: process.env.DB_HOST || 'No definido',
        user: process.env.DB_USER || 'No definido'
    });
}
console.log("---------------------------------------------------------");
// ----------------------------------------

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    }
  : {
      user: process.env.DB_USER as string,
      host: process.env.DB_HOST as string,
      database: process.env.DB_NAME as string,
      password: process.env.DB_PASSWORD as string,
      port: parseInt(process.env.DB_PORT || '5432'),
    };

const pool = new Pool(poolConfig);

pool.on('connect', () => {
  console.log('Base de Datos conectada correctamente');
});

pool.on('error', (err) => {
  console.error(' Error CRÍTICO en Base de Datos:', err);
});

export default {
  query: (text: string, params?: any[]) => pool.query(text, params),
};