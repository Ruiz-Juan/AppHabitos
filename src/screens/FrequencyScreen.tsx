// Archivo: src/screens/FrequencyScreen.tsx
import React, { useContext, useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert } from "react-native";
import { HabitContext } from "../context/HabitContext";
import { supabase } from '../services/supabase';

interface FrequencyScreenProps {
  navigation: {
    navigate: (screen: string) => void;
    goBack: () => void;
  };
}

export default function FrequencyScreen({ navigation }: FrequencyScreenProps) {
  const { habitData, setHabitData } = useContext(HabitContext)!;
  const [selectedFrequency, setSelectedFrequency] = useState<
    "Todos los días" | "Días específicos de la semana" | "Días específicos del mes"
  >(habitData.frequency || "Todos los días");
  const [selectedDays, setSelectedDays] = useState<string[]>(habitData.selectedDays || []);
  const [selectedDates, setSelectedDates] = useState<number[]>(habitData.selectedDates || []);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [isMonthModalVisible, setIsMonthModalVisible] = useState<boolean>(false);

  useEffect(() => {
    setSelectedFrequency(habitData.frequency || "Todos los días");
    setSelectedDays(habitData.selectedDays || []);
    setSelectedDates(habitData.selectedDates || []);
  }, [habitData]);

  const handleNext = async () => {
    if (
      (selectedFrequency === "Días específicos de la semana" && selectedDays.length === 0) ||
      (selectedFrequency === "Días específicos del mes" && selectedDates.length === 0)
    ) {
      Alert.alert("Error", "Selecciona al menos un día para la frecuencia especificada.");
      return;
    }

    try {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) {
        throw new Error('Usuario no autenticado');
      }

      setHabitData({
        ...habitData,
        frequency: selectedFrequency,
        selectedDays,
        selectedDates,
      });

      navigation.navigate("Recordatorio");
    } catch (error) {
      console.error('Error al manejar la frecuencia del hábito:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Error desconocido');
    }
  };

  const handleFrequencySelection = (
    option: "Todos los días" | "Días específicos de la semana" | "Días específicos del mes"
  ) => {
    setSelectedFrequency(option);
    if (option === "Todos los días") {
      setSelectedDays([]);
      setSelectedDates([]);
    } else if (option === "Días específicos de la semana") {
      setSelectedDates([]);
      setIsModalVisible(true);
    } else if (option === "Días específicos del mes") {
      setSelectedDays([]);
      setIsMonthModalVisible(true);
    }
  };

  const toggleDaySelection = (day: string) => {
    setSelectedDays((prevDays) =>
      prevDays.includes(day) ? prevDays.filter((d) => d !== day) : [...prevDays, day]
    );
  };

  const toggleDateSelection = (date: number) => {
    setSelectedDates((prevDates) =>
      prevDates.includes(date) ? prevDates.filter((d) => d !== date) : [...prevDates, date]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>¿Con qué frecuencia quieres realizarlo?</Text>
      <View style={styles.optionsContainer}>
        {["Todos los días", "Días específicos de la semana", "Días específicos del mes"].map((option) => (
          <TouchableOpacity
            key={option}
            style={[styles.option, selectedFrequency === option && styles.selectedOption]}
            onPress={() =>
              handleFrequencySelection(
                option as "Todos los días" | "Días específicos de la semana" | "Días específicos del mes"
              )
            }
          >
            <Text style={styles.optionText}>{option}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.navigationButton} onPress={() => navigation.goBack()}>
          <Text style={styles.navigationButtonText}>Anterior</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navigationButton, !selectedFrequency && styles.disabledButton]}
          onPress={handleNext}
          disabled={!selectedFrequency}
        >
          <Text style={styles.navigationButtonText}>Siguiente</Text>
        </TouchableOpacity>
      </View>

      {/* Modal para seleccionar días específicos de la semana */}
      <Modal animationType="slide" transparent={true} visible={isModalVisible} onRequestClose={() => setIsModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecciona los días de la semana</Text>
            {["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"].map((day) => (
              <View key={day} style={styles.checkboxContainerAligned}>
                <TouchableOpacity
                  style={[styles.checkbox, selectedDays.includes(day) && styles.checkedCheckbox]}
                  onPress={() => toggleDaySelection(day)}
                />
                <Text style={styles.checkboxLabel}>{day}</Text>
              </View>
            ))}
            <TouchableOpacity style={styles.closeButton} onPress={() => setIsModalVisible(false)}>
              <Text style={styles.closeButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal para seleccionar días específicos del mes */}
      <Modal animationType="slide" transparent={true} visible={isMonthModalVisible} onRequestClose={() => setIsMonthModalVisible(false)}>
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
            <TouchableOpacity style={styles.closeButton} onPress={() => setIsMonthModalVisible(false)}>
              <Text style={styles.closeButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
    paddingHorizontal: 16,
    paddingTop: 32,
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
    textAlign: "center",
  },
  optionsContainer: {
    flex: 1,
    justifyContent: "flex-start",
    marginBottom: 24,
  },
  option: {
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 8,
  },
  selectedOption: {
    backgroundColor: "#d3d3d3",
  },
  optionText: {
    fontSize: 18,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    position: "absolute",
    bottom: 32,
    left: 16,
    right: 16,
  },
  navigationButton: {
    flex: 1,
    marginHorizontal: 8,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#007bff",
    alignItems: "center",
  },
  navigationButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  disabledButton: {
    backgroundColor: "#cccccc",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    marginBottom: 16,
    textAlign: "center",
  },
  checkboxContainerAligned: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 5,
    justifyContent: "flex-start",
    width: "100%",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: "gray",
    borderRadius: 3,
    marginRight: 8,
  },
  checkedCheckbox: {
    backgroundColor: "#d3d3d3",
  },
  checkboxLabel: {
    fontSize: 16,
  },
  datesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 16,
  },
  dateButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    margin: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "gray",
  },
  selectedDateButton: {
    backgroundColor: "#d3d3d3",
  },
  dayButtonText: {
    fontSize: 16,
  },
  closeButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: "#007bff",
    borderRadius: 8,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

