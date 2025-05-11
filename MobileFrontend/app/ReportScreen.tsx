import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from 'react-native-vector-icons';

const ReportScreen = () => {
  const { userId, userRole, logout } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (userRole !== 'PATIENT' && userRole !== 'DOCTOR') {
      Alert.alert('Erreur', 'Accès réservé aux utilisateurs authentifiés');
      logout();
      return;
    }
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      if (!userId) {
        throw new Error('Utilisateur non identifié');
      }
      const response = await api.get(`/api/medical-records/user/${userId}`);
      setRecords(response.data);
    } catch (err) {
      setError('Erreur lors de la récupération des dossiers médicaux');
      Alert.alert('Erreur', err.message || 'Erreur lors de la récupération des dossiers médicaux');
    } finally {
      setLoading(false);
    }
  };

  const renderRecord = ({ item }) => (
    <View style={styles.recordCard}>
      <Text style={styles.recordDetail}>Symptômes: {item.symptoms.join(', ')}</Text>
      <Text style={styles.recordDetail}>Antécédents: {item.diseaseHistory.join(', ')}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mes Rapports</Text>
        <TouchableOpacity onPress={fetchRecords}>
          <Ionicons name="refresh-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#2196F3" />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : records.length === 0 ? (
        <Text style={styles.emptyText}>Aucun dossier médical trouvé</Text>
      ) : (
        <FlatList
          data={records}
          renderItem={renderRecord}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
        />
      )}
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
  list: {
    paddingBottom: 20,
  },
  recordCard: {
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
  recordDetail: {
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
});

export default ReportScreen;