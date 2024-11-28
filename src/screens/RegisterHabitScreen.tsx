// Archivo: src/screens/RegisterHabitScreen.tsx
import React, { useState, useContext } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { HabitContext } from '../context/HabitContext';
import { supabase } from '../services/supabase'; 

interface RegisterHabitScreenProps {
  navigation: {
    navigate: (screen: string) => void;
  };
}

const RegisterHabitScreen: React.FC<RegisterHabitScreenProps> = ({ navigation }) => {
  const { habitData, setHabitData } = useContext(HabitContext)!;

  const [habitName, setHabitName] = useState<string>(habitData.habitName || '');
  const [description, setDescription] = useState<string>(habitData.description || '');

  const handleNext = async (): Promise<void> => {
    if (!habitName.trim()) {
      Alert.alert('Error', 'Por favor, ingresa un nombre válido para el hábito.');
      return;
    }

    try {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) {
        throw new Error('Usuario no autenticado');
      }

      const newHabit = {
        habitName: habitName.trim(),
        description: description.trim(),
        user_id: data.user.id, 
      };

      // Guardar temporalmente el hábito en el contexto
      setHabitData((prev) => ({
        ...prev,
        ...newHabit,
      }));

      // Navegar a la pantalla de Frecuencia
      navigation.navigate('Frecuencia');
    } catch (error) {
      console.error('Error al manejar el hábito:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Error desconocido');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Registrar Hábito</Text>
      <TextInput
        placeholder="Nombre del Hábito"
        style={styles.input}
        value={habitName}
        onChangeText={setHabitName}
      />
      <TextInput
        placeholder="Descripción (opcional)"
        style={styles.input}
        value={description}
        onChangeText={setDescription}
      />
      <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
        <Text style={styles.nextButtonText}>Siguiente</Text>
      </TouchableOpacity>
    </View>
  );
};

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
  input: {
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  nextButton: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default RegisterHabitScreen;
