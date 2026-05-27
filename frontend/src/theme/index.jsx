import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1a56db', light: '#3b82f6', dark: '#1e3a8a' },
    secondary: { main: '#f59e0b' },
    background: { default: '#f0f4ff', paper: '#ffffff' },
    text: { primary: '#0f172a', secondary: '#64748b' },
  },
  typography: {
    fontFamily: '"Plus Jakarta Sans", "Segoe UI", sans-serif',
  },
  shape: { borderRadius: 12 },
  components: {
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '10px',
            background: '#f8fafc',
            fontSize: '0.9rem',
            '& fieldset': { borderColor: '#e2e8f0', borderWidth: '1.5px' },
            '&:hover fieldset': { borderColor: '#93c5fd' },
            '&.Mui-focused fieldset': { borderColor: '#1a56db', borderWidth: '2px' },
            '&.Mui-focused': { background: '#fff' },
          },
          '& .MuiInputLabel-root': { fontSize: '0.875rem', color: '#94a3b8' },
          '& .MuiInputLabel-root.Mui-focused': { color: '#1a56db' },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '10px',
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.95rem',
          letterSpacing: '0.01em',
        },
      },
    },
  },
})

export { theme }
