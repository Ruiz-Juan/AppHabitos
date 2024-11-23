// Archivo: src/screens/EditFrequencyScreen.js
import React, { useState, useEffect, useContext } from 'react';
import { View, Text, Button, StyleSheet, TouchableOpacity, Modal, Alert } from 'react-native';
import { HabitContext } from '../context/HabitContext';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, firestore } from '../services/firebase';

export default function EditFrequencyScreen({ navigation }) {
  const { habitData, setHabitData } = useContext(HabitContext);
  const [selectedFrequency, setSelectedFrequency] = useState(habitData.frequency || 'Todos los días');
  const [selectedDays, setSelectedDays] = useState(habitData.selectedDays || []);
  const [selectedDates, setSelectedDates] = useState(habitData.selectedDates || []);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isMonthModalVisible, setIsMonthModalVisible] = useState(false);

  useEffect(() => {
    setSelectedFrequency(habitData.frequency || 'Todos los días');
    setSelectedDays(habitData.selectedDays || []);
    setSelectedDates(habitData.selectedDates || []);
  }, [habitData]);

  const handleSave = async () => {
    if (
      (selectedFrequency === 'Días específicos de la semana' && selectedDays.length === 0) ||
      (selectedFrequency === 'Días específicos del mes' && selectedDates.length === 0)
    ) {
      Alert.alert('Error', 'Selecciona al menos un día para la frecuencia especificada.');
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Usuario no autenticado.');
      }

      const habitRef = doc(firestore, 'users', user.uid, 'habits', habitData.id);

      const updateData = {
        frequency: selectedFrequency,
        selectedDays: selectedFrequency === 'Días específicos de la semana' ? selectedDays : [],
        selectedDates: selectedFrequency === 'Días específicos del mes' ? selectedDates : [],
      };

      // Guardar en Firestore
      await updateDoc(habitRef, updateData);

      // Actualizar contexto
      setHabitData({
        ...habitData,
        ...updateData,
      });

      Alert.alert('Éxito', 'Frecuencia actualizada correctamente.');
      navigation.goBack();
    } catch (error) {
      console.error('Error al guardar la frecuencia:', error);
      Alert.alert('Error', 'Hubo un problema al guardar los cambios.');
    }
  };

  const handleFrequencySelection = (option) => {
    setSelectedFrequency(option);
    if (option === 'Todos los días') {
      setSelectedDays([]);
      setSelectedDates([]);
    } else if (option === 'Días específicos de la semana') {
      setSelectedDates([]);
      setIsModalVisible(true);
    } else if (option === 'Días específicos del mes') {
      setSelectedDays([]);
      setIsMonthModalVisible(true);
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Editar Frecuencia</Text>
      <View style={styles.optionsContainer}>
        {['Todos los días', 'Días específicos de la semana', 'Días específicos del mes'].map((option, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.option, selectedFrequency === option && styles.selectedOption]}
            onPress={() => handleFrequencySelection(option)}
          >
            <Text style={styles.optionText}>{option}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.buttonContainer}>
        <Button title="Guardar" onPress={handleSave} disabled={!selectedFrequency} />
      </View>

      {/* Modal para seleccionar días específicos de la semana */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecciona los días de la semana</Text>
            {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map((day, index) => (
              <View key={index} style={styles.checkboxContainerAligned}>
                <TouchableOpacity
                  style={[styles.checkbox, selectedDays.includes(day) && styles.checkedCheckbox]}
                  onPress={() => toggleDaySelection(day)}
                />
                <Text style={styles.checkboxLabel}>{day}</Text>
              </View>
            ))}
            <Button title="Cerrar" onPress={() => setIsModalVisible(false)} />
          </View>
        </View>
      </Modal>

      {/* Modal para seleccionar días específicos del mes */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isMonthModalVisible}
        onRequestClose={() => setIsMonthModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecciona los días del mes</Text>
            <View style={styles.datesContainer}>
              {[...Array(31).keys()].map((date) => (
                <TouchableOpacity
                  key={date}
                  style={[styles.dateButton, selectedDates.includes(date + 1) && styles.selectedDateButton]}
                  onPress={() => toggleDateSelection(date + 1)}
                >
                  <Text style={styles.dayButtonText}>{date + 1}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Button title="Cerrar" onPress={() => setIsMonthModalVisible(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, textAlign: 'center', marginBottom: 16 },
  optionsContainer: { flex: 1, justifyContent: 'center' },
  option: { padding: 16, borderWidth: 1, borderColor: 'gray', marginVertical: 8 },
  selectedOption: { backgroundColor: '#d3d3d3' },
  buttonContainer: { marginTop: 16 },
  modalContainer: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  modalContent: { backgroundColor: 'white', padding: 20, borderRadius: 10, alignItems: 'center' },
  modalTitle: { fontSize: 20, marginBottom: 16 },
  checkboxContainerAligned: { flexDirection: 'row', alignItems: 'center', marginVertical: 5 },
  checkbox: { width: 20, height: 20, borderWidth: 1, marginRight: 8 },
  checkedCheckbox: { backgroundColor: 'gray' },
  checkboxLabel: { fontSize: 16 },
  datesContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  dateButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', margin: 5, borderRadius: 20 },
  selectedDateButton: { backgroundColor: 'gray' },
  dayButtonText: { fontSize: 16 },
});
