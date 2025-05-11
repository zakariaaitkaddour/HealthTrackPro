import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  Dimensions,
  Animated,
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.9;

export default function PatientDashboard() {
  const router = useRouter();
  const { userRole, logout, userName = "Patient" } = useAuth();
  const [greeting, setGreeting] = useState('');
  const [notificationCount, setNotificationCount] = useState(3);
  const [upcomingAppointment, setUpcomingAppointment] = useState({
    doctor: 'Dr. Martin',
    specialty: 'Cardiologie',
    date: '15 mai',
    time: '14:30',
  });
  const [medicationsDue, setMedicationsDue] = useState(2);

  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const translateY = useState(new Animated.Value(30))[0];
  const scaleAnim = useState(new Animated.Value(0.9))[0];

  useEffect(() => {
    // Set greeting based on time of day
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Bonjour');
    else if (hour < 18) setGreeting('Bon après-midi');
    else setGreeting('Bonsoir');

    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  if (userRole !== 'PATIENT') {
    router.replace('/login');
    return null;
  }

  const handleNavigation = (screen: string) => {
    router.push(screen);
  };

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  // Group navigation items by category
  const navigationGroups = [
    {
      title: 'Santé',
      items: [
        {
          name: 'Médicaments',
          icon: 'pill',
          iconType: 'MaterialCommunityIcons',
          color: '#4CAF50',
          route: '/MedicationScreen',
          badge: medicationsDue,
        },
        {
          name: 'Rappels',
          icon: 'alarm',
          iconType: 'Ionicons',
          color: '#FF9800',
          route: '/ReminderScreen',
        },
        {
          name: 'Suivi de santé',
          icon: 'heart',
          iconType: 'Ionicons',
          color: '#F44336',
          route: '/HealthTrackingScreen',
        },
      ],
    },
    {
      title: 'Consultations',
      items: [
        {
          name: 'Rendez-vous',
          icon: 'calendar',
          iconType: 'Ionicons',
          color: '#2196F3',
          route: '/MyAppointmentsScreen',
        },
        {
          name: 'Chat',
          icon: 'chatbubbles',
          iconType: 'Ionicons',
          color: '#9C27B0',
          route: '/ChatScreen',
        },
        {
          name: 'Rapports',
          icon: 'document-text',
          iconType: 'Ionicons',
          color: '#607D8B',
          route: '/ReportScreen',
        },
      ],
    },
    {
      title: 'Mon compte',
      items: [
        {
          name: 'Profil',
          icon: 'person',
          iconType: 'Ionicons',
          color: '#00BCD4',
          route: '/ProfileScreen',
        },
        {
          name: 'Notifications',
          icon: 'notifications',
          iconType: 'Ionicons',
          color: '#FFC107',
          route: '/NotificationsScreen',
          badge: notificationCount,
        },
        {
          name: 'Journal',
          icon: 'list',
          iconType: 'Ionicons',
          color: '#795548',
          route: '/ActivityLogScreen',
        },
      ],
    },
  ];

  // Render icon based on type
  const renderIcon = (item) => {
    const size = 24;

    if (item.iconType === 'MaterialCommunityIcons') {
      return <MaterialCommunityIcons name={item.icon} size={size} color={item.color} />;
    } else if (item.iconType === 'FontAwesome5') {
      return <FontAwesome5 name={item.icon} size={size} color={item.color} />;
    } else {
      return <Ionicons name={`${item.icon}-outline`} size={size} color={item.color} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1976D2" />

      {/* Header */}
      <LinearGradient
        colors={['#1976D2', '#64B5F6']}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting},</Text>
            <Text style={styles.headerTitle}>{userName}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => handleNavigation('/NotificationsScreen')}
              style={styles.notificationButton}
            >
              <Ionicons name="notifications-outline" size={24} color="#fff" />
              {notificationCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>{notificationCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <Ionicons name="log-out-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity
            style={[styles.quickAction, styles.quickAction1]}
            onPress={() => handleNavigation('/MyAppointmentsScreen')}
          >
            <View style={styles.quickActionContent}>
              <Ionicons name="calendar" size={24} color="#fff" />
              <Text style={styles.quickActionTitle}>Prendre RDV</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickAction, styles.quickAction2]}
            onPress={() => handleNavigation('/ChatScreen')}
          >
            <View style={styles.quickActionContent}>
              <Ionicons name="chatbubbles" size={24} color="#fff" />
              <Text style={styles.quickActionTitle}>Consulter</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickAction, styles.quickAction3]}
            onPress={() => handleNavigation('/MedicationScreen')}
          >
            <View style={styles.quickActionContent}>
              <MaterialCommunityIcons name="pill" size={24} color="#fff" />
              <Text style={styles.quickActionTitle}>Médicaments</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Upcoming Appointment Card */}
        <Animated.View
          style={[
            styles.appointmentCard,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: translateY },
                { scale: scaleAnim }
              ],
            }
          ]}
        >
          <View style={styles.appointmentHeader}>
            <Text style={styles.appointmentTitle}>Prochain rendez-vous</Text>
            <TouchableOpacity onPress={() => handleNavigation('/MyAppointmentsScreen')}>
              <Text style={styles.seeAllText}>Voir tous</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.appointmentContent}>
            <View style={styles.appointmentIconContainer}>
              <Ionicons name="calendar" size={30} color="#1976D2" />
            </View>
            <View style={styles.appointmentDetails}>
              <Text style={styles.doctorName}>{upcomingAppointment.doctor}</Text>
              <Text style={styles.appointmentSpecialty}>{upcomingAppointment.specialty}</Text>
              <View style={styles.appointmentTime}>
                <Ionicons name="time-outline" size={16} color="#666" />
                <Text style={styles.appointmentTimeText}>
                  {upcomingAppointment.date} à {upcomingAppointment.time}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.appointmentAction}
              onPress={() => handleNavigation('/MyAppointmentsScreen')}
            >
              <Ionicons name="chevron-forward" size={24} color="#1976D2" />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Health Status Card */}
        <Animated.View
          style={[
            styles.healthCard,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: translateY },
                { scale: scaleAnim }
              ],
            }
          ]}
        >
          <View style={styles.healthCardHeader}>
            <Text style={styles.healthCardTitle}>Résumé de santé</Text>
            <TouchableOpacity onPress={() => handleNavigation('/HealthTrackingScreen')}>
              <Text style={styles.seeAllText}>Détails</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.healthMetrics}>
            <View style={styles.healthMetric}>
              <View style={[styles.metricIconContainer, { backgroundColor: '#E3F2FD' }]}>
                <FontAwesome5 name="heartbeat" size={20} color="#2196F3" />
              </View>
              <Text style={styles.metricValue}>72</Text>
              <Text style={styles.metricLabel}>Pouls</Text>
            </View>

            <View style={styles.healthMetric}>
              <View style={[styles.metricIconContainer, { backgroundColor: '#E8F5E9' }]}>
                <MaterialCommunityIcons name="blood-bag" size={20} color="#4CAF50" />
              </View>
              <Text style={styles.metricValue}>120/80</Text>
              <Text style={styles.metricLabel}>Tension</Text>
            </View>

            <View style={styles.healthMetric}>
              <View style={[styles.metricIconContainer, { backgroundColor: '#FFF3E0' }]}>
                <MaterialCommunityIcons name="scale-bathroom" size={20} color="#FF9800" />
              </View>
              <Text style={styles.metricValue}>68kg</Text>
              <Text style={styles.metricLabel}>Poids</Text>
            </View>
          </View>
        </Animated.View>

        {/* Navigation Groups */}
        {navigationGroups.map((group, groupIndex) => (
          <View key={groupIndex} style={styles.navigationGroup}>
            <Text style={styles.navigationGroupTitle}>{group.title}</Text>
            <View style={styles.buttonContainer}>
              {group.items.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.button}
                  onPress={() => handleNavigation(item.route)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.iconContainer, { backgroundColor: `${item.color}15` }]}>
                    {renderIcon(item)}
                    {item.badge && (
                      <View style={[styles.badge, { backgroundColor: item.color }]}>
                        <Text style={styles.badgeText}>{item.badge}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.buttonText}>{item.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Emergency Contact */}
        <TouchableOpacity style={styles.emergencyButton}>
          <View style={styles.emergencyContent}>
            <Ionicons name="call" size={24} color="#fff" />
            <Text style={styles.emergencyText}>Contact d'urgence</Text>
          </View>
        </TouchableOpacity>

        {/* Bottom padding */}
        <View style={{ height: 20 }} />
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
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 10,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  greeting: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationButton: {
    padding: 10,
    marginRight: 5,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#FF5252',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#1976D2',
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  logoutButton: {
    padding: 10,
  },
  scrollContent: {
    padding: 15,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  quickAction: {
    width: '31%',
    height: 80,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickAction1: {
    backgroundColor: '#2196F3',
  },
  quickAction2: {
    backgroundColor: '#9C27B0',
  },
  quickAction3: {
    backgroundColor: '#4CAF50',
  },
  quickActionContent: {
    alignItems: 'center',
  },
  quickActionTitle: {
    color: '#fff',
    marginTop: 8,
    fontWeight: '600',
    fontSize: 12,
  },
  appointmentCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  appointmentTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  seeAllText: {
    fontSize: 14,
    color: '#1976D2',
    fontWeight: '600',
  },
  appointmentContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appointmentIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  appointmentDetails: {
    flex: 1,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  appointmentSpecialty: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  appointmentTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appointmentTimeText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
  },
  appointmentAction: {
    padding: 10,
  },
  healthCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  healthCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  healthCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  healthMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  healthMetric: {
    alignItems: 'center',
    width: '30%',
  },
  metricIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
  },
  navigationGroup: {
    marginBottom: 20,
  },
  navigationGroupTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 15,
    marginLeft: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  button: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    width: '31%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 5,
  },
  buttonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  emergencyButton: {
    backgroundColor: '#F44336',
    borderRadius: 15,
    padding: 15,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  emergencyContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emergencyText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 10,
  },
});