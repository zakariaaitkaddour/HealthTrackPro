"use client"

import { createTheme } from "@mui/material/styles"

const theme = createTheme({
  palette: {
    primary: {
      main: "#00a895",
      light: "#33baa8",
      dark: "#00806f",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#f5f5f5",
      light: "#ffffff",
      dark: "#e0e0e0",
      contrastText: "#333333",
    },
    background: {
      default: "#ffffff",
      paper: "#ffffff",
    },
    text: {
      primary: "#333333",
      secondary: "#666666",
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h5: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 500,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          marginTop: "8px",
          marginBottom: "8px",
        },
      },
    },
  },
})

export default theme

