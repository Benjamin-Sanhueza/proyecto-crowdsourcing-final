import { Router } from 'express';
import axios from 'axios';

const router = Router();

router.post('/chat', async (req, res) => {
  try {
    const { messages = [] } = req.body ?? {};

    const system = {
      role: 'system',
      content:
        'Eres el asistente del Panel de CrowdSense. Responde en español. ' +
        'Puedes ayudar a interpretar gráficos de correlación y regresión y a navegar funcionalidades del panel.'
    };

    const payload = {
      model: process.env.AI_MODEL ?? 'gpt-4o-mini',
      temperature: 0.2,
      messages: [system, ...messages],
    };

    const base = process.env.AI_BASE_URL?.replace(/\/$/, '') || 'https://api.openai.com/v1';
    const r = await axios.post(`${base}/chat/completions`, payload, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.AI_API_KEY}`,
      },
      timeout: 60_000,
    });

    const reply = r.data?.choices?.[0]?.message?.content ?? '';
    res.json({ reply });
  } catch (err: any) {
    console.error('AI chat error:', err?.response?.data || err?.message || err);
    res.status(500).json({ message: 'No se pudo generar respuesta.' });
  }
});

export default router;
