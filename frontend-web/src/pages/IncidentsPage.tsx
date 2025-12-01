import React, { useEffect, useState, useMemo } from 'react';
import {
  Typography, Paper, CircularProgress, Alert, TableContainer, Table, TableHead,
  TableRow, TableCell, TableBody, Chip, Modal, Box, Select, MenuItem, IconButton, Tooltip, Grid, Card, CardContent
} from '@mui/material'; // Se eliminó 'Divider' de aquí
import DeleteIcon from '@mui/icons-material/Delete';
import AssessmentIcon from '@mui/icons-material/Assessment';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BarChartIcon from '@mui/icons-material/BarChart';
import api from '../services/api';

// --- IMPORTAMOS LOS GRÁFICOS ---
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell 
} from 'recharts';

const BASE_URL = 'https://proyecto-crowdsourcing-final.onrender.com';

interface Incident {
  id: number;
  title: string;
  description: string;
  category: string;
  location: string;
  status: 'pending' | 'in_progress' | 'resolved';
  user_name: string;
  created_at: string;
  images: string[];
  ai_moderated: boolean;
  ai_is_toxic: boolean;
  ai_toxicity_score: number;
  is_duplicate: boolean;
}

const getStatusChipColor = (status: Incident['status']) => {
  switch (status) {
    case 'pending': return 'warning';
    case 'in_progress': return 'primary';
    case 'resolved': return 'success';
    default: return 'default';
  }
};

// --- LÓGICA PARA MOSTRAR DOBLE ETIQUETA ---
const renderAIBadge = (incident: Incident) => {
  const badges = [];

  // 1. Chequeamos Toxicidad
  if (incident.ai_is_toxic) {
    const isByRules = incident.ai_toxicity_score === 0;
    badges.push(
      <Tooltip key="toxic" title={isByRules ? "Detectado por Reglas (Lista Negra)" : `Probabilidad IA: ${(incident.ai_toxicity_score * 100).toFixed(1)}%`}>
        <Chip 
          label={isByRules ? "PALABRA PROHIBIDA" : "OFENSIVO"} 
          color="error" 
          size="small" 
          sx={{ fontWeight: 'bold' }} 
        />
      </Tooltip>
    );
  }

  // 2. Chequeamos Duplicado
  if (incident.is_duplicate) {
    badges.push(
      <Tooltip key="duplicate" title="Este reporte es muy similar a uno anterior">
        <Chip label="DUPLICADO" color="warning" size="small" sx={{ fontWeight: 'bold' }} />
      </Tooltip>
    );
  }

  // 3. Si hay badges, los mostramos
  if (badges.length > 0) {
    return (
      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', justifyContent: 'center' }}>
        {badges}
      </Box>
    );
  }

  // 4. Si está limpio
  if (incident.ai_moderated) {
    return <Chip label="LIMPIO" color="success" size="small" variant="outlined" />;
  }

  return <Chip label="PENDIENTE" size="small" />;
};

// Componente de Tarjeta KPI
const StatCard = ({ title, value, icon, color }: any) => (
  <Card sx={{ bgcolor: `${color}10`, height: '100%', boxShadow: 'none', border: `1px solid ${color}30` }}>
    <CardContent>
      <Typography color="textSecondary" variant="caption" sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>{title}</Typography>
      <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: color, mt: 1 }}>
        {value}
      </Typography>
      <Box sx={{ position: 'absolute', top: 15, right: 15, color: color, opacity: 0.3 }}>
        {icon}
      </Box>
    </CardContent>
  </Card>
);

const modalStyle = {
  position: 'absolute' as const, top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
  width: 400, bgcolor: 'background.paper', border: '2px solid #000', boxShadow: 24, p: 4, maxHeight: '90vh', overflowY: 'auto'
};

const lightboxStyle = {
  position: 'absolute' as const, top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
  bgcolor: 'transparent', boxShadow: 'none', p: 0, outline: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%',
};

const IncidentsPage: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState<number | null>(null);
  
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [selectedImageInLightbox, setSelectedImageInLightbox] = useState<string | null>(null);

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const response = await api.get<Incident[]>('/incidents');
        setIncidents(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Error al cargar las incidencias.');
      } finally {
        setLoading(false);
      }
    };
    fetchIncidents();
  }, []);

  // --- CÁLCULOS ---
  const totalIncidents = incidents.length;
  const pendingIncidents = incidents.filter(i => i.status === 'pending').length;
  const aiFilteredCount = incidents.filter(i => i.ai_is_toxic || i.is_duplicate).length;
  const resolvedCount = incidents.filter(i => i.status === 'resolved').length;
  const resolutionRate = totalIncidents > 0 ? ((resolvedCount / totalIncidents) * 100).toFixed(0) : 0;

  const chartData = useMemo(() => {
    const grouped: Record<string, number> = {};
    incidents.forEach(inc => {
      const date = new Date(inc.created_at).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' });
      grouped[date] = (grouped[date] || 0) + 1;
    });
    return Object.keys(grouped).map(date => ({ date, count: grouped[date] })).reverse().slice(0, 7).reverse();
  }, [incidents]);

  const handleOpenModal = (incident: Incident) => setSelectedIncident(incident);
  const handleCloseModal = () => setSelectedIncident(null);
  const handleOpenLightbox = (imageUrl: string) => setSelectedImageInLightbox(imageUrl);
  const handleCloseLightbox = () => setSelectedImageInLightbox(null);

  const handleStatusChange = async (id: number, status: Incident['status']) => {
    setSavingId(id);
    try {
      const { data } = await api.put(`/incidents/${id}`, { status });
      setIncidents(prev => prev.map(i => (i.id === id ? { ...i, status: data.status } : i)));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al actualizar.');
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar esta incidencia?')) return;
    try {
      await api.delete(`/incidents/${id}`);
      setIncidents(prev => prev.filter(i => i.id !== id));
      if (selectedIncident?.id === id) setSelectedIncident(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al eliminar.');
    }
  };

  if (loading) return <CircularProgress sx={{ display: 'block', margin: '20px auto' }} />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4, fontWeight: 'bold', color: '#1976d2', borderBottom: '2px solid #f0f0f0', pb: 2 }}>
        Panel de Control
      </Typography>

      {/* --- SECCIÓN 1: RESUMEN (KPIs) --- */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Reportes" value={totalIncidents} icon={<AssessmentIcon fontSize="large" />} color="#1976d2" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Pendientes" value={pendingIncidents} icon={<WarningIcon fontSize="large" />} color="#ed6c02" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Filtrados IA" value={aiFilteredCount} icon={<WarningIcon fontSize="large" />} color="#d32f2f" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Resolución" value={`${resolutionRate}%`} icon={<CheckCircleIcon fontSize="large" />} color="#2e7d32" />
        </Grid>
      </Grid>

      {/* --- SECCIÓN 2: GRÁFICO --- */}
      <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 2, border: '1px solid #e0e0e0' }}>
        <Box display="flex" alignItems="center" mb={2}>
            <BarChartIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6" fontWeight="bold">Tendencia Semanal</Typography>
        </Box>
        <Box sx={{ height: 300, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
              <RechartsTooltip cursor={{ fill: '#f5f5f5' }} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="count" name="Incidentes" radius={[4, 4, 0, 0]} barSize={50}>
                {/* CORRECCIÓN AQUÍ: Usamos _entry para evitar error de variable no usada */}
                {chartData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill="#1976d2" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Paper>

      {/* --- SECCIÓN 3: TABLA --- */}
      <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid #e0e0e0', overflow: 'hidden' }}>
        <Box sx={{ p: 2, bgcolor: '#f8f9fa', borderBottom: '1px solid #e0e0e0' }}>
            <Typography variant="h6" fontWeight="bold">Detalle de Incidencias</Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Título</strong></TableCell>
                <TableCell align="center"><strong>Análisis IA</strong></TableCell> 
                <TableCell><strong>Reportado por</strong></TableCell>
                <TableCell><strong>Ubicación</strong></TableCell>
                <TableCell><strong>Fecha</strong></TableCell>
                <TableCell><strong>Estado</strong></TableCell>
                <TableCell><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {incidents.map((incident) => (
                <TableRow key={incident.id} hover onClick={() => handleOpenModal(incident)} sx={{ cursor: 'pointer' }}>
                  <TableCell sx={{ fontWeight: 500 }}>{incident.title}</TableCell>
                  
                  {/* AQUÍ SE MUESTRAN LAS ETIQUETAS DOBLES */}
                  <TableCell align="center">{renderAIBadge(incident)}</TableCell>

                  <TableCell>{incident.user_name}</TableCell>
                  <TableCell>{incident.location}</TableCell>
                  <TableCell>{new Date(incident.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Chip label={incident.status} color={getStatusChipColor(incident.status)} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Select
                      size="small"
                      value={incident.status}
                      onChange={(e) => handleStatusChange(incident.id, e.target.value as Incident['status'])}
                      disabled={savingId === incident.id}
                      sx={{ mr: 1, height: 32, fontSize: '0.875rem' }}
                    >
                      <MenuItem value="pending">pending</MenuItem>
                      <MenuItem value="in_progress">in_progress</MenuItem>
                      <MenuItem value="resolved">resolved</MenuItem>
                    </Select>
                    <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); handleDelete(incident.id); }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* MODALS */}
      <Modal open={selectedIncident !== null} onClose={handleCloseModal}>
        <Box sx={modalStyle}>
          <Typography variant="h6" component="h2" gutterBottom>{selectedIncident?.title}</Typography>
          <Box sx={{ mb: 2 }}>{selectedIncident && renderAIBadge(selectedIncident)}</Box>
          <Typography variant="body1" paragraph><strong>Descripción:</strong> {selectedIncident?.description}</Typography>
          <Typography variant="body2" gutterBottom><strong>Ubicación:</strong> {selectedIncident?.location}</Typography>
          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Evidencia:</Typography>
          <Box sx={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {selectedIncident?.images?.map((imgUrl, index) => {
               const fullImageUrl = `${BASE_URL}${imgUrl}`;
               return (
              <img key={index} src={fullImageUrl} width="100" height="100" onClick={() => handleOpenLightbox(fullImageUrl)} style={{ objectFit: 'cover', borderRadius: 4, border: '1px solid #ddd', cursor: 'pointer' }} />
            )})}
          </Box>
        </Box>
      </Modal>

      <Modal open={selectedImageInLightbox !== null} onClose={handleCloseLightbox}>
        <Box sx={lightboxStyle} onClick={handleCloseLightbox}>
          {selectedImageInLightbox && (
            <img src={selectedImageInLightbox} style={{ maxWidth: '95vw', maxHeight: '95vh', objectFit: 'contain', borderRadius: 4 }} onClick={(e) => e.stopPropagation()} />
          )}
        </Box>
      </Modal>
    </Box>
  );
};

export default IncidentsPage;