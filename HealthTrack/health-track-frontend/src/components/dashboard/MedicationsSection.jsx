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
  Paper,
  TableContainer,
  Stack,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from "@mui/material";
import { format, parseISO } from "date-fns";
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AlarmIcon from '@mui/icons-material/Alarm';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';

export default function MedicationsSection({ medications: initialMedications }) {
  const [medications, setMedications] = useState(initialMedications || []);
  const [openDialog, setOpenDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [newMedication, setNewMedication] = useState({ 
    name: "", 
    dosage: "", 
    frequency: "Once daily", 
    nextDoseTime: new Date().toISOString().slice(0, 16) 
  });
  const currentUser = JSON.parse(localStorage.getItem("user"));

  // Frequency options
  const frequencyOptions = [
    "Once daily",
    "Twice daily",
    "Three times daily",
    "Every 4 hours",
    "Every 6 hours",
    "Every 8 hours",
    "As needed"
  ];

  // Load medications
  useEffect(() => {
    const fetchMedications = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `http://localhost:8080/api/medications/user/${currentUser.userId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        if (!response.ok) throw new Error("Failed to fetch medications");
        const data = await response.json();
        setMedications(data);
      } catch (error) {
        console.error("Error fetching medications:", error);
        setError("Failed to load medications");
      } finally {
        setIsLoading(false);
      }
    };
    fetchMedications();
  }, [currentUser.userId]);

  const handleMarkAsTaken = async (medicationId) => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `http://localhost:8080/api/medications/${medicationId}/taken`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (!response.ok) throw new Error("Failed to mark dose as taken");
      const updatedMed = await response.json();
      setMedications(medications.map(med => med.id === medicationId ? updatedMed : med));
      setSuccess("Medication marked as taken successfully!");
    } catch (error) {
      console.error("Error marking dose as taken:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMedication = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Basic validation
      if (!newMedication.name || !newMedication.dosage || !newMedication.frequency) {
        throw new Error("Please fill all required fields");
      }

      const response = await fetch(
        `http://localhost:8080/api/medications/user/${currentUser.userId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(newMedication),
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add medication");
      }
      
      const addedMed = await response.json();
      setMedications([...medications, addedMed]);
      setOpenDialog(false);
      setSuccess("Medication added successfully!");
      setNewMedication({ 
        name: "", 
        dosage: "", 
        frequency: "Once daily", 
        nextDoseTime: new Date().toISOString().slice(0, 16) 
      });
    } catch (error) {
      console.error("Error adding medication:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusChip = (nextDoseTime) => {
    if (!nextDoseTime) return null;
    
    const now = new Date();
    const doseTime = new Date(nextDoseTime);
    const isPast = doseTime < now;
    
    return (
      <Chip
        icon={isPast ? <AlarmIcon /> : <CheckCircleIcon />}
        label={isPast ? "Due now" : format(parseISO(nextDoseTime), "h:mm a")}
        color={isPast ? "warning" : "success"}
        size="small"
      />
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          My Medications
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          sx={{ 
            bgcolor: "#00a895", 
            "&:hover": { bgcolor: "#00806f" },
            px: 3,
            py: 1
          }}
          onClick={() => setOpenDialog(true)}
        >
          Add Medication
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {isLoading && medications.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : medications.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <MedicalServicesIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No medications scheduled
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            You don't have any active medications. Add one now!
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            sx={{ 
              bgcolor: "#00a895", 
              "&:hover": { bgcolor: "#00806f" }
            }}
            onClick={() => setOpenDialog(true)}
          >
            Add Medication
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead sx={{ bgcolor: 'background.default' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Medication</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Dosage</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Frequency</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Next Dose</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {medications.map((med) => (
                <TableRow key={med.id}>
                  <TableCell>
                    <Typography fontWeight="500">{med.name}</Typography>
                  </TableCell>
                  <TableCell>{med.dosage}</TableCell>
                  <TableCell>{med.frequency}</TableCell>
                  <TableCell>
                    {med.nextReminderTime ? format(parseISO(med.nextReminderTime), 'MMM d, yyyy') : "N/A"}
                  </TableCell>
                  <TableCell>
                    {getStatusChip(med.nextReminderTime)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<CheckCircleIcon />}
                      onClick={() => handleMarkAsTaken(med.id)}
                      disabled={isLoading}
                      sx={{ 
                        bgcolor: "#00a895", 
                        "&:hover": { bgcolor: "#00806f" },
                        "&:disabled": { bgcolor: "#e0e0e0" }
                      }}
                    >
                      Mark Taken
                    </Button>
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
          fontWeight: 600
        }}>
          Add New Medication
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={3}>
            <TextField
              fullWidth
              label="Medication Name *"
              value={newMedication.name}
              onChange={(e) => setNewMedication({ ...newMedication, name: e.target.value })}
              disabled={isLoading}
            />
            <TextField
              fullWidth
              label="Dosage *"
              value={newMedication.dosage}
              onChange={(e) => setNewMedication({ ...newMedication, dosage: e.target.value })}
              disabled={isLoading}
            />
            <FormControl fullWidth>
              <InputLabel>Frequency *</InputLabel>
              <Select
                value={newMedication.frequency}
                onChange={(e) => setNewMedication({ ...newMedication, frequency: e.target.value })}
                disabled={isLoading}
                label="Frequency *"
              >
                {frequencyOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Next Dose Time"
              type="datetime-local"
              value={newMedication.nextDoseTime}
              onChange={(e) => setNewMedication({ ...newMedication, nextDoseTime: e.target.value })}
              InputLabelProps={{ shrink: true }}
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
            onClick={handleAddMedication}
            variant="contained"
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} /> : null}
            sx={{ bgcolor: '#00a895' }}
          >
            {isLoading ? 'Adding...' : 'Add Medication'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}