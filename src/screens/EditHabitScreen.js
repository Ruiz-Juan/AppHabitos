// Archivo: src/screens/EditHabitScreen.js
import React, { useContext, useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, TouchableOpacity, Alert, Modal, FlatList } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { HabitContext } from '../context/HabitContext';
import { firestore, auth } from '../services/firebase';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';

export default function EditHabitScreen({ route, navigation }) {
  const { habit } = route.params;
  const { habitData, setHabitData } = useContext(HabitContext);

  const [habitName, setHabitName] = useState(habit.habitName || '');
  const [description, setDescription] = useState(habit.description || '');
  const [reminderTime, setReminderTime] = useState(new Date(habit.reminderTime || new Date()));
  const [showPicker, setShowPicker] = useState(false);

  // Modal states
  const [showFrequencyModal, setShowFrequencyModal] = useState(false);
  const [selectedFrequency, setSelectedFrequency] = useState(habitData.frequency || '');
  const [selectedDays, setSelectedDays] = useState(habitData.selectedDays || []);
  const [selectedDates, setSelectedDates] = useState(habitData.selectedDates || []);

  useEffect(() => {
    // Inicializa el contexto con los datos del hábito seleccionado
    setHabitData({
      habitName: habit.habitName || '',
      description: habit.description || '',
      reminderTime: habit.reminderTime || null,
      frequency: habit.frequency || '',
      selectedDays: habit.selectedDays || [],
      selectedDates: habit.selectedDates || [],
    });

    return () => {
      setHabitData({
        habitName: '',
        description: '',
        reminderTime: null,
        frequency: '',
        selectedDays: [],
        selectedDates: [],
      });
    };
  }, [habit, setHabitData]);

  const onChange = (event, selectedDate) => {
    const currentDate = selectedDate || reminderTime;
    setShowPicker(false);
    setReminderTime(currentDate);
  };

  const handleSave = async () => {
    if (!habitName.trim()) {
      Alert.alert('Error', 'El nombre del hábito no puede estar vacío.');
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Usuario no autenticado.');
      }

      const habitRef = doc(firestore, 'users', user.uid, 'habits', habit.id);

      await updateDoc(habitRef, {
        habitName: habitName.trim(),
        description: description.trim(),
        reminderTime: reminderTime.toISOString(),
        frequency: selectedFrequency,
        selectedDays: selectedDays,
        selectedDates: selectedDates,
      });

      Alert.alert('Éxito', 'Hábito actualizado correctamente.');
      navigation.navigate('Mis Hábitos');
    } catch (e) {
      console.error('Error al actualizar el hábito:', e);
      Alert.alert('Error', 'Hubo un problema al guardar los cambios.');
    }
  };

  const handleDelete = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Usuario no autenticado.');
      }

      const habitRef = doc(firestore, 'users', user.uid, 'habits', habit.id);

      await deleteDoc(habitRef);

      Alert.alert('Éxito', 'Hábito eliminado correctamente.');
      navigation.navigate('Mis Hábitos');
    } catch (e) {
      console.error('Error al eliminar el hábito:', e);
      Alert.alert('Error', 'Hubo un problema al eliminar el hábito.');
    }
  };

  const toggleDaySelection = (day) => {
    setSelectedDays((prevDays) =>
      prevDays.includes(day) ? prevDays.filter((d) => d !== day) : [...prevDays, day]
    );
  };

  const toggleDateSelection = (date) => {
    setSelectedDates((prevDates) =>
      prevDates.includes(date) ? prevDates.filter((d) => d !== date) : [...prevDates, date]
    );
  };

  const renderFrequencyModal = () => (
    <Modal visible={showFrequencyModal} animationType="slide" transparent={true}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Editar Frecuencia</Text>
          <View style={styles.frequencyOptions}>
            {['Todos los días', 'Días específicos de la semana', 'Días específicos del mes'].map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.frequencyOption,
                  selectedFrequency === option && styles.selectedOption,
                ]}
                onPress={() => setSelectedFrequency(option)}
              >
                <Text style={styles.frequencyOptionText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {selectedFrequency === 'Días específicos de la semana' && (
            <View style={styles.daysContainer}>
              {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map((day) => (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayButton,
                    selectedDays.includes(day) && styles.selectedDayButton,
                  ]}
                  onPress={() => toggleDaySelection(day)}
                >
                  <Text style={styles.dayButtonText}>{day.slice(0, 3)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {selectedFrequency === 'Días específicos del mes' && (
            <FlatList
              data={[...Array(31).keys()].map((i) => i + 1)}
              keyExtractor={(item) => item.toString()}
              numColumns={7}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.dateButton,
                    selectedDates.includes(item) && styles.selectedDateButton,
                  ]}
                  onPress={() => toggleDateSelection(item)}
                >
                  <Text style={styles.dateButtonText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          )}
          <Button title="Guardar" onPress={() => setShowFrequencyModal(false)} />
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Editar Hábito</Text>
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

      <TouchableOpacity style={styles.frequencyButton} onPress={() => setShowFrequencyModal(true)}>
        <Text style={styles.buttonText}>
          {selectedFrequency ? `Frecuencia: ${selectedFrequency}` : 'Seleccionar Frecuencia'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.timeButton} onPress={() => setShowPicker(true)}>
        <Text style={styles.buttonText}>
          {`Hora y recordatorio: ${reminderTime.getHours()}:${reminderTime.getMinutes().toString().padStart(2, '0')}`}
        </Text>
      </TouchableOpacity>
      {showPicker && (
        <DateTimePicker
          value={reminderTime}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={onChange}
        />
      )}

      {renderFrequencyModal()}

      <View style={styles.buttonContainer}>
        <Button title="Guardar" onPress={handleSave} />
        <Button title="Eliminar" color="red" onPress={handleDelete} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: 'gray',
    marginBottom: 12,
    padding: 8,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  frequencyButton: {
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  timeButton: {
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  buttonText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    width: '90%',
  },
  modalTitle: {
    fontSize: 20,
    marginBottom: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  sectionDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    marginVertical: 10,
    width: '100%',
  },
  frequencyOptions: {
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
    padding: 10,
  },
  frequencyOption: {
    padding: 10,
    borderWidth: 1,
    borderColor: 'gray',
    marginBottom: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  selectedOption: {
    backgroundColor: '#d3d3d3',
  },
  frequencyOptionText: {
    textAlign: 'center',
    color: '#333',
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 10,
  },
  dayButton: {
    padding: 10,
    margin: 5,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  selectedDayButton: {
    backgroundColor: '#d3d3d3',
  },
  dayButtonText: {
    textAlign: 'center',
    color: '#333',
  },
  datesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-evenly',
    marginTop: 10,
  },
  dateButton: {
    width: '14.28%', // Divide el ancho de la pantalla entre 7 columnas
    aspectRatio: 1, // Hace que el botón sea cuadrado
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  selectedDateButton: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  dateButtonText: {
    textAlign: 'center',
    color: '#333',
  },
  saveButton: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#007bff',
    borderRadius: 5,
    alignItems: 'center',
    width: '80%',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});


