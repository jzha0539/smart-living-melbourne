import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#243C35',
      light: '#4F6B57',
      dark: '#182B25',
      contrastText: '#FFFDF8',
    },
    secondary: {
      main: '#D99A73',
      light: '#E8B99C',
      dark: '#B77956',
      contrastText: '#243C35',
    },
    background: {
      default: '#F5F1E8',
      paper: '#EFE8DA',
    },
    text: {
      primary: '#243C35',
      secondary: '#6E7771',
    },
    divider: '#E4D9C8',
  },

  shape: {
    borderRadius: 22,
  },

  typography: {
    fontFamily: 'Inter, Arial, sans-serif',
    h1: {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontWeight: 500,
      letterSpacing: '-0.04em',
      color: '#243C35',
    },
    h2: {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontWeight: 500,
      letterSpacing: '-0.035em',
      color: '#243C35',
    },
    h3: {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontWeight: 500,
      color: '#243C35',
    },
    h4: {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontWeight: 600,
      color: '#243C35',
    },
    h5: {
      fontWeight: 700,
      color: '#243C35',
    },
    h6: {
      fontWeight: 700,
      color: '#243C35',
    },
    body1: {
      color: '#4F5E57',
    },
    body2: {
      color: '#6E7771',
    },
    button: {
      textTransform: 'none',
      fontWeight: 700,
    },
  },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#F5F1E8',
          color: '#243C35',
        },
      },
    },

    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#EFE8DA',
          border: '1px solid #E4D9C8',
          boxShadow: '0 18px 50px rgba(36, 60, 53, 0.08)',
        },
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 28,
          backgroundColor: '#EFE8DA',
          border: '1px solid #E4D9C8',
          boxShadow: '0 18px 50px rgba(36, 60, 53, 0.08)',
        },
      },
    },

    MuiButton: {
  styleOverrides: {
    root: {
      borderRadius: 999,
      padding: '10px 18px',
      boxShadow: 'none',
      textTransform: 'none',
      fontWeight: 700,
    },
  },
  variants: [
    {
      props: { variant: 'contained', color: 'primary' },
      style: {
        backgroundColor: '#243C35',
        color: '#FFFDF8',
        '&:hover': {
          backgroundColor: '#182B25',
          boxShadow: '0 12px 28px rgba(36, 60, 53, 0.18)',
        },
      },
    },
    {
      props: { variant: 'outlined', color: 'primary' },
      style: {
        borderColor: '#CFC4B4',
        color: '#243C35',
        backgroundColor: '#FFFDF8',
        '&:hover': {
          borderColor: '#243C35',
          backgroundColor: '#EFE8DA',
        },
      },
    },
  ],
},}})

export default theme;