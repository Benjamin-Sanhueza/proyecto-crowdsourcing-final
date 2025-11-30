
import { Grid, Paper, Typography, Box, Divider } from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import GroupIcon from '@mui/icons-material/Group';

// Componente de Tarjeta de Estadística (KPI)
const StatCard = ({ title, value, icon, color, trend }: any) => (
  <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', overflow: 'hidden' }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
      <Box 
        sx={{ 
          p: 1.5, 
          borderRadius: 3, 
          bgcolor: `${color}15`, // Fondo transparente del color
          color: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {icon}
      </Box>
      {trend && (
        <Chip 
            label={trend} 
            size="small" 
            color="success" 
            sx={{ bgcolor: '#dcfce7', color: '#166534', fontWeight: 'bold', borderRadius: 1 }} 
        />
      )}
    </Box>
    <Typography variant="h4" fontWeight="800" sx={{ mb: 0.5, color: '#0f172a' }}>
      {value}
    </Typography>
    <Typography variant="body2" fontWeight="500" color="text.secondary">
      {title}
    </Typography>
  </Paper>
);

// Componente pequeño para listas (Chip)
const Chip = ({ label, sx }: any) => (
    <Box sx={{ px: 1, py: 0.5, fontSize: '0.75rem', ...sx }}>{label}</Box>
);

const DashboardHome = () => {
  return (
    <Box sx={{ p: 1 }}>
      {/* Encabezado */}
      <Box sx={{ mb: 5 }}>
        <Typography variant="h4" gutterBottom>
          Resumen General
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Vista general del rendimiento del sistema de Crowdsourcing.
        </Typography>
      </Box>

      {/* Grid de Tarjetas */}
      <Grid container spacing={3} sx={{ mb: 5 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Total Incidencias" 
            value="24" 
            icon={<AssignmentIcon fontSize="medium" />} 
            color="#3b82f6" // Azul
            trend="+12%"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Pendientes de Revisión" 
            value="8" 
            icon={<PendingActionsIcon fontSize="medium" />} 
            color="#f59e0b" // Naranja (Warning)
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Resueltas este mes" 
            value="14" 
            icon={<CheckCircleIcon fontSize="medium" />} 
            color="#10b981" // Verde
            trend="+5%"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Usuarios Activos" 
            value="156" 
            icon={<GroupIcon fontSize="medium" />} 
            color="#6366f1" // Indigo
          />
        </Grid>
      </Grid>

      {/* Sección Secundaria (Simulada para visual) */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed', borderWidth: 2, borderColor: '#e2e8f0', bgcolor: 'transparent', boxShadow: 'none' }}>
            <Box textAlign="center">
                <TrendingUpIcon sx={{ fontSize: 40, color: '#cbd5e1', mb: 2 }} />
                <Typography color="text.secondary">Gráfico de Tendencias (Próximamente)</Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Actividad Reciente</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {[1,2,3].map(i => (
                        <Box key={i}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="body2" fontWeight="600">Nuevo reporte en Sala B-{i}01</Typography>
                                <Typography variant="caption" color="text.secondary">Hace {i}h</Typography>
                            </Box>
                            <Typography variant="caption" color="text.secondary">Categoría: Infraestructura</Typography>
                            {i < 3 && <Divider sx={{ mt: 2 }} />}
                        </Box>
                    ))}
                </Box>
            </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardHome;