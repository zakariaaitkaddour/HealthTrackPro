// user.service.js
// Define the API base URL - make sure this points to your actual API
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8080/api"

// Helper function to get auth token from localStorage
const getAuthToken = () => localStorage.getItem("token")

const UserService = {
  // Get user profile
  getProfile: async () => {
    try {
      // IMPORTANT: Force production mode to always use the real API
      // Remove or comment out the development mode check

      // Real API call
      const token = getAuthToken()
      const headers = {
        "Content-Type": "application/json",
      }

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      } else {
        throw new Error("No authentication token found");
      }

      console.log(`Sending getProfile request to: ${API_BASE_URL}/users/profile`)
      const response = await fetch(`${API_BASE_URL}/users/profile`, {
        method: "GET",
        headers,
        credentials: "include",
      })

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || `Error: ${response.status}`;
        } catch (e) {
          errorMessage = `Error: ${response.status} - ${errorText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json()
      console.log("Real API getProfile response:", data)
      return data
    } catch (error) {
      console.error("Error in UserService.getProfile:", error)
      throw error
    }
  },

  // Update user profile
  updateProfile: async (userData) => {
    try {
      // IMPORTANT: Force production mode to always use the real API
      // Remove or comment out the development mode check

      // Real API call
      const token = getAuthToken()
      const headers = {
        "Content-Type": "application/json",
      }

      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      console.log(`Sending updateProfile request to: ${API_BASE_URL}/users/profile`)
      const response = await fetch(`${API_BASE_URL}/users/profile`, {
        method: "PUT",
        headers,
        body: JSON.stringify(userData),
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      const data = await response.json()
      console.log("Real API updateProfile response:", data)
      return data
    } catch (error) {
      console.error("Error in UserService.updateProfile:", error)
      throw error
    }
  },

  // For doctors: Get patients
  getPatients: async () => {
    try {
      // IMPORTANT: Force production mode to always use the real API
      // Remove or comment out the development mode check

      // Real API call
      const token = getAuthToken()
      const headers = {
        "Content-Type": "application/json",
      }

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      } else {
        throw new Error("No authentication token found");
      }

      console.log(`Sending getPatients request to: ${API_BASE_URL}/doctors/patients`)
      const response = await fetch(`${API_BASE_URL}/doctors/patients`, {
        method: "GET",
        headers,
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      const data = await response.json()
      console.log("Real API getPatients response:", data)
      return data
    } catch (error) {
      console.error("Error in UserService.getPatients:", error)
      throw error
    }
  },

  // For patients: Get doctors
  getDoctors: async () => {
    try {
      // IMPORTANT: Force production mode to always use the real API
      // Remove or comment out the development mode check

      // Real API call
      const token = getAuthToken()
      const headers = {
        "Content-Type": "application/json",
      }

      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      console.log(`Sending getDoctors request to: ${API_BASE_URL}/patients/doctors`)
      const response = await fetch(`${API_BASE_URL}/patients/doctors`, {
        method: "GET",
        headers,
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      const data = await response.json()
      console.log("Real API getDoctors response:", data)
      return data
    } catch (error) {
      console.error("Error in UserService.getDoctors:", error)
      throw error
    }
  },
}

export default UserService
