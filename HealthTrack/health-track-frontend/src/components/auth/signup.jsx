"use client"

import { useState, useEffect } from "react"
import {
  Box,
  TextField,
  Button,
  Typography,
  InputAdornment,
  Link as MuiLink,
  CircularProgress,
  FormControl,
  FormLabel,
  Radio,
  RadioGroup as MuiRadioGroup,
  FormControlLabel,
  MenuItem,
  Collapse,
  Alert,
} from "@mui/material"
import { Person, Email, Lock, Phone, CalendarMonth, MedicalServices } from "@mui/icons-material"
import { useAuth } from "../../context/AuthContext"

export default function Signup({ onToggleMode }) {
  const auth = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [role, setRole] = useState("PATIENT")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [specializations, setSpecializations] = useState([])

  // Form fields
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "", // This will map to phoneNumber in your Java model
    role: "PATIENT",
    // Patient fields
    birthday: "",
    // Doctor fields
    specialization: "",
  })
  
  // Fetch specializations for doctor role
  useEffect(() => {
    const fetchSpecializations = async () => {
      try {
        const response = await fetch("http://localhost:8080/api/specializations")
        const data = await response.json()
        console.log("Fetched specializations:", data, Array.isArray(data));
        setSpecializations(data) // Set specializations in state
      } catch (error) {
        console.error("Error fetching specializations:", error)
        setSpecializations([])
      }
    }
    fetchSpecializations()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleRoleChange = (e) => {
    const newRole = e.target.value
    setRole(newRole)
    setFormData({
      ...formData,
      role: newRole,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")
    const birthdayWithTime = formData.birthday + "T00:00:00";
    try {
      console.log("Signup form submitted with:", formData)

      // Prepare data based on role
      const userData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone : formData.phone, // This will map to phoneNumber in your Java model
        role: formData.role,
      }

      // Add role-specific fields
      if (formData.role === "PATIENT") {
        userData.birthday = formData.birthday
        userData.condition = formData.condition
      } else {
        userData.specialization = { id: formData.specialization.id }
      }

      // Call the register function from context
      const response = await auth.register(userData)
      setSuccess("Registration successful! Redirecting...")
      console.log("Registration successful:", response)

      // Redirect after a short delay
      setTimeout(() => {
        // window.location.href = '/dashboard';
        console.log("Redirecting to dashboard...")
      }, 1500)
    } catch (error) {
      console.error("Registration error:", error)

      // Handle different types of errors
      setError(error.message || "Registration failed. Please try again.")
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

      <TextField
        margin="normal"
        required
        fullWidth
        id="name"
        label="Full Name"
        name="name"
        autoComplete="name"
        autoFocus
        value={formData.name}
        onChange={handleChange}
        disabled={isLoading}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Person />
            </InputAdornment>
          ),
        }}
      />

      <TextField
        margin="normal"
        required
        fullWidth
        id="email"
        label="Email Address"
        name="email"
        autoComplete="email"
        value={formData.email}
        onChange={handleChange}
        disabled={isLoading}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Email />
            </InputAdornment>
          ),
        }}
      />

      <TextField
        margin="normal"
        required
        fullWidth
        name="password"
        label="Password"
        type="password"
        id="password"
        autoComplete="new-password"
        value={formData.password}
        onChange={handleChange}
        disabled={isLoading}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Lock />
            </InputAdornment>
          ),
        }}
      />

      <TextField
        margin="normal"
        required
        fullWidth
        name="phone"
        label="Phone Number"
        id="phone"
        autoComplete="tel"
        value={formData.phone}
        onChange={handleChange}
        disabled={isLoading}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Phone />
            </InputAdornment>
          ),
        }}
      />

      <FormControl component="fieldset" margin="normal" fullWidth>
        <FormLabel component="legend">I am a:</FormLabel>
        <MuiRadioGroup row name="role" value={role} onChange={handleRoleChange}>
          <FormControlLabel value="PATIENT" control={<Radio />} label="Patient" />
          <FormControlLabel value="DOCTOR" control={<Radio />} label="Doctor" />
        </MuiRadioGroup>
      </FormControl>

      {/* Conditional fields based on role */}
      <Collapse in={role === "PATIENT"} timeout="auto" sx={{ mt: 2 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            animation: "fadeIn 0.3s ease-in-out",
            "@keyframes fadeIn": {
              from: {
                opacity: 0,
                transform: "translateY(10px)",
              },
              to: {
                opacity: 1,
                transform: "translateY(0)",
              },
            },
          }}
        >
          <TextField
            required={role === "PATIENT"}
            fullWidth
            id="dob"
            label="Date of Birth"
            name="birthday"
            type="date"
            value={formData.birthday}
            onChange={handleChange}
            disabled={isLoading}
            InputLabelProps={{
              shrink: true,
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <CalendarMonth />
                </InputAdornment>
              ),
            }}
          />

          
        </Box>
      </Collapse>

      <Collapse in={role === "DOCTOR"} timeout="auto" sx={{ mt: 2 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            animation: "fadeIn 0.3s ease-in-out",
            "@keyframes fadeIn": {
              from: {
                opacity: 0,
                transform: "translateY(10px)",
              },
              to: {
                opacity: 1,
                transform: "translateY(0)",
              },
            },
          }}
        >
          {/* <TextField
            required={role === "DOCTOR"}
            fullWidth
            id="license"
            label="Medical License Number"
            name="license"
            placeholder="Enter your license number"
            value={formData.license}
            onChange={handleChange}
            disabled={isLoading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <MedicalServices />
                </InputAdornment>
              ),
            }}
          /> */}

          {/* <TextField
            required={role === "DOCTOR"}
            fullWidth
            id="specialization"
            label="Specialization"
            name="specialization"
            placeholder="Enter your specialization"
            value={formData.specialization}
            onChange={handleChange}
            disabled={isLoading}
          /> */}

      <TextField
        select
        required={role === "DOCTOR"}
        fullWidth
        id="specialization"
        label="Specialization"
        name="specialization"
        value={formData.specialization?.id || ""}
        onChange={(e) => {
          const selectedId = parseInt(e.target.value, 10);
          const selectedSpec = specializations.find(s => s.id === selectedId);
          setFormData({ ...formData, specialization: selectedSpec });
        }}
        disabled={isLoading}
        InputLabelProps={{
              shrink: true,
            }}
      
      >
        <MenuItem value="">Select your specialization</MenuItem>
        {Array.isArray(specializations) && specializations.map(s => (
          <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
        ))}
      </TextField>


        </Box>
      </Collapse>

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
        {isLoading ? <CircularProgress size={24} color="inherit" /> : "Create Account"}
      </Button>

      <Box sx={{ textAlign: "center", mt: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Already have an account?{" "}
          <MuiLink
            component="button"
            variant="body2"
            onClick={onToggleMode}
            color="primary"
            underline="hover"
            sx={{ fontWeight: "medium" }}
          >
            Sign in
          </MuiLink>
        </Typography>
      </Box>
    </Box>
  )
}
