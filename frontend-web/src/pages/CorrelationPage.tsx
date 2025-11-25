import React, { useEffect, useMemo, useState } from 'react';
import {
  Paper, Typography, Box, FormControl, InputLabel, Select, MenuItem,
  Table, TableHead, TableRow, TableCell, TableBody, Alert, Stack, Chip
} from '@mui/material';
import api from '../services/api';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Line, ResponsiveContainer,
  Label
} from 'recharts';

type Status = 'pending' | 'in_progress' | 'resolved';

interface Incident {
  id: number;
  title: string;
  description: string;
  category: string;
  location: string;
  status: Status;
  user_name: string;
  created_at: string; 
  satisfaction?: number | null; 
}

type MonthKey = string;

function formatMonth(dateIso: string): MonthKey {
  const d = new Date(dateIso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function pearson(x: number[], y: number[]) {
  const n = Math.min(x.length, y.length);
  if (n < 2) return NaN;
  const sx = x.slice(0, n);
  const sy = y.slice(0, n);
  const mx = sx.reduce((a, b) => a + b, 0) / n;
  const my = sy.reduce((a, b) => a + b, 0) / n;
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) {
    const vx = sx[i] - mx;
    const vy = sy[i] - my;
    num += vx * vy;
    dx += vx * vx;
    dy += vy * vy;
  }
  const den = Math.sqrt(dx * dy);
  return den === 0 ? NaN : num / den;
}

function linearRegression(x: number[], y: number[]) {
  const n = Math.min(x.length, y.length);
  if (n < 2) return { a: 0, b: 0, ok: false };
  const sx = x.slice(0, n), sy = y.slice(0, n);
  const mx = sx.reduce((a, b) => a + b, 0) / n;
  const my = sy.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    const vx = sx[i] - mx;
    num += vx * (sy[i] - my);
    den += vx * vx;
  }
  if (den === 0) return { a: my, b: 0, ok: false };
  const b = num / den;           
  const a = my - b * mx;         
  return { a, b, ok: true };
}

const CorrelationPage: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [category, setCategory] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get<Incident[]>('/incidents');
        setIncidents(data);
      } catch (e: any) {
        setError(e.response?.data?.message || 'Error al cargar incidencias');
      }
    })();
  }, []);

  const categories = useMemo(
    () => Array.from(new Set(incidents.map(i => i.category))).sort(),
    [incidents]
  );

  const aggregates = useMemo(() => {
    type Agg = { total: number; rated: number; sumSat: number; month: MonthKey };
    const map = new Map<MonthKey, Agg>();
    const data = (category ? incidents.filter(i => i.category === category) : incidents)
      .slice()
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    for (const it of data) {
      const key = formatMonth(it.created_at);
      const cur = map.get(key) ?? { total: 0, rated: 0, sumSat: 0, month: key };
      cur.total += 1;
      if (it.satisfaction !== null && it.satisfaction !== undefined) {
        cur.rated += 1;
        cur.sumSat += Number(it.satisfaction);
      }
      map.set(key, cur);
    }

    return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
  }, [incidents, category]);

  const chartData = aggregates
    .filter(a => a.rated > 0)
    .map(a => ({
      month: a.month,
      reports: a.total,                        
      avgSatisfaction: a.sumSat / a.rated      
    }));

  const xs = chartData.map(d => d.reports);
  const ys = chartData.map(d => d.avgSatisfaction);
  const r = pearson(xs, ys);
  const { a, b, ok } = linearRegression(xs, ys);

  const minX = Math.min(...xs, 0);
  const maxX = Math.max(...xs, 1);
  const regFit = ok ? [
  { reports: minX, avgSatisfaction: a + b * minX },
  { reports: maxX, avgSatisfaction: a + b * maxX }
] : [];
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Correlación: Reportes vs Satisfacción (real del usuario)
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Para cada <strong>mes</strong> se calcula: <em>nº de reportes</em> y el <em>promedio de satisfacción</em> de las incidencias que sí reportaron nota.
        Los meses sin ninguna nota de satisfacción se omiten del análisis.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <FormControl sx={{ minWidth: 240 }}>
          <InputLabel id="cat-label">Categoría</InputLabel>
          <Select
            labelId="cat-label"
            label="Categoría"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <MenuItem value=""><em>Todas</em></MenuItem>
            {categories.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </Select>
        </FormControl>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Chip label={`Meses analizados: ${chartData.length}`} />
          <Typography variant="subtitle1">
            r (Pearson): <strong>{isNaN(r) ? '—' : r.toFixed(3)}</strong>
          </Typography>
          {ok && <Typography variant="caption">Regresión: y = {a.toFixed(2)} + {b.toFixed(2)}·x</Typography>}
        </Box>
      </Stack>

      {/* Gráfico */}
      <Box sx={{ width: '100%', height: 360, mb: 3 }}>
  {chartData.length === 0 ? (
    <Alert severity="info">No hay meses con notas de satisfacción para esta selección.</Alert>
  ) : (
    <ResponsiveContainer>
      <ScatterChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />

        <XAxis type="number" dataKey="reports">
          <Label value="Reportes del mes (n)" position="insideBottom" offset={-5} />
        </XAxis>

        <YAxis type="number" dataKey="avgSatisfaction" domain={[1, 5]}>
          <Label
            value="Satisfacción promedio (1–5)"
            angle={-90}
            position="insideLeft"
            offset={10}
          />
        </YAxis>

        <Tooltip
          formatter={(value, name, ctx: any) => {
            const { reports, avgSatisfaction } = ctx?.payload || {};
            if (name === 'reports') return [reports, 'Reportes'];
            if (name === 'avgSatisfaction') return [avgSatisfaction, 'Satisfacción prom.'];
            return [value, name];
          }}
          labelFormatter={(_, p) => p?.[0]?.payload?.month ?? ''}
          contentStyle={{ whiteSpace: 'nowrap' }}
        />

        <Legend />

        {/* Puntos */}
        <Scatter name="Observaciones (mes)" data={chartData} fill="#1976d2" />

        {/* Recta de regresión */}
        {ok && (
  <Line
    type="linear"
    name="Línea de regresión"
    data={regFit}
    dataKey="avgSatisfaction"
    dot={false}
    stroke="#dc004e"
    isAnimationActive={false}
  />
)}

      </ScatterChart>
    </ResponsiveContainer>
  )}
</Box>


      {/* Tabla (solo lectura) */}
      <Typography variant="h6" gutterBottom>Detalle mensual</Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Mes</TableCell>
            <TableCell align="right">Reportes (total)</TableCell>
            <TableCell align="right">Con nota</TableCell>
            <TableCell align="right">Satisfacción promedio</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {aggregates.map(row => {
            const avg = row.rated > 0 ? (row.sumSat / row.rated) : null;
            return (
              <TableRow key={row.month}>
                <TableCell>{row.month}</TableCell>
                <TableCell align="right">{row.total}</TableCell>
                <TableCell align="right">{row.rated}</TableCell>
                <TableCell align="right">
                  {avg === null ? '—' : avg.toFixed(2)}
                </TableCell>
              </TableRow>
            );
          })}
          {aggregates.length === 0 && (
            <TableRow><TableCell colSpan={4}>No hay datos</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </Paper>
  );
};

export default CorrelationPage;
