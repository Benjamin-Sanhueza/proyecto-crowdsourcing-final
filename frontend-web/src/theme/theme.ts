import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0f172a', // Slate 900 (Oscuro, elegante)
      light: '#334155',
      dark: '#020617',
    },
    secondary: {
      main: '#f59e0b', // Amber 500 (Para botones de acción/resalte)
      contrastText: '#fff',
    },
    background: {
      default: '#f8fafc', // Gris muy muy claro (no blanco puro) para el fondo
      paper: '#ffffff',
    },
    text: {
      primary: '#1e293b',
      secondary: '#64748b',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700 },
    h4: { fontWeight: 600, color: '#0f172a' },
    h6: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 }, // Botones sin mayúsculas forzadas
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          boxShadow: '0px 4px 20px rgba(0,0,0,0.05)', // Sombra suave y moderna
          borderRadius: 12, // Bordes redondeados
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 20px',
          boxShadow: 'none',
          '&:hover': { boxShadow: '0px 4px 12px rgba(0,0,0,0.1)' },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          backgroundColor: '#f1f5f9',
          color: '#475569',
          fontWeight: 700,
          textTransform: 'uppercase',
          fontSize: '0.75rem',
          letterSpacing: '0.05em',
        },
        body: {
          fontSize: '0.875rem',
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 500, borderRadius: 6 },
      }
    }
  },
});

export default theme;