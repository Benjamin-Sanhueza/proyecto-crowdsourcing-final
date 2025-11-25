import React from 'react';
import { Typography, Container, Paper, Grid } from '@mui/material';
import { useAuth } from '../context/AuthContext';

const OverviewPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <Container maxWidth="lg">
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h4" gutterBottom>
              ¡Bienvenido, {user?.name}!
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Panel de Control del Sistema de Gestión de Incidencias (SGIU)
            </Typography>
          </Paper>
        </Grid>
        {/* Aquí podrías añadir más componentes con estadísticas */}
      </Grid>
    </Container>
  );
};

export default OverviewPage;