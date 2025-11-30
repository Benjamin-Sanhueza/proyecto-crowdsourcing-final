import React, { useEffect, useState } from 'react';
import {
  Typography, Paper, CircularProgress, Alert, TableContainer, Table, TableHead,
  TableRow, TableCell, TableBody, Chip, Modal, Box, Select, MenuItem, IconButton, Tooltip, Grid, Card, CardContent
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AssessmentIcon from '@mui/icons-material/Assessment'; // Ícono para métricas
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import api from '../services/api';

// --- CONFIGURACIÓN ---
const BASE_URL = 'https://proyecto-crowdsourcing-final.onrender.com';

// 1. INTERFAZ COMPLETA
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

// 2. ETIQUETAS INTELIGENTES (La corrección visual de "0%")
const renderAIBadge = (incident: Incident) => {
  if (incident.ai_is_toxic) {
    const isByRules = incident.ai_toxicity_score === 0;
    return (
      <Tooltip title={isByRules ? "Detectado por lista de palabras prohibidas (Reglas Estrictas)" : `Probabilidad IA: ${(incident.ai_toxicity_score * 100).toFixed(1)}%`}>
        <Chip label={isByRules ? "PALABRA PROHIBIDA" : "OFENSIVO"} color="error" size="small" sx={{ fontWeight: 'bold' }} />
      </Tooltip>
    );
  }
  if (incident.is_duplicate) {
    return (
      <Tooltip title="Este reporte es muy similar a uno anterior">
        <Chip label="DUPLICADO" color="warning" size="small" sx={{ fontWeight: 'bold' }} />
      </Tooltip>
    );
  }
  if (incident.ai_moderated) {
    return <Chip label="LIMPIO" color="success" size="small" variant="outlined" />;
  }
  return <Chip label="PENDIENTE" size="small" />;
};

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

  // --- CÁLCULO DE MÉTRICAS (KPIs) ---
  const totalIncidents = incidents.length;
  const pendingIncidents = incidents.filter(i => i.status === 'pending').length;
  // Contamos cuántos ha filtrado la IA (tóxicos o duplicados)
  const aiFilteredCount = incidents.filter(i => i.ai_is_toxic || i.is_duplicate).length;
  const resolvedCount = incidents.filter(i => i.status === 'resolved').length;
  // Evitamos división por cero
  const resolutionRate = totalIncidents > 0 ? ((resolvedCount / totalIncidents) * 100).toFixed(0) : 0;

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
      setError(err.response?.data?.message || 'No se pudo actualizar el estado.');
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
      setError(err.response?.data?.message || 'No se pudo eliminar.');
    }
  };

  if (loading) return <CircularProgress sx={{ display: 'block', margin: '20px auto' }} />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4, fontWeight: 'bold', color: '#1976d2' }}>
        Dashboard de Control Universitario
      </Typography>

      {/* --- SECCIÓN DE MÉTRICAS (DASHBOARD) --- */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* KPI 1: Total */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#e3f2fd', height: '100%' }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Reportes</Typography>
              <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                {totalIncidents}
              </Typography>
              <AssessmentIcon sx={{ position: 'absolute', top: 20, right: 20, color: '#90caf9', fontSize: 40, opacity: 0.5 }} />
            </CardContent>
          </Card>
        </Grid>

        {/* KPI 2: Pendientes */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#fff3e0', height: '100%' }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Pendientes de Atención</Typography>
              <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: '#ed6c02' }}>
                {pendingIncidents}
              </Typography>
              <WarningIcon sx={{ position: 'absolute', top: 20, right: 20, color: '#ffb74d', fontSize: 40, opacity: 0.5 }} />
            </CardContent>
          </Card>
        </Grid>

        {/* KPI 3: Filtrados por IA */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#ffebee', height: '100%' }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Detectados por IA</Typography>
              <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: '#d32f2f' }}>
                {aiFilteredCount}
              </Typography>
              <Typography variant="caption" color="textSecondary">Tóxicos o Duplicados</Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* KPI 4: Tasa Resolución */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#e8f5e9', height: '100%' }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Eficiencia Resolución</Typography>
              <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
                {resolutionRate}%
              </Typography>
              <CheckCircleIcon sx={{ position: 'absolute', top: 20, right: 20, color: '#a5d6a7', fontSize: 40, opacity: 0.5 }} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* --- TABLA DE DATOS --- */}
      <Paper elevation={3} sx={{ p: 2, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
          Listado Reciente
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
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
                  <TableCell>{incident.title}</TableCell>
                  
                  {/* Aquí se usa la función corregida */}
                  <TableCell align="center">{renderAIBadge(incident)}</TableCell>
                  
                  <TableCell>{incident.user_name}</TableCell>
                  <TableCell>{incident.location}</TableCell>
                  <TableCell>{new Date(incident.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Chip label={incident.status} color={getStatusChipColor(incident.status)} size="small" />
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Select
                      size="small"
                      value={incident.status}
                      onChange={(e) => handleStatusChange(incident.id, e.target.value as Incident['status'])}
                      disabled={savingId === incident.id}
                      sx={{ mr: 1, minWidth: 140, height: 35 }}
                    >
                      <MenuItem value="pending">pending</MenuItem>
                      <MenuItem value="in_progress">in_progress</MenuItem>
                      <MenuItem value="resolved">resolved</MenuItem>
                    </Select>
                    <IconButton aria-label="delete" color="error" onClick={(e) => { e.stopPropagation(); handleDelete(incident.id); }}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* MODALS (Detalle y Lightbox) - Mantenidos igual */}
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