import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  Typography,
  Divider,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
} from "@mui/material";
import { format, parseISO } from "date-fns";
import AddMedicationSection from "./AddMedicationSection";

export default function PatientMedicalDataSection() {
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [medicalData, setMedicalData] = useState([]);
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fonction utilitaire pour gérer les appels API
  const fetchData = useCallback(async (url, setData) => {
    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        throw new Error(
          text.startsWith("<!DOCTYPE")
            ? "Server error: Received HTML instead of JSON"
            : text
        );
      }

      if (!response.ok) {
        if (response.status === 204) {
          setData([]);
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setData(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(`Error fetching data from ${url}:`, err);
      setError(err.message);
    }
  }, []);

  // Récupérer la liste des patients
  useEffect(() => {
    fetchData("http://localhost:8080/api/patient", setPatients);
  }, [fetchData]);

  // Récupérer les données médicales et les médicaments
  useEffect(() => {
    if (!selectedPatientId) {
      setMedicalData([]);
      setMedications([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    setMedicalData([]);
    setMedications([]);

    Promise.all([
      fetchData(`http://localhost:8080/api/medical-data/user/${selectedPatientId}`, setMedicalData),
      fetchData(`http://localhost:8080/api/medications/user/${selectedPatientId}`, setMedications),
    ]).finally(() => setLoading(false));
  }, [selectedPatientId, fetchData]);

  const handlePatientChange = (event) => {
    setSelectedPatientId(event.target.value);
  };

  const handleMedicationAdded = () => {
    fetchData(`http://localhost:8080/api/medications/user/${selectedPatientId}`, setMedications);
  };

  return (
    <Card sx={{ borderRadius: 3, boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)", width: "1000px" }}>
      <CardContent sx={{ p: 4 }}>
        <Typography variant="h5" fontWeight="bold" color="primary" mb={2}>
          Patient Medical Data
        </Typography>
        <Divider sx={{ mb: 3, borderColor: "#e0e0e0" }} />

        {patients.length > 0 ? (
          <FormControl fullWidth sx={{ mb: 3, maxWidth: 300 }}>
            <InputLabel id="patient-select-label">Select Patient</InputLabel>
            <Select
              labelId="patient-select-label"
              value={selectedPatientId}
              label="Select Patient"
              onChange={handlePatientChange}
              sx={{ borderRadius: "8px" }}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {patients.map((patient) => (
                <MenuItem key={patient.id} value={patient.id}>
                  {patient.name || `Patient ${patient.id}`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        ) : (
          <Typography variant="body1" color="text.secondary" mb={2}>
            No patients available.
          </Typography>
        )}

        {selectedPatientId && (
          <AddMedicationSection
            patientId={selectedPatientId}
            onMedicationAdded={handleMedicationAdded}
          />
        )}

        <Paper
          elevation={2}
          sx={{
            p: 2,
            mt: 5,
            borderRadius: 2,
            backgroundColor: "#fff",
            border: "1px solid #e0e0e0",
            borderLeft: "4px solid #1976d2",
          }}
        >
          <Typography variant="h5" fontWeight="bold" color="primary" mb={2}>
            Medical data
          </Typography>
          <Divider sx={{ mb: 3, borderColor: "#e0e0e0" }} />
          {loading ? (
            <Typography variant="body1" color="text.secondary" align="center">
              Loading...
            </Typography>
          ) : error ? (
            <Alert severity="error" sx={{ borderRadius: "8px" }}>
              {error}
            </Alert>
          ) : !selectedPatientId ? (
            <Typography variant="body1" color="text.secondary" align="center">
              Select a patient to view medical data.
            </Typography>
          ) : medicalData.length === 0 ? (
            <>
              
              <Typography variant="body1" color="text.secondary" align="center">
                No medical data available for this patient.
              </Typography>
            </>
          ) : (
            <TableContainer component={Paper} sx={{ mt: 3, borderRadius: 2 }}>
              <Table>
                <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: "bold", color: "#424242" }}>Date Recorded</TableCell>
                    <TableCell sx={{ fontWeight: "bold", color: "#424242" }}>Blood Sugar (mg/dL)</TableCell>
                    <TableCell sx={{ fontWeight: "bold", color: "#424242" }}>Systolic BP (mmHg)</TableCell>
                    <TableCell sx={{ fontWeight: "bold", color: "#424242" }}>Diastolic BP (mmHg)</TableCell>
                    <TableCell sx={{ fontWeight: "bold", color: "#424242" }}>Heart Rate (bpm)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {medicalData.map((data) => (
                    <TableRow key={data.id} hover>
                      <TableCell>
                        {data.recordedAt
                          ? format(parseISO(data.recordedAt), "MMM d, yyyy HH:mm")
                          : "N/A"}
                      </TableCell>
                      <TableCell>{data.bloodSugar ?? "N/A"}</TableCell>
                      <TableCell>{data.systolicBloodPressure ?? "N/A"}</TableCell>
                      <TableCell>{data.diastolicBloodPressure ?? "N/A"}</TableCell>
                      <TableCell>{data.heartRate ?? "N/A"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

        {medications.length > 0 && (
          <Paper
          elevation={2}
          sx={{
            p: 2,
            mt: 5,
            borderRadius: 2,
            backgroundColor: "#fff",
            border: "1px solid #e0e0e0",
            borderLeft: "4px solid #1976d2",
          }}>
            <Typography variant="h5" fontWeight="bold" color="primary" mb={2}>
              Medications
            </Typography>
            <Divider sx={{ mb: 3, borderColor: "#e0e0e0" }} />
            <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
              <Table>
                <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: "bold", color: "#424242" }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: "bold", color: "#424242" }}>Dosage</TableCell>
                    <TableCell sx={{ fontWeight: "bold", color: "#424242" }}>Next Reminder Time</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {medications.map((med) => (
                    <TableRow key={med.id} hover>
                      <TableCell>{med.name ?? "N/A"}</TableCell>
                      <TableCell>{med.dosage ?? "N/A"}</TableCell>
                      <TableCell>
                        {med.nextReminderTime
                          ? format(new Date(med.nextReminderTime), "MMM d, yyyy HH:mm")
                          : "N/A"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}
      </CardContent>
    </Card>
  );
}