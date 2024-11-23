// Archivo: src/screens/HabitListScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { auth, firestore } from '../services/firebase';

export default function HabitListScreen({ navigation }) {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchHabits = async () => {
      setLoading(true);
      try {
        const user = auth.currentUser;
        if (!user) {
          throw new Error('Usuario no autenticado');
        }

        // Obtener la referencia a la colección de hábitos del usuario
        const habitsRef = collection(firestore, 'users', user.uid, 'habits');
        const querySnapshot = await getDocs(habitsRef);

        // Mapear los datos obtenidos a un formato adecuado
        const habitsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setHabits(habitsData);
      } catch (error) {
        console.error('Error al cargar hábitos:', error);
        Alert.alert('Error', 'No se pudieron cargar los hábitos. Por favor, inténtelo más tarde.');
      } finally {
        setLoading(false);
      }
    };

    fetchHabits();

    // Listener para recargar hábitos al volver a la pantalla
    const unsubscribe = navigation.addListener('focus', fetchHabits);
    return unsubscribe;
  }, [navigation]);

  const handleHabitPress = (habit) => {
    navigation.navigate('Editar Hábito', { habit });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mis Hábitos</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#007bff" />
      ) : (
        <FlatList
          data={habits}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.habitContainer}
              onPress={() => handleHabitPress(item)}
            >
              <Text style={styles.habitName}>{item.habitName}</Text>
              <Text style={styles.habitDescription}>{item.description}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No tienes hábitos registrados aún.
            </Text>
          }
        />
      )}

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('Registrar Hábito')}
      >
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 16,
  },
  habitContainer: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f9f9f9',
  },
  habitName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  habitDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 16,
    color: '#999',
  },
  addButton: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#007bff',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
});
