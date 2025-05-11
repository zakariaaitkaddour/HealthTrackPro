import { useState, useEffect } from "react";
import { Box, Tabs, Tab, Typography, Stack, Button, Alert, CircularProgress } from "@mui/material";
import DoctorAppointmentsSection from "./components/sections/DoctorAppointmentsSection";
import PatientMedicalDataSection from "./components/sections/PatientMedicalDataSection";
import AddMedicationSection from "./components/sections/AddMedicationSection";
import { useNavigate } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { format, parseISO } from "date-fns";

export default function DoctorDashboardPage() {
  const [currentTab, setCurrentTab] = useState("appointments");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientCount, setPatientCount] = useState(0);
  const [medicalData, setMedicalData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const currentUser = JSON.parse(localStorage.getItem("user")) || {};
  const navigate = useNavigate();

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
    setCurrentTab("medical-data");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  useEffect(() => {
    const fetchPatientCount = async () => {
      try {
        setLoading(true);
        const response = await fetch("http://localhost:8080/api/users/patientCount", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        if (!response.ok) throw new Error("Failed to fetch patient count");
        const count = await response.json();
        setPatientCount(count);
      } catch (error) {
        console.error("Error fetching patient count:", error);
        setError("Erreur lors de la récupération du nombre de patients.");
      } finally {
        setLoading(false);
      }
    };

    const fetchMedicalData = async () => {
      if (!currentUser?.id) {
        setError("Utilisateur non connecté ou ID manquant. Veuillez vous reconnecter.");
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`http://localhost:8080/api/medical-data/user/${currentUser.userId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        if (!response.ok) throw new Error("Failed to fetch medical data");
        const data = await response.json();
        setMedicalData(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching medical data:", error);
        setError(`Erreur lors de la récupération des données médicales : ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchPatientCount();
    fetchMedicalData();
  }, [currentUser.id]);

  // Calcul des statistiques à partir de medicalData
  const calculateStats = (data) => {
    if (!data || data.length === 0) return [];
    const groupedByDate = data.reduce((acc, item) => {
      const date = format(parseISO(item.recordedAt), "MMM dd");
      if (!acc[date]) acc[date] = { count: 0, bloodSugarSum: 0, systolicSum: 0, heartRateSum: 0 };
      acc[date].count += 1;
      acc[date].bloodSugarSum += item.bloodSugar || 0;
      acc[date].systolicSum += item.systolicBloodPressure || 0;
      acc[date].heartRateSum += item.heartRate || 0;
      return acc;
    }, {});

    return Object.keys(groupedByDate).map((date) => ({
      date,
      bloodSugarAvg: groupedByDate[date].bloodSugarSum / groupedByDate[date].count || 0,
      systolicAvg: groupedByDate[date].systolicSum / groupedByDate[date].count || 0,
      heartRateAvg: groupedByDate[date].heartRateSum / groupedByDate[date].count || 0,
    }));
  };

  const statsData = calculateStats(medicalData);
  const overallAvg = medicalData.length > 0
    ? {
        bloodSugarAvg: medicalData.reduce((sum, item) => sum + (item.bloodSugar || 0), 0) / medicalData.length,
        systolicAvg: medicalData.reduce((sum, item) => sum + (item.systolicBloodPressure || 0), 0) / medicalData.length,
        heartRateAvg: medicalData.reduce((sum, item) => sum + (item.heartRate || 0), 0) / medicalData.length,
      }
    : { bloodSugarAvg: 0, systolicAvg: 0, heartRateAvg: 0 };

  return (
    <Box sx={{ p: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Tableau de Bord Médical
        </Typography>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Typography variant="subtitle1">
            Bonjour, Dr. {currentUser.name || "Inconnu"}
          </Typography>
          <Button
            variant="outlined"
            color="red"
            onClick={handleLogout}
            sx={{
              borderRadius: "20px",
              textTransform: "none",
              "&:hover": { backgroundColor: "red" },
            }}
          >
            Déconnexion
          </Button>
        </Stack>
      </Stack>

      <Tabs
        value={currentTab}
        onChange={handleTabChange}
        sx={{
          mb: 4,
          "& .MuiTabs-indicator": {
            backgroundColor: "#00a895",
          },
        }}
      >
        <Tab
          label="Rendez-vous"
          value="appointments"
          sx={{
            fontWeight: currentTab === "appointments" ? 600 : 400,
            color: currentTab === "appointments" ? "#00a895" : "inherit",
          }}
        />
        <Tab
          label="Dossiers Patients"
          value="medical-data"
          sx={{
            fontWeight: currentTab === "medical-data" ? 600 : 400,
            color: currentTab === "medical-data" ? "#00a895" : "inherit",
          }}
        />
        
        <Tab
          label="Statistiques"
          value="statistics"
          sx={{
            fontWeight: currentTab === "statistics" ? 600 : 400,
            color: currentTab === "statistics" ? "#00a895" : "inherit",
          }}
        />
      </Tabs>

      {currentTab === "appointments" && (
        <DoctorAppointmentsSection onSelectPatient={handleSelectPatient} />
      )}

      {currentTab === "medical-data" && (
        <Box sx={{ display: "flex", gap: 4 }}>
          <Box sx={{ flex: 6 }}>
            <PatientMedicalDataSection patientId={selectedPatient?.id} />
          </Box>
          {/* <Box sx={{ flex: 1 }}>
            <AddMedicationSection patientId={selectedPatient?.id} />
          </Box> */}
        </Box>
      )}

      {currentTab === "prescriptions" && (
        <Box sx={{ p: 3, bgcolor: "background.paper", borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            Gestion des Prescriptions
          </Typography>
          {/* Ici vous pourriez ajouter un composant de gestion des prescriptions */}
        </Box>
      )}

      {currentTab === "statistics" && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Statistiques Médicales
          </Typography>
          {loading && <CircularProgress sx={{ mb: 2 }} />}
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {medicalData.length === 0 && !error && !loading && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Aucune donnée médicale disponible pour générer des statistiques.
            </Alert>
          )}
          {!error && medicalData.length > 0 && (
            <>
              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle1">
                  Nombre total de patients : {patientCount}
                </Typography>
                <Typography variant="subtitle1" sx={{ mt: 1 }}>
                  Moyenne globale - Glycémie : {overallAvg.bloodSugarAvg.toFixed(2)} mg/dL
                </Typography>
                <Typography variant="subtitle1">
                  Moyenne globale - Pression Systolique : {overallAvg.systolicAvg.toFixed(2)} mmHg
                </Typography>
                <Typography variant="subtitle1">
                  Moyenne globale - Fréquence Cardiaque : {overallAvg.heartRateAvg.toFixed(2)} bpm
                </Typography>
              </Box>
              <Box>
                <Typography variant="h6" gutterBottom>
                  Tendances des Moyennes
                </Typography>
                <LineChart width={600} height={300} data={statsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="bloodSugarAvg" stroke="#00a895" name="Blood Sugar Avg" />
                  <Line type="monotone" dataKey="systolicAvg" stroke="#ff7300" name="Systolic Avg" />
                  <Line type="monotone" dataKey="heartRateAvg" stroke="#ff00ff" name="Heart Rate Avg" />
                </LineChart>
              </Box>
            </>
          )}
        </Box>
      )}

      {/* Pied de page avec informations utiles */}
      <Box
        sx={{
          mt: 4,
          pt: 2,
          borderTop: "1px solid",
          borderColor: "divider",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <Typography variant="body2" color="text.secondary">
          {new Date().toLocaleDateString("fr-FR", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Nombre de patients aujourd'hui : {patientCount}
        </Typography>
      </Box>
    </Box>
  );
}