import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, Image, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from 'react-native-vector-icons';
import { useAuth } from '../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';

export default function DashboardScreen() {
  const [userName, setUserName] = useState('Jhon Doe');
  const router = useRouter();
  const { setIsAuthenticated } = useAuth();

  const services = [
    { id: '1', name: 'Profile', icon: 'person', route: '/profile' },
    { id: '2', name: 'Medications', icon: 'medkit', route: '/medication' },
    { id: '3', name: 'Chat', icon: 'chatbubbles', route: '/chat' },
    { id: '4', name: 'Activity Log', icon: 'journal', route: '/activity-log' },
  ];

  const appointments = [
    { id: '1', doctor: 'Dr. Samuel', time: '9:30 AM', date: 'Tue 12', type: 'Depression' },
    { id: '2', doctor: 'Dr. Samuel', time: '10:00 AM', date: 'Wed 13', type: 'Depression' },
  ];

  // Animation pour les cartes
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(20)).current;

  useEffect(() => {
    const fetchUserName = async () => {
      const email = await AsyncStorage.getItem('userEmail');
      if (email) {
        setUserName(email.split('@')[0]);
      }
    };
    fetchUserName();

    // Lancer l'animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userEmail');
    setIsAuthenticated(false);
    router.replace('/login');
  };

  const renderService = ({ item }) => (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <Pressable style={styles.serviceCard} onPress={() => router.push(item.route)}>
        <Ionicons name={item.icon} size={28} color="#4a90e2" />
        <Text style={styles.serviceText}>{item.name}</Text>
      </Pressable>
    </Animated.View>
  );

  const renderAppointment = ({ item }) => (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <View style={[styles.appointmentCard, { backgroundColor: item.id === '1' ? '#4a90e2' : '#4cd964' }]}>
        <Text style={styles.appointmentTime}>{item.time}</Text>
        <Text style={styles.appointmentDate}>{item.date}</Text>
        <Text style={styles.appointmentDoctor}>{item.doctor}</Text>
        <Text style={styles.appointmentType}>{item.type}</Text>
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello, {userName}!</Text>
        <View style={styles.headerIcons}>
          <Ionicons name="heart-outline" size={26} color="#ff2d55" style={styles.icon} />
          <Pressable onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={26} color="#ff2d55" style={styles.icon} />
          </Pressable>
        </View>
      </View>

      {/* Services Section */}
      <Text style={styles.sectionTitle}>Services</Text>
      <FlatList
        data={services}
        renderItem={renderService}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.serviceList}
      />

      {/* Banner */}
      <LinearGradient
        colors={['#4a90e2', '#4cd964']}
        style={styles.banner}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Image
          source={{ uri: 'https://via.placeholder.com/80' }} // Image de remplacement
          style={styles.bannerImage}
        />
        <View style={styles.bannerTextContainer}>
          <Text style={styles.bannerText}>Best Medical Services</Text>
          <Text style={styles.bannerSubText}>Quality care at affordable prices</Text>
        </View>
      </LinearGradient>

      {/* Upcoming Appointments Section */}
      <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
      <FlatList
        data={appointments}
        renderItem={renderAppointment}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.appointmentList}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa', // Fond légèrement plus clair pour un look moderne
    padding: 20,
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  headerIcons: {
    flexDirection: 'row',
  },
  icon: {
    marginLeft: 15,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: '#4a90e2', // Bleu principal
    fontFamily: 'System', // Vous pouvez utiliser une police personnalisée ici
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    marginLeft: 5,
  },
  serviceList: {
    marginBottom: 25,
  },
  serviceCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginRight: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#e8ecef',
  },
  serviceText: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: '500',
    color: '#4a90e2', // Bleu pour le texte des services
  },
  banner: {
    borderRadius: 15,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  bannerImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 20,
    borderWidth: 2,
    borderColor: '#fff',
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 5,
  },
  bannerSubText: {
    fontSize: 14,
    color: '#f0f4f8',
    fontWeight: '400',
  },
  appointmentList: {
    marginBottom: 20,
  },
  appointmentCard: {
    borderRadius: 15,
    padding: 20,
    marginRight: 15,
    width: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 5,
  },
  appointmentTime: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  appointmentDate: {
    fontSize: 14,
    color: '#f0f4f8',
    marginBottom: 5,
  },
  appointmentDoctor: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  appointmentType: {
    fontSize: 13,
    color: '#f0f4f8',
    marginTop: 5,
    fontStyle: 'italic',
  },
});