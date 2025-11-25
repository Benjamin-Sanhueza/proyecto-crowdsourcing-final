import React, { useEffect, useMemo, useState } from 'react';
import {
  Paper, Typography, Stack, Alert, Box, TextField, Button,
  MenuItem, Table, TableHead, TableRow, TableCell, TableBody, Chip
} from '@mui/material';
import api from '../services/api';

type Cat = 'equipment'|'infrastructure'|'services'|'other'|'none';
type Edu = 'year1'|'year2'|'year3'|'year4'|'year5';

type Row = {
  id: number;
  user_id: number;
  category: Exclude<Cat,'none'>;
  prev_category: Cat;
  prior_count: number;
  education_level: Edu;
  level_num: number; // 1..5
  y: 0|1;
};

const ALL_CATS: Exclude<Cat,'none'>[] = ['equipment','infrastructure','services','other'];

function sigmoid(z: number) { return 1 / (1 + Math.exp(-z)); }

interface Model {
  w: number[];              
    maxPrior: number;         
}

function trainLogistic(rows: Row[]): Model | null {
  if (rows.length < 8) return null;

  const maxPrior = Math.max(1, ...rows.map(r => r.prior_count));
  const toOneHotPrev = (p: Cat): number[] =>
    ['equipment','infrastructure','services','other','none'].map(c => (p === c ? 1 : 0));

  const X = rows.map(r => {
    const level = r.level_num / 5;         // 0..1
    const prior = r.prior_count / maxPrior; // 0..1
    const prev = toOneHotPrev(r.prev_category);
    return [1, level, prior, ...prev];
  });
  const y = rows.map(r => r.y);

  const n = rows.length, m = X[0].length;
  const w = Array(m).fill(0); 

  const lr = 0.1;        
  const iters = 2000;  
  const lambda = 0.001;  

  for (let t = 0; t < iters; t++) {
    const grad = Array(m).fill(0);
    for (let i = 0; i < n; i++) {
      const z = w.reduce((s, wi, j) => s + wi * X[i][j], 0);
      const p = sigmoid(z);
      const err = p - y[i];
      for (let j = 0; j < m; j++) grad[j] += err * X[i][j];
    }
    for (let j = 0; j < m; j++) {
      const reg = lambda * w[j];
      w[j] -= lr * (grad[j] / n + reg);
    }
  }

  return { w, maxPrior };
}

function predictProb(model: Model, levelNum: number, priorCount: number, prevCategory: Cat) {
  const prior = priorCount / Math.max(1, model.maxPrior);
  const x = [1, levelNum / 5, prior,
    ...( ['equipment','infrastructure','services','other','none'] as Cat[] ).map(c => (c === prevCategory ? 1 : 0))
  ];
  const z = model.w.reduce((s, wi, j) => s + wi * x[j], 0);
  return sigmoid(z);
}

const MultiRegressionPage: React.FC = () => {
  const [target, setTarget] = useState<Exclude<Cat,'none'>>('equipment');
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState('');
  const [model, setModel] = useState<Model|null>(null);

  const load = async () => {
    try {
      setError('');
      const { data } = await api.get<{target: string; rows: Row[]}>(`/analytics/multi-regression-dataset`, { params: { target }});
      setRows(data.rows);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Error al cargar dataset.');
    }
  };

  useEffect(() => { load(); }, [target]);

  useEffect(() => {
    const m = trainLogistic(rows);
    setModel(m);
  }, [rows]);

  const stats = useMemo(() => {
    const n = rows.length;
    const pos = rows.filter(r => r.y === 1).length;
    return { n, pos, neg: n - pos };
  }, [rows]);

  const [predLevel, setPredLevel] = useState(3);
  const [predPrior, setPredPrior] = useState(2);
  const [predPrev, setPredPrev] = useState<Cat>('none');

  const prob = model ? predictProb(model, predLevel, predPrior, predPrev) : null;

  const coefNames = ['bias', 'level(1..5)', 'prior_count(norm)', 'prev_equipment', 'prev_infrastructure', 'prev_services', 'prev_other', 'prev_none'];

  return (
    <Paper sx={{ p: 3 }}>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          Regresión múltiple (logística) — Probabilidad de <Chip size="small" color="primary" label={target} />
        </Typography>
        <TextField select size="small" label="Categoría objetivo" value={target} onChange={e => setTarget(e.target.value as any)}>
          {ALL_CATS.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
        </TextField>
        <Button variant="outlined" onClick={load}>Refrescar</Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Typography sx={{ mb: 2 }}>
        Dataset: <b>{stats.n}</b> filas — Positivos (<b>{target}</b>): <b>{stats.pos}</b> / Negativos: <b>{stats.neg}</b>
      </Typography>

      {!model ? (
        <Alert severity="info">Se necesitan más datos para entrenar (mín. ~8 filas). Crea más incidencias.</Alert>
      ) : (
        <>
          <Typography variant="h6" sx={{ mt: 1 }}>Coeficientes del modelo</Typography>
          <Table size="small" sx={{ mb: 2 }}>
            <TableHead>
              <TableRow>
                <TableCell>Feature</TableCell>
                <TableCell align="right">Peso</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {model.w.map((w, i) => (
                <TableRow key={i}>
                  <TableCell>{coefNames[i] ?? `w${i}`}</TableCell>
                  <TableCell align="right">{w.toFixed(4)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Typography variant="h6">Predicción rápida</Typography>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mt: 1, mb: 2 }}>
            <TextField
              label="Nivel educativo (1..5)"
              type="number"
              inputProps={{ min: 1, max: 5 }}
              value={predLevel}
              onChange={(e) => setPredLevel(Math.max(1, Math.min(5, parseInt(e.target.value || '1', 10))))}
            />
            <TextField
              label="Reportes históricos"
              type="number"
              inputProps={{ min: 0 }}
              value={predPrior}
              onChange={(e) => setPredPrior(Math.max(0, parseInt(e.target.value || '0', 10)))}
            />
            <TextField select label="Categoría previa" value={predPrev} onChange={(e) => setPredPrev(e.target.value as Cat)}>
              {(['none', ...ALL_CATS] as Cat[]).map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </TextField>
          </Stack>
          <Box>
            <Typography>Probabilidad estimada de que el siguiente reporte sea <b>{target}</b>:
              {' '}<b>{(prob! * 100).toFixed(1)}%</b>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              * Modelo: logística con gradiente descendente, features: nivel (1–5), reportes históricos normalizados y categoría previa (one-hot).
            </Typography>
          </Box>
        </>
      )}

      <Typography variant="h6" sx={{ mt: 3 }}>Muestras (últimas 12)</Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>User</TableCell>
            <TableCell>Cat</TableCell>
            <TableCell>Prev</TableCell>
            <TableCell align="right">Prior</TableCell>
            <TableCell align="right">Nivel</TableCell>
            <TableCell align="right">y</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.slice(-12).map(r => (
            <TableRow key={r.id}>
              <TableCell>{r.id}</TableCell>
              <TableCell>{r.user_id}</TableCell>
              <TableCell>{r.category}</TableCell>
              <TableCell>{r.prev_category}</TableCell>
              <TableCell align="right">{r.prior_count}</TableCell>
              <TableCell align="right">{r.level_num}</TableCell>
              <TableCell align="right">{r.y}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
};

export default MultiRegressionPage;
