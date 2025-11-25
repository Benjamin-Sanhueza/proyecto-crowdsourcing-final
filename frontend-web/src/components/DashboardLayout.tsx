import React, { useState } from 'react';
import { Outlet, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  AppBar, Toolbar, IconButton, Typography, Drawer, List, ListItem, ListItemButton,
  ListItemIcon, ListItemText, Box, Divider, Tooltip, Fab
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import ListAltIcon from '@mui/icons-material/ListAlt';
import LogoutIcon from '@mui/icons-material/Logout';
import InsightsIcon from '@mui/icons-material/Insights';
import TimelineIcon from '@mui/icons-material/Timeline';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import { useAuth } from '../context/AuthContext';

const drawerWidth = 240;

const DashboardLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const drawer = (
    <div>
      <Toolbar />
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton component={RouterLink} to="/">
            <ListItemIcon><HomeIcon /></ListItemIcon>
            <ListItemText primary="Resumen" />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton component={RouterLink} to="/incidents">
            <ListItemIcon><ListAltIcon /></ListItemIcon>
            <ListItemText primary="Incidencias" />
          </ListItemButton>
        </ListItem>

        {/* Análisis · Regresión simple */}
        <ListItem disablePadding>
          <ListItemButton component={RouterLink} to="/analysis/regression">
            <ListItemIcon><TimelineIcon /></ListItemIcon>
            <ListItemText primary="Análisis · Regresión" />
          </ListItemButton>
        </ListItem>

        {/* Análisis · Regresión múltiple */}
        <ListItem disablePadding>
          <ListItemButton component={RouterLink} to="/analysis/multi-regression">
            <ListItemIcon><InsightsIcon /></ListItemIcon>
            <ListItemText primary="Análisis · Regresión múltiple" />
          </ListItemButton>
        </ListItem>

        {/* Correlación */}
        <ListItem disablePadding>
          <ListItemButton component={RouterLink} to="/analytics">
            <ListItemIcon><InsightsIcon /></ListItemIcon>
            <ListItemText primary="Análisis · Correlación" />
          </ListItemButton>
        </ListItem>

        {/* NUEVO: Asistente IA */}
        <ListItem disablePadding>
          <ListItemButton component={RouterLink} to="/assistant">
            <ListItemIcon><SmartToyIcon /></ListItemIcon>
            <ListItemText primary="Asistente IA" />
          </ListItemButton>
        </ListItem>
      </List>

      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon><LogoutIcon /></ListItemIcon>
            <ListItemText primary="Cerrar Sesión" />
          </ListItemButton>
        </ListItem>
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Panel de Administración
          </Typography>

          {/* Acceso rápido al asistente en AppBar (opcional) */}
          <Tooltip title="Asistente IA">
            <IconButton color="inherit" component={RouterLink} to="/assistant" sx={{ mr: 1 }}>
              <SmartToyIcon />
            </IconButton>
          </Tooltip>

          <Typography variant="subtitle1">
            Hola, {user?.name}
          </Typography>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        {/* Drawer móvil */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth }
          }}
        >
          {drawer}
        </Drawer>

        {/* Drawer desktop */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth }
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` } }}
      >
        <Toolbar />
        <Outlet />
      </Box>

      {/* FAB flotante para abrir el Asistente IA desde cualquier página */}
      <Box sx={{ position: 'fixed', right: 24, bottom: 24, zIndex: 1200 }}>
        <Tooltip title="Abrir asistente IA">
          <Fab color="primary" component={RouterLink} to="/assistant" aria-label="asistente-ia">
            <SmartToyIcon />
          </Fab>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default DashboardLayout;
