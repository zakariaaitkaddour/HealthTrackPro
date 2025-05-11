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
  Dimensions,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LineChart } from 'react-native-chart-kit';

// Types for medical data
interface MedicalData {
  id: number;
  recordedAt: string;
  bloodSugar: number;
  systolicBloodPressure: number;
  diastolicBloodPressure: number;
  heartRate: number;
  user: { id: number; email: string; role: string };
}

// Health status evaluation
const evaluateStatus = (
  bloodSugar: number,
  systolic: number,
  diastolic: number,
  heartRate: number
) => {
  let status = 'normal';
  let message = 'Tous les paramètres sont normaux';

  if (bloodSugar > 180 || bloodSugar < 70) {
    status = 'warning';
    message = 'Glycémie hors plage normale';
  }

  if (systolic > 140 || diastolic > 90 || systolic < 90 || diastolic < 60) {
    status = 'warning';
    message = 'Pression artérielle hors plage normale';
  }

  if (heartRate > 100 || heartRate < 60) {
    status = 'warning';
    message = 'Rythme cardiaque hors plage normale';
  }

  if (
    (bloodSugar > 250 || bloodSugar < 50) ||
    (systolic > 180 || diastolic > 120) ||
    (heartRate > 120 || heartRate < 40)
  ) {
    status = 'danger';
    message = 'Paramètres critiques détectés';
  }

  return { status, message };
};

const HealthTrackingScreen: React.FC = () => {
  const { userId, userRole, logout } = useAuth();
  const [medicalData, setMedicalData] = useState<MedicalData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [bloodSugar, setBloodSugar] = useState<string>('');
  const [systolicBloodPressure, setSystolicBloodPressure] = useState<string>('');
  const [diastolicBloodPressure, setDiastolicBloodPressure] = useState<string>('');
  const [heartRate, setHeartRate] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'list' | 'chart'>('list');
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Load medical data on mount
  useEffect(() => {
    if (!userId || userRole !== 'PATIENT') {
      Alert.alert('Erreur', 'Accès réservé aux patients authentifiés', [
        { text: 'OK', onPress: () => logout() },
      ]);
      return;
    }
    fetchMedicalData();
  }, [userId, userRole, logout]);

  // Fetch medical data for the patient
  const fetchMedicalData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!userId) throw new Error('Utilisateur non identifié');
      const token = await AsyncStorage.getItem('userToken');
      if (!token) throw new Error('Token non trouvé');

      const response = await api.get(`/api/medical-data/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Sort data by date (newest first)
      const sortedData = [...(response.data || [])].sort(
        (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
      );

      setMedicalData(sortedData);
    } catch (err: any) {
      console.error('Error fetching medical data:', err.message, err.response?.data);
      setError('Erreur lors de la récupération des données médicales : ' + (err.message || 'Erreur inconnue'));
      if (err.response?.status === 403) {
        Alert.alert('Erreur', 'Accès interdit. Veuillez vous reconnecter.', [
          { text: 'OK', onPress: () => logout() },
        ]);
      } else {
        Alert.alert('Erreur', err.message || 'Erreur lors de la récupération des données médicales');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle pull-to-refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchMedicalData();
  };

  // Add new medical data
  const handleAddMedicalData = async () => {
    if (
      !bloodSugar.trim() ||
      !systolicBloodPressure.trim() ||
      !diastolicBloodPressure.trim() ||
      !heartRate.trim()
    ) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs.');
      return;
    }

    const bloodSugarValue = parseFloat(bloodSugar);
    const systolicBPValue = parseInt(systolicBloodPressure);
    const diastolicBPValue = parseInt(diastolicBloodPressure);
    const heartRateValue = parseInt(heartRate);

    if (
      isNaN(bloodSugarValue) ||
      isNaN(systolicBPValue) ||
      isNaN(diastolicBPValue) ||
      isNaN(heartRateValue) ||
      bloodSugarValue <= 0 ||
      systolicBPValue <= 0 ||
      diastolicBPValue <= 0 ||
      heartRateValue <= 0
    ) {
      Alert.alert('Erreur', 'Veuillez entrer des valeurs numériques positives valides.');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) throw new Error('Token non trouvé');

      const response = await api.post(`/api/medical-data/user/${userId}`, {
        bloodSugar: bloodSugarValue,
        systolicBloodPressure: systolicBPValue,
        diastolicBloodPressure: diastolicBPValue,
        heartRate: heartRateValue,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Succès', 'Données médicales ajoutées avec succès');

      // Check if any values are outside normal ranges
      const { status, message } = evaluateStatus(
        bloodSugarValue,
        systolicBPValue,
        diastolicBPValue,
        heartRateValue
      );

      if (status !== 'normal') {
        setTimeout(() => {
          Alert.alert(
            status === 'danger' ? 'Attention!' : 'Information',
            message,
            [{ text: 'Compris' }]
          );
        }, 500);
      }

      setBloodSugar('');
      setSystolicBloodPressure('');
      setDiastolicBloodPressure('');
      setHeartRate('');
      setModalVisible(false);
      fetchMedicalData();
    } catch (err: any) {
      console.error('Add Medical Data - Error:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      if (err.response?.status === 403) {
        Alert.alert('Erreur', 'Accès interdit. Veuillez vous reconnecter.', [
          { text: 'OK', onPress: () => logout() },
        ]);
      } else {
        Alert.alert('Erreur', err.response?.data?.message || err.message || 'Échec de l\'ajout des données médicales');
      }
    }
  };

  // Get status color based on value
  const getStatusColor = (value: number, type: 'bloodSugar' | 'systolic' | 'diastolic' | 'heartRate') => {
    switch (type) {
      case 'bloodSugar':
        if (value > 180 || value < 70) return '#FF9800';
        if (value > 250 || value < 50) return '#F44336';
        return '#4CAF50';
      case 'systolic':
        if (value > 140 || value < 90) return '#FF9800';
        if (value > 180 || value < 70) return '#F44336';
        return '#4CAF50';
      case 'diastolic':
        if (value > 90 || value < 60) return '#FF9800';
        if (value > 120 || value < 40) return '#F44336';
        return '#4CAF50';
      case 'heartRate':
        if (value > 100 || value < 60) return '#FF9800';
        if (value > 120 || value < 40) return '#F44336';
        return '#4CAF50';
      default:
        return '#4CAF50';
    }
  };

  // Render a medical data entry in the list
  const renderMedicalData = ({ item }: { item: MedicalData }) => {
    const date = new Date(item.recordedAt);
    const formattedDate = date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const formattedTime = date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const { status } = evaluateStatus(
      item.bloodSugar,
      item.systolicBloodPressure,
      item.diastolicBloodPressure,
      item.heartRate
    );

    const cardBorderColor =
      status === 'danger' ? '#F44336' :
      status === 'warning' ? '#FF9800' :
      '#E0E0E0';

    return (
      <View style={[styles.dataCard, { borderLeftWidth: 5, borderLeftColor: cardBorderColor }]}>
        <View style={styles.dataCardHeader}>
          <Text style={styles.dataCardDate}>{formattedDate}</Text>
          <Text style={styles.dataCardTime}>{formattedTime}</Text>
        </View>

        <View style={styles.dataRow}>
          <View style={styles.dataIconContainer}>
            <FontAwesome5 name="tint" size={18} color="#E53935" />
          </View>
          <Text style={styles.dataLabel}>Glycémie:</Text>
          <Text style={[
            styles.dataValue,
            { color: getStatusColor(item.bloodSugar, 'bloodSugar') }
          ]}>
            {item.bloodSugar} mg/dL
          </Text>
        </View>

        <View style={styles.dataRow}>
          <View style={styles.dataIconContainer}>
            <FontAwesome5 name="heartbeat" size={18} color="#1E88E5" />
          </View>
          <Text style={styles.dataLabel}>Pression artérielle:</Text>
          <Text>
            <Text style={[
              styles.dataValue,
              { color: getStatusColor(item.systolicBloodPressure, 'systolic') }
            ]}>
              {item.systolicBloodPressure}
            </Text>
            <Text style={styles.dataValue}>/</Text>
            <Text style={[
              styles.dataValue,
              { color: getStatusColor(item.diastolicBloodPressure, 'diastolic') }
            ]}>
              {item.diastolicBloodPressure}
            </Text>
            <Text style={styles.dataValue}> mmHg</Text>
          </Text>
        </View>

        <View style={styles.dataRow}>
          <View style={styles.dataIconContainer}>
            <MaterialCommunityIcons name="heart-pulse" size={18} color="#7B1FA2" />
          </View>
          <Text style={styles.dataLabel}>Rythme cardiaque:</Text>
          <Text style={[
            styles.dataValue,
            { color: getStatusColor(item.heartRate, 'heartRate') }
          ]}>
            {item.heartRate} bpm
          </Text>
        </View>
      </View>
    );
  };

  // Prepare chart data
  const prepareChartData = () => {
    if (medicalData.length === 0) return null;

    // Get the last 7 entries (or fewer if not available)
    const chartData = [...medicalData]
      .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
      .slice(-7);

    return {
      labels: chartData.map(item => {
        const date = new Date(item.recordedAt);
        return `${date.getDate()}/${date.getMonth() + 1}`;
      }),
      datasets: [
        {
          data: chartData.map(item => item.bloodSugar),
          color: () => '#E53935', // red
          strokeWidth: 2,
        },
        {
          data: chartData.map(item => item.systolicBloodPressure),
          color: () => '#1E88E5', // blue
          strokeWidth: 2,
        },
        {
          data: chartData.map(item => item.heartRate),
          color: () => '#7B1FA2', // purple
          strokeWidth: 2,
        },
      ],
      legend: ['Glycémie', 'Pression Sys.', 'Rythme Card.'],
    };
  };

  // Render the chart view
  const renderChartView = () => {
    const chartData = prepareChartData();

    if (!chartData) {
      return (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="chart-line" size={60} color="#BDBDBD" />
          <Text style={styles.emptyText}>Pas assez de données pour afficher un graphique</Text>
        </View>
      );
    }

    return (
      <ScrollView contentContainerStyle={styles.chartContainer}>
        <Text style={styles.chartTitle}>Évolution sur les 7 derniers relevés</Text>

        <View style={styles.chartCard}>
          <Text style={styles.chartSubtitle}>Glycémie (mg/dL)</Text>
          <LineChart
            data={{
              labels: chartData.labels,
              datasets: [chartData.datasets[0]],
              legend: [chartData.legend[0]],
            }}
            width={Dimensions.get('window').width - 40}
            height={180}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(229, 57, 53, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '6',
                strokeWidth: '2',
                stroke: '#E53935',
              },
            }}
            bezier
            style={styles.chart}
          />
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.chartSubtitle}>Pression Systolique (mmHg)</Text>
          <LineChart
            data={{
              labels: chartData.labels,
              datasets: [chartData.datasets[1]],
              legend: [chartData.legend[1]],
            }}
            width={Dimensions.get('window').width - 40}
            height={180}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(30, 136, 229, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '6',
                strokeWidth: '2',
                stroke: '#1E88E5',
              },
            }}
            bezier
            style={styles.chart}
          />
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.chartSubtitle}>Rythme Cardiaque (bpm)</Text>
          <LineChart
            data={{
              labels: chartData.labels,
              datasets: [chartData.datasets[2]],
              legend: [chartData.legend[2]],
            }}
            width={Dimensions.get('window').width - 40}
            height={180}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(123, 31, 162, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '6',
                strokeWidth: '2',
                stroke: '#7B1FA2',
              },
            }}
            bezier
            style={styles.chart}
          />
        </View>
      </ScrollView>
    );
  };

  // Get latest health status
  const getLatestHealthStatus = () => {
    if (medicalData.length === 0) return null;

    const latestData = medicalData[0]; // Already sorted newest first

    return evaluateStatus(
      latestData.bloodSugar,
      latestData.systolicBloodPressure,
      latestData.diastolicBloodPressure,
      latestData.heartRate
    );
  };

  // Render health status card
  const renderHealthStatusCard = () => {
    const status = getLatestHealthStatus();

    if (!status) return null;

    const statusColors = {
      normal: '#4CAF50',
      warning: '#FF9800',
      danger: '#F44336',
    };

    const statusIcons = {
      normal: 'checkmark-circle',
      warning: 'alert-circle',
      danger: 'warning',
    };

    return (
      <View style={[
        styles.statusCard,
        { borderColor: statusColors[status.status as keyof typeof statusColors] }
      ]}>
        <View style={styles.statusIconContainer}>
          <Ionicons
            name={statusIcons[status.status as keyof typeof statusIcons]}
            size={24}
            color={statusColors[status.status as keyof typeof statusColors]}
          />
        </View>
        <View style={styles.statusTextContainer}>
          <Text style={styles.statusTitle}>
            {status.status === 'normal' ? 'État de santé normal' :
             status.status === 'warning' ? 'Attention' : 'Alerte'}
          </Text>
          <Text style={styles.statusMessage}>{status.message}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#1565C0" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Suivi de Santé</Text>
          <TouchableOpacity onPress={fetchMedicalData}>
            <Ionicons name="refresh-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Health Status Card */}
        {renderHealthStatusCard()}

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'list' && styles.activeTab]}
            onPress={() => setActiveTab('list')}
          >
            <Ionicons
              name="list"
              size={20}
              color={activeTab === 'list' ? '#1976D2' : '#757575'}
            />
            <Text style={[styles.tabText, activeTab === 'list' && styles.activeTabText]}>
              Historique
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'chart' && styles.activeTab]}
            onPress={() => setActiveTab('chart')}
          >
            <Ionicons
              name="bar-chart"
              size={20}
              color={activeTab === 'chart' ? '#1976D2' : '#757575'}
            />
            <Text style={[styles.tabText, activeTab === 'chart' && styles.activeTabText]}>
              Graphiques
            </Text>
          </TouchableOpacity>
        </View>

        {/* Add Button */}
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>

        {/* Main Content */}
        {loading && !refreshing ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#1976D2" />
            <Text style={styles.loadingText}>Chargement des données...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={60} color="#F44336" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchMedicalData}>
              <Text style={styles.retryButtonText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        ) : medicalData.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={60} color="#BDBDBD" />
            <Text style={styles.emptyText}>Aucune donnée médicale trouvée</Text>
            <Text style={styles.emptySubText}>
              Ajoutez vos premières données en cliquant sur le bouton +
            </Text>
          </View>
        ) : activeTab === 'list' ? (
          <FlatList
            data={medicalData}
            renderItem={renderMedicalData}
            keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
            contentContainerStyle={styles.list}
            onRefresh={handleRefresh}
            refreshing={refreshing}
          />
        ) : (
          renderChartView()
        )}

        {/* Modal for adding medical data */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Ajouter des Données Médicales</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScrollView}>
                {/* Blood Sugar Field */}
                <View style={styles.inputContainer}>
                  <View style={styles.inputIconContainer}>
                    <FontAwesome5 name="tint" size={18} color="#E53935" />
                  </View>
                  <View style={styles.inputWrapper}>
                    <Text style={styles.label}>Glycémie</Text>
                    <TextInput
                      style={styles.input}
                      value={bloodSugar}
                      onChangeText={setBloodSugar}
                      placeholder="Ex: 120.5"
                      placeholderTextColor="#999"
                      keyboardType="numeric"
                    />
                    <Text style={styles.inputUnit}>mg/dL</Text>
                  </View>
                </View>

                {/* Systolic Blood Pressure Field */}
                <View style={styles.inputContainer}>
                  <View style={styles.inputIconContainer}>
                    <FontAwesome5 name="heartbeat" size={18} color="#1E88E5" />
                  </View>
                  <View style={styles.inputWrapper}>
                    <Text style={styles.label}>Pression Systolique</Text>
                    <TextInput
                      style={styles.input}
                      value={systolicBloodPressure}
                      onChangeText={setSystolicBloodPressure}
                      placeholder="Ex: 130"
                      placeholderTextColor="#999"
                      keyboardType="numeric"
                    />
                    <Text style={styles.inputUnit}>mmHg</Text>
                  </View>
                </View>

                {/* Diastolic Blood Pressure Field */}
                <View style={styles.inputContainer}>
                  <View style={styles.inputIconContainer}>
                    <FontAwesome5 name="heartbeat" size={18} color="#1E88E5" />
                  </View>
                  <View style={styles.inputWrapper}>
                    <Text style={styles.label}>Pression Diastolique</Text>
                    <TextInput
                      style={styles.input}
                      value={diastolicBloodPressure}
                      onChangeText={setDiastolicBloodPressure}
                      placeholder="Ex: 85"
                      placeholderTextColor="#999"
                      keyboardType="numeric"
                    />
                    <Text style={styles.inputUnit}>mmHg</Text>
                  </View>
                </View>

                {/* Heart Rate Field */}
                <View style={styles.inputContainer}>
                  <View style={styles.inputIconContainer}>
                    <MaterialCommunityIcons name="heart-pulse" size={18} color="#7B1FA2" />
                  </View>
                  <View style={styles.inputWrapper}>
                    <Text style={styles.label}>Rythme Cardiaque</Text>
                    <TextInput
                      style={styles.input}
                      value={heartRate}
                      onChangeText={setHeartRate}
                      placeholder="Ex: 72"
                      placeholderTextColor="#999"
                      keyboardType="numeric"
                    />
                    <Text style={styles.inputUnit}>bpm</Text>
                  </View>
                </View>

                {/* Info text */}
                <Text style={styles.infoText}>
                  Entrez vos valeurs mesurées pour suivre votre état de santé au fil du temps.
                </Text>

                {/* Modal Buttons */}
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.modalButtonText}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.submitButton]}
                    onPress={handleAddMedicalData}
                  >
                    <Text style={styles.modalButtonText}>Ajouter</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
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
    backgroundColor: '#1976D2',
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    backgroundColor: '#1976D2',
    padding: 20,
    paddingTop: 10,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    margin: 15,
    marginTop: 0,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    elevation: 2,
  },
  statusIconContainer: {
    marginRight: 15,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
    color: '#333',
  },
  statusMessage: {
    fontSize: 14,
    color: '#666',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginBottom: 10,
    borderRadius: 12,
    elevation: 2,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: '#E3F2FD',
  },
  tabText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#757575',
  },
  activeTabText: {
    color: '#1976D2',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#00BFA6',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    zIndex: 10,
  },
  list: {
    padding: 15,
    paddingTop: 5,
  },
  dataCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
  },
  dataCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dataCardDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  dataCardTime: {
    fontSize: 14,
    color: '#757575',
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dataIconContainer: {
    width: 30,
    alignItems: 'center',
    marginRight: 10,
  },
  dataLabel: {
    fontSize: 14,
    color: '#757575',
    width: 140,
  },
  dataValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  chartContainer: {
    padding: 15,
    paddingBottom: 30,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    elevation: 2,
  },
  chartSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
    marginTop: 15,
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
  },
  emptyText: {
    fontSize: 18,
    color: '#757575',
    textAlign: 'center',
    marginTop: 15,
  },
  emptySubText: {
    fontSize: 14,
    color: '#9E9E9E',
    textAlign: 'center',
    marginTop: 10,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#757575',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
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
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  modalScrollView: {
    padding: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  inputIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  inputWrapper: {
    flex: 1,
    position: 'relative',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
    paddingRight: 50, // Space for the unit
  },
  inputUnit: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    fontSize: 16,
    color: '#757575',
  },
  infoText: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
  },
  submitButton: {
    backgroundColor: '#1976D2',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
});

export default HealthTrackingScreen;