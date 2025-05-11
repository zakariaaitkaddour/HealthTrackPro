import { Stack } from "expo-router";
import { AuthProvider } from "../context/AuthContext";
import { Redirect, useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";

// A separate component to handle navigation logic
function AppNavigator() {
  const { userToken, userRole, isLoading } = useAuth(); // Now safe to use inside AuthProvider
  const router = useRouter();

  if (isLoading) {
    return null; // Or a loading component
  }

  // Redirect logic
  if (!userToken) {
    return <Redirect href="/login" />;
  }

  if (userToken && userRole === "PATIENT") {
    return <Redirect href="/PatientDashboard" />;
  }

  if (userToken && userRole === "DOCTOR") {
    return <Redirect href="/DoctorDashboard" />;
  }

  return <Redirect href="/login" />;
}

export default function Layout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Unauthenticated Routes */}
        <Stack.Screen name="login" />
        <Stack.Screen name="RegisterScreen" />
        <Stack.Screen name="ForgotPassword" />
        <Stack.Screen name="index" redirect={true} />

        {/* Patient Routes */}
        <Stack.Screen name="PatientDashboard" />
        <Stack.Screen name="ReportScreen" />
        <Stack.Screen name="ScheduleScreen" />
        <Stack.Screen name="NotificationsScreen" />
        <Stack.Screen name="ChatScreen" />
        <Stack.Screen name="HealthTrackingScreen" />
        <Stack.Screen name="MedicationScreen" />
        <Stack.Screen name="RemindersScreen" />
        <Stack.Screen name="ActivityLogScreen" />
        <Stack.Screen name="ProfileScreen" />

        {/* Doctor Routes */}
        <Stack.Screen name="DoctorDashboard" />
        {/* Doctor shares some routes with Patient */}
        {/* Add any Doctor-specific routes if needed */}
      </Stack>

      {/* Render the navigation logic inside AuthProvider */}
      <AppNavigator />
    </AuthProvider>
  );
}