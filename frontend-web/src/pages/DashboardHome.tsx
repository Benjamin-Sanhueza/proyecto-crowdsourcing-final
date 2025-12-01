import React, { useEffect, useState, useMemo } from 'react';
import { Grid, Paper, Typography, Box, Divider, CircularProgress, Alert } from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import GroupIcon from '@mui/icons-material/Group';
import api from '../services/api'; // Asegúrate de importar tu api configurada

// --- IMPORTAMOS LOS GRÁFICOS ---
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';

// Interfaz de datos
interface Incident {
  id: number;
  title: string;
  category: string;
  status: 'pending' | 'in_progress' | 'resolved';
  created_at: string;
}

// Componente de Tarjeta de Estadística (KPI)
const StatCard = ({ title, value, icon, color, trend }: any) => (
  <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', overflow: 'hidden', borderRadius: 3, boxShadow: '0px 4px 20px rgba(0,0,0,0.05)' }}>
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
        <Box sx={{ px: 1, py: 0.5, fontSize: '0.75rem', bgcolor: '#dcfce7', color: '#166534', fontWeight: 'bold', borderRadius: 1 }}>
          {trend}
        </Box>
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

const DashboardHome = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 1. CARGAR DATOS REALES DEL BACKEND
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get<Incident[]>('/incidents');
        setIncidents(response.data);
      } catch (err) {
        console.error(err);
        setError('No se pudieron cargar los datos del dashboard.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 2. CALCULAR MÉTRICAS (KPIs)
  const totalIncidents = incidents.length;
  const pendingCount = incidents.filter(i => i.status === 'pending').length;
  const resolvedCount = incidents.filter(i => i.status === 'resolved').length;
  // Simulamos usuarios activos (ya que no tenemos endpoint de usuarios aún)
  const activeUsers = 15; 

  // 3. PREPARAR DATOS PARA EL GRÁFICO
  const chartData = useMemo(() => {
    const grouped: Record<string, number> = {};
    
    incidents.forEach(inc => {
      // Formato DD/MM
      const date = new Date(inc.created_at).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' });
      grouped[date] = (grouped[date] || 0) + 1;
    });

    // Convertir a array, ordenar y tomar los últimos 7 días
    return Object.keys(grouped)
      .map(date => ({ date, count: grouped[date] }))
      // Ordenar por fecha (truco simple asumiendo formato string ordenable o orden de llegada)
      .reverse() 
      .slice(0, 7)
      .reverse();
  }, [incidents]);

  if (loading) return <Box p={4} display="flex" justifyContent="center"><CircularProgress /></Box>;
  if (error) return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;

  return (
    <Box sx={{ p: 1 }}>
      {/* Encabezado */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ color: '#1e293b' }}>
          Resumen General
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Vista general del rendimiento del sistema de Crowdsourcing en tiempo real.
        </Typography>
      </Box>

      {/* Grid de Tarjetas (KPIs REALES) */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Total Incidencias" 
            value={totalIncidents} 
            icon={<AssignmentIcon fontSize="medium" />} 
            color="#3b82f6" 
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Pendientes" 
            value={pendingCount} 
            icon={<PendingActionsIcon fontSize="medium" />} 
            color="#f59e0b" 
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Resueltas" 
            value={resolvedCount} 
            icon={<CheckCircleIcon fontSize="medium" />} 
            color="#10b981" 
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Usuarios Activos" 
            value={activeUsers} 
            icon={<GroupIcon fontSize="medium" />} 
            color="#6366f1" 
          />
        </Grid>
      </Grid>

      {/* Sección Secundaria */}
      <Grid container spacing={3}>
        
        {/* === AQUÍ ESTÁ EL GRÁFICO QUE PEDISTE === */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: '400px', borderRadius: 3, boxShadow: '0px 4px 20px rgba(0,0,0,0.05)' }}>
            <Box display="flex" alignItems="center" mb={3}>
                <Box p={1} bgcolor="#e0f2fe" borderRadius={2} mr={2} color="#0288d1">
                    <TrendingUpIcon />
                </Box>
                <Typography variant="h6" fontWeight="bold">Tendencia de Reportes</Typography>
            </Box>
            
            {/* Contenedor del Gráfico */}
            <Box sx={{ width: '100%', height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis 
                            dataKey="date" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#64748b', fontSize: 12 }} 
                            dy={10}
                        />
                        <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#64748b', fontSize: 12 }} 
                            allowDecimals={false}
                        />
                        <Tooltip 
                            cursor={{ fill: '#f1f5f9' }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                        <Bar dataKey="count" name="Incidentes" radius={[4, 4, 0, 0]} barSize={40}>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill="#3b82f6" />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Panel Lateral: Actividad Reciente (REAL) */}
        <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, height: '400px', overflowY: 'auto', borderRadius: 3, boxShadow: '0px 4px 20px rgba(0,0,0,0.05)' }}>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Actividad Reciente</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* Tomamos los últimos 5 incidentes reales */}
                    {incidents.slice(0, 5).map((inc, i) => (
                        <Box key={inc.id}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="body2" fontWeight="600" noWrap sx={{ maxWidth: '70%' }}>
                                    {inc.title}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {new Date(inc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </Typography>
                            </Box>
                            <Typography variant="caption" color="text.secondary" display="block">
                                Categoría: {inc.category}
                            </Typography>
                            <Box mt={1}>
                                <span style={{ 
                                    fontSize: '10px', 
                                    padding: '2px 8px', 
                                    borderRadius: '10px', 
                                    backgroundColor: inc.status === 'pending' ? '#fff7ed' : '#f0fdf4',
                                    color: inc.status === 'pending' ? '#c2410c' : '#15803d',
                                    fontWeight: 'bold'
                                }}>
                                    {inc.status.toUpperCase()}
                                </span>
                            </Box>
                            {i < 4 && <Divider sx={{ mt: 2 }} />}
                        </Box>
                    ))}
                    {incidents.length === 0 && (
                        <Typography variant="body2" color="text.secondary" align="center" mt={4}>
                            No hay actividad reciente.
                        </Typography>
                    )}
                </Box>
            </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardHome;