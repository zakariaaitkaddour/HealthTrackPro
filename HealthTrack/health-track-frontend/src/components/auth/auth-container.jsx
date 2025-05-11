"use client"

import { useState } from "react"
import { Paper, Box, Typography } from "@mui/material"
import Login from "./login"
import Signup from "./signup"

export default function AuthContainer() {
  const [isLogin, setIsLogin] = useState(true)

  const toggleAuthMode = () => {
    setIsLogin(!isLogin)
  }

  return (
    <Box sx={{ width: "100%", maxWidth: "450px" }}>
      <Paper
        elevation={3}
        sx={{
          overflow: "hidden",
          transition: "all 0.3s ease",
          "&:hover": {
            boxShadow: 6,
          },
          borderRadius: 2,
        }}
      >
        <Box
          sx={{
            height: "4px",
            background: "linear-gradient(to right, #00a895, #00806f)",
          }}
        />
        <Box sx={{ p: 4 }}>
          <Typography variant="h5" align="center" gutterBottom fontWeight="bold">
            {isLogin ? "Welcome Back" : "Create Account"}
          </Typography>

          {isLogin ? <Login onToggleMode={toggleAuthMode} /> : <Signup onToggleMode={toggleAuthMode} />}
        </Box>
      </Paper>
    </Box>
  )
}

