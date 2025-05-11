import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, FlatList, Alert } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ActivityLogScreen() {
  const [type, setType] = useState('');
  const [description, setDescription] = useState('');
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchActivities = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const email = await AsyncStorage.getItem('userEmail');
      const response = await axios.get('http://10.0.2.2:8080/api/activity-log', {
        params: { patientId: email },
        headers: { Authorization: `Bearer ${token}` },
      });
      setActivities(response.data);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les activités.');
      console.error(error);
    }
  };

  const addActivity = async () => {
    if (!type || !description) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs.');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const email = await AsyncStorage.getItem('userEmail');
      await axios.post(
        'http://10.0.2.2:8080/api/activity-log',
        { patientId: email, type, description },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Succès', 'Activité enregistrée !');
      setType('');
      setDescription('');
      fetchActivities();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d’enregistrer l’activité.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Journal d’activités</Text>

      <Text style={styles.label}>Type d’activité</Text>
      <TextInput
        style={styles.input}
        value={type}
        onChangeText={setType}
        placeholder="Exemple : Exercice, Repas, Sommeil"
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={styles.input}
        value={description}
        onChangeText={setDescription}
        placeholder="Exemple : 30 minutes de marche"
      />

      <Pressable
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={addActivity}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{loading ? 'Enregistrement...' : 'Enregistrer'}</Text>
      </Pressable>

      <Text style={styles.subtitle}>Historique</Text>
      <FlatList
        data={activities}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.activityItem}>
            <Text>{item.type} : {item.description} (le {new Date(item.date).toLocaleString()})</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4a90e2',
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#4a90e2',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#a0a0a0',
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  activityItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
});