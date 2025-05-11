import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, FlatList, Alert } from 'react-native';
import PushNotification from 'react-native-push-notification';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RemindersScreen() {
  const [message, setMessage] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchReminders = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const email = await AsyncStorage.getItem('userEmail');
      const response = await axios.get('http://10.0.2.2:8080/api/reminders', {
        params: { patientId: email },
        headers: { Authorization: `Bearer ${token}` },
      });
      setReminders(response.data);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les rappels.');
      console.error(error);
    }
  };

  const addReminder = async () => {
    if (!message || !scheduledTime) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs.');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const email = await AsyncStorage.getItem('userEmail');
      await axios.post(
        'http://10.0.2.2:8080/api/reminders',
        { patientId: email, message, scheduledTime },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Succès', 'Rappel ajouté !');
      setMessage('');
      setScheduledTime('');
      fetchReminders();

      // Configurer une notification
      PushNotification.localNotificationSchedule({
        message: message,
        date: new Date(scheduledTime),
      });
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d’ajouter le rappel.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    PushNotification.configure({
      onNotification: function (notification) {
        console.log('NOTIFICATION:', notification);
      },
      requestPermissions: Platform.OS === 'ios',
    });
    fetchReminders();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rappels et notifications</Text>

      <Text style={styles.label}>Message</Text>
      <TextInput
        style={styles.input}
        value={message}
        onChangeText={setMessage}
        placeholder="Exemple : Prendre rendez-vous"
      />

      <Text style={styles.label}>Horaire (YYYY-MM-DD HH:mm)</Text>
      <TextInput
        style={styles.input}
        value={scheduledTime}
        onChangeText={setScheduledTime}
        placeholder="Exemple : 2025-03-21 08:00"
      />

      <Pressable
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={addReminder}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{loading ? 'Ajout...' : 'Ajouter'}</Text>
      </Pressable>

      <Text style={styles.subtitle}>Rappels</Text>
      <FlatList
        data={reminders}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.reminderItem}>
            <Text>{item.message} (le {new Date(item.scheduledTime).toLocaleString()})</Text>
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
  reminderItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
});