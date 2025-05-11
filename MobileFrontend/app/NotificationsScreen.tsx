import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  Platform,
  Animated,
  ScrollView,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Types for appointments and medications
interface Appointment {
  id: number;
  dateTime: string;
  doctor?: { id: number; fullName: string };
  patient?: { id: number; fullName: string };
  description: string;
}

interface Medication {
  id: number;
  name: string;
  dosage: string;
  nextReminderTime: string;
}

// Combine both types for unified notification list
type Notification = {
  id: string;
  type: 'appointment' | 'medication';
  title: string;
  time: string;
  detail: string;
  isToday: boolean;
  isPast: boolean;
  data: Appointment | Medication;
};

const NotificationsScreen: React.FC = () => {
  const { userId, userRole, logout } = useAuth();
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'today' | 'upcoming'>('all');
  const [showAppointments, setShowAppointments] = useState<boolean>(true);
  const [showMedications, setShowMedications] = useState<boolean>(true);

  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const translateY = useState(new Animated.Value(20))[0];

  // Format date for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    if (isToday) {
      return `Aujourd'hui à ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (isTomorrow) {
      return `Demain à ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  // Check if a date is today
  const isToday = (dateString: string): boolean => {
    const date = new Date(dateString);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Check if a date is in the past
  const isPast = (dateString: string): boolean => {
    const date = new Date(dateString);
    const now = new Date();
    return date < now;
  };

  // Get appointment title with null checks
  const getAppointmentTitle = (appointment: Appointment): string => {
    if (userRole === 'PATIENT') {
      return appointment.doctor && appointment.doctor.fullName
        ? `Rendez-vous avec Dr. ${appointment.doctor.fullName}`
        : 'Rendez-vous médical';
    } else {
      return appointment.patient && appointment.patient.fullName
        ? `Rendez-vous avec ${appointment.patient.fullName}`
        : 'Rendez-vous avec patient';
    }
  };

  // Combine and process notifications
  const processNotifications = useCallback(() => {
    const allNotifications: Notification[] = [];

    // Process appointments
    appointments.forEach(appointment => {
      allNotifications.push({
        id: `appointment-${appointment.id}`,
        type: 'appointment',
        title: getAppointmentTitle(appointment),
        time: appointment.dateTime,
        detail: appointment.description || 'Aucune description',
        isToday: isToday(appointment.dateTime),
        isPast: isPast(appointment.dateTime),
        data: appointment
      });
    });

    // Process medications
    medications.forEach(medication => {
      allNotifications.push({
        id: `medication-${medication.id}`,
        type: 'medication',
        title: `Rappel: ${medication.name}`,
        time: medication.nextReminderTime,
        detail: `Dosage: ${medication.dosage || 'Non spécifié'}`,
        isToday: isToday(medication.nextReminderTime),
        isPast: isPast(medication.nextReminderTime),
        data: medication
      });
    });

    // Sort by date (closest first)
    allNotifications.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

    setNotifications(allNotifications);

    // Start animations
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
  }, [appointments, medications, userRole]);

  useEffect(() => {
    if (!userId || (userRole !== 'PATIENT' && userRole !== 'DOCTOR')) {
      Alert.alert('Erreur', 'Accès réservé aux patients ou médecins authentifiés', [
        { text: 'OK', onPress: () => logout() },
      ]);
      router.replace('/login');
      return;
    }
    fetchNotifications();
  }, [userId, userRole, logout, router]);

  useEffect(() => {
    processNotifications();
  }, [appointments, medications, processNotifications]);

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) throw new Error('Token d\'authentification manquant');
      console.log('Fetching notifications for userId:', userId, 'with token:', token);

      const appointmentsResponse = await api.get(`/api/appointments/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (Array.isArray(appointmentsResponse.data)) {
        // Using current date instead of hardcoded date
        const currentDate = new Date();
        const allAppointments = appointmentsResponse.data;
        allAppointments.sort(
          (a: Appointment, b: Appointment) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
        );
        setAppointments(allAppointments);
        console.log('Appointments fetched:', allAppointments.length);
      } else {
        throw new Error('Réponse inattendue pour les rendez-vous');
      }

      const medicationsResponse = await api.get(`/api/medications/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (Array.isArray(medicationsResponse.data)) {
        // Using current date instead of hardcoded date
        const currentDate = new Date();
        const allMedications = medicationsResponse.data;
        allMedications.sort(
          (a: Medication, b: Medication) =>
            new Date(a.nextReminderTime).getTime() - new Date(b.nextReminderTime).getTime()
        );
        setMedications(allMedications);
        console.log('Medications fetched:', allMedications.length);
      } else {
        throw new Error('Réponse inattendue pour les médicaments');
      }
    } catch (err: any) {
      console.error('Fetch error:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
      setError('Impossible de charger les notifications : ' + (err.message || 'Erreur serveur'));
      if (err.response?.status === 403) {
        Alert.alert('Erreur', 'Accès interdit. Veuillez vous reconnecter.', [
          { text: 'OK', onPress: () => logout() },
        ]);
        router.replace('/login');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  // Filter notifications based on active tab and toggle settings
  const filteredNotifications = notifications.filter(notification => {
    // Filter by type
    if (!showAppointments && notification.type === 'appointment') return false;
    if (!showMedications && notification.type === 'medication') return false;

    // Filter by time
    if (activeTab === 'today' && !notification.isToday) return false;
    if (activeTab === 'upcoming' && (notification.isToday || notification.isPast)) return false;

    return true;
  });

  // Get notification icon based on type
  const getNotificationIcon = (type: string, isPast: boolean) => {
    if (type === 'appointment') {
      return isPast
        ? <Ionicons name="calendar-outline" size={24} color="#999" />
        : <Ionicons name="calendar-outline" size={24} color="#2196F3" />;
    } else {
      return isPast
        ? <MaterialCommunityIcons name="pill" size={24} color="#999" />
        : <MaterialCommunityIcons name="pill" size={24} color="#4CAF50" />;
    }
  };

  // Get notification background color based on status
  const getNotificationColor = (notification: Notification) => {
    if (notification.isPast) return '#f5f5f5';
    if (notification.isToday) return '#FFF8E1';
    return '#fff';
  };

  // Get notification border color based on type and status
  const getNotificationBorder = (notification: Notification) => {
    if (notification.isPast) return '#ddd';
    if (notification.type === 'appointment') return '#2196F3';
    return '#4CAF50';
  };

  // Render a notification item
  const renderNotification = ({ item }: { item: Notification }) => (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: getNotificationColor(item),
          borderLeftColor: getNotificationBorder(item),
          borderLeftWidth: 4,
          opacity: fadeAnim,
          transform: [{ translateY: translateY }]
        }
      ]}
    >
      <View style={styles.cardIconContainer}>
        {getNotificationIcon(item.type, item.isPast)}
      </View>
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, item.isPast && styles.pastText]}>{item.title}</Text>
          <Text style={[styles.cardDate, item.isPast && styles.pastText]}>
            {formatDate(item.time)}
          </Text>
        </View>
        <Text style={[styles.cardDetail, item.isPast && styles.pastText]}>{item.detail}</Text>

        {!item.isPast && (
          <View style={styles.cardActions}>
            {item.type === 'appointment' && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#E3F2FD' }]}
                onPress={() => router.push('/MyAppointmentsScreen')}
              >
                <Text style={[styles.actionText, { color: '#2196F3' }]}>Détails</Text>
              </TouchableOpacity>
            )}
            {item.type === 'medication' && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#E8F5E9' }]}
                onPress={() => router.push('/MedicationScreen')}
              >
                <Text style={[styles.actionText, { color: '#4CAF50' }]}>Détails</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </Animated.View>
  );

  // Render empty state
  const renderEmptyState = () => {
    if (loading) return null;

    return (
      <View style={styles.emptyContainer}>
        <Image
          source={{ uri: 'https://cdn-icons-png.flaticon.com/512/1380/1380641.png' }}
          style={styles.emptyImage}
        />
        <Text style={styles.emptyText}>Aucune notification</Text>
        <Text style={styles.emptySubtext}>
          {activeTab === 'all'
            ? 'Vous n\'avez aucune notification pour le moment.'
            : activeTab === 'today'
              ? 'Vous n\'avez aucune notification pour aujourd\'hui.'
              : 'Vous n\'avez aucune notification à venir.'}
        </Text>
      </View>
    );
  };

  // Get count of notifications by type
  const getTodayCount = () => notifications.filter(n => n.isToday).length;
  const getUpcomingCount = () => notifications.filter(n => !n.isToday && !n.isPast).length;
  const getAppointmentCount = () => notifications.filter(n => n.type === 'appointment' && !n.isPast).length;
  const getMedicationCount = () => notifications.filter(n => n.type === 'medication' && !n.isPast).length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#1976D2" />
      <View style={styles.container}>
        {/* Header */}
        <LinearGradient
          colors={['#1976D2', '#64B5F6']}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.header}>
            <View style={styles.headerTitleContainer}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.backButton}
              >
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Notifications</Text>
            </View>
            <TouchableOpacity
              onPress={fetchNotifications}
              style={styles.refreshButton}
            >
              <Ionicons name="refresh-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'all' && styles.activeTab]}
            onPress={() => setActiveTab('all')}
          >
            <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
              Toutes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'today' && styles.activeTab]}
            onPress={() => setActiveTab('today')}
          >
            <Text style={[styles.tabText, activeTab === 'today' && styles.activeTabText]}>
              Aujourd'hui {getTodayCount() > 0 && `(${getTodayCount()})`}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
            onPress={() => setActiveTab('upcoming')}
          >
            <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>
              À venir {getUpcomingCount() > 0 && `(${getUpcomingCount()})`}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Filters */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              showAppointments && styles.activeFilterButton
            ]}
            onPress={() => setShowAppointments(!showAppointments)}
          >
            <Ionicons
              name="calendar-outline"
              size={16}
              color={showAppointments ? "#2196F3" : "#999"}
            />
            <Text
              style={[
                styles.filterText,
                showAppointments && styles.activeFilterText
              ]}
            >
              Rendez-vous {getAppointmentCount() > 0 && `(${getAppointmentCount()})`}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              showMedications && styles.activeFilterButton
            ]}
            onPress={() => setShowMedications(!showMedications)}
          >
            <MaterialCommunityIcons
              name="pill"
              size={16}
              color={showMedications ? "#4CAF50" : "#999"}
            />
            <Text
              style={[
                styles.filterText,
                showMedications && { color: "#4CAF50" }
              ]}
            >
              Médicaments {getMedicationCount() > 0 && `(${getMedicationCount()})`}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Main content */}
        {loading && !refreshing ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#2196F3" />
            <Text style={styles.loadingText}>Chargement des notifications...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={60} color="#dc3545" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchNotifications}>
              <Text style={styles.retryButtonText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filteredNotifications}
            renderItem={renderNotification}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={renderEmptyState}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#2196F3"]}
                tintColor="#2196F3"
              />
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1976D2',
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  headerGradient: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    paddingBottom: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 15,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  refreshButton: {
    padding: 5,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#2196F3',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#2196F3',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: '#f5f5f5',
  },
  activeFilterButton: {
    backgroundColor: '#E3F2FD',
  },
  filterText: {
    fontSize: 12,
    marginLeft: 5,
    color: '#666',
  },
  activeFilterText: {
    color: '#2196F3',
  },
  list: {
    padding: 15,
    paddingBottom: 30,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    marginBottom: 5,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 3,
  },
  cardDate: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
  },
  cardDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  pastText: {
    color: '#999',
  },
  cardActions: {
    flexDirection: 'row',
    marginTop: 5,
  },
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginRight: 8,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    marginTop: 50,
  },
  emptyImage: {
    width: 100,
    height: 100,
    opacity: 0.5,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
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
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
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
});

export default NotificationsScreen;