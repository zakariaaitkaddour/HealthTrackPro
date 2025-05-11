import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CircularProgress, Box, Typography } from "@mui/material";
import { useAuth } from "../../context/AuthContext";
import PatientDashboard from "../../components/dashboard/PatientDashboard";
import api from "../../services/api";

export default function DashboardPage() {
    const { isAuthenticated, isLoading, currentUser } = useAuth();
    const navigate = useNavigate();
    const [dashboardData, setDashboardData] = useState(null);
    const [error, setError] = useState(null);
  
    useEffect(() => {
      console.log("Auth state:", { isAuthenticated, isLoading, currentUser }); // Debug auth state
      if (!isLoading && !isAuthenticated) {
        console.log("Not authenticated, redirecting to /login");
        navigate('/login');
      } else if (isAuthenticated && currentUser?.role === "PATIENT") {
        console.log("Fetching dashboard data for patient...");
        const fetchData = async () => {
          try {
            const profileResponse = await api.get("/users/profile");
            const medicationsResponse = await api.get("/medications/user/" + profileResponse.data.id);
            const medicalDataResponse = await api.get("/medical-data");
            const appointmentsResponse = await api.get("/appointments/user/" + profileResponse.data.id);
  
            console.log("API responses:", {
              profile: profileResponse.data,
              medications: medicationsResponse.data,
              medicalData: medicalDataResponse.data,
              appointments: appointmentsResponse.data,
            });
  
            setDashboardData({
              profile: profileResponse.data,
              medications: medicationsResponse.data,
              medicalData: medicalDataResponse.data,
              appointments: appointmentsResponse.data,
            });
          } catch (error) {
            console.error("Failed to fetch dashboard data:", error.message);
            setError(error.message || "Failed to load dashboard data. Please try again later.");
          }
        };
        fetchData();
      } else {
        console.log("User is not a patient or auth state is invalid:", { currentUser });
      }
    }, [isAuthenticated, isLoading, navigate, currentUser]);
  
    if (isLoading) {
      return (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
          <CircularProgress />
        </Box>
      );
    }
  
    if (error) {
      return (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
          <Typography color="error">{error}</Typography>
        </Box>
      );
    }
  
    if (!dashboardData) {
      return (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
          <CircularProgress />
        </Box>
      );
    }
  
    if (isAuthenticated && currentUser?.role === "PATIENT") {
      console.log("Rendering PatientDashboard with dashboardData:", dashboardData);
      return <PatientDashboard dashboardData={dashboardData} />;
    }
  
    return null;
  }