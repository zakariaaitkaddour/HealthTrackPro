import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  Paper,
  TableContainer,
  Stack,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
} from "@mui/material";
import { format, parseISO } from "date-fns";
import AddIcon from '@mui/icons-material/Add';
import CancelIcon from '@mui/icons-material/Cancel';
import EditIcon from '@mui/icons-material/Edit';
import EventIcon from '@mui/icons-material/Event';
import PersonIcon from '@mui/icons-material/Person';
import InfoIcon from '@mui/icons-material/Info';

export default function AppointmentsSection({ appointments: initialAppointments }) {
  const [appointments, setAppointments] = useState(initialAppointments || []);
  const [openDialog, setOpenDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [newAppointment, setNewAppointment] = useState({
    appointmentDate: new Date().toISOString().slice(0, 16),
    doctorId: "",
    reason: "General checkup",
  });
  const [doctors, setDoctors] = useState([]);
  const currentUser = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("http://localhost:8080/api/doctors", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (!response.ok) throw new Error("Failed to fetch doctors");

        const data = await response.json();
        setDoctors(data || []);
      } catch (error) {
        console.error("Error fetching doctors:", error);
        setError("Failed to load doctors list");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`http://localhost:8080/api/appointments/user/${currentUser.userId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        if (!response.ok) throw new Error("Failed to fetch appointments");
        const data = await response.json();
        console.log("Fetched appointments:", data);
        setAppointments(data || []);
      } catch (error) {
        console.error("Error fetching appointments:", error);
        setError("Failed to load appointments");
        setAppointments([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppointments();
  }, [currentUser.userId]);

  const handleCancelAppointment = async (appointmentId) => {
    try {
      setIsLoading(true);
      const response = await fetch(`http://localhost:8080/api/appointments/${appointmentId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to cancel appointment");
      setAppointments(appointments.filter(appt => appt.id !== appointmentId));
      setSuccess("Appointment canceled successfully!");
    } catch (error) {
      console.error("Error canceling appointment:", error);
      setError("Failed to cancel appointment");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookAppointment = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!newAppointment.doctorId) {
        throw new Error("Please select a doctor");
      }
      if (!newAppointment.appointmentDate) {
        throw new Error("Please select a date and time");
      }
      if (!newAppointment.reason.trim()) {
        throw new Error("Please provide a reason for the appointment");
      }
      const appointmentDate = new Date(newAppointment.appointmentDate);
      if (appointmentDate < new Date()) {
        throw new Error("Appointment date must be in the future");
      }

      const formattedDate = appointmentDate.toISOString();

      const response = await fetch(`http://localhost:8080/api/appointments/user/${currentUser.userId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          appointmentDate: formattedDate,
          reason: newAppointment.reason,
          doctor: { id: Number(newAppointment.doctorId) },
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        console.log("Server response:", text);
        try {
          const errorData = JSON.parse(text) || {};
          throw new Error(errorData.message || "Failed to book appointment: " + text);
        } catch (parseError) {
          throw new Error("Failed to book appointment: Server returned invalid response");
        }
      }

      const addedAppt = await response.json();
      setAppointments([...appointments, addedAppt]);
      setSuccess("Appointment booked successfully!");
      setOpenDialog(false);
      setNewAppointment({
        appointmentDate: new Date().toISOString().slice(0, 16),
        doctorId: "",
        reason: "General checkup",
      });
    } catch (error) {
      console.error("Error booking appointment:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusChip = (appointmentDate, accepted) => {
    const now = new Date();
    const apptDate = parseISO(appointmentDate);
    const isPast = apptDate < now;
    const isToday = apptDate.toDateString() === now.toDateString();

    if (isPast) {
      return <Chip label="Completed" color="default" size="small" />;
    }
    if (isToday) {
      return <Chip label="Today" color="primary" size="small" />;
    }
    if (accepted === true) {
      return <Chip label="Accepted" color="success" size="small" />;
    }
    if (accepted === false) {
      return <Chip label="Refused" color="error" size="small" />;
    }
    return <Chip label="Pending" color="warning" size="small" />;
  };

  return (
    <Box sx={{ p: 3, mt: -20 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          My Appointments
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          sx={{
            bgcolor: "#00a895",
            "&:hover": { bgcolor: "#00806f" },
            px: 3,
            py: 1,
          }}
          onClick={() => setOpenDialog(true)}
        >
          New Appointment
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      {isLoading && appointments.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : appointments.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <EventIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No appointments scheduled
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            You don't have any upcoming appointments. Book one now!
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            sx={{
              bgcolor: "#00a895",
              "&:hover": { bgcolor: "#00806f" },
            }}
            onClick={() => setOpenDialog(true)}
          >
            Book Appointment
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead sx={{ bgcolor: 'background.default' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Date & Time</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Doctor</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Reason</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {appointments.map((appt) => (
                <TableRow key={appt.id}>
                  <TableCell>
                    {getStatusChip(appt.appointmentDate, appt.accepted)}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {appt.appointmentDate
                        ? format(parseISO(appt.appointmentDate), 'EEE, MMM d, yyyy')
                        : 'N/A'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {appt.appointmentDate
                        ? format(parseISO(appt.appointmentDate), 'h:mm a')
                        : 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <PersonIcon color="action" fontSize="small" />
                      <Typography>
                        {appt.doctor?.name || `Dr. ${appt.doctorId}`}
                      </Typography>
                    </Stack>
                    {appt.doctor?.specialization?.name && (
                      <Typography variant="body2" color="text.secondary">
                        {appt.doctor.specialization.name}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {appt.reason || "General checkup"}
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <IconButton
                        color="error"
                        onClick={() => handleCancelAppointment(appt.id)}
                        // disabled={isLoading || appt.accepted !== null} // Désactiver si accepté ou refusé
                      >
                        <CancelIcon />
                      </IconButton>
                      
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog
        open={openDialog}
        onClose={() => !isLoading && setOpenDialog(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{
          bgcolor: '#00a895',
          color: 'white',
          fontWeight: 600,
        }}>
          Book New Appointment
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={3}>
            <TextField
              fullWidth
              label="Date & Time"
              type="datetime-local"
              value={newAppointment.appointmentDate}
              onChange={(e) => setNewAppointment({ ...newAppointment, appointmentDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              disabled={isLoading}
            />

            <Select
              fullWidth
              label="Doctor"
              value={newAppointment.doctorId}
              onChange={(e) => setNewAppointment({ ...newAppointment, doctorId: e.target.value })}
              required
              disabled={isLoading || doctors.length === 0}
            >
              <MenuItem value="" disabled>
                {doctors.length === 0 ? "Loading doctors..." : "Select a doctor"}
              </MenuItem>
              {doctors.map((doctor) => (
                <MenuItem key={doctor.id} value={doctor.id}>
                  Dr. {doctor.name}
                  {doctor.specialization?.name && ` - ${doctor.specialization.name}`}
                </MenuItem>
              ))}
            </Select>

            <TextField
              fullWidth
              label="Reason for appointment"
              multiline
              rows={3}
              value={newAppointment.reason}
              onChange={(e) => setNewAppointment({ ...newAppointment, reason: e.target.value })}
              disabled={isLoading}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={() => setOpenDialog(false)}
            disabled={isLoading}
            color="inherit"
          >
            Cancel
          </Button>
          <Button
            onClick={handleBookAppointment}
            variant="contained"
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} /> : null}
            sx={{ bgcolor: '#00a895' }}
          >
            {isLoading ? 'Booking...' : 'Book Appointment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}