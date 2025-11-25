import React, { useEffect, useMemo, useState } from 'react';
import {
  Paper, Typography, Box, TextField, Button, Stack, Alert,
  Table, TableHead, TableRow, TableCell, TableBody, Divider
} from '@mui/material';
import api from '../services/api';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  Line, ResponsiveContainer, Label
} from 'recharts';

type Row = { month: string; active_students: number; reports: number };

function pearson(x: number[], y: number[]) {
  const n = Math.min(x.length, y.length);
  if (n < 2) return NaN;
  const mx = x.reduce((a, b) => a + b, 0) / n;
  const my = y.reduce((a, b) => a + b, 0) / n;
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) {
    const vx = x[i] - mx, vy = y[i] - my;
    num += vx * vy; dx += vx * vx; dy += vy * vy;
  }
  const den = Math.sqrt(dx * dy);
  return den === 0 ? NaN : num / den;
}

function linearRegression(x: number[], y: number[]) {
  const n = Math.min(x.length, y.length);
  if (n < 2) return { a: 0, b: 0, ok: false };
  const mx = x.reduce((s, v) => s + v, 0) / n;
  const my = y.reduce((s, v) => s + v, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    const vx = x[i] - mx;
    num += vx * (y[i] - my);
    den += vx * vx;
  }
  if (den === 0) return { a: my, b: 0, ok: false };
  const b = num / den;
  const a = my - b * mx;
  return { a, b, ok: true };
}

const SimpleRegressionPage: React.FC = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState('');
  const [month, setMonth] = useState(''); 
  const [active, setActive] = useState<number | ''>('');
  const [predictX, setPredictX] = useState<number | ''>('');

  const load = async () => {
    try {
      setError('');
      const { data } = await api.get<Row[]>('/analytics/regression-dataset');
      setRows(data);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Error al cargar datos');
    }
  };

  useEffect(() => { load(); }, []);

  const xs = useMemo(() => rows.map(r => r.active_students), [rows]);
  const ys = useMemo(() => rows.map(r => r.reports), [rows]);
  const r = pearson(xs, ys);
  const { a, b, ok } = linearRegression(xs, ys);

  const minX = Math.min(...xs, 0);
  const maxX = Math.max(...xs, 1);
  const regLine = ok ? [
    { x: minX, y: a + b * minX },
    { x: maxX, y: a + b * maxX }
  ] : [];

  const yPred = ((): number | null => {
    if (!ok || predictX === '' || typeof predictX !== 'number') return null;
    const yhat = a + b * predictX;
    return Math.max(0, yhat);
  })();

  const handleSave = async () => {
    if (!month || active === '' || active < 0) return;
    try {
      await api.post('/analytics/active-students', {
        month, active_students: Number(active),
      });
      setMonth(''); setActive('');
      await load();
    } catch (e: any) {
      setError(e.response?.data?.message || 'No se pudo guardar');
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Regresión simple: Reportes mensuales vs Estudiantes activos
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Ingresa/actualiza el número de estudiantes activos por mes y observa la relación con los reportes.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Formulario de carga */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <TextField
          label="Mes (YYYY-MM)"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          placeholder="2025-09"
        />
        <TextField
          label="Estudiantes activos"
          type="number"
          inputProps={{ min: 0 }}
          value={active}
          onChange={(e) => setActive(e.target.value === '' ? '' : Number(e.target.value))}
        />
        <Button variant="contained" onClick={handleSave}>Guardar</Button>
      </Stack>

      <Divider sx={{ my: 2 }} />

      {/* Predicción y métricas */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <TextField
          label="Predecir reportes para estudiantes activos"
          type="number"
          value={predictX}
          onChange={(e) => setPredictX(e.target.value === '' ? '' : Number(e.target.value))}
        />
        <Box sx={{ alignSelf: 'center' }}>
          <Typography>
            r (Pearson): <strong>{isNaN(r) ? '—' : r.toFixed(3)}</strong>
            {ok && <> — y = {a.toFixed(2)} + {b.toFixed(2)}·x</>}
          </Typography>
          {yPred !== null && (
            <Typography>Predicción: <strong>{yPred.toFixed(1)} reportes/mes</strong></Typography>
          )}
        </Box>
      </Stack>

      {/* Gráfico */}
      <Box sx={{ width: '100%', height: 360, mb: 3 }}>
        {rows.length === 0 ? (
          <Alert severity="info">Aún no hay datos. Carga al menos un mes con estudiantes activos.</Alert>
        ) : (
          <ResponsiveContainer>
            <ScatterChart data={rows}>
              <CartesianGrid strokeDasharray="3 3" />

              <XAxis type="number" dataKey="active_students">
                <Label value="Estudiantes activos (n)" position="insideBottom" offset={-5} />
              </XAxis>

              <YAxis type="number" dataKey="reports" allowDecimals={false}>
                <Label
                  value="Reportes del mes (n)"
                  angle={-90}
                  position="insideLeft"
                  offset={10}
                />
              </YAxis>

              <Tooltip
                formatter={(value, name, ctx: any) => {
                  const { active_students, reports } = ctx?.payload || {};
                  if (name === 'active_students') return [active_students, 'Estudiantes activos'];
                  if (name === 'reports') return [reports, 'Reportes'];
                  return [value, name];
                }}
                labelFormatter={(_, p) => p?.[0]?.payload?.month ?? ''}
                contentStyle={{ whiteSpace: 'nowrap' }}
              />

              <Legend />

              {/* Puntos */}
              <Scatter name="Observaciones (mes)" data={rows} fill="#1976d2" />

              {/* Recta de regresión */}
              {ok && (
                <Line
                  name="Recta de regresión"
                  type="linear"
                  data={regLine}  
                  dataKey="y"
                  dot={false}
                  stroke="#dc004e"
                  strokeDasharray="4 2"
                  isAnimationActive={false}
                />
              )}
            </ScatterChart>
          </ResponsiveContainer>
        )}
      </Box>

      {/* Tabla */}
      <Typography variant="h6" gutterBottom>Detalle por mes</Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Mes</TableCell>
            <TableCell align="right">Estudiantes activos</TableCell>
            <TableCell align="right">Reportes</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map(r => (
            <TableRow key={r.month}>
              <TableCell>{r.month}</TableCell>
              <TableCell align="right">{r.active_students}</TableCell>
              <TableCell align="right">{r.reports}</TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && <TableRow><TableCell colSpan={3}>Sin datos</TableCell></TableRow>}
        </TableBody>
      </Table>
    </Paper>
  );
};

export default SimpleRegressionPage;
