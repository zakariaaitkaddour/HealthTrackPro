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
  ScrollView,
  TextInput,
  Vibration,
  SafeAreaView,
  StatusBar,
  Platform,
  Dimensions,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';

// Types for medications
interface Medication {
  id: number;
  name: string;
  dosage: string;
  nextReminderTime: string;
  user?: { id: number; email: string; role: string };
}

const { width } = Dimensions.get('window');
const CARD_MARGIN = 10;
const CARD_WIDTH = width - 40;

const MedicationScreen: React.FC = () => {
  const { userId, userRole, logout } = useAuth();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [dosage, setDosage] = useState<string>('');
  const [nextReminderTime, setNextReminderTime] = useState<string>('');
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showSearch, setShowSearch] = useState<boolean>(false);

  // Date picker alternatives
  const [datePickerModalVisible, setDatePickerModalVisible] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedHour, setSelectedHour] = useState<number>(new Date().getHours());
  const [selectedMinute, setSelectedMinute] = useState<number>(new Date().getMinutes());

  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const translateY = useState(new Animated.Value(50))[0];

  // Load medications on mount
  useEffect(() => {
    if (!userId || (userRole !== 'PATIENT' && userRole !== 'DOCTOR')) {
      Alert.alert('Erreur', 'Accès réservé aux patients ou médecins authentifiés', [
        { text: 'OK', onPress: () => logout() },
      ]);
      return;
    }
    console.log('Component mounted - userId:', userId, 'userRole:', userRole);
    fetchMedications();
  }, [userId, userRole, logout]);

  // Animation effect when medications load
  useEffect(() => {
    if (!loading && medications.length > 0) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [loading, medications]);

  // Fetch medications from API
  const fetchMedications = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) throw new Error('Token d\'authentification manquant');
      console.log('Fetching medications for userId:', userId, 'with token:', token);
      const response = await api.get(`/api/medications/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (Array.isArray(response.data)) {
        setMedications(response.data);
        console.log('Medications fetched successfully:', response.data);
      } else {
        throw new Error('Réponse inattendue du serveur : données non sous forme de tableau');
      }
    } catch (err: any) {
      console.error('Fetch error:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
        headers: err.response?.headers,
      });
      setError('Impossible de charger les médicaments : ' + (err.message || 'Erreur serveur'));
      if (err.response?.status === 404) {
        setMedications([]);
        console.log('No medications found for userId:', userId);
      } else if (err.response?.status === 403) {
        Alert.alert('Erreur', 'Accès interdit. Veuillez vous reconnecter.', [
          { text: 'OK', onPress: () => logout() },
        ]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle pull-to-refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchMedications();
  };

  // Add a new medication
  const handleAddMedication = async () => {
    console.log('handleAddMedication called with:', { name, dosage, nextReminderTime });
    if (!name.trim() || !dosage.trim() || !nextReminderTime.trim()) {
      Alert.alert('Erreur', 'Tous les champs sont obligatoires.');
      return;
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;
    if (!dateRegex.test(nextReminderTime)) {
      Alert.alert('Erreur', 'Format de date invalide. Utilisez AAAA-MM-JJThh:mm:ss (ex: 2025-05-09T10:00:00)');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) throw new Error('Token d\'authentification manquant');

      console.log('Adding medication - URL:', `/api/medications/user/${userId}`);
      console.log('Adding medication - Headers:', { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' });
      console.log('Adding medication - Payload:', { name, dosage, nextReminderTime });
      const response = await api.post(`/api/medications/user/${userId}`, {
        name,
        dosage,
        nextReminderTime,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Add response - Status:', response.status, 'Data:', response.data);
      Vibration.vibrate(200);
      Alert.alert('Succès', 'Médicament ajouté avec succès');
      setName('');
      setDosage('');
      setNextReminderTime('');
      setModalVisible(false);
      fetchMedications();
    } catch (err: any) {
      console.error('Add error:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
        headers: err.response?.headers,
      });
      Vibration.vibrate([0, 200, 100, 200]);
      if (err.response?.status === 403) {
        Alert.alert('Erreur', 'Accès interdit. Veuillez vous reconnecter.', [
          { text: 'OK', onPress: () => logout() },
        ]);
      } else if (err.response?.status === 404) {
        Alert.alert('Erreur', 'Utilisateur non trouvé.');
      } else {
        Alert.alert('Erreur', 'Échec de l\'ajout : ' + (err.response?.data?.message || err.message));
      }
    }
  };

  // Open date picker modal
  const openDatePickerModal = () => {
    setDatePickerModalVisible(true);
  };

  // Confirm date selection
  const confirmDateSelection = () => {
    const newDate = new Date(selectedDate);
    newDate.setHours(selectedHour);
    newDate.setMinutes(selectedMinute);
    newDate.setSeconds(0);

    const formattedDate = newDate.toISOString().split('.')[0];
    setNextReminderTime(formattedDate);
    setDatePickerModalVisible(false);
  };

  // Generate arrays for picker values
  const generateHours = () => {
    const hours = [];
    for (let i = 0; i < 24; i++) {
      hours.push(i);
    }
    return hours;
  };

  const generateMinutes = () => {
    const minutes = [];
    for (let i = 0; i < 60; i++) {
      minutes.push(i);
    }
    return minutes;
  };

  // Generate days for the date picker
  const generateDays = () => {
    const days = [];
    const today = new Date();

    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(today.getDate() + i);
      days.push({
        date: date,
        label: date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
      });
    }

    return days;
  };

  const days = generateDays();
  const hours = generateHours();
  const minutes = generateMinutes();

  // Open add modal
  const openAddModal = () => {
    console.log('Add button clicked - Opening modal');
    setModalVisible(true);
  };

  // Get time until next reminder
  const getTimeUntilReminder = (reminderTime: string) => {
    const now = new Date();
    const reminder = new Date(reminderTime);
    const diffMs = reminder.getTime() - now.getTime();

    if (diffMs < 0) return 'Passé';

    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHrs > 24) {
      const days = Math.floor(diffHrs / 24);
      return `Dans ${days} jour${days > 1 ? 's' : ''}`;
    }

    if (diffHrs === 0) {
      return `Dans ${diffMins} minute${diffMins > 1 ? 's' : ''}`;
    }

    return `Dans ${diffHrs}h${diffMins.toString().padStart(2, '0')}`;
  };

  // Get status color based on reminder time
  const getReminderStatusColor = (reminderTime: string) => {
    const now = new Date();
    const reminder = new Date(reminderTime);
    const diffMs = reminder.getTime() - now.getTime();

    if (diffMs < 0) return '#dc3545'; // Past due - red
    if (diffMs < 3600000) return '#ff9800'; // Less than 1 hour - orange
    if (diffMs < 86400000) return '#2196F3'; // Less than 24 hours - blue
    return '#4CAF50'; // More than 24 hours - green
  };

  // Filter medications based on search query
  const filteredMedications = medications.filter(med =>
    med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    med.dosage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Render a medication in the list
  const renderMedication = ({ item, index }: { item: Medication, index: number }) => {
    console.log('Rendering medication:', item);
    const reminderStatus = getTimeUntilReminder(item.nextReminderTime);
    const statusColor = getReminderStatusColor(item.nextReminderTime);

    return (
      <Animated.View
        style={[
          styles.medicationCard,
          {
            opacity: fadeAnim,
            transform: [{ translateY: translateY }],
            borderLeftColor: statusColor,
            borderLeftWidth: 5,
          }
        ]}
      >
        <View style={styles.medicationHeader}>
          <Text style={styles.medicationName}>{item.name || 'Nom inconnu'}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{reminderStatus}</Text>
          </View>
        </View>

        <View style={styles.medicationBody}>
          <View style={styles.medicationInfo}>
            <MaterialCommunityIcons name="pill" size={18} color="#666" />
            <Text style={styles.medicationDetail}>{item.dosage || 'Non spécifié'}</Text>
          </View>

          <View style={styles.medicationInfo}>
            <Ionicons name="time-outline" size={18} color="#666" />
            <Text style={styles.medicationDetail}>
              {item.nextReminderTime ? new Date(item.nextReminderTime).toLocaleString() : 'Non défini'}
            </Text>
          </View>
        </View>

        <View style={styles.medicationActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="notifications-outline" size={20} color="#2196F3" />
            <Text style={styles.actionText}>Rappel</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <MaterialCommunityIcons name="history" size={20} color="#4CAF50" />
            <Text style={styles.actionText}>Historique</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="ellipsis-horizontal" size={20} color="#666" />
            <Text style={styles.actionText}>Plus</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  // Render empty state
  const renderEmptyState = () => {
    if (loading) return null;

    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons name="pill-off" size={80} color="#ccc" />
        <Text style={styles.emptyText}>Aucun médicament trouvé</Text>
        <Text style={styles.emptySubtext}>
          {searchQuery ? 'Essayez une autre recherche' : 'Ajoutez votre premier médicament'}
        </Text>
        {!searchQuery && (
          <TouchableOpacity style={styles.emptyButton} onPress={openAddModal}>
            <Text style={styles.emptyButtonText}>Ajouter un médicament</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#1565C0" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Mes Médicaments</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => setShowSearch(!showSearch)}
              >
                <Ionicons name={showSearch ? "close-outline" : "search-outline"} size={24} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerButton} onPress={fetchMedications}>
                <Ionicons name="refresh-outline" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Search bar */}
          {showSearch && (
            <View style={styles.searchContainer}>
              <Ionicons name="search-outline" size={20} color="#666" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Rechercher un médicament..."
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color="#666" />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Main content */}
        {loading && medications.length === 0 ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#2196F3" />
            <Text style={styles.loadingText}>Chargement des médicaments...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={60} color="#dc3545" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchMedications}>
              <Text style={styles.retryButtonText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filteredMedications}
            renderItem={renderMedication}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.list}
            ListEmptyComponent={renderEmptyState}
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        )}

        {/* Add button */}
        <TouchableOpacity style={styles.floatingButton} onPress={openAddModal}>
          <Ionicons name="add" size={30} color="#fff" />
        </TouchableOpacity>

        {/* Modal for adding medication */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => {
            console.log('Modal closed');
            setModalVisible(false);
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Ajouter un Médicament</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                {/* Name field */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Nom du médicament</Text>
                  <View style={styles.inputContainer}>
                    <MaterialCommunityIcons name="pill" size={20} color="#2196F3" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={name}
                      onChangeText={setName}
                      placeholder="Ex: Paracétamol"
                      placeholderTextColor="#999"
                    />
                  </View>
                </View>

                {/* Dosage field */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Dosage</Text>
                  <View style={styles.inputContainer}>
                    <FontAwesome5 name="prescription-bottle-alt" size={20} color="#2196F3" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={dosage}
                      onChangeText={setDosage}
                      placeholder="Ex: 500 mg toutes les 8 heures"
                      placeholderTextColor="#999"
                    />
                  </View>
                </View>

                {/* Next reminder field */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Prochain Rappel</Text>
                  <TouchableOpacity
                    style={styles.datePickerButton}
                    onPress={openDatePickerModal}
                  >
                    <Ionicons name="calendar-outline" size={20} color="#2196F3" style={styles.inputIcon} />
                    <Text style={styles.datePickerText}>
                      {nextReminderTime
                        ? new Date(nextReminderTime).toLocaleString()
                        : "Sélectionner une date et heure"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>

              {/* Modal buttons */}
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    console.log('Cancel button pressed');
                    setModalVisible(false);
                  }}
                >
                  <Text style={styles.cancelButtonText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.submitButton]}
                  onPress={handleAddMedication}
                >
                  <Text style={styles.submitButtonText}>Ajouter</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Custom Date Picker Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={datePickerModalVisible}
          onRequestClose={() => setDatePickerModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Sélectionner Date et Heure</Text>
                <TouchableOpacity onPress={() => setDatePickerModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.datePickerContainer}>
                {/* Date selection */}
                <Text style={styles.datePickerLabel}>Date</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.daysContainer}
                >
                  {days.map((day, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.dayButton,
                        selectedDate.toDateString() === day.date.toDateString() && styles.selectedDayButton
                      ]}
                      onPress={() => setSelectedDate(day.date)}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          selectedDate.toDateString() === day.date.toDateString() && styles.selectedDayText
                        ]}
                      >
                        {day.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Time selection */}
                <View style={styles.timeContainer}>
                  <View style={styles.timeColumn}>
                    <Text style={styles.timeLabel}>Heure</Text>
                    <ScrollView
                      style={styles.timeScroller}
                      showsVerticalScrollIndicator={false}
                    >
                      {hours.map((hour) => (
                        <TouchableOpacity
                          key={hour}
                          style={[
                            styles.timeOption,
                            selectedHour === hour && styles.selectedTimeOption
                          ]}
                          onPress={() => setSelectedHour(hour)}
                        >
                          <Text
                            style={[
                              styles.timeText,
                              selectedHour === hour && styles.selectedTimeText
                            ]}
                          >
                            {hour.toString().padStart(2, '0')}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  <Text style={styles.timeSeparator}>:</Text>

                  <View style={styles.timeColumn}>
                    <Text style={styles.timeLabel}>Minute</Text>
                    <ScrollView
                      style={styles.timeScroller}
                      showsVerticalScrollIndicator={false}
                    >
                      {minutes.map((minute) => (
                        <TouchableOpacity
                          key={minute}
                          style={[
                            styles.timeOption,
                            selectedMinute === minute && styles.selectedTimeOption
                          ]}
                          onPress={() => setSelectedMinute(minute)}
                        >
                          <Text
                            style={[
                              styles.timeText,
                              selectedMinute === minute && styles.selectedTimeText
                            ]}
                          >
                            {minute.toString().padStart(2, '0')}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setDatePickerModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.submitButton]}
                  onPress={confirmDateSelection}
                >
                  <Text style={styles.submitButtonText}>Confirmer</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

// Styles
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1565C0', // Darker blue for status bar area
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    backgroundColor: '#1976D2', // Material blue
    paddingBottom: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
    paddingHorizontal: 20,
    paddingBottom: 10,
    paddingTop: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    marginLeft: 15,
  },
  searchContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginHorizontal: 20,
    marginTop: 5,
    paddingHorizontal: 15,
    alignItems: 'center',
    height: 40,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#333',
  },
  list: {
    padding: 15,
    paddingBottom: 80, // Space for floating button
  },
  medicationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 15,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  medicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  medicationName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  medicationBody: {
    padding: 15,
  },
  medicationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  medicationDetail: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
  },
  medicationActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  actionText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 5,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#1976D2',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end', // Modal slides from bottom
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  modalBody: {
    padding: 20,
    maxHeight: '70%',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  inputIcon: {
    marginHorizontal: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingRight: 12,
    fontSize: 16,
    color: '#333',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#fff',
    paddingVertical: 12,
  },
  datePickerText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#1976D2',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#dc3545',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#1976D2',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 50,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: '#1976D2',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Custom date picker styles
  datePickerContainer: {
    padding: 20,
  },
  datePickerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  daysContainer: {
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dayButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: '#f5f5f5',
  },
  selectedDayButton: {
    backgroundColor: '#1976D2',
  },
  dayText: {
    fontSize: 14,
    color: '#333',
  },
  selectedDayText: {
    color: '#fff',
    fontWeight: '600',
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  timeColumn: {
    width: 80,
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  timeSeparator: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginHorizontal: 15,
    marginTop: 20,
  },
  timeScroller: {
    height: 150,
  },
  timeOption: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  selectedTimeOption: {
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
  },
  timeText: {
    fontSize: 18,
    color: '#333',
  },
  selectedTimeText: {
    color: '#1976D2',
    fontWeight: '600',
  },
});

export default MedicationScreen;