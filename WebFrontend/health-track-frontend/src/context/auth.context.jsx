"use client"

import { createContext, useState, useEffect, useContext } from "react"
import AuthService from "../services/auth.service.js"

// Create context with default values
const AuthContext = createContext({
  currentUser: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
})

// Provider component
function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is already logged in
    const checkLoggedIn = () => {
      try {
        console.log("Checking if user is logged in...")
        const user = AuthService.getCurrentUser()
        console.log("Current user:", user)
        if (user) {
          setCurrentUser(user)
          setIsAuthenticated(true)
        }
      } catch (error) {
        console.error("Error checking authentication:", error)
      } finally {
        setIsLoading(false)
      }
    }

    checkLoggedIn()
  }, [])

  // Login function
  const login = async (email, password, role) => {
    try {
      console.log("AuthContext login called with:", { email, role })
      // Call the login method from AuthService
      const response = await AuthService.login(email, password, role)
      setCurrentUser(response.user)
      setIsAuthenticated(true)
      return response
    } catch (error) {
      console.error("Login error in context:", error)
      throw error
    }
  }

  // Register function
  const register = async (userData) => {
    try {
      // Call the register method from AuthService
      const response = await AuthService.register(userData)
      setCurrentUser(response.user)
      setIsAuthenticated(true)
      return response
    } catch (error) {
      console.error("Register error in context:", error)
      throw error
    }
  }

  // Logout function
  const logout = () => {
    try {
      AuthService.logout()
      setCurrentUser(null)
      setIsAuthenticated(false)
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  // Context value
  const value = {
    currentUser,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Custom hook to use auth context
function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export { AuthProvider, useAuth }
