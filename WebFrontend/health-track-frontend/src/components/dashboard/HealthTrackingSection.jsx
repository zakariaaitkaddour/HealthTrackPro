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
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Alert,
} from "@mui/material";
import { format, parseISO } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

export default function HealthTrackingSection({ medicalData: initialMedicalData }) {
  const [medicalData, setMedicalData] = useState(initialMedicalData || []);
  const [chartData, setChartData] = useState([]);
  const [selectedMetric, setSelectedMetric] = useState("bloodSugar");
  const [openDialog, setOpenDialog] = useState(false);
  const [error, setError] = useState(null);
  const [newData, setNewData] = useState({
    bloodSugar: "",
    systolicBloodPressure: "",
    diastolicBloodPressure: "",
    heartRate: "",
    recordedAt: new Date().toISOString().split("T")[0],
  });
  const currentUser = JSON.parse(localStorage.getItem("user")) || {};

  useEffect(() => {
    const fetchMedicalData = async () => {
      try {
        setError(null);
        const response = await fetch(`http://localhost:8080/api/medical-data/user/${currentUser.userId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch medical data: ${errorText}`);
        }
        const data = await response.json();
        console.log("Fetched medical data:", data);
        setMedicalData(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching medical data:", error);
        setError(error.message);
        setMedicalData([]);
      }
    };

    if (!initialMedicalData && currentUser.userId) {
      fetchMedicalData();
    } else if (initialMedicalData && !Array.isArray(initialMedicalData)) {
      console.warn("initialMedicalData is not an array:", initialMedicalData);
      setMedicalData([]);
    }
  }, [initialMedicalData, currentUser.userId]);

  useEffect(() => {
    updateChartData(medicalData, selectedMetric);
  }, [medicalData, selectedMetric]);

  const updateChartData = (data, metric) => {
    const filteredData = data
      .map((item) => ({
        date: format(parseISO(item.recordedAt), "MMM dd, HH:mm"),
        value:
          metric === "bloodSugar"
            ? item.bloodSugar
            : metric === "bloodPressure"
            ? item.systolicBloodPressure
            : item.heartRate,
      }))
      .filter((item) => item.value !== undefined && item.value !== null);
    setChartData(filteredData);
  };

  const handleMetricChange = (event) => {
    setSelectedMetric(event.target.value);
  };

  const handleAddData = async () => {
    try {
      const payload = {
        bloodSugar: newData.bloodSugar ? parseFloat(newData.bloodSugar) : null,
        systolicBloodPressure: newData.systolicBloodPressure ? parseInt(newData.systolicBloodPressure) : null,
        diastolicBloodPressure: newData.diastolicBloodPressure ? parseInt(newData.diastolicBloodPressure) : null,
        heartRate: newData.heartRate ? parseInt(newData.heartRate) : null,
        recordedAt: new Date().toISOString(),
      };

      const response = await fetch(`http://localhost:8080/api/medical-data/user/${currentUser.userId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to add medical data: ${errorText}`);
      }

      const addedData = await response.json();
      console.log("Added medical data:", addedData);
      setMedicalData([...medicalData, addedData]);
      setOpenDialog(false);
      setNewData({
        bloodSugar: "",
        systolicBloodPressure: "",
        diastolicBloodPressure: "",
        heartRate: "",
        recordedAt: new Date().toISOString().split("T")[0],
      });
    } catch (error) {
      console.error("Error adding medical data:", error);
      setError(error.message);
    }
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" gutterBottom>
        Health Tracking
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 2 }}>
        <Select value={selectedMetric} onChange={handleMetricChange}>
          <MenuItem value="bloodSugar">Blood Sugar (mg/dL)</MenuItem>
          <MenuItem value="bloodPressure">Blood Pressure (mmHg)</MenuItem>
          <MenuItem value="heartRate">Heart Rate (bpm)</MenuItem>
        </Select>
      </Box>

      {medicalData.length === 0 ? (
        <Typography variant="body1" sx={{ mb: 2 }}>
          No medical data available. Add some data to start tracking!
        </Typography>
      ) : (
        <Box > 
          <LineChart width={600} height={300} data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              angle={-45}
              textAnchor="end"
              height={70}
              interval="preserveStartEnd"
            />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="value" stroke="#00a895" strokeWidth={3 } />
          </LineChart>
        </Box>
      )}

      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: "bold" }}>Date & Time</TableCell>
            <TableCell sx={{ fontWeight: "bold" }}>Blood Sugar (mg/dL)</TableCell>
            <TableCell sx={{ fontWeight: "bold" }}>Systolic (mmHg)</TableCell>
            <TableCell sx={{ fontWeight: "bold" }}>Diastolic (mmHg)</TableCell>
            <TableCell sx={{ fontWeight: "bold" }}>Heart Rate (bpm)</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {medicalData.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                {format(parseISO(item.recordedAt), "MMM dd, yyyy HH:mm")}
              </TableCell>
              <TableCell>{item.bloodSugar !== null ? item.bloodSugar : "N/A"}</TableCell>
              <TableCell>{item.systolicBloodPressure !== null ? item.systolicBloodPressure : "N/A"}</TableCell>
              <TableCell>{item.diastolicBloodPressure !== null ? item.diastolicBloodPressure : "N/A"}</TableCell>
              <TableCell>{item.heartRate !== null ? item.heartRate : "N/A"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Button
        variant="contained"
        sx={{ mt: 2, bgcolor: "#00a895", "&:hover": { bgcolor: "#00806f" } }}
        onClick={() => setOpenDialog(true)}
      >
        Add New Data
      </Button>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Add New Health Data</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Blood Sugar (mg/dL)"
            value={newData.bloodSugar}
            onChange={(e) => setNewData({ ...newData, bloodSugar: e.target.value })}
            type="number"
            sx={{ mb: 2, mt: 2 }}
          />
          <TextField
            fullWidth
            label="Systolic Blood Pressure (mmHg)"
            value={newData.systolicBloodPressure}
            onChange={(e) => setNewData({ ...newData, systolicBloodPressure: e.target.value })}
            type="number"
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Diastolic Blood Pressure (mmHg)"
            value={newData.diastolicBloodPressure}
            onChange={(e) => setNewData({ ...newData, diastolicBloodPressure: e.target.value })}
            type="number"
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Heart Rate (bpm)"
            value={newData.heartRate}
            onChange={(e) => setNewData({ ...newData, heartRate: e.target.value })}
            type="number"
            sx={{ mb: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleAddData} variant="contained" sx={{ bgcolor: "#00a895" }}>
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}