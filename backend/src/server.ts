import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import analyticsRoutes from './routes/analyticsRoutes';
import authRoutes from './routes/authRoutes';
import incidentRoutes from './routes/incidentRoutes';
import assistantRoutes from './routes/assistantRoutes';
import 'dotenv/config';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 4000);
const HOST = process.env.HOST || '0.0.0.0';

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/analytics', analyticsRoutes);

app.use('/api/assistant', assistantRoutes);
app.get('/', (req, res) => {
  res.send('API del SGIU funcionando!');
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});