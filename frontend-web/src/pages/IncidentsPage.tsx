import React, { useEffect, useState } from 'react';
import {
  Typography, Paper, CircularProgress, Alert, TableContainer, Table, TableHead,
  TableRow, TableCell, TableBody, Chip, Modal, Box, Select, MenuItem, IconButton
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../services/api';

// --- URL DEL BACKEND PARA LAS IMÁGENES ---
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
}

const getStatusChipColor = (status: Incident['status']) => {
  switch (status) {
    case 'pending': return 'warning';
    case 'in_progress': return 'primary';
    case 'resolved': return 'success';
    default: return 'default';
  }
};

// Estilo del modal de detalles (el formulario)
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
  maxHeight: '90vh', // Para que no se salga si hay muchas fotos
  overflowY: 'auto'  // Scroll si es necesario
};

// Estilo NUEVO para el modal de la imagen grande (Lightbox)
const lightboxStyle = {
  position: 'absolute' as const,
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  bgcolor: 'transparent', // Fondo transparente, solo se ve la imagen
  boxShadow: 'none',
  p: 0,
  outline: 'none',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  width: '100%',
  height: '100%',
};


const IncidentsPage: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState<number | null>(null);
  
  // Estado para el modal de detalles de texto
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  
  // Estado NUEVO: guarda la URL de la imagen grande que se está viendo
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

  const handleOpenModal = (incident: Incident) => setSelectedIncident(incident);
  const handleCloseModal = () => setSelectedIncident(null);

  // ✨ Handlers para abrir y cerrar el Lightbox de imagen
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

                <TableCell
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

      {/* MODAL 1: DETALLES DE LA INCIDENCIA (Texto y miniaturas) */}
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
          
          <Typography sx={{ mt: 2, mb: 1 }}><strong>Evidencia:</strong></Typography>
          <Box sx={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {selectedIncident?.images?.map((imgUrl, index) => {
               const fullImageUrl = `${BASE_URL}${imgUrl}`;
               return (
              <img
                key={index}
                src={fullImageUrl}
                alt={`Incidencia ${index + 1}`}
                width="100"
                height="100"

                onClick={() => handleOpenLightbox(fullImageUrl)}
                style={{ 
                  objectFit: 'cover', 
                  borderRadius: 4, 
                  border: '1px solid #ddd',
                  cursor: 'pointer' // ✨ Cambia el cursor para indicar que es clicable
                }}
              />
            )})}
          </Box>
        </Box>
      </Modal>

      {/*MODAL 2: LIGHTBOX (SOLO IMAGEN GRANDE) */}
      <Modal
        open={selectedImageInLightbox !== null}
        onClose={handleCloseLightbox}
        aria-labelledby="lightbox-modal"
      >
        {/* Al hacer click en cualquier parte del fondo negro, se cierra */}
        <Box sx={lightboxStyle} onClick={handleCloseLightbox}>
          {selectedImageInLightbox && (
            <img
              src={selectedImageInLightbox}
              alt="Detalle grande"
              style={{ 
                maxWidth: '95vw',  // Ocupa máximo el 95% del ancho de la pantalla
                maxHeight: '95vh', // Ocupa máximo el 95% del alto
                objectFit: 'contain', // Asegura que la imagen se vea entera sin recortarse
                boxShadow: '0px 4px 20px rgba(0,0,0,0.5)',
                borderRadius: 4
              }}
              // Evitamos que el click en la imagen misma cierre el modal
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </Box>
      </Modal>

    </Paper>
  );
};

export default IncidentsPage;