// Archivo: src/screens/ReminderScreen.js
import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, Alert, Platform, TouchableOpacity } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { HabitContext } from '../context/HabitContext';
import { doc, setDoc, collection } from 'firebase/firestore';
import { auth, firestore } from '../services/firebase';

export default function ReminderScreen({ navigation }) {
  const { habitData, setHabitData } = useContext(HabitContext);
  const [time, setTime] = useState(habitData.reminderTime ? new Date(habitData.reminderTime) : new Date());
  const [showPicker, setShowPicker] = useState(false);

  const onChange = (event, selectedDate) => {
    const currentDate = selectedDate || time;
    setShowPicker(false);
    setTime(currentDate);
    setHabitData({ ...habitData, reminderTime: currentDate });
  };

  const handleFinalize = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      const userRef = doc(firestore, 'users', user.uid);
      const habitsRef = collection(userRef, 'habits');

      const habitToSave = {
        habitName: habitData.habitName,
        description: habitData.description,
        reminderTime: time.toISOString(),
        frequency: habitData.frequency,
        selectedDays: habitData.selectedDays,
        selectedDates: habitData.selectedDates,
      };

      await setDoc(doc(habitsRef), habitToSave);

      Alert.alert('Éxito', 'Hábito guardado correctamente.');
      navigation.navigate('Mis Hábitos');
    } catch (error) {
      console.error('Error al guardar el hábito:', error);
      Alert.alert('Error', error.message);
    }
  };

  const handlePrevious = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>¿Cuándo quieres hacerlo?</Text>
      <View style={styles.pickerContainer}>
        <TouchableOpacity style={styles.selectTimeButton} onPress={() => setShowPicker(true)}>
          <Text style={styles.selectTimeButtonText}>Seleccionar hora</Text>
        </TouchableOpacity>
        {showPicker && (
          <DateTimePicker
            value={time}
            mode="time"
            is24Hour={true}
            display="spinner"
            onChange={onChange}
          />
        )}
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.navigationButton} onPress={handlePrevious}>
          <Text style={styles.navigationButtonText}>Anterior</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navigationButton} onPress={handleFinalize}>
          <Text style={styles.navigationButtonText}>Finalizar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 24,
    marginBottom: 32,
    textAlign: 'center',
  },
  pickerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  selectTimeButton: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectTimeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'absolute',
    bottom: 32,
    left: 16,
    right: 16,
  },
  navigationButton: {
    flex: 1,
    marginHorizontal: 8,
    paddingVertical: 12,
    backgroundColor: '#007bff',
    borderRadius: 8,
    alignItems: 'center',
  },
  navigationButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});



