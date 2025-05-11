"use client"

import { useState } from "react"
import { useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  InputAdornment,
  Link as MuiLink,
  CircularProgress,
  Alert,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Collapse,
} from "@mui/material"
import { Person, Lock } from "@mui/icons-material"
import { useAuth } from "../../context/AuthContext" // Make sure this import path is correct

export default function Login({ onToggleMode }) {
  const auth = useAuth() // Get the entire auth object
  const navigate = useNavigate(); // Use useNavigate from react-router-dom for navigation
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [role, setRole] = useState("PATIENT") // Default role
  const [showDebug, setShowDebug] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      console.log("Login form submitted with:", { email, password, role })

      // Call the login function from context
      const response = await auth.login(email, password, role)
      console.log("Login response:", response)

      setSuccess("Login successful! Redirecting...")

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        if (role === "DOCTOR") {
          navigate('/doctor-dashboard');
        }
        else if (role === "PATIENT") {
          navigate('/dashboard');
        } 
      }, 1500)
      
    } catch (error) {
      console.error("Login error:", error)

      // Handle different types of errors
      setError(error.message || "An error occurred during login. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Collapse in={!!error}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      </Collapse>

      <Collapse in={!!success}>
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      </Collapse>

      {/* Debug button */}
      <Box sx={{ mb: 2, textAlign: "right" }}>
        <Button size="small" color="primary" onClick={() => setShowDebug(!showDebug)}>
          {showDebug ? "Hide Debug" : "Show Debug"}
        </Button>
      </Box>

      {/* Debug info */}
      {/* <Collapse in={showDebug}>
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            API URL: /api/auth/login
            <br />
            Method: POST
            <br />
            Headers: Content-Type: application/json
            <br />
            Body: {JSON.stringify({ email, password, role })}
          </Typography>
        </Alert>
      </Collapse> */}

      <TextField
        margin="normal"
        required
        fullWidth
        id="email"
        label="Email Address"
        name="email"
        autoComplete="email"
        autoFocus
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={isLoading}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Person />
            </InputAdornment>
          ),
        }}
      />

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1, mt: 2 }}>
        <Typography variant="body2">Password</Typography>
        <MuiLink href="#" variant="body2" color="primary" underline="hover">
          Forgot password?
        </MuiLink>
      </Box>

      <TextField
        margin="normal"
        required
        fullWidth
        name="password"
        label="Password"
        type="password"
        id="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={isLoading}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Lock />
            </InputAdornment>
          ),
        }}
      />

      {/* Role Selection Radio Group */}
      <FormControl component="fieldset" sx={{ mt: 2, width: "100%" }}>
        <FormLabel component="legend" sx={{ mb: 1, color: "text.primary", fontSize: "0.875rem" }}>
          I am a
        </FormLabel>
        <RadioGroup
          row
          aria-label="role"
          name="role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          sx={{ justifyContent: "space-between" }}
        >
          <FormControlLabel value="PATIENT" control={<Radio size="small" />} label="Patient" disabled={isLoading} />
          <FormControlLabel value="DOCTOR" control={<Radio size="small" />} label="Doctor" disabled={isLoading} />
        </RadioGroup>
      </FormControl>

      <Button
        type="submit"
        fullWidth
        variant="contained"
        sx={{
          mt: 3,
          mb: 2,
          py: 1.5,
          bgcolor: "#00a895",
          "&:hover": {
            bgcolor: "#00806f",
          },
        }}
        disabled={isLoading}
      >
        {isLoading ? <CircularProgress size={24} color="inherit" /> : "Sign In"}
      </Button>

      <Box sx={{ textAlign: "center", mt: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Don't have an account?{" "}
          <MuiLink
            component="button"
            variant="body2"
            onClick={onToggleMode}
            color="primary"
            underline="hover"
            sx={{ fontWeight: "medium" }}
          >
            Sign up
          </MuiLink>
        </Typography>
      </Box>
    </Box>
  )
}
