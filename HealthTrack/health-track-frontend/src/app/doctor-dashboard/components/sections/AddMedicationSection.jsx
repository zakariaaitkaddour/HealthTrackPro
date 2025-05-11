import { useState } from "react";
import {
  Button,
  TextField,
  Paper,
  Alert,
  Typography,
  Grid,
  Box,
  Fade,
  IconButton,
} from "@mui/material";
import { format } from "date-fns";
import CloseIcon from "@mui/icons-material/Close";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";

export default function AddMedicationSection({ patientId, onMedicationAdded }) {
  const [medication, setMedication] = useState({
    name: "",
    dosage: "",
    nextReminderTime: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!patientId) {
      setError("No patient selected.");
      return;
    }

    const formattedNextReminderTime = format(new Date(medication.nextReminderTime), "yyyy-MM-dd'T'HH:mm:ss");

    const payload = {
      name: medication.name,
      dosage: medication.dosage,
      patient: `id:${patientId}`,
      nextReminderTime: formattedNextReminderTime,
    };

    try {
      const response = await fetch(`http://localhost:8080/api/medications/user/${patientId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
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
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      await response.json();
      setSuccess(true);
      if (onMedicationAdded) onMedicationAdded();
      setMedication({
        name: "",
        dosage: "",
        nextReminderTime: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
      });
    } catch (error) {
      console.error("Error adding medication:", error);
      setError(error.message || "An unexpected error occurred.");
    }
  };

  const handleReset = () => {
    setMedication({
      name: "",
      dosage: "",
      nextReminderTime: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
    });
    setError(null);
    setSuccess(false);
  };

  return (
    <Paper
      elevation={4}
      sx={{
        p: 3,
        mt: 3,
        borderRadius: 2,
        backgroundColor: "#f9f9f9",
        borderLeft: "4px solid #1976d2",
      }}
    >
      <Box display="flex" alignItems="center" mb={2}>
        <AddCircleOutlineIcon color="primary" sx={{ mr: 1 }} />
        <Typography variant="h6" color="primary">
          Add New Medication
        </Typography>
      </Box>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Medication Name"
              fullWidth
              variant="outlined"
              value={medication.name}
              onChange={(e) => setMedication({ ...medication, name: e.target.value })}
              required
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "8px",
                  "&:hover fieldset": {
                    borderColor: "#1976d2",
                  },
                },
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Dosage"
              fullWidth
              variant="outlined"
              value={medication.dosage}
              onChange={(e) => setMedication({ ...medication, dosage: e.target.value })}
              required
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "8px",
                  "&:hover fieldset": {
                    borderColor: "#1976d2",
                  },
                },
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Next Reminder Time"
              type="datetime-local"
              fullWidth
              variant="outlined"
              value={medication.nextReminderTime}
              onChange={(e) => setMedication({ ...medication, nextReminderTime: e.target.value })}
              required
              InputLabelProps={{
                shrink: true,
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "8px",
                  "&:hover fieldset": {
                    borderColor: "#1976d2",
                  },
                },
              }}
            />
          </Grid>
        </Grid>

        <Box display="flex" justifyContent="flex-end" mt={3} gap={2}>
          <Button
            variant="outlined"
            color="secondary"
            onClick={handleReset}
            startIcon={<CloseIcon />}
            sx={{ borderRadius: "20px", textTransform: "none" }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            sx={{
              borderRadius: "20px",
              textTransform: "none",
              px: 4,
              py: 1,
              boxShadow: "0 2px 8px rgba(25, 118, 210, 0.3)",
              "&:hover": {
                boxShadow: "0 4px 12px rgba(25, 118, 210, 0.5)",
              },
            }}
          >
            Add Medication
          </Button>
        </Box>

        <Fade in={!!error || !!success}>
          <Box mt={2}>
            {error && (
              <Alert severity="error" sx={{ borderRadius: "8px" }}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert severity="success" sx={{ borderRadius: "8px" }}>
                Medication added successfully!
              </Alert>
            )}
          </Box>
        </Fade>
      </form>
    </Paper>
  );
}