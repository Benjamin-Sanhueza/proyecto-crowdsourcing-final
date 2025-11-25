import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import incidentRoutes from './routes/incidentRoutes';
import path from 'path';
import fs from 'fs';

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middlewares ---
app.use(cors()); // Permite conexiones externas (Vercel/Localhost)
app.use(express.json()); // Permite leer JSON en los POST
app.use(morgan('dev')); // Muestra logs de las peticiones en consola

// --- Configuración de carpeta Uploads ---
// (Vital para que Multer no falle al subir fotos)
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('📁 Carpeta uploads creada automáticamente');
}

// Servir la carpeta de imágenes públicamente
// Así el frontend puede mostrar las fotos con <img src="...">
app.use('/uploads', express.static(uploadsDir));

// --- Rutas ---
app.use('/api/incidents', incidentRoutes);

// Ruta de prueba (Health Check)
app.get('/', (req, res) => {
    res.send('API Crowdsourcing Universitario: ONLINE 🟢');
});

// --- Iniciar Servidor ---
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
    console.log(`📡 URL de IA configurada: ${process.env.AI_SERVICE_URL || 'No definida (usando default)'}`);
});