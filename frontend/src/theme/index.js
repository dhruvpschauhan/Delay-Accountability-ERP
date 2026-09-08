import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1a3a5c',
      light: '#2d5986',
      dark: '#0f2238',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#c0392b',
      light: '#e74c3c',
      dark: '#922b21',
      contrastText: '#ffffff',
    },
    success: {
      main: '#1e7e34',
    },
    warning: {
      main: '#d4820a',
    },
    background: {
      default: '#f0f2f5',
      paper: '#ffffff',
    },
    text: {
      primary: '#1a1a2e',
      secondary: '#555577',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", sans-serif',
    h4: { fontWeight: 700, letterSpacing: '-0.02em' },
    h5: { fontWeight: 600, letterSpacing: '-0.01em' },
    h6: { fontWeight: 600 },
    body2: { color: '#555577' },
    caption: { fontSize: '0.75rem', color: '#777799' },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600 },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600 },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: { fontWeight: 700, backgroundColor: '#f0f2f5' },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
      },
    },
  },
});

export default theme;
