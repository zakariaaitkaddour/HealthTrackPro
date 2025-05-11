import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { Picker } from '@react-native-picker/picker';

// Types pour les données
interface Appointment {
  id: number;
  dateTime: string;
  patient: { id: number; fullName: string };
  description: string;
}

interface MedicalRecord {
  id: number;
  symptoms: string[];
  diseaseHistory: string[];
}

interface MedicationDTO {
  name: string;
  dosage: string;
  nextReminderTime: string;
}

interface MedicalData {
  id: number;
  blood_sugar: number | null;
  diastolic_blood_pressure: number | null;
  heart_rate: number | null;
  recorded_at: string | null;
  systolic_blood_pressure: number | null;
}

export default function DoctorDashboard() {
  const router = useRouter();
  const { userId, userRole, logout, user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<{ id: number; fullName: string }[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord | null>(null);
  const [medicalData, setMedicalData] = useState<MedicalData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [medication, setMedication] = useState<MedicationDTO>({
    name: '',
    dosage: '',
    nextReminderTime: '',
  });

  useEffect(() => {
    if (userRole !== 'DOCTOR') {
      router.replace('/login');
      return;
    }
    fetchAppointments();
    fetchPatients();
  }, [userRole, router]);

  const fetchAppointments = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) throw new Error('Token manquant');
      const response = await api.get(`/api/appointments/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const currentDate = new Date('2025-05-09T00:00:00');
      const futureAppointments = response.data.filter(
        (appt: Appointment) => new Date(appt.dateTime) > currentDate
      ).sort((a: Appointment, b: Appointment) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
      setAppointments(futureAppointments);
    } catch (err: any) {
      if (err.response && err.response.status === 403) {
        setError('Accès interdit : Vous n\'avez pas les permissions nécessaires pour voir les rendez-vous.');
      } else {
        setError('Erreur lors du chargement des rendez-vous');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) throw new Error('Token manquant');
      const response = await api.get('/api/users?role=PATIENT', {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Réponse brute de /api/users?role=PATIENT:', response.data);
      const patientsData = Array.isArray(response.data) ? response.data : response.data.data || [];
      if (patientsData.length === 0) {
        setError('Aucun patient trouvé.');
        setPatients([]);
        return;
      }
      const mappedPatients = patientsData.map((p: any) => ({
        id: p.id,
        fullName: p.fullName || p.name || `Patient ${p.id}`,
      }));
      console.log('Patients mappés:', mappedPatients);
      setPatients(mappedPatients);
    } catch (err: any) {
      if (err.response && err.response.status === 403) {
        setError('Accès interdit : Vous n\'avez pas les permissions nécessaires pour voir les patients.');
      } else {
        setError('Erreur lors du chargement des patients');
      }
      console.error(err);
      setPatients([]);
    }
  };

  const fetchMedicalRecords = async (patientId: number) => {
    setLoading(true);
    setError(null);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) throw new Error('Token manquant');
      const response = await api.get(`/api/medical-records/user/${patientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMedicalRecords(response.data[0] || null);
    } catch (err: any) {
      if (err.response && err.response.status === 403) {
        setError('Accès interdit : Vous n\'avez pas les permissions nécessaires pour voir les données médicales.');
      } else {
        setError('Erreur lors du chargement des données médicales');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMedicalData = async (patientId: number) => {
    setLoading(true);
    setError(null);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) throw new Error('Token manquant');
      const response = await api.get(`/api/medical-data/user/${patientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Réponse brute de /api/medical-data:', response.data); // Log pour débogage
      setMedicalData(response.data || []);
    } catch (err: any) {
      if (err.response && err.response.status === 403) {
        setError('Accès interdit : Vous n\'avez pas les permissions nécessaires pour voir les données médicales.');
      } else {
        setError('Erreur lors du chargement des données médicales');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const assignMedication = async () => {
    if (!selectedPatientId) {
      Alert.alert('Erreur', 'Veuillez sélectionner un patient');
      return;
    }
    if (!medication.name || !medication.dosage || !medication.nextReminderTime) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs du médicament');
      return;
    }
    const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;
    if (!dateRegex.test(medication.nextReminderTime)) {
      Alert.alert('Erreur', 'Veuillez entrer une date valide au format YYYY-MM-DDTHH:MM:SS (ex: 2025-05-10T10:00:00)');
      return;
    }
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) throw new Error('Token manquant');
      const response = await api.post(`/api/medications/assign/${selectedPatientId}`, medication, {
        headers: { Authorization: `Bearer ${token}` },
      });
      Alert.alert('Succès', 'Médicament assigné avec succès');
      console.log('Réponse de assignMedication:', response.data);
      setMedication({ name: '', dosage: '', nextReminderTime: '' });
      fetchMedicalRecords(selectedPatientId);
      fetchMedicalData(selectedPatientId);
    } catch (err: any) {
      if (err.response && err.response.status === 403) {
        Alert.alert('Erreur', 'Accès interdit : Vous n\'avez pas les permissions nécessaires pour assigner un médicament.');
      } else {
        Alert.alert('Erreur', 'Échec de l\'assignation du médicament');
      }
      console.error('Erreur assignMedication:', err);
    }
  };

  const handlePatientChange = (patientId: string) => {
    const id = patientId ? parseInt(patientId, 10) : null;
    setSelectedPatientId(id);
    if (id) {
      fetchMedicalRecords(id);
      fetchMedicalData(id);
    } else {
      setMedicalRecords(null);
      setMedicalData([]);
    }
  };

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  const renderAppointment = ({ item }: { item: Appointment }) => (
    <View style={styles.appointmentCard}>
      <Text style={styles.appointmentText}>
        {new Date(item.dateTime).toLocaleString()} - {item.patient.fullName}
      </Text>
      <Text style={styles.appointmentDescription}>{item.description || 'Aucune description'}</Text>
    </View>
  );

  const renderMedicalData = ({ item }: { item: MedicalData }) => {
    const recordedAt = item.recorded_at ? new Date(item.recorded_at).toLocaleString() : 'Date invalide';
    return (
      <View style={styles.medicalDataItem}>
        <Text style={styles.medicalText}>
          Glycémie: {item.blood_sugar ?? 'N/A'}, Pression Diastolique: {item.diastolic_blood_pressure ?? 'N/A'},
          Fréquence Cardiaque: {item.heart_rate ?? 'N/A'}, Pression Systolique: {item.systolic_blood_pressure ?? 'N/A'},
          Enregistré le: {recordedAt}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#00BFA6', '#2196F3']}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Tableau de bord - Docteur</Text>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileSection}>
          <Text style={styles.sectionTitle}>Mon Profil</Text>
          <Text style={styles.profileText}>Nom: {user?.fullName || 'Non défini'}</Text>
          <Text style={styles.profileText}>Email: {user?.email || 'Non défini'}</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push('/ProfileScreen')}
          >
            <Text style={styles.buttonText}>Modifier le profil</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Données Médicales Récentes</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedPatientId?.toString() || ''}
              onValueChange={(itemValue) => handlePatientChange(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="Sélectionner un patient" value="" />
              {patients.map((patient) => (
                <Picker.Item
                  key={patient.id}
                  label={patient.fullName}
                  value={patient.id.toString()}
                />
              ))}
            </Picker>
          </View>
          {loading ? (
            <ActivityIndicator size="large" color="#00BFA6" />
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : selectedPatientId && medicalData.length > 0 ? (
            <FlatList
              data={medicalData}
              renderItem={renderMedicalData}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={true}
            />
          ) : (
            <Text style={styles.emptyText}>Aucune donnée médicale récente pour ce patient</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prochains Rendez-vous</Text>
          {loading ? (
            <ActivityIndicator size="large" color="#00BFA6" />
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : appointments.length === 0 ? (
            <Text style={styles.emptyText}>Aucun rendez-vous à venir</Text>
          ) : (
            <FlatList
              data={appointments}
              renderItem={renderAppointment}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
            />
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Assigner un Médicament</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedPatientId?.toString() || ''}
              onValueChange={(itemValue) => handlePatientChange(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="Sélectionner un patient" value="" />
              {patients.map((patient) => (
                <Picker.Item
                  key={patient.id}
                  label={patient.fullName}
                  value={patient.id.toString()}
                />
              ))}
            </Picker>
          </View>
          {selectedPatientId && (
            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder="Nom du médicament"
                value={medication.name}
                onChangeText={(text) => setMedication({ ...medication, name: text })}
              />
              <TextInput
                style={styles.input}
                placeholder="Dosage (ex: 500 mg)"
                value={medication.dosage}
                onChangeText={(text) => setMedication({ ...medication, dosage: text })}
              />
              <TextInput
                style={styles.input}
                placeholder="Prochain rappel (ex: 2025-05-10T10:00:00)"
                value={medication.nextReminderTime}
                onChangeText={(text) => setMedication({ ...medication, nextReminderTime: text })}
              />
              <TouchableOpacity style={styles.submitButton} onPress={assignMedication}>
                <Text style={styles.submitButtonText}>Assigner Médicament</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Données Médicales du Patient</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedPatientId?.toString() || ''}
              onValueChange={(itemValue) => handlePatientChange(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="Sélectionner un patient" value="" />
              {patients.map((patient) => (
                <Picker.Item
                  key={patient.id}
                  label={patient.fullName}
                  value={patient.id.toString()}
                />
              ))}
            </Picker>
          </View>
          {loading ? (
            <ActivityIndicator size="large" color="#00BFA6" />
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : selectedPatientId && medicalRecords ? (
            <View style={styles.medicalData}>
              <Text style={styles.medicalTitle}>Symptômes :</Text>
              {medicalRecords.symptoms.length > 0 ? (
                medicalRecords.symptoms.map((symptom, index) => (
                  <Text key={index} style={styles.medicalText}>- {symptom}</Text>
                ))
              ) : (
                <Text style={styles.medicalText}>Aucun symptôme enregistré</Text>
              )}
              <Text style={styles.medicalTitle}>Historique des maladies :</Text>
              {medicalRecords.diseaseHistory.length > 0 ? (
                medicalRecords.diseaseHistory.map((disease, index) => (
                  <Text key={index} style={styles.medicalText}>- {disease}</Text>
                ))
              ) : (
                <Text style={styles.medicalText}>Aucun historique de maladie</Text>
              )}
            </View>
          ) : (
            <Text style={styles.emptyText}>Sélectionnez un patient pour voir les données médicales</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  logoutButton: {
    padding: 10,
  },
  scrollContent: {
    padding: 20,
  },
  button: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    width: '48%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  profileSection: {
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  appointmentCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  appointmentText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  appointmentDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 10,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100',
  },
  form: {
    marginTop: 10,
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 10,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  submitButton: {
    backgroundColor: '#00BFA6',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  medicalData: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  medicalDataItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  medicalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  medicalText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
  },
  errorText: {
    color: '#dc3545',
    textAlign: 'center',
  },
  emptyText: {
    color: '#666',
    textAlign: 'center',
  },
});