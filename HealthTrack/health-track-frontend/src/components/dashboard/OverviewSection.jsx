import { Box, Typography, Card, CardContent, Button, Stack } from "@mui/material";
import { format, parseISO } from "date-fns";
import { useNavigate } from "react-router-dom";
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import MedicationIcon from '@mui/icons-material/Medication';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';

export default function OverviewSection({ data }) {
  const { profile, medications, medicalData, appointments } = data || {}; // Default to empty object if data is undefined
  const navigate = useNavigate();
  const nextAppointment = appointments?.[0];

  // Log the raw medications data for debugging
  console.log("Raw Medications data:", medications);

  // Validate and filter medications to ensure only valid entries are processed
  const validMedications = Array.isArray(medications)
    ? medications.filter(med => med && typeof med === 'object' && med.nextReminderTime && typeof med.nextReminderTime === 'string')
    : [];
  console.log("Valid Medications after filtering:", validMedications);

  // Sort valid medications by nextReminderTime
  const sortedMedications = validMedications.length
    ? [...validMedications].sort((a, b) => {
        try {
          const dateA = parseISO(a.nextReminderTime);
          const dateB = parseISO(b.nextReminderTime);
          if (isNaN(dateA) || isNaN(dateB)) {
            console.warn(`Invalid date detected: a=${a.nextReminderTime}, b=${b.nextReminderTime}`);
            return 0; // Avoid sorting errors
          }
          return dateA - dateB;
        } catch (error) {
          console.error("Error sorting medications:", { a, b, error });
          return 0; // Return 0 to prevent crash
        }
      })
    : [];

  const now = new Date();
  const nextMedication = sortedMedications.find(med => {
    try {
      const doseTime = parseISO(med.nextReminderTime);
      if (isNaN(doseTime)) {
        console.warn(`Invalid nextReminderTime for medication: ${med.nextReminderTime}`, med);
        return false;
      }
      return doseTime > now;
    } catch (error) {
      console.error(`Error parsing nextReminderTime: ${med.nextReminderTime}`, { med, error });
      return false;
    }
  });

  // Find the most recent medication if no future dose exists
  const mostRecentMedication = sortedMedications.length > 0 && !nextMedication
    ? sortedMedications.reduce((latest, current) => {
        try {
          const latestDate = parseISO(latest.nextReminderTime);
          const currentDate = parseISO(current.nextReminderTime);
          if (isNaN(latestDate) || isNaN(currentDate)) {
            console.warn(`Invalid date in most recent check: latest=${latest.nextReminderTime}, current=${current.nextReminderTime}`);
            return latest;
          }
          return latestDate > currentDate ? latest : current;
        } catch (error) {
          console.error("Error finding most recent medication:", { latest, current, error });
          return latest;
        }
      }, sortedMedications[0])
    : null;

  const latestHealthData = medicalData?.[medicalData.length - 1];

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
        Health Overview
      </Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
        {/* Appointment Card */}
        <Card sx={{ flex: "1 1 300px", minWidth: 300 }}>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <MedicalServicesIcon color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>Next Appointment</Typography>
            </Stack>
            
            {nextAppointment ? (
              <>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>Date:</strong> {format(parseISO(nextAppointment.appointment_date), 'EEE, MMM dd, yyyy @ h:mm a')}
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>Doctor:</strong> {nextAppointment.doctor_name || `Dr. ${nextAppointment.doctor_id}`}
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  <strong>Reason:</strong> {nextAppointment.reason}
                </Typography>
                <Stack direction="row" spacing={2}>
                  <Button
                    variant="contained"
                    sx={{ bgcolor: "#00a895", "&:hover": { bgcolor: "#00806f" } }}
                    onClick={() => navigate('/dashboard/appointments')}
                  >
                    View All
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/dashboard/appointments')}
                  >
                    New Appointment
                  </Button>
                </Stack>
              </>
            ) : (
              <>
                <Typography variant="body1" sx={{ mb: 2 }}>No upcoming appointments.</Typography>
                <Button
                  variant="contained"
                  sx={{ bgcolor: "#00a895", "&:hover": { bgcolor: "#00806f" } }}
                  onClick={() => navigate('/appointments/new')}
                >
                  Schedule Appointment
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Medication Card */}
        <Card sx={{ flex: "1 1 300px", minWidth: 300 }}>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <MedicationIcon color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>Next Medication</Typography>
            </Stack>
            
            {nextMedication ? (
              <>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>Name:</strong> {nextMedication.name}
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>Dosage:</strong> {nextMedication.dosage}
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  <strong>Time:</strong> {format(parseISO(nextMedication.nextReminderTime), "MMM dd, yyyy @ h:mm a")}
                </Typography>
                <Stack direction="row" spacing={2}>
                  <Button
                    variant="contained"
                    sx={{ bgcolor: "#00a895", "&:hover": { bgcolor: "#00806f" } }}
                    onClick={() => navigate('/medications')}
                  >
                    View All
                  </Button>
                  <Button
                    variant="contained"
                    color="success"
                    onClick={() => console.log("Marked as taken")}
                  >
                    Mark as Taken
                  </Button>
                </Stack>
              </>
            ) : mostRecentMedication ? (
              <>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>No upcoming doses. Last dose:</strong>
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>Name:</strong> {mostRecentMedication.name}
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>Dosage:</strong> {mostRecentMedication.dosage}
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  <strong>Time:</strong> {format(parseISO(mostRecentMedication.nextReminderTime), "MMM dd, yyyy @ h:mm a")}
                </Typography>
                <Button
                  variant="contained"
                  sx={{ bgcolor: "#00a895", "&:hover": { bgcolor: "#00806f" } }}
                  onClick={() => navigate('/medications')}
                >
                  View All Medications
                </Button>
              </>
            ) : (
              <>
                <Typography variant="body1" sx={{ mb: 2 }}>No medication data available.</Typography>
                <Button
                  variant="contained"
                  sx={{ bgcolor: "#00a895", "&:hover": { bgcolor: "#00806f" } }}
                  onClick={() => navigate('/medications/new')}
                >
                  Add Medication
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Health Data Card */}
        <Card sx={{ flex: "1 1 300px", minWidth: 300 }}>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <MonitorHeartIcon color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>Recent Health Data</Typography>
            </Stack>
            
            {latestHealthData ? (
              <>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>Blood Sugar:</strong> {latestHealthData.bloodSugar} mg/dL
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>Blood Pressure:</strong> {latestHealthData.systolicBloodPressure}/{latestHealthData.diastolicBloodPressure} mmHg
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>Heart Rate:</strong> {latestHealthData.heartRate} bpm
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  <strong>Recorded:</strong> {format(parseISO(latestHealthData.recordedAt), 'MMM dd, yyyy @ h:mm a')}
                </Typography>
                <Stack direction="row" spacing={2}>
                  <Button
                    variant="contained"
                    sx={{ bgcolor: "#00a895", "&:hover": { bgcolor: "#00806f" } }}
                    onClick={() => navigate('/health-data')}
                  >
                    View History
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/health-data/new')}
                  >
                    Record New Data
                  </Button>
                </Stack>
              </>
            ) : (
              <>
                <Typography variant="body1" sx={{ mb: 2 }}>No recent data available.</Typography>
                <Button
                  variant="contained"
                  sx={{ bgcolor: "#00a895", "&:hover": { bgcolor: "#00806f" } }}
                  onClick={() => navigate('/health-data/new')}
                >
                  Add Health Data
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}