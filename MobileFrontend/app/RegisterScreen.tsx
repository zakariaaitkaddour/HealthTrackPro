"use client"

import React, { useState, useEffect } from "react"
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Animated,
  Keyboard,
  TouchableOpacity,
} from "react-native"
import axios from "axios"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useRouter } from "expo-router"
import { Ionicons, FontAwesome5 } from "react-native-vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import * as Haptics from "expo-haptics"
import { StatusBar } from "expo-status-bar"
import Svg, { Path, Circle } from "react-native-svg"

export default function RegisterScreen() {
  const [role, setRole] = useState("patient") // patient par défaut
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [passwordVisible, setPasswordVisible] = useState(false)
  const router = useRouter()

  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0]
  const slideAnim = useState(new Animated.Value(50))[0]

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  const validateForm = () => {
    const newErrors = {}
    if (!role) newErrors.role = "Veuillez sélectionner un rôle"
    if (!name) newErrors.name = "Le nom est requis"
    if (!email) newErrors.email = "L’email est requis"
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Email invalide"
    if (!phoneNumber) newErrors.phoneNumber = "Le numéro de téléphone est requis"
    else if (!/^\d{10}$/.test(phoneNumber)) newErrors.phoneNumber = "Numéro de téléphone invalide (10 chiffres)"
    if (!password) newErrors.password = "Le mot de passe est requis"
    else if (password.length < 6) newErrors.password = "Le mot de passe doit contenir au moins 6 caractères"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleRegister = async () => {
    Keyboard.dismiss()

    if (!validateForm()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      Alert.alert("Erreur", "Veuillez corriger les erreurs dans le formulaire.")
      return
    }

    setLoading(true)
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

      const response = await axios.post("http://10.0.2.2:8080/api/auth/signup", {
        email,
        password,
        role: role.toUpperCase(), // Envoyer le rôle en majuscules (PATIENT ou DOCTOR)
        name,
        phoneNumber,
      })

      // Store the token and role
      await AsyncStorage.setItem("userToken", response.data.jwt)
      await AsyncStorage.setItem("userRole", response.data.role)

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)

      // Navigate to Login after successful registration
      Alert.alert("Succès", "Inscription réussie ! Veuillez vous connecter.", [
        { text: "OK", onPress: () => router.replace("/Login") },
      ])
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      console.error("Register error:", error.response?.data || error.message)

      let errorMessage = "Échec de l’inscription. Veuillez réessayer."
      if (error.response) {
        if (error.response.status === 500) {
          errorMessage = "Erreur serveur. Veuillez réessayer plus tard."
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message
        }
      } else if (error.request) {
        errorMessage = "Impossible de se connecter au serveur. Vérifiez votre connexion."
      }

      Alert.alert("Erreur", errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const toggleRole = (newRole) => {
    Haptics.selectionAsync()
    setRole(newRole)
  }

  // SVG Icons for Patient and Doctor
  const PatientIcon = () => (
    <Svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <Path
        d="M10,20 Q15,10 20,20 Q25,30 30,20"
        stroke={role === "patient" ? "#fff" : "#2196F3"}
        strokeWidth="2"
        fill="none"
      />
    </Svg>
  )

  const DoctorIcon = () => (
    <Svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <Circle cx="20" cy="15" r="5" stroke={role === "doctor" ? "#fff" : "#00BFA6"} strokeWidth="2" fill="none" />
      <Path
        d="M10,25 C10,20 15,18 20,18 C25,18 30,20 30,25"
        stroke={role === "doctor" ? "#fff" : "#00BFA6"}
        strokeWidth="2"
        fill="none"
      />
      <Path
        d="M20,25 L20,35 M15,30 L25,30"
        stroke={role === "doctor" ? "#fff" : "#00BFA6"}
        strokeWidth="2"
        fill="none"
      />
    </Svg>
  )

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Decorative circles */}
      <View style={styles.decorativeCircleTopRight}>
        <LinearGradient
          colors={["#00BFA6", "#00BFA680"]}
          style={styles.circleGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </View>

      <View style={styles.decorativeCircleBottomLeft}>
        <LinearGradient
          colors={["#2196F3", "#2196F380"]}
          style={styles.circleGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Animated.View style={[styles.formCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.roleTabsContainer}>
            <TouchableOpacity
              style={[
                styles.roleTab,
                role === "patient" && styles.activeRoleTab,
                { backgroundColor: role === "patient" ? "#2196F3" : "#F5F7FA" },
              ]}
              onPress={() => toggleRole("patient")}
              activeOpacity={0.8}
            >
              <PatientIcon />
              <Text style={[styles.roleTabText, role === "patient" && styles.activeRoleTabText]}>PATIENT</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.roleTab,
                role === "doctor" && styles.activeRoleTab,
                { backgroundColor: role === "doctor" ? "#00BFA6" : "#F5F7FA" },
              ]}
              onPress={() => toggleRole("doctor")}
              activeOpacity={0.8}
            >
              <DoctorIcon />
              <Text
                style={[
                  styles.roleTabText,
                  role === "doctor" && styles.activeRoleTabText,
                  { color: role === "doctor" ? "#fff" : "#00BFA6" },
                ]}
              >
                DOCTEUR
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>Inscription</Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              value={name}
              onChangeText={setName}
              placeholder="Nom"
              placeholderTextColor="#A0A0A0"
              autoCapitalize="words"
              accessibilityLabel="Nom"
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor="#A0A0A0"
              keyboardType="email-address"
              autoCapitalize="none"
              accessibilityLabel="Email"
            />
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, errors.phoneNumber && styles.inputError]}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="Numéro de téléphone"
              placeholderTextColor="#A0A0A0"
              keyboardType="phone-pad"
              accessibilityLabel="Numéro de téléphone"
            />
            {errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, errors.password && styles.inputError]}
              value={password}
              onChangeText={setPassword}
              placeholder="Mot de passe"
              placeholderTextColor="#A0A0A0"
              secureTextEntry={!passwordVisible}
              accessibilityLabel="Mot de passe"
            />
            <TouchableOpacity
              onPress={() => setPasswordVisible(!passwordVisible)}
              style={styles.visibilityIcon}
              accessibilityLabel={passwordVisible ? "Cacher le mot de passe" : "Afficher le mot de passe"}
            >
              <Ionicons name={passwordVisible ? "eye-off-outline" : "eye-outline"} size={20} color="#A0A0A0" />
            </TouchableOpacity>
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
          </View>

          <TouchableOpacity style={styles.forgotPasswordContainer} onPress={() => {}}>
            <Text style={[styles.forgotPasswordText, { color: role === "patient" ? "#2196F3" : "#00BFA6" }]}>
              Mot de passe oublié?
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleRegister}
            disabled={loading}
            style={[
              styles.button,
              role === "patient" ? styles.patientButton : styles.doctorButton,
              loading && styles.buttonDisabled,
            ]}
            accessibilityLabel="S'inscrire"
            accessibilityHint="Créer un nouveau compte"
            accessibilityState={{ disabled: loading }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.buttonText}>S'inscrire</Text>
            )}
          </TouchableOpacity>

          <View style={styles.socialLoginContainer}>
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ou</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity style={styles.socialButton}>
              <FontAwesome5 name="facebook" size={20} color="#3b5998" />
              <Text style={styles.socialButtonText}>S'inscrire avec Facebook</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.registerLinkContainer}>
            <Text style={styles.registerText}>Déjà un compte ? </Text>
            <TouchableOpacity
              onPress={() => router.replace("/Login")}
              accessibilityLabel="Se connecter"
              accessibilityHint="Se connecter à un compte existant"
            >
              <Text style={[styles.registerLink, { color: role === "patient" ? "#2196F3" : "#00BFA6" }]}>
                Se connecter
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
    paddingTop: 40,
    paddingBottom: 40,
  },
  decorativeCircleTopRight: {
    position: "absolute",
    top: -100,
    right: -100,
    width: 200,
    height: 200,
    borderRadius: 100,
    overflow: "hidden",
    zIndex: -1,
  },
  decorativeCircleBottomLeft: {
    position: "absolute",
    bottom: -100,
    left: -100,
    width: 200,
    height: 200,
    borderRadius: 100,
    overflow: "hidden",
    zIndex: -1,
  },
  circleGradient: {
    width: "100%",
    height: "100%",
    borderRadius: 100,
  },
  formCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  roleTabsContainer: {
    flexDirection: "row",
    marginBottom: 25,
    borderRadius: 15,
    overflow: "hidden",
    backgroundColor: "#F5F7FA",
    padding: 5,
  },
  roleTab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderRadius: 10,
  },
  activeRoleTab: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  roleTabText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "700",
    color: "#2196F3",
  },
  activeRoleTabText: {
    color: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333",
    textAlign: "center",
    marginBottom: 25,
  },
  inputContainer: {
    marginBottom: 15,
    position: "relative",
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 30,
    padding: 15,
    paddingLeft: 20,
    fontSize: 16,
    backgroundColor: "#fff",
    color: "#333",
    height: 55,
  },
  visibilityIcon: {
    position: "absolute",
    right: 15,
    top: 17,
    padding: 5,
  },
  inputError: {
    borderColor: "#dc3545",
    borderWidth: 2,
  },
  errorText: {
    fontSize: 14,
    color: "#dc3545",
    marginTop: 5,
    marginLeft: 15,
  },
  forgotPasswordContainer: {
    alignSelf: "flex-end",
    marginBottom: 20,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: "500",
  },
  button: {
    height: 55,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  patientButton: {
    backgroundColor: "#2196F3",
  },
  doctorButton: {
    backgroundColor: "#00BFA6",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  socialLoginContainer: {
    marginTop: 20,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E0E0E0",
  },
  dividerText: {
    paddingHorizontal: 10,
    color: "#A0A0A0",
    fontSize: 14,
  },
  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 55,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    backgroundColor: "#fff",
  },
  socialButtonText: {
    marginLeft: 10,
    fontSize: 16,
    color: "#333",
  },
  registerLinkContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 25,
  },
  registerText: {
    color: "#666",
    fontSize: 14,
  },
  registerLink: {
    fontSize: 14,
    fontWeight: "600",
  },
})