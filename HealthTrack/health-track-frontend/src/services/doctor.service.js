// services/doctor.service.js
export const getDoctorAppointments = async () => {
    const response = await fetch('/api/doctor/appointments');
    return response.json();
  };
  
  export const getPatientMedicalData = async (patientId) => {
    const response = await fetch(`/api/patients/${patientId}/medical-data`);
    return response.json();
  };
  
  export const addPatientMedication = async (patientId, medication) => {
    const response = await fetch(`/api/patients/${patientId}/medications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(medication)
    });
    return response.json();
  };