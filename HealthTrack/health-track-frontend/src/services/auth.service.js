// auth.service.js
import { format, parseISO } from "date-fns";


// Define the API base URL - make sure this points to your actual API
const API_BASE_URL = "http://localhost:8080/api"; // Using relative path for proxy to work

// Helper function to get auth token from localStorage
const getAuthToken = () => localStorage.getItem("token")

// Create the AuthService object with explicit methods
const AuthService = {
  // Login user
  login: async (email, password, role) => {
    try {
      console.log("AuthService.login called with:", { email, role })
      console.log("Using API URL:", API_BASE_URL)

      const headers = {
        "Content-Type": "application/json",
        Accept: "application/json",
      }

      // Prepare the request body to match your Java backend expectations
      const requestBody = {
        email: email, // Include both to be safe
        password: password,
        role: role,
      }

      console.log(`Sending login request to: ${API_BASE_URL}/auth/login`)
      console.log("Request body:", JSON.stringify(requestBody))

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
        credentials: "include", // Include cookies if your backend uses them
      })

      // Check for HTTP errors
      if (!response.ok) {
        const errorText = await response.text()
        console.error("Login error response:", errorText)

        let errorMessage
        try {
          const errorJson = JSON.parse(errorText)
          errorMessage = errorJson.message || `Error: ${response.status}`
        } catch (e) {
          errorMessage = `Error: ${response.status}`
        }

        throw new Error(errorMessage)
      }

      // Parse JSON response
      const data = await response.json()
      console.log("Real API login response:", data)

      // Adjust this based on your backend response structure
      // Your backend might return { token: "...", user: {...} } or a different structure
      // const token = data.token || data.accessToken || data.jwt
      const token = data.jwt; // Adjust this based on your backend response structure
      const birthdayParsed = data.birthday 
      ? format(new Date(data.birthday.split('T')[0]), 'yyyy-MM-dd') 
      : null;      
      const user = {
        userId: data.userId,
        name: data.name,
        role: data.role,
        email: data.email,
        birthday: birthdayParsed,
        specialization: data.specialization,
        phoneNumber: data.phoneNumber,
      };

      console.log("Parsed user data:", user)
      // Store token in localStorage
      if (token) {
        localStorage.setItem("token", token)
        localStorage.setItem("user", JSON.stringify(user))
      }

      return { user, token }
    } catch (error) {
      console.error("Error in AuthService.login:", error)
      throw error
    }
  },

  // Register user
  register: async (userData) => {
    try {
      console.log("AuthService.register called with:", userData)
      console.log("Using API URL:", API_BASE_URL)

      const headers = {
        "Content-Type": "application/json",
        Accept: "application/json",
      }

      // Prepare the request body to match your Java backend expectations
      const requestBody = {
        email: userData.email, // Include both to be safe
        password: userData.password,
        role: userData.role,
        name: userData.name,
        phoneNumber: userData.phone, // Adjust field name to match your backend
        birthday: userData.birthday,
      }

      // Add role-specific fields if needed
      if (userData.role === "PATIENT") {
        requestBody.birthday = userData.birthday
      } else if (userData.role === "DOCTOR") {
        requestBody.specialization = userData.specialization
      }

      console.log(`Sending register request to: ${API_BASE_URL}/auth/signup`)
      console.log("Request body:", JSON.stringify(requestBody))

      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
        credentials: "include", // Include cookies if your backend uses them
      })

      // Check for HTTP errors
      if (!response.ok) {
        const errorText = await response.text()
        console.error("Register error response:", errorText)

        let errorMessage
        try {
          const errorJson = JSON.parse(errorText)
          errorMessage = errorJson.message || `Error: ${response.status}`
        } catch (e) {
          errorMessage = `Error: ${response.status}`
        }

        throw new Error(errorMessage)
      }

      // Parse JSON response
      const data = await response.json()
      console.log("Real API register response:", data)

      // Adjust this based on your backend response structure
      const token = data.token || data.accessToken || data.jwt
      const user = data.user || data

      // Store token in localStorage if the API returns it upon registration
      if (token) {
        localStorage.setItem("token", token)
        localStorage.setItem("user", JSON.stringify(user))
      }

      return { user, token }
    } catch (error) {
      console.error("Error in AuthService.register:", error)
      throw error
    }
  },

  // Logout user
  logout: () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
  },

  // Get current user
  getCurrentUser: () => {
    const user = localStorage.getItem("user")
    return user ? JSON.parse(user) : null
  },

  // Check if user is authenticated
  isAuthenticated: () => !!localStorage.getItem("token"),
}

// Export the AuthService object as default
export default AuthService
