import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert, ScrollView, Platform, Animated } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from 'react-native-vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function ProfileScreen() {
  const [email, setEmail] = useState('');
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [condition, setCondition] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isProfileEmpty, setIsProfileEmpty] = useState(false);
  const [errors, setErrors] = useState({});
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(20)).current;
  const buttonScale = React.useRef(new Animated.Value(1)).current;
  const sectionFadeAnim = React.useRef(new Animated.Value(0)).current;

  const handleFieldChange = (setter) => (value) => {
    setHasUnsavedChanges(true);
    setIsProfileEmpty(false);
    setter(value);
    setErrors((prev) => ({ ...prev, [setter.name]: '' }));
  };

  useFocusEffect(
    useCallback(() => {
      if (!isAuthenticated) {
        router.replace('/login');
      } else {
        const fetchProfile = async () => {
          try {
            const token = await AsyncStorage.getItem('userToken');
            const userEmail = await AsyncStorage.getItem('userEmail');
            console.log('Fetching profile for email:', userEmail);
            console.log('Token:', token);

            if (userEmail) {
              setEmail(userEmail);
            }

            const response = await axios.get('http://10.0.2.2:8080/api/patient/profile', {
              headers: { Authorization: `Bearer ${token}` },
              params: { email: userEmail },
            });

            console.log('Profile data fetched:', response.data);
            const { lastName, firstName, age, gender, condition } = response.data;
            setLastName(lastName || '');
            setFirstName(firstName || '');
            setAge(age ? age.toString() : '');
            setGender(gender || '');
            setCondition(condition || '');
            setHasUnsavedChanges(false);
            setIsProfileEmpty(false);
          } catch (error) {
            console.error('Fetch profile error:', error.response?.data || error.message);
            if (error.response?.status === 404) {
              setIsProfileEmpty(true);
              setGender('Homme');
              setCondition('Aucune');
            } else {
              Alert.alert('Erreur', 'Impossible de charger le profil.');
            }
          }
        };
        fetchProfile();
      }
    }, [isAuthenticated])
  );

  useEffect(() => {
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
      Animated.timing(sectionFadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, sectionFadeAnim]);

  const validateForm = () => {
    const newErrors = {};
    if (!lastName) newErrors.lastName = 'Ce champ est requis';
    if (!firstName) newErrors.firstName = 'Ce champ est requis';
    if (!age) newErrors.age = 'Ce champ est requis';
    if (!gender) newErrors.gender = 'Ce champ est requis';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!validateForm()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires (Nom, Prénom, Âge, Sexe).');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const profileData = { email, lastName, firstName, age: parseInt(age), gender, condition };
      console.log('Saving profile data:', profileData);
      console.log('Token:', token);

      const response = await axios.post(
        'http://10.0.2.2:8080/api/patient/profile',
        profileData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('Profile saved successfully:', response.data);
      setHasUnsavedChanges(false);
      setIsProfileEmpty(false);
      Alert.alert('Succès', 'Profil enregistré avec succès !');
      router.push('/dashboard');
    } catch (error) {
      console.error('Save profile error:', error.response?.data || error.message);
      Alert.alert('Erreur', 'Impossible d’enregistrer le profil.');
    } finally {
      setLoading(false);
    }
  };

  const handleButtonPress = () => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => handleSaveProfile());
  };

  const handleBackPress = () => {
    if (hasUnsavedChanges) {
      Alert.alert(
        'Modifications non enregistrées',
        'Vous avez des modifications non enregistrées. Voulez-vous quitter sans sauvegarder ?',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Quitter',
            style: 'destructive',
            onPress: () => router.push('/dashboard'),
          },
        ]
      );
    } else {
      router.push('/dashboard');
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Pressable onPress={handleBackPress} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" accessibilityLabel="Retour" />
          </Pressable>
          <Text style={styles.title}>Mon Profil</Text>
        </View>

        <Animated.View
          style={[
            styles.formContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {isProfileEmpty && (
            <View style={styles.infoMessage}>
              <Ionicons name="information-circle-outline" size={20} color="#27ae60" style={styles.infoIcon} />
              <Text style={styles.infoText}>
                Aucun profil trouvé. Veuillez remplir vos informations ci-dessous.
              </Text>
            </View>
          )}

          <Animated.View style={{ opacity: sectionFadeAnim }}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Informations Personnelles</Text>

              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#27ae60" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.disabledInput]}
                  value={email}
                  editable={false}
                  placeholder="Email (non modifiable)"
                  placeholderTextColor="#7f8c8d"
                  accessibilityLabel="Email (non modifiable)"
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="person-circle-outline" size={20} color="#27ae60" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, errors.firstName && styles.inputError]}
                  value={firstName}
                  onChangeText={handleFieldChange(setFirstName)}
                  placeholder="Prénom"
                  placeholderTextColor="#7f8c8d"
                  accessibilityLabel="Prénom"
                />
                {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#27ae60" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, errors.lastName && styles.inputError]}
                  value={lastName}
                  onChangeText={handleFieldChange(setLastName)}
                  placeholder="Nom"
                  placeholderTextColor="#7f8c8d"
                  accessibilityLabel="Nom"
                />
                {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="calendar-outline" size={20} color="#27ae60" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, errors.age && styles.inputError]}
                  value={age}
                  onChangeText={(text) => handleFieldChange(setAge)(text.replace(/[^0-9]/g, ''))}
                  keyboardType="numeric"
                  placeholder="Âge"
                  placeholderTextColor="#7f8c8d"
                  accessibilityLabel="Âge"
                />
                {errors.age && <Text style={styles.errorText}>{errors.age}</Text>}
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="male-female-outline" size={20} color="#27ae60" style={styles.inputIcon} />
                <View style={[styles.input, styles.pickerContainer, errors.gender && styles.inputError]}>
                  <Picker
                    selectedValue={gender}
                    onValueChange={handleFieldChange(setGender)}
                    style={styles.picker}
                    accessibilityLabel="Sexe"
                  >
                    <Picker.Item label="Sélectionnez votre sexe" value="" enabled={false} />
                    <Picker.Item label="Homme" value="Homme" />
                    <Picker.Item label="Femme" value="Femme" />
                    <Picker.Item label="Autre" value="Autre" />
                  </Picker>
                </View>
                {errors.gender && <Text style={styles.errorText}>{errors.gender}</Text>}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Informations Médicales</Text>

              <View style={styles.inputContainer}>
                <Ionicons name="heart-outline" size={20} color="#27ae60" style={styles.inputIcon} />
                <View style={[styles.input, styles.pickerContainer]}>
                  <Picker
                    selectedValue={condition}
                    onValueChange={handleFieldChange(setCondition)}
                    style={styles.picker}
                    accessibilityLabel="Maladie"
                  >
                    <Picker.Item label="Sélectionnez une maladie" value="" enabled={false} />
                    <Picker.Item label="Aucune" value="Aucune" />
                    <Picker.Item label="Diabète" value="Diabète" />
                    <Picker.Item label="Hypertension" value="Hypertension" />
                    <Picker.Item label="Asthme" value="Asthme" />
                    <Picker.Item label="Autre" value="Autre" />
                  </Picker>
                </View>
              </View>
            </View>
          </Animated.View>

          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <Pressable onPress={handleButtonPress} disabled={loading}>
              <LinearGradient
                colors={['#27ae60', '#2ecc71']}
                style={[styles.saveButton, loading && styles.buttonDisabled]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading ? (
                  <Ionicons name="refresh" size={20} color="#fff" style={styles.buttonIcon} />
                ) : (
                  <Ionicons name="checkmark-circle-outline" size={20} color="#fff" style={styles.buttonIcon} />
                )}
                <Text style={styles.buttonText}>{loading ? 'Enregistrement...' : 'Enregistrer'}</Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff', // Fond blanc comme dans l'interface fournie
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 10,
    borderRadius: 25,
    backgroundColor: '#27ae60', // Vert pour le bouton de retour
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a3c34', // Vert foncé pour le titre
    flex: 1,
    textAlign: 'center',
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingVertical: 25,
  },
  infoMessage: {
    flexDirection: 'row',
    backgroundColor: '#e8f5e9',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#c8e6c9',
  },
  infoIcon: {
    marginRight: 10,
  },
  infoText: {
    fontSize: 16,
    color: '#27ae60',
    flex: 1,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a3c34',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 15,
    paddingLeft: 45,
    fontSize: 16,
    backgroundColor: '#f5f5f5', // Fond gris clair comme dans l'interface fournie
    color: '#333',
  },
  disabledInput: {
    backgroundColor: '#e8f5e9',
    color: '#7f8c8d',
  },
  inputError: {
    borderColor: '#e74c3c',
    borderWidth: 2,
  },
  inputIcon: {
    position: 'absolute',
    left: 15,
    top: 18,
    zIndex: 1,
  },
  pickerContainer: {
    padding: 0,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
  },
  picker: {
    height: Platform.OS === 'ios' ? 150 : 50,
    width: '100%',
    color: '#333',
  },
  errorText: {
    fontSize: 14,
    color: '#e74c3c',
    marginTop: 5,
    marginLeft: 15,
  },
  saveButton: {
    flexDirection: 'row',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});