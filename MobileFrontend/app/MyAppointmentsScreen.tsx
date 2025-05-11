import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Picker } from '@react-native-picker/picker';

const MyAppointmentsScreen = () => {
  const { userId, userRole, logout } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!userId || userRole !== 'PATIENT') {
      Alert.alert('Erreur', 'Accès réservé aux patients authentifiés', [
        { text: 'OK', onPress: () => logout() },
      ]);
      return;
    }
    fetchDoctors();
    fetchAppointments();
  }, [userId, userRole, logout]);

  const fetchDoctors = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('Token non trouvé');
      }
      console.log('Token used:', token);
      const response = await api.get('/api/users/doctors', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log('Doctors response:', response.data);
      if (Array.isArray(response.data)) {
        setDoctors(response.data);
        if (response.data.length > 0) {
          setSelectedDoctorId(response.data[0].id.toString());
        }
      } else {
        console.warn('Unexpected response format:', response.data);
        setDoctors([]);
      }
    } catch (err) {
      console.error('Error fetching doctors:', err.message, err.response?.data);
      setDoctors([]);
      Alert.alert('Erreur', 'Impossible de charger la liste des médecins : ' + (err.response?.data?.error || err.message));
    }
  };

  const fetchAppointments = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!userId) {
        throw new Error('Utilisateur non identifié');
      }
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('Token non trouvé');
      }
      console.log('Fetching appointments for userId:', userId);
      const response = await api.get(`/api/appointments/user/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log('Appointments response:', response.data);
      setAppointments(response.data || []);
    } catch (err) {
      console.error('Error fetching appointments:', err.message, err.response?.data);
      setError('Erreur lors de la récupération des rendez-vous : ' + (err.message || 'Erreur inconnue'));
      if (err.response?.status === 403) {
        Alert.alert('Erreur', 'Accès interdit. Veuillez vous reconnecter.', [
          { text: 'OK', onPress: () => logout() },
        ]);
      } else {
        Alert.alert('Erreur', err.message || 'Erreur lors de la récupération des rendez-vous');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddAppointment = async () => {
    if (!selectedDoctorId || !appointmentDate.trim() || !notes.trim()) {
      Alert.alert('Erreur', 'Veuillez sélectionner un médecin et remplir tous les champs.');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('Token non trouvé');
      }

      const now = new Date();
      const selectedDate = new Date(appointmentDate);
      if (isNaN(selectedDate.getTime())) {
        Alert.alert('Erreur', 'Format de date invalide. Utilisez YYYY-MM-DD.');
        return;
      }
      if (selectedDate <= now) {
        Alert.alert('Erreur', 'La date du rendez-vous doit être dans le futur');
        return;
      }

      const formattedDate = selectedDate.toISOString();
      console.log('Adding appointment for userId:', userId, 'with data:', { doctorId: selectedDoctorId, appointmentDate: formattedDate, notes });
      const response = await api.post(`/api/appointments/user/${userId}/doctor/${selectedDoctorId}`, {
        appointmentDate: formattedDate,
        notes,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Succès', 'Rendez-vous créé avec succès');
      setSelectedDoctorId(doctors.length > 0 ? doctors[0].id.toString() : '');
      setAppointmentDate('');
      setNotes('');
      setModalVisible(false);
      fetchAppointments();
    } catch (err) {
      console.error('Error adding appointment:', err.message, err.response?.data);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      if (err.response?.status === 403) {
        Alert.alert('Erreur', 'Accès interdit. Veuillez vous reconnecter.', [
          { text: 'OK', onPress: () => logout() },
        ]);
      } else {
        Alert.alert('Erreur', err.response?.data?.message || err.message || 'Échec de la création du rendez-vous');
      }
    }
  };

  const renderAppointment = ({ item }) => (
    <View style={styles.appointmentCard}>
      <Text style={styles.appointmentDetail}>
        Médecin: {item.doctor?.name || item.doctorName || 'Non spécifié'}
      </Text>
      <Text style={styles.appointmentDetail}>
        Date: {new Date(item.appointmentDate).toLocaleString()}
      </Text>
      <Text style={styles.appointmentDetail}>Notes: {item.notes || 'Aucune'}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mes Rendez-vous</Text>
        <TouchableOpacity onPress={fetchAppointments}>
          <Ionicons name="refresh-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add-outline" size={24} color="#fff" />
        <Text style={styles.addButtonText}>Ajouter un rendez-vous</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator size="large" color="#2196F3" style={styles.center} />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : appointments.length === 0 ? (
        <Text style={styles.emptyText}>Aucun rendez-vous trouvé</Text>
      ) : (
        <FlatList
          data={appointments}
          renderItem={renderAppointment}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          contentContainerStyle={styles.list}
        />
      )}

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>Nouveau Rendez-vous</Text>

              <Text style={styles.label}>Sélectionner un médecin</Text>
              <View style={[styles.input, styles.pickerContainer]}>
                <Picker
                  selectedValue={selectedDoctorId}
                  onValueChange={(itemValue) => setSelectedDoctorId(itemValue)}
                  style={styles.picker}
                >
                  {doctors.length === 0 ? (
                    <Picker.Item label="Aucun médecin disponible" value="" />
                  ) : (
                    doctors.map((doctor) => (
                      <Picker.Item
                        key={doctor.id}
                        label={doctor.name || 'Médecin inconnu'}
                        value={doctor.id.toString()}
                      />
                    ))
                  )}
                </Picker>
              </View>

              <Text style={styles.label}>Date du rendez-vous (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                value={appointmentDate}
                onChangeText={setAppointmentDate}
                placeholder="Ex: 2025-06-01"
                placeholderTextColor="#999"
              />

              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={styles.input}
                value={notes}
                onChangeText={setNotes}
                placeholder="Ex: Consultation pour un bilan de santé"
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.modalButtonText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.submitButton]}
                  onPress={handleAddAppointment}
                >
                  <Text style={styles.modalButtonText}>Créer</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    padding: 20,
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 20,
    paddingTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: '#00BFA6',
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  list: {
    paddingBottom: 20,
  },
  appointmentCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  appointmentDetail: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  errorText: {
    fontSize: 16,
    color: '#dc3545',
    textAlign: 'center',
    marginTop: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
  },
  pickerContainer: {
    padding: Platform.OS === 'ios' ? 0 : 5,
    paddingHorizontal: Platform.OS === 'ios' ? 5 : 0,
  },
  picker: {
    width: '100%',
    color: '#333',
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#dc3545',
  },
  submitButton: {
    backgroundColor: '#2196F3',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MyAppointmentsScreen;