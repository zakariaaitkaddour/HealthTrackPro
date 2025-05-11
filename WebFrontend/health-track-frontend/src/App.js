import { Routes, Route } from "react-router-dom"; // Import Routes and Route
import { Box, Container, Typography } from "@mui/material";
import AuthContainer from "./components/auth/auth-container";
import DashboardPage from "./app/dashboard/page"; // Import Dashboard component (create this if it doesn't exist)
import ProfileSection from "./components/dashboard/ProfileSection";
import { useAuth } from "./context/AuthContext"; // Import AuthContext
import MedicationsSection from "./components/dashboard/MedicationsSection";
import AppointmentsSection from "./components/dashboard/AppointmentsSection";
import DoctorDashboardPage from "./app/doctor-dashboard/page"; // Import DoctorDashboard component (create this if it doesn't exist)
import HealthTrackingSection from "./components/dashboard/HealthTrackingSection";

function App() {

  const { currentUser } = useAuth();
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "linear-gradient(to bottom right, #f0f7fa, #ffffff)",
        backgroundImage: "url(/subtle-pattern.svg)",
        backgroundRepeat: "repeat",
      }}
    >
      <Box
        component="header"
        sx={{
          width: "100%",
          py: 3,
          px: { xs: 2, md: 4 },
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <svg
            width="40"
            height="40"
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ color: "#00a895" }}
          >
            <path
              d="M20 5C11.729 5 5 11.729 5 20C5 28.271 11.729 35 20 35C28.271 35 35 28.271 35 20C35 11.729 28.271 5 20 5ZM20 32.5C13.107 32.5 7.5 26.893 7.5 20C7.5 13.107 13.107 7.5 20 7.5C26.893 7.5 32.5 13.107 32.5 20C32.5 26.893 26.893 32.5 20 32.5Z"
              fill="currentColor"
            />
            <path
              d="M27.5 18.75H21.25V12.5C21.25 11.81 20.69 11.25 20 11.25C19.31 11.25 18.75 11.81 18.75 12.5V18.75H12.5C11.81 18.75 11.25 19.31 11.25 20C11.25 20.69 11.81 21.25 12.5 21.25H18.75V27.5C18.75 28.19 19.31 28.75 20 28.75C20.69 28.75 21.25 28.19 21.25 27.5V21.25H27.5C28.19 21.25 28.75 20.69 28.75 20C28.75 19.31 28.19 18.75 27.5 18.75Z"
              fill="currentColor"
            />
          </svg>
          <Typography variant="h5" fontWeight="bold" color="text.primary">
            HealthTrack Pro
          </Typography>
        </Box>
      </Box>

      <Container
        component="main"
        maxWidth="md"
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 2,
        }}
      >
        <Routes>
          <Route path="/" element={<AuthContainer />} />
          <Route path="/auth" element={<AuthContainer />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/dashboard/profile" element={<ProfileSection currentUser={currentUser} />} />
          <Route path="/dashboard/medications" element={<MedicationsSection />} />
          <Route path="/dashboard/appointments" element={<AppointmentsSection />} />
          <Route path="/dashboard/health-tarcking" element={<HealthTrackingSection />} />          
          <Route path="/doctor-dashboard" element={<DoctorDashboardPage />} />


        </Routes>
      </Container>

      <Box
        component="footer"
        sx={{
          width: "100%",
          py: 2,
          px: 4,
          textAlign: "center",
        }}
      >
        <Typography variant="body2" color="text.secondary">
          © {new Date().getFullYear()} HealthTrack Pro. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
}

export default App;