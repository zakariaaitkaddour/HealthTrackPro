import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, FlatList, Alert } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ChatScreen() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchMessages = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const email = await AsyncStorage.getItem('userEmail');
      const response = await axios.get('http://10.0.2.2:8080/api/messages', {
        params: { patientId: email, doctorId: 'doctor@example.com' }, // Remplacez par l’ID du médecin
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(response.data);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les messages.');
      console.error(error);
    }
  };

  const sendMessage = async () => {
    if (!message) {
      Alert.alert('Erreur', 'Veuillez entrer un message.');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const email = await AsyncStorage.getItem('userEmail');
      await axios.post(
        'http://10.0.2.2:8080/api/messages',
        { senderId: email, receiverId: 'doctor@example.com', message },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Succès', 'Message envoyé !');
      setMessage('');
      fetchMessages();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d’envoyer le message.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chat avec le médecin</Text>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={[styles.messageItem, item.senderId === email ? styles.sentMessage : styles.receivedMessage]}>
            <Text style={styles.messageText}>{item.message}</Text>
            <Text style={styles.messageTime}>{new Date(item.timestamp).toLocaleTimeString()}</Text>
          </View>
        )}
        style={styles.messageList}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.messageInput}
          value={message}
          onChangeText={setMessage}
          placeholder="Tapez votre message..."
        />
        <Pressable
          style={[styles.sendButton, loading && styles.buttonDisabled]}
          onPress={sendMessage}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Envoyer</Text>
        </Pressable>
      </View>
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
  messageList: {
    flex: 1,
    marginBottom: 20,
  },
  messageItem: {
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    maxWidth: '80%',
  },
  sentMessage: {
    backgroundColor: '#4a90e2',
    alignSelf: 'flex-end',
  },
  receivedMessage: {
    backgroundColor: '#e6f0fa',
    alignSelf: 'flex-start',
  },
  messageText: {
    color: '#fff',
    fontSize: 16,
  },
  messageTime: {
    fontSize: 12,
    color: '#fff',
    textAlign: 'right',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  sendButton: {
    backgroundColor: '#4a90e2',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    marginLeft: 10,
  },
  buttonDisabled: {
    backgroundColor: '#a0a0a0',
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});