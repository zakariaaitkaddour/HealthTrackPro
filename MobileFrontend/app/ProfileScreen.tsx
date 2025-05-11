import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Image,
  Animated,
  Easing,
  ScrollView,
  Dimensions,
  StatusBar,
  Platform,
  Switch,
  TextInput,
  Modal,
  KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from 'react-native-vector-icons';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import api from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';

// Define interfaces for profile data
interface ProfileData {
  email: string;
  name: string;
  phoneNumber: string;
  address?: string;
  birthDate?: string;
  bloodType?: string;
  allergies?: string[];
  emergencyContact?: {
    name: string;
    phoneNumber: string;
    relationship: string;
  };
  profilePicture?: string;
}

interface SettingsData {
  notifications: boolean;
  darkMode: boolean;
  language: string;
  twoFactorAuth: boolean;
  dataSharing: boolean;
}

const { width, height } = Dimensions.get('window');

// Medical theme colors
const COLORS = {
  primary: '#1A73E8',       // Medical blue
  primaryDark: '#0D47A1',   // Darker blue
  secondary: '#4ECDC4',     // Teal
  accent: '#4ECDC4',        // Teal accent
  background: '#F8FAFC',    // Light background
  card: '#FFFFFF',          // White card
  text: '#2D3748',          // Dark text
  textSecondary: '#718096', // Secondary text
  error: '#E53E3E',         // Error red
  success: '#48BB78',       // Success green
  warning: '#F59E0B',       // Warning yellow
  border: '#E2E8F0',        // Border color
  gradient: ['#1A73E8', '#4ECDC4'], // Blue to teal gradient
  logout: ['#E53E3E', '#C53030'], // Red gradient for logout
  edit: ['#F59E0B', '#D97706'], // Orange gradient for edit
  save: ['#48BB78', '#2F855A'], // Green gradient for save
};

const ProfileScreen = () => {
  const { userId, userRole, logout } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [settings, setSettings] = useState<SettingsData>({
    notifications: true,
    darkMode: false,
    language: 'Français',
    twoFactorAuth: false,
    dataSharing: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'settings' | 'medical'>('profile');
  const [editMode, setEditMode] = useState(false);
  const [editedProfile, setEditedProfile] = useState<ProfileData | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editField, setEditField] = useState<{name: string, value: string}>({name: '', value: ''});
  const [refreshing, setRefreshing] = useState(false);

  // Scroll and animation values
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const cardScale = useRef(new Animated.Value(0.97)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const refreshRotate = useRef(new Animated.Value(0)).current;
  const logoutButtonScale = useRef(new Animated.Value(0.95)).current;
  const logoutButtonOpacity = useRef(new Animated.Value(0)).current;
  const tabBarTranslateY = useRef(new Animated.Value(100)).current;
  const tabBarOpacity = useRef(new Animated.Value(0)).current;

  // Field animations
  const fieldAnimations = useRef([
    new Animated.Value(20),
    new Animated.Value(20),
    new Animated.Value(20),
    new Animated.Value(20),
    new Animated.Value(20),
    new Animated.Value(20),
  ]).current;

  const fieldOpacity = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  // Header animations based on scroll - using transform instead of height
  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -50],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.98],
    extrapolate: 'clamp',
  });

  const headerElevation = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 10],
    extrapolate: 'clamp',
  });

  const avatarScale = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.8],
    extrapolate: 'clamp',
  });

  const avatarTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -10],
    extrapolate: 'clamp',
  });

  const nameTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -5],
    extrapolate: 'clamp',
  });

  const nameScale = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.9],
    extrapolate: 'clamp',
  });

  const spin = refreshRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  useEffect(() => {
    if (userRole !== 'PATIENT' && userRole !== 'DOCTOR') {
      Alert.alert('Erreur', 'Accès réservé aux utilisateurs authentifiés');
      logout();
      return;
    }

    StatusBar.setBarStyle('light-content');
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor('transparent');
      StatusBar.setTranslucent(true);
    }

    fetchProfile();
  }, []);

  const animateIn = () => {
    // Reset animations
    fadeAnim.setValue(0);
    slideAnim.setValue(30);
    cardScale.setValue(0.97);
    cardOpacity.setValue(0);
    tabBarTranslateY.setValue(100);
    tabBarOpacity.setValue(0);
    fieldAnimations.forEach(anim => anim.setValue(20));
    fieldOpacity.forEach(anim => anim.setValue(0));
    logoutButtonScale.setValue(0.95);
    logoutButtonOpacity.setValue(0);

    // Sequence of animations
    Animated.sequence([
      // Fade in header
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),

      // Card slide up
      Animated.parallel([
        Animated.spring(cardScale, {
          toValue: 1,
          friction: 8,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),

      // Tab bar animation
      Animated.parallel([
        Animated.spring(tabBarTranslateY, {
          toValue: 0,
          friction: 8,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(tabBarOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),

      // Stagger field animations
      Animated.stagger(100, [
        ...fieldAnimations.map((anim, index) =>
          Animated.parallel([
            Animated.spring(anim, {
              toValue: 0,
              friction: 8,
              tension: 70,
              useNativeDriver: true,
            }),
            Animated.timing(fieldOpacity[index], {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
          ])
        ),

        // Logout button animation
        Animated.parallel([
          Animated.spring(logoutButtonScale, {
            toValue: 1,
            friction: 8,
            tension: 50,
            useNativeDriver: true,
          }),
          Animated.timing(logoutButtonOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();
  };

  const animateRefresh = () => {
    Animated.timing(refreshRotate, {
      toValue: 1,
      duration: 800,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start(() => {
      refreshRotate.setValue(0);
    });
  };

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    animateRefresh();

    try {
      console.log('UserId récupéré depuis AuthContext :', userId);
      if (!userId) {
        throw new Error('Utilisateur non identifié');
      }

      // Récupérer le token de manière asynchrone
      const token = await AsyncStorage.getItem('userToken');
      console.log('Token récupéré depuis AsyncStorage :', token);
      if (!token) {
        throw new Error('Token non trouvé');
      }

      const response = await api.get(`/api/patient/profile/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log('Réponse du backend :', response.data);

      // Enhance the profile with mock data if needed
      const enhancedProfile = {
        ...response.data,
        address: response.data.address || '123 Rue de la Santé, Paris',
        birthDate: response.data.birthDate || '15/05/1985',
        bloodType: response.data.bloodType || 'A+',
        allergies: response.data.allergies || ['Pénicilline', 'Arachides'],
        emergencyContact: response.data.emergencyContact || {
          name: 'Marie Dupont',
          phoneNumber: '+33 6 12 34 56 78',
          relationship: 'Conjoint',
        },
        profilePicture: response.data.profilePicture || 'https://randomuser.me/api/portraits/men/1.jpg',
      };

      setProfile(enhancedProfile);
      setEditedProfile(enhancedProfile);

      // Trigger animations after data is loaded
      setTimeout(() => {
        animateIn();
      }, 100);
    } catch (err) {
      setError('Erreur lors de la récupération du profil');
      console.error('Détails de l\'erreur :', err.response?.status);
      Alert.alert('Erreur', err.message || 'Erreur lors de la récupération du profil');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRetry = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    fetchProfile();
  };

  const handleLogout = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Animate logout button press
    Animated.sequence([
      Animated.timing(logoutButtonScale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(logoutButtonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),

      // Animate out everything
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(cardOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(logoutButtonOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
    ]).start(async () => {
      await logout();
      router.replace('/login');
    });
  };

  const handleEditProfile = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditMode(true);
  };

  const handleSaveProfile = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setLoading(true);

    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) throw new Error('Token non trouvé');

      // In a real app, you would send the updated profile to the server
      // await api.put(`/api/patient/profile/${userId}`, editedProfile, {
      //   headers: { Authorization: `Bearer ${token}` },
      // });

      // For now, just update the local state
      setProfile(editedProfile);
      setEditMode(false);

      Alert.alert('Succès', 'Profil mis à jour avec succès');
    } catch (err) {
      Alert.alert('Erreur', 'Échec de la mise à jour du profil');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditedProfile(profile);
    setEditMode(false);
  };

  const handlePickImage = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      "Changer la photo de profil",
      "Cette fonctionnalité n'est pas disponible dans cette version de l'application.",
      [{ text: "OK" }]
    );
  };

  const handleEditField = (name: string, value: string) => {
    setEditField({ name, value });
    setShowEditModal(true);
  };

  const saveEditField = () => {
    if (editedProfile && editField.name) {
      const updatedProfile = { ...editedProfile };

      // Handle nested properties
      if (editField.name.includes('.')) {
        const [parent, child] = editField.name.split('.');
        if (updatedProfile[parent]) {
          updatedProfile[parent] = {
            ...updatedProfile[parent],
            [child]: editField.value
          };
        }
      } else {
        updatedProfile[editField.name] = editField.value;
      }

      setEditedProfile(updatedProfile);
    }

    setShowEditModal(false);
  };

  const onPressRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    fetchProfile();
  };

  const handleTabChange = (tab: 'profile' | 'settings' | 'medical') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
  };

  const toggleSetting = (setting: keyof SettingsData) => {
    if (typeof settings[setting] === 'boolean') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSettings({
        ...settings,
        [setting]: !settings[setting],
      });
    }
  };

  const renderProfileField = (label: string, value: string | undefined, index: number, iconName: string, fieldName?: string) => (
    <Animated.View
      style={[
        styles.profileField,
        {
          opacity: fieldOpacity[index % fieldOpacity.length],
          transform: [{ translateY: fieldAnimations[index % fieldAnimations.length] }]
        }
      ]}
    >
      <View style={styles.profileLabelContainer}>
        <View style={styles.iconContainer}>
          <Ionicons name={iconName} size={18} color={COLORS.primary} />
        </View>
        <Text style={styles.profileLabel}>{label}</Text>
      </View>

      {editMode && fieldName ? (
        <TouchableOpacity
          style={styles.editableValue}
          onPress={() => handleEditField(fieldName, value || '')}
        >
          <Text style={[styles.profileValue, styles.editableText]}>
            {value || 'Non spécifié'}
          </Text>
          <Ionicons name="pencil-outline" size={16} color={COLORS.primary} style={styles.editIcon} />
        </TouchableOpacity>
      ) : (
        <Text style={styles.profileValue}>{value || 'Non spécifié'}</Text>
      )}
    </Animated.View>
  );

  const renderSettingItem = (label: string, value: boolean, setting: keyof SettingsData, iconName: string, index: number) => (
    <Animated.View
      style={[
        styles.settingItem,
        {
          opacity: fieldOpacity[index % fieldOpacity.length],
          transform: [{ translateY: fieldAnimations[index % fieldAnimations.length] }]
        }
      ]}
    >
      <View style={styles.settingLabelContainer}>
        <View style={[styles.iconContainer, { backgroundColor: 'rgba(78, 205, 196, 0.1)' }]}>
          <Ionicons name={iconName} size={18} color={COLORS.secondary} />
        </View>
        <Text style={styles.settingLabel}>{label}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={() => toggleSetting(setting)}
        trackColor={{ false: '#E2E8F0', true: 'rgba(78, 205, 196, 0.4)' }}
        thumbColor={value ? COLORS.secondary : '#f4f3f4'}
        ios_backgroundColor="#E2E8F0"
      />
    </Animated.View>
  );

  const renderMedicalField = (label: string, value: string | string[] | undefined, index: number, iconName: string) => (
    <Animated.View
      style={[
        styles.profileField,
        {
          opacity: fieldOpacity[index % fieldOpacity.length],
          transform: [{ translateY: fieldAnimations[index % fieldAnimations.length] }]
        }
      ]}
    >
      <View style={styles.profileLabelContainer}>
        <View style={[styles.iconContainer, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
          <FontAwesome5 name={iconName} size={16} color={COLORS.warning} />
        </View>
        <Text style={styles.profileLabel}>{label}</Text>
      </View>

      {Array.isArray(value) ? (
        <View style={styles.tagsContainer}>
          {value.map((item, idx) => (
            <View key={idx} style={styles.tag}>
              <Text style={styles.tagText}>{item}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.profileValue}>{value || 'Non spécifié'}</Text>
      )}
    </Animated.View>
  );

  if (loading && !profile) {
    return (
      <View style={styles.center}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <LinearGradient
            colors={COLORS.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.loadingGradient}
          >
            <ActivityIndicator size="large" color="#ffffff" />
          </LinearGradient>
        </View>
        <Text style={styles.loadingText}>Chargement du profil...</Text>
      </View>
    );
  }

  if (error && !profile) {
    return (
      <View style={styles.center}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.errorIconContainer}>
          <LinearGradient
            colors={COLORS.logout}
            style={styles.errorGradient}
          >
            <Ionicons name="alert-circle-outline" size={40} color="#fff" />
          </LinearGradient>
        </View>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={handleRetry}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={COLORS.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.retryGradient}
          >
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Animated Header */}
      <Animated.View
        style={[
          styles.headerContainer,
          {
            transform: [{ translateY: headerTranslateY }],
            opacity: headerOpacity,
            shadowOpacity: headerElevation,
          }
        ]}
      >
        <LinearGradient
          colors={COLORS.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          {/* Medical cross decoration */}
          <View style={styles.medicalCrossHorizontal} />
          <View style={styles.medicalCrossVertical} />

          {/* Back button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <BlurView intensity={80} tint="light" style={styles.blurButton}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </BlurView>
          </TouchableOpacity>

          {/* Refresh button */}
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={onPressRefresh}
            activeOpacity={0.8}
            disabled={refreshing}
          >
            <BlurView intensity={80} tint="light" style={styles.blurButton}>
              <Animated.View style={{ transform: [{ rotate: spin }] }}>
                <Ionicons name="refresh-outline" size={22} color="#fff" />
              </Animated.View>
            </BlurView>
          </TouchableOpacity>

          {/* Medical icon */}
          <View style={styles.medicalIconContainer}>
            <Ionicons name="medical-outline" size={24} color="rgba(255,255,255,0.2)" />
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Scrollable Content */}
      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      >
        {/* Avatar and Name */}
        <View style={styles.profileHeader}>
          <Animated.View
            style={[
              styles.avatarContainer,
              {
                transform: [
                  { scale: avatarScale },
                  { translateY: avatarTranslateY }
                ],
                opacity: fadeAnim
              }
            ]}
          >
            <TouchableOpacity
              style={styles.avatarRing}
              onPress={editMode ? handlePickImage : undefined}
              activeOpacity={editMode ? 0.7 : 1}
            >
              <Image
                source={{ uri: editMode && editedProfile ? editedProfile.profilePicture : profile?.profilePicture }}
                style={styles.avatar}
              />
              {editMode && (
                <View style={styles.editAvatarOverlay}>
                  <Ionicons name="camera" size={24} color="#fff" />
                </View>
              )}
            </TouchableOpacity>

            {userRole === 'DOCTOR' && (
              <View style={styles.doctorBadge}>
                <Ionicons name="medical" size={12} color="#fff" />
              </View>
            )}
          </Animated.View>

          <Animated.Text
            style={[
              styles.profileName,
              {
                opacity: fadeAnim,
                transform: [
                  { translateY: nameTranslateY },
                  { scale: nameScale }
                ]
              }
            ]}
          >
            {editMode && editedProfile ? editedProfile.name : profile?.name || 'Utilisateur'}
          </Animated.Text>

          <Animated.View
            style={[
              styles.roleContainer,
              { opacity: fadeAnim }
            ]}
          >
            <LinearGradient
              colors={['rgba(26, 115, 232, 0.1)', 'rgba(78, 205, 196, 0.1)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.roleGradient}
            >
              <Text style={styles.roleText}>
                {userRole === 'PATIENT' ? 'Patient' : 'Médecin'}
              </Text>
            </LinearGradient>
          </Animated.View>
        </View>

        {/* Tab Bar */}
        <Animated.View
          style={[
            styles.tabBarContainer,
            {
              opacity: tabBarOpacity,
              transform: [{ translateY: tabBarTranslateY }]
            }
          ]}
        >
          <TouchableOpacity
            style={[styles.tab, activeTab === 'profile' && styles.activeTab]}
            onPress={() => handleTabChange('profile')}
          >
            <Ionicons
              name="person-outline"
              size={20}
              color={activeTab === 'profile' ? COLORS.primary : COLORS.textSecondary}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'profile' && styles.activeTabText
              ]}
            >
              Profil
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'medical' && styles.activeTab]}
            onPress={() => handleTabChange('medical')}
          >
            <Ionicons
              name="fitness-outline"
              size={20}
              color={activeTab === 'medical' ? COLORS.warning : COLORS.textSecondary}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'medical' && { color: COLORS.warning }
              ]}
            >
              Médical
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'settings' && styles.activeTab]}
            onPress={() => handleTabChange('settings')}
          >
            <Ionicons
              name="settings-outline"
              size={20}
              color={activeTab === 'settings' ? COLORS.secondary : COLORS.textSecondary}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'settings' && { color: COLORS.secondary }
              ]}
            >
              Paramètres
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Profile Card */}
        {activeTab === 'profile' && (
          <Animated.View
            style={[
              styles.profileCard,
              {
                opacity: cardOpacity,
                transform: [{ scale: cardScale }]
              }
            ]}
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderContent}>
                <Ionicons name="person-circle-outline" size={20} color={COLORS.primary} />
                <Text style={styles.cardTitle}>Informations personnelles</Text>
              </View>

              {!editMode ? (
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={handleEditProfile}
                >
                  <LinearGradient
                    colors={COLORS.edit}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.editGradient}
                  >
                    <Ionicons name="pencil-outline" size={16} color="#fff" />
                    <Text style={styles.editButtonText}>Modifier</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ) : (
                <View style={styles.editActions}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleCancelEdit}
                  >
                    <Ionicons name="close-outline" size={20} color={COLORS.error} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSaveProfile}
                  >
                    <LinearGradient
                      colors={COLORS.save}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.saveGradient}
                    >
                      <Ionicons name="checkmark-outline" size={16} color="#fff" />
                      <Text style={styles.saveButtonText}>Enregistrer</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {(profile || editedProfile) && (
              <View style={styles.fieldsContainer}>
                {renderProfileField(
                  'Email',
                  editMode ? editedProfile?.email : profile?.email,
                  0,
                  'mail-outline',
                  'email'
                )}
                {renderProfileField(
                  'Nom',
                  editMode ? editedProfile?.name : profile?.name,
                  1,
                  'person-outline',
                  'name'
                )}
                {renderProfileField(
                  'Téléphone',
                  editMode ? editedProfile?.phoneNumber : profile?.phoneNumber,
                  2,
                  'call-outline',
                  'phoneNumber'
                )}
                {renderProfileField(
                  'Adresse',
                  editMode ? editedProfile?.address : profile?.address,
                  3,
                  'home-outline',
                  'address'
                )}
              </View>
            )}
          </Animated.View>
        )}

        {/* Medical Information Card */}
        {activeTab === 'medical' && (
          <Animated.View
            style={[
              styles.profileCard,
              {
                opacity: cardOpacity,
                transform: [{ scale: cardScale }]
              }
            ]}
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderContent}>
                <FontAwesome5 name="heartbeat" size={18} color={COLORS.warning} />
                <Text style={[styles.cardTitle, { color: COLORS.warning }]}>Informations médicales</Text>
              </View>
            </View>

            {profile && (
              <View style={styles.fieldsContainer}>
                {renderMedicalField('Date de naissance', profile.birthDate, 0, 'calendar')}
                {renderMedicalField('Groupe sanguin', profile.bloodType, 1, 'tint')}
                {renderMedicalField('Allergies', profile.allergies, 2, 'allergies')}

                <Animated.View
                  style={[
                    styles.emergencyContactCard,
                    {
                      opacity: fieldOpacity[3 % fieldOpacity.length],
                      transform: [{ translateY: fieldAnimations[3 % fieldAnimations.length] }]
                    }
                  ]}
                >
                  <View style={styles.emergencyContactHeader}>
                    <FontAwesome5 name="ambulance" size={16} color="#fff" />
                    <Text style={styles.emergencyContactTitle}>Contact d'urgence</Text>
                  </View>

                  <View style={styles.emergencyContactBody}>
                    <View style={styles.emergencyContactRow}>
                      <Text style={styles.emergencyContactLabel}>Nom:</Text>
                      <Text style={styles.emergencyContactValue}>{profile.emergencyContact?.name}</Text>
                    </View>
                    <View style={styles.emergencyContactRow}>
                      <Text style={styles.emergencyContactLabel}>Téléphone:</Text>
                      <Text style={styles.emergencyContactValue}>{profile.emergencyContact?.phoneNumber}</Text>
                    </View>
                    <View style={styles.emergencyContactRow}>
                      <Text style={styles.emergencyContactLabel}>Relation:</Text>
                      <Text style={styles.emergencyContactValue}>{profile.emergencyContact?.relationship}</Text>
                    </View>
                  </View>
                </Animated.View>
              </View>
            )}
          </Animated.View>
        )}

        {/* Settings Card */}
        {activeTab === 'settings' && (
          <Animated.View
            style={[
              styles.profileCard,
              {
                opacity: cardOpacity,
                transform: [{ scale: cardScale }]
              }
            ]}
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderContent}>
                <Ionicons name="settings-outline" size={20} color={COLORS.secondary} />
                <Text style={[styles.cardTitle, { color: COLORS.secondary }]}>Paramètres</Text>
              </View>
            </View>

            <View style={styles.fieldsContainer}>
              {renderSettingItem(
                'Notifications',
                settings.notifications,
                'notifications',
                'notifications-outline',
                0
              )}
              {renderSettingItem(
                'Mode sombre',
                settings.darkMode,
                'darkMode',
                'moon-outline',
                1
              )}
              {renderSettingItem(
                'Authentification à deux facteurs',
                settings.twoFactorAuth,
                'twoFactorAuth',
                'shield-checkmark-outline',
                2
              )}
              {renderSettingItem(
                'Partage de données médicales',
                settings.dataSharing,
                'dataSharing',
                'share-social-outline',
                3
              )}

              <Animated.View
                style={[
                  styles.settingItem,
                  {
                    opacity: fieldOpacity[4 % fieldOpacity.length],
                    transform: [{ translateY: fieldAnimations[4 % fieldAnimations.length] }]
                  }
                ]}
              >
                <View style={styles.settingLabelContainer}>
                  <View style={[styles.iconContainer, { backgroundColor: 'rgba(78, 205, 196, 0.1)' }]}>
                    <Ionicons name="language-outline" size={18} color={COLORS.secondary} />
                  </View>
                  <Text style={styles.settingLabel}>Langue</Text>
                </View>
                <TouchableOpacity style={styles.languageSelector}>
                  <Text style={styles.languageText}>{settings.language}</Text>
                  <Ionicons name="chevron-down" size={16} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </Animated.View>

              <Animated.View
                style={[
                  styles.settingItem,
                  {
                    opacity: fieldOpacity[5 % fieldOpacity.length],
                    transform: [{ translateY: fieldAnimations[5 % fieldAnimations.length] }]
                  }
                ]}
              >
                <TouchableOpacity
                  style={styles.dangerButton}
                  onPress={() => Alert.alert(
                    'Confirmation',
                    'Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.',
                    [
                      { text: 'Annuler', style: 'cancel' },
                      { text: 'Supprimer', style: 'destructive' }
                    ]
                  )}
                >
                  <Ionicons name="trash-outline" size={18} color={COLORS.error} />
                  <Text style={styles.dangerButtonText}>Supprimer mon compte</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </Animated.View>
        )}

        {/* Spacer for logout button */}
        <View style={{ height: 100 }} />
      </Animated.ScrollView>

      {/* Logout Button */}
      <Animated.View
        style={[
          styles.logoutButtonContainer,
          {
            opacity: logoutButtonOpacity,
            transform: [{ scale: logoutButtonScale }]
          }
        ]}
      >
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={COLORS.logout}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoutGradient}
          >
            <Ionicons name="log-out-outline" size={20} color="#fff" />
            <Text style={styles.logoutButtonText}>Se déconnecter</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* Edit Field Modal */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowEditModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowEditModal(false)}
          />

          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Modifier {editField.name}</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalInput}
              value={editField.value}
              onChangeText={(text) => setEditField({ ...editField, value: text })}
              autoFocus
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={saveEditField}
              >
                <Text style={styles.modalSaveText}>Enregistrer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
    height: 200, // Fixed height instead of animated
  },
  headerGradient: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    position: 'relative',
    overflow: 'hidden',
  },
  medicalCrossHorizontal: {
    position: 'absolute',
    width: 120,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: 40,
    right: -30,
    borderRadius: 10,
  },
  medicalCrossVertical: {
    position: 'absolute',
    width: 20,
    height: 120,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: -10,
    right: 20,
    borderRadius: 10,
  },
  medicalIconContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 40,
    left: 20,
    zIndex: 10,
  },
  refreshButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 40,
    right: 20,
    zIndex: 10,
  },
  blurButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  scrollView: {
    flex: 1,
    zIndex: 1,
  },
  scrollContent: {
    paddingTop: 200,
    paddingBottom: 40,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    marginBottom: 15,
  },
  avatarRing: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  editAvatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doctorBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  roleContainer: {
    marginBottom: 10,
  },
  roleGradient: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  tabBarContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    padding: 5,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: 'rgba(26, 115, 232, 0.1)',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginLeft: 5,
  },
  activeTabText: {
    color: COLORS.primary,
  },
  profileCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    overflow: 'hidden',
    marginBottom: 20,
  },
  cardHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: 8,
  },
  editButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  editGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 5,
  },
  editActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cancelButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(229, 62, 62, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  saveButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  saveGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 5,
  },
  fieldsContainer: {
    paddingVertical: 8,
  },
  profileField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  profileLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(26, 115, 232, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text,
  },
  profileValue: {
    fontSize: 15,
    color: COLORS.textSecondary,
    flexShrink: 1,
    textAlign: 'right',
    fontWeight: '400',
    maxWidth: '50%',
  },
  editableValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editableText: {
    color: COLORS.primary,
  },
  editIcon: {
    marginLeft: 5,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  settingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text,
  },
  languageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginRight: 5,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.error,
    borderRadius: 8,
  },
  dangerButtonText: {
    color: COLORS.error,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    maxWidth: '60%',
  },
  tag: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
    marginLeft: 4,
  },
  tagText: {
    fontSize: 12,
    color: COLORS.warning,
    fontWeight: '500',
  },
  emergencyContactCard: {
    margin: 20,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emergencyContactHeader: {
    backgroundColor: COLORS.error,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  emergencyContactTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  emergencyContactBody: {
    backgroundColor: '#fff',
    padding: 16,
  },
  emergencyContactRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  emergencyContactLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    width: 100,
  },
  emergencyContactValue: {
    fontSize: 14,
    color: COLORS.textSecondary,
    flex: 1,
  },
  logoutButtonContainer: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    zIndex: 100,
  },
  logoutButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: COLORS.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  logoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 20,
  },
  loadingContainer: {
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  loadingGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  errorIconContainer: {
    marginBottom: 20,
    shadowColor: COLORS.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  errorGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: COLORS.error,
    textAlign: 'center',
    marginVertical: 20,
    fontWeight: '500',
  },
  retryButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  retryGradient: {
    paddingVertical: 14,
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '85%',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalCancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 10,
  },
  modalCancelText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  modalSaveButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  modalSaveText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});

export default ProfileScreen;