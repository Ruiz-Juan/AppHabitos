import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../services/supabase';
import moment from 'moment-timezone'; 

interface Habit {
  id: string;
  habit_name: string;
  description: string;
  reminder_time?: string | null; 
}

interface HabitListScreenProps {
  navigation: {
    navigate: (screen: string, params?: { [key: string]: any }) => void;
    addListener: (event: string, callback: () => void) => () => void;
  };
}

export default function HabitListScreen({ navigation }: HabitListScreenProps) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Función para cargar hábitos desde Supabase
  const fetchHabits = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error('Usuario no autenticado');
      }

      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id); 

      if (error) {
        throw error;
      }

      if (data) {
        setHabits(data);
      }
    } catch (error) {
      console.error('Error al cargar hábitos:', error);
      Alert.alert('Error', 'No se pudieron cargar los hábitos. Por favor, inténtelo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHabits();

    const unsubscribe = navigation.addListener('focus', fetchHabits);
    return unsubscribe;
  }, [navigation]);

  // Navegar al editor de hábitos
  const handleHabitPress = (habit: Habit) => {
    navigation.navigate('Editar Hábito', { habit });
  };

  // Función para mostrar la hora local de la notificación en la zona horaria de Bogotá (UTC-5)
  const formatReminderTime = (reminderTime?: string | null): string => {
    if (!reminderTime) return 'Sin recordatorio';
    return moment(reminderTime).tz('America/Bogota').format('DD-MM-YYYY HH:mm');
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
              <Text style={styles.habitName}>{item.habit_name}</Text>
              <Text style={styles.habitDescription}>{item.description}</Text>
              <Text style={styles.habitReminder}>
                {`Recordatorio: ${formatReminderTime(item.reminder_time)}`}
              </Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No tienes hábitos registrados aún.</Text>
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
  habitReminder: {
    fontSize: 12,
    color: '#007bff',
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

