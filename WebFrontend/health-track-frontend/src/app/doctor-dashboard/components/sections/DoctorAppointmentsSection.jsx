import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  TableContainer,
  CircularProgress,
  Typography,
  Alert,
  Button,
  Chip,
  Box,
} from "@mui/material";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import ErrorIcon from "@mui/icons-material/Error";
import { format, parseISO } from "date-fns";

export default function DoctorAppointmentsSection({ onSelectPatient }) {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const currentUser = JSON.parse(localStorage.getItem("user")) || {};

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Récupérer les patients
        const patientsResponse = await fetch("http://localhost:8080/api/patient", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        });

        if (!patientsResponse.ok) {
          const errorData = await patientsResponse.json();
          throw new Error(errorData.message || `HTTP error! status: ${patientsResponse.status}`);
        }

        const patientsData = await patientsResponse.json();
        // Créer un objet pour mapper patientId -> patient
        const patientsMap = {};
        patientsData.forEach((patient) => {
          patientsMap[patient.id] = patient;
        });
        setPatients(patientsMap);

        // Récupérer les rendez-vous
        const appointmentsResponse = await fetch(
          `http://localhost:8080/api/appointments/doctor/${currentUser.userId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          }
        );

        const contentType = appointmentsResponse.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const text = await appointmentsResponse.text();
          throw new Error(
            text.startsWith("<!DOCTYPE")
              ? "Server error: Received HTML instead of JSON"
              : text
          );
        }

        if (!appointmentsResponse.ok) {
          const errorData = await appointmentsResponse.json();
          throw new Error(errorData.message || `HTTP error! status: ${appointmentsResponse.status}`);
        }

        const data = await appointmentsResponse.json();
        console.log("Fetched appointments:", data);

        // Associer les noms des patients aux rendez-vous
        const appointmentsWithPatients = Array.isArray(data)
          ? data.map((appt) => ({
              ...appt,
              patient: patientsMap[appt.patientId] || { name: "Patient inconnu", id: appt.patientId },
            }))
          : [];
        setAppointments(appointmentsWithPatients);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError(
          error.message.includes("<!DOCTYPE")
            ? "Server is not responding properly"
            : error.message
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser.userId]);

  const handleViewDetails = (patientId) => {
    if (onSelectPatient) {
      const selectedAppointment = appointments.find((a) => a.patient?.id === patientId);
      onSelectPatient(selectedAppointment?.patient);
    }
  };

  const handleUpdateStatus = async (appointmentId, accept) => {
  try {
    setLoading(true);
    setError(null);
    const response = await fetch(
      `http://localhost:8080/api/appointments/${appointmentId}/doctor/${currentUser.userId}/status`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ accept }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const updatedAppointment = await response.json();
    setAppointments((prevAppointments) =>
      prevAppointments.map((appt) =>
        appt.id === appointmentId ? { ...appt, accepted: accept } : appt
      )
    );
  } catch (error) {
    console.error("Error updating appointment status:", error);
    setError(
      error.message.includes("<!DOCTYPE")
        ? "Server is not responding properly"
        : `Erreur lors de la mise à jour : ${error.message}`
    );
  } finally {
    setLoading(false);
  }
};

  if (loading) {
    return (
      <Paper elevation={3} sx={{ p: 4, textAlign: "center" }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Chargement des rendez-vous...
        </Typography>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper elevation={3} sx={{ p: 2 }}>
        <Alert severity="error" icon={<ErrorIcon />} sx={{ mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Erreur de chargement
          </Typography>
          <Typography variant="body2">
            {error.length > 100 ? `${error.substring(0, 100)}...` : error}
          </Typography>
        </Alert>
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <Button variant="contained" onClick={() => window.location.reload()} sx={{ mt: 2 }}>
            Réessayer
          </Button>
        </Box>
      </Paper>
    );
  }

  if (appointments.length === 0) {
    return (
      <Paper elevation={3} sx={{ p: 4, textAlign: "center" }}>
        <MedicalServicesIcon sx={{ fontSize: 60, color: "text.secondary", mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          Aucun rendez-vous programmé
        </Typography>
        <Typography color="text.secondary">
          Vous n'avez pas de rendez-vous à venir.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 2, width: "1000px", borderRadius: 2 }}>
      <TableContainer>
        <Table>
          <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold" }}>Patient</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Date & Heure</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Motif</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Statut</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {appointments.map((appt) => (
              <TableRow key={appt.id} hover>
                <TableCell>
                  <Typography fontWeight="medium">
                    {appt.patient?.name || "Patient inconnu"}
                  </Typography>
                  {appt.patient?.age && (
                    <Typography variant="body2" color="text.secondary">
                      {appt.patient.age} ans
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {appt.appointmentDate
                      ? format(parseISO(appt.appointmentDate), "EEE, MMM d, yyyy")
                      : "N/A"}
                  </Typography>
                </TableCell>
                <TableCell>{appt.reason || "Consultation générale"}</TableCell>
                <TableCell>
                  <Chip
                    label={appt.accepted ? "Confirmé" : "En attente"}
                    color={appt.accepted ? "success" : "warning"}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    size="small"
                    sx={{
                      backgroundColor: "#00a895",
                      "&:hover": { backgroundColor: "#00806f" },
                      mr: 1,
                    }}
                    onClick={() => handleViewDetails(appt.patient?.id)}
                    disabled={appt.accepted !== null} // Désactiver si déjà validé ou refusé
                  >
                    Détails
                  </Button>
                  <Button
                    variant="contained"
                    size="small"
                    sx={{
                      backgroundColor: "#4caf50",
                      "&:hover": { backgroundColor: "#388e3c" },
                      mr: 1,
                    }}
                    onClick={() => handleUpdateStatus(appt.id, true)}
                    disabled={appt.accepted === true} // Désactiver si déjà validé
                  >
                    Valider
                  </Button>
                  <Button
                    variant="contained"
                    size="small"
                    sx={{
                      backgroundColor: "#f44336",
                      "&:hover": { backgroundColor: "#d32f2f" },
                    }}
                    onClick={() => handleUpdateStatus(appt.id, false)}
                    disabled={appt.accepted === false} // Désactiver si déjà refusé
                  >
                    Refuser
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}