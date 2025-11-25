import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// --- IMPORTAR RUTAS ---
import incidentRoutes from './routes/incidentRoutes';
import authRoutes from './routes/authRoutes';          
import assistantRoutes from './routes/assistantRoutes'; 
// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middlewares ---
app.use(cors()); // Permite conexiones externas (Vercel/Localhost)
app.use(express.json()); // Permite leer JSON en los POST
app.use(morgan('dev')); // Muestra logs de las peticiones en consola

// --- Configuración de carpeta Uploads ---
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Carpeta uploads creada automáticamente');
}

// Servir la carpeta de imágenes públicamente
app.use('/uploads', express.static(uploadsDir));

// --- CONECTAR RUTAS ---
app.use('/api/incidents', incidentRoutes);
app.use('/api/auth', authRoutes);           // <--- ¡AQUÍ CONECTAMOS EL LOGIN/REGISTER!
app.use('/api/assistant', assistantRoutes); // <--- Aquí conectamos la IA

// Ruta de prueba (Health Check)
app.get('/', (req, res) => {
    res.send('API Crowdsourcing Universitario: ONLINE ');
});

// --- Iniciar Servidor ---
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
    console.log(`URL de IA configurada: ${process.env.AI_SERVICE_URL || 'No definida (usando default)'}`);
});