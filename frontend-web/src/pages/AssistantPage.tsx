import React, { useState } from 'react';
import { Paper, Typography, Box, Stack, TextField, IconButton, Avatar, Divider } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import api from '../services/api';

type Msg = { role: 'user' | 'assistant'; content: string };

const AssistantPage: React.FC = () => {
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'assistant', content: '¡Hola! Soy el asistente del panel. ¿En qué te ayudo?' },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;

    const next: Msg[] = [...messages, { role: 'user' as const, content: text }];
    setMessages(next);
    setInput('');
    setSending(true);

    try {
      const { data } = await api.post<{ reply: string }>('/assistant/chat', { messages: next });
      setMessages(prev => [
        ...prev,
        { role: 'assistant' as const, content: data.reply ?? '(sin respuesta)' },
      ]);
    } catch (e) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant' as const, content: 'Hubo un error generando la respuesta.' },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>Asistente IA</Typography>

      <Box sx={{ maxHeight: 420, overflowY: 'auto', mb: 2 }}>
        {messages.map((m, i) => (
          <Stack key={i} direction="row" spacing={2} sx={{ mb: 1, alignItems: 'flex-start' }}>
            <Avatar sx={{ bgcolor: m.role === 'assistant' ? 'primary.main' : 'grey.600' }}>
              {m.role === 'assistant' ? 'A' : 'U'}
            </Avatar>
            <Paper
              sx={{
                p: 1.5,
                bgcolor: m.role === 'assistant' ? 'grey.100' : 'grey.200',
                maxWidth: '75%',
              }}
            >
              <Typography variant="body2" whiteSpace="pre-wrap">{m.content}</Typography>
            </Paper>
          </Stack>
        ))}
      </Box>

      <Divider sx={{ mb: 2 }} />

      <Stack direction="row" spacing={1}>
        <TextField
          fullWidth
          size="small"
          placeholder="Escribe tu consulta…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
        />
        <IconButton color="primary" onClick={send} disabled={sending || !input.trim()}>
          <SendIcon />
        </IconButton>
      </Stack>
    </Paper>
  );
};

export default AssistantPage;
