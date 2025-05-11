import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function HomeScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleLogout = () => {
    // Logique de déconnexion (par exemple, supprimer les tokens si vous utilisez une authentification)
    router.push('/login');
  };

  const handleMenuPress = () => {
    // Logique pour ouvrir un menu latéral (vous pouvez ajouter un drawer ici plus tard)
    console.log('Menu pressed');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Barre de navigation */}
      <View style={styles.navbar}>
        {/* Icône de menu (hamburger) */}
        <TouchableOpacity onPress={handleMenuPress} style={styles.menuButton}>
          <Icon name="menu" size={28} color="#fff" />
        </TouchableOpacity>

        {/* Bannière de recherche */}
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
        </View>

        {/* Bouton Se déconnecter */}
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Icon name="logout" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Contenu de la page d'accueil */}
      <View style={styles.content}>
        <Text style={styles.title}>Bienvenue sur l'accueil !</Text>
        <Text style={styles.subtitle}>Vous êtes maintenant connecté.</Text>
        {/* Ajoutez ici d'autres éléments comme une liste, des cartes, etc. */}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f8',
  },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4a90e2', // Bleu pour la navbar
    paddingVertical: 10,
    paddingHorizontal: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  menuButton: {
    marginRight: 10,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 10,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  logoutButton: {
    marginLeft: 10,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
});