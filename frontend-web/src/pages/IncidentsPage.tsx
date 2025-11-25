import React, { useEffect, useState } from 'react';
import {
  Typography, Paper, CircularProgress, Alert, TableContainer, Table, TableHead,
  TableRow, TableCell, TableBody, Chip, Modal, Box, Select, MenuItem, IconButton
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../services/api';

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
}

const getStatusChipColor = (status: Incident['status']) => {
  switch (status) {
    case 'pending': return 'warning';
    case 'in_progress': return 'primary';
    case 'resolved': return 'success';
    default: return 'default';
  }
};

const modalStyle = {
  position: 'absolute' as const,
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

const IncidentsPage: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState<number | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

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

  const handleOpenModal = (incident: Incident) => setSelectedIncident(incident);
  const handleCloseModal = () => setSelectedIncident(null);

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
    if (!confirm('¿Eliminar esta incidencia? Esta acción no se puede deshacer.')) return;
    try {
      await api.delete(`/incidents/${id}`);
      setIncidents(prev => prev.filter(i => i.id !== id));
      if (selectedIncident?.id === id) setSelectedIncident(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'No se pudo eliminar la incidencia.');
    }
  };

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Gestión de Incidencias
      </Typography>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Título</TableCell>
              <TableCell>Reportado por</TableCell>
              <TableCell>Ubicación</TableCell>
              <TableCell>Fecha</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {incidents.map((incident) => (
              <TableRow
                key={incident.id}
                hover
                onClick={() => handleOpenModal(incident)}
                sx={{ cursor: 'pointer' }}
              >
                <TableCell>{incident.title}</TableCell>
                <TableCell>{incident.user_name}</TableCell>
                <TableCell>{incident.location}</TableCell>
                <TableCell>{new Date(incident.created_at).toLocaleDateString()}</TableCell>

                <TableCell>
                  <Chip label={incident.status} color={getStatusChipColor(incident.status)} />
                </TableCell>

                <TableCell /* acciones */
                  onClick={(e) => e.stopPropagation()} 
                >
                  <Select
                    size="small"
                    value={incident.status}
                    onChange={(e) =>
                      handleStatusChange(incident.id, e.target.value as Incident['status'])
                    }
                    disabled={savingId === incident.id}
                    sx={{ mr: 1, minWidth: 160 }}
                  >
                    <MenuItem value="pending">pending</MenuItem>
                    <MenuItem value="in_progress">in_progress</MenuItem>
                    <MenuItem value="resolved">resolved</MenuItem>
                  </Select>

                  <IconButton
                    aria-label="delete"
                    color="error"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(incident.id);
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>

        </Table>
      </TableContainer>

      {/* MODAL PARA VER DETALLES */}
      <Modal
        open={selectedIncident !== null}
        onClose={handleCloseModal}
        aria-labelledby="incident-detail-title"
      >
        <Box sx={modalStyle}>
          <Typography id="incident-detail-title" variant="h6" component="h2">
            {selectedIncident?.title}
          </Typography>
          <Typography sx={{ mt: 2 }}>
            <strong>Descripción:</strong> {selectedIncident?.description}
          </Typography>
          <Typography sx={{ mt: 1 }}>
            <strong>Ubicación:</strong> {selectedIncident?.location}
          </Typography>
          <Box sx={{ mt: 2, display: 'flex', gap: '10px' }}>
            {selectedIncident?.images?.map((imgUrl, index) => (
              <img
                key={index}
                src={`http://localhost:4000${imgUrl}`}
                alt={`Incidencia ${index + 1}`}
                width="100"
                style={{ objectFit: 'cover' }}
              />
            ))}
          </Box>
        </Box>
      </Modal>
    </Paper>
  );
};

export default IncidentsPage;
