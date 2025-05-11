// API service using native fetch

// Base URL for API requests - using relative path for proxy to work
const API_BASE_URL = "http://localhost:8080/api"

// Helper function to get auth token from localStorage
const getAuthToken = () => localStorage.getItem("token")

// API methods
const api = {
  // GET request
  get: async (endpoint) => {
    try {
      const token = getAuthToken()
      const headers = {
        "Content-Type": "application/json",
      }

      // Add token to Authorization header exactly as expected by your Java backend
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      console.log(`Sending GET request to: ${API_BASE_URL}${endpoint}`)
      console.log("Headers:", headers)

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "GET",
        headers,
      })
      

      // Check for HTTP errors
      if (!response.ok) {
        const status = response.status
        let errorMessage = `Error: ${status}`

        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (e) {
          // If response is not JSON, use text
          try {
            const errorText = await response.text()
            if (errorText) errorMessage = errorText
          } catch (textError) {
            // If we can't get text either, use the status code
          }
        }

        throw new Error(errorMessage)
      }

      if (response.status === 204) {
        return { data: [] }; // Retourner un tableau vide pour les cas où il n'y a pas de données
      }

      // Parse JSON response
      const data = await response.json()
      return { data }
    } catch (error) {
      console.error(`GET ${endpoint} error:`, error)
      throw error
    }
  },

  // POST request
  post: async (endpoint, data) => {
    try {
      const token = getAuthToken()
      const headers = {
        "Content-Type": "application/json",
      }

      // Add token to Authorization header exactly as expected by your Java backend
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      console.log(`Sending POST request to: ${API_BASE_URL}${endpoint}`, data)
      console.log("Headers:", headers)

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers,
        body: JSON.stringify(data),
      })

      // Check for HTTP errors
      if (!response.ok) {
        const status = response.status
        let errorMessage = `Error: ${status}`

        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (e) {
          // If response is not JSON, use text
          try {
            const errorText = await response.text()
            if (errorText) errorMessage = errorText
          } catch (textError) {
            // If we can't get text either, use the status code
          }
        }

        throw new Error(errorMessage)
      }

      // Parse JSON response
      const responseData = await response.json()
      return { data: responseData }
    } catch (error) {
      console.error(`POST ${endpoint} error:`, error)
      throw error
    }
  },

  // PUT request
  put: async (endpoint, data) => {
    try {
      const token = getAuthToken()
      const headers = {
        "Content-Type": "application/json",
      }

      // Add token to Authorization header exactly as expected by your Java backend
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      console.log(`Sending PUT request to: ${API_BASE_URL}${endpoint}`, data)
      console.log("Headers:", headers)

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(data),
      })

      // Check for HTTP errors
      if (!response.ok) {
        const status = response.status
        let errorMessage = `Error: ${status}`

        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (e) {
          // If response is not JSON, use text
          try {
            const errorText = await response.text()
            if (errorText) errorMessage = errorText
          } catch (textError) {
            // If we can't get text either, use the status code
          }
        }

        throw new Error(errorMessage)
      }

      // Parse JSON response
      const responseData = await response.json()
      return { data: responseData }
    } catch (error) {
      console.error(`PUT ${endpoint} error:`, error)
      throw error
    }
  },

  // DELETE request
  delete: async (endpoint) => {
    try {
      const token = getAuthToken()
      const headers = {
        "Content-Type": "application/json",
      }

      // Add token to Authorization header exactly as expected by your Java backend
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      console.log(`Sending DELETE request to: ${API_BASE_URL}${endpoint}`)
      console.log("Headers:", headers)

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "DELETE",
        headers,
      })

      // Check for HTTP errors
      if (!response.ok) {
        const status = response.status
        let errorMessage = `Error: ${status}`

        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (e) {
          // If response is not JSON, use text
          try {
            const errorText = await response.text()
            if (errorText) errorMessage = errorText
          } catch (textError) {
            // If we can't get text either, use the status code
          }
        }

        throw new Error(errorMessage)
      }

      // Parse JSON response if there is one
      if (response.headers.get("content-type")?.includes("application/json")) {
        const responseData = await response.json()
        return { data: responseData }
      }

      return { data: { success: true } }
    } catch (error) {
      console.error(`DELETE ${endpoint} error:`, error)
      throw error
    }
  },
}

export default api
