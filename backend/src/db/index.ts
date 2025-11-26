import { Pool } from 'pg';
import dotenv from 'dotenv';
import dns from 'dns'; 

dotenv.config();


if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}
// -------------------------------------------

// Configuración dinámica
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
  console.log('✅ Base de Datos conectada correctamente');
});

pool.on('error', (err) => {
  console.error('❌ Error CRÍTICO en Base de Datos:', err);
});

export default {
  query: (text: string, params?: any[]) => pool.query(text, params),
};