import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { HabitContext } from '../context/HabitContext';
import { supabase } from '../services/supabase';
import * as Notifications from 'expo-notifications';
import moment from 'moment-timezone';

interface Habit {
  id: string;
  habit_name: string;
  description: string;
  reminder_time: string;
  frequency: 'Todos los días' | 'Días específicos de la semana' | 'Días específicos del mes';
  selected_days: string[];
  selected_dates: number[];
  notification_id?: string;
}

interface EditHabitScreenProps {
  route: {
    params: {
      habit: Habit;
    };
  };
  navigation: {
    navigate: (screen: string) => void;
  };
}

export default function EditHabitScreen({ route, navigation }: EditHabitScreenProps) {
  const { habit } = route.params;
  const { setHabitData } = useContext(HabitContext);

  // Convertir el tiempo de recordatorio a la zona horaria 'America/Bogota' al inicializar
  const initialReminderTime = moment(habit.reminder_time).tz('America/Bogota').toDate();

  const [habitName, setHabitName] = useState(habit.habit_name || '');
  const [description, setDescription] = useState(habit.description || '');
  const [reminderTime, setReminderTime] = useState<Date>(initialReminderTime);
  const [showPicker, setShowPicker] = useState(false);
  const [selectedFrequency, setSelectedFrequency] = useState<Habit['frequency']>(habit.frequency || 'Todos los días');
  const [selectedDays, setSelectedDays] = useState(habit.selected_days || []);
  const [selectedDates, setSelectedDates] = useState(habit.selected_dates || []);
  const [isFrequencyModalVisible, setIsFrequencyModalVisible] = useState<boolean>(false);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [isMonthModalVisible, setIsMonthModalVisible] = useState<boolean>(false);

  useEffect(() => {
    setHabitData({
      habitName,
      description,
      reminderTime,
      frequency: selectedFrequency,
      selectedDays,
      selectedDates,
    });
  }, [habitName, description, reminderTime, selectedFrequency, selectedDays, selectedDates]);

  const onChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    const currentDate = selectedDate || reminderTime;
    setShowPicker(false);
    setReminderTime(currentDate);
  };

  // Función para cancelar una notificación previa si existe
  const cancelPreviousNotification = async (notificationId: string | undefined) => {
    try {
      if (notificationId) {
        await Notifications.cancelScheduledNotificationAsync(notificationId);
        console.log(`Notificación cancelada con éxito: ${notificationId}`);
      }
    } catch (error) {
      console.error('Error al cancelar la notificación:', error);
    }
  };

  const handleSave = async () => {
    if (!habitName.trim()) {
      Alert.alert('Error', 'El nombre del hábito no puede estar vacío.');
      return;
    }

    try {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) {
        throw new Error('Usuario no autenticado');
      }

      await cancelPreviousNotification(habit.notification_id);

      // Programar la nueva notificación y obtener su ID
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `¡Es hora de: ${habitName}!`,
          body: 'No olvides completar este hábito.',
        },
        trigger: {
          type: 'daily', 
          hour: reminderTime.getHours(), 
          minute: reminderTime.getMinutes(), 
          repeats: true, 
        } as Notifications.DailyTriggerInput, 
      });

      // Convertir la hora de recordatorio a UTC para almacenar en Supabase
      const utcReminderTime = moment(reminderTime).utc().format(); 

      const habitToUpdate = {
        habit_name: habitName.trim(),
        description: description.trim(),
        reminder_time: utcReminderTime,
        frequency: selectedFrequency,
        selected_days: selectedDays,
        selected_dates: selectedDates,
        notification_id: notificationId,
      };

      const filteredHabitToUpdate = Object.fromEntries(
        Object.entries(habitToUpdate).filter(([_, v]) => v !== undefined)
      );

      const { error: updateError } = await supabase
        .from('habits')
        .update(filteredHabitToUpdate)
        .eq('id', habit.id)
        .eq('user_id', data.user.id);

      if (updateError) {
        console.error('Error al actualizar el hábito en Supabase:', updateError);
        throw new Error('Error al actualizar el hábito en Supabase: ' + updateError.message);
      }

      Alert.alert('Éxito', 'Hábito actualizado correctamente.');
      navigation.navigate('Mis Hábitos');
    } catch (error) {
      console.error('Error al actualizar el hábito:', error);
      Alert.alert('Error', 'Hubo un problema al guardar los cambios: ' + error.message);
    }
  };

  const handleDelete = async () => {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) {
        throw new Error('Usuario no autenticado');
      }

      const { error: deleteError } = await supabase
        .from('habits')
        .delete()
        .eq('id', habit.id)
        .eq('user_id', data.user.id);

      if (deleteError) {
        throw new Error('Error al eliminar el hábito en Supabase.');
      }

      Alert.alert('Éxito', 'Hábito eliminado correctamente.');
      navigation.navigate('Mis Hábitos');
    } catch (error) {
      console.error('Error al eliminar el hábito:', error);
      Alert.alert('Error', 'Hubo un problema al eliminar el hábito.');
    }
  };

  const handleFrequencySelection = (
    option: 'Todos los días' | 'Días específicos de la semana' | 'Días específicos del mes'
  ) => {
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
    setIsFrequencyModalVisible(false);
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
      <TouchableOpacity style={styles.timeButton} onPress={() => setShowPicker(true)}>
        <Text style={styles.buttonText}>
          {`Hora y recordatorio: ${reminderTime.getHours()}:${reminderTime
            .getMinutes()
            .toString()
            .padStart(2, '0')}`}
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
      <TouchableOpacity style={styles.timeButton} onPress={() => setIsFrequencyModalVisible(true)}>
        <Text style={styles.buttonText}>{`Frecuencia: ${selectedFrequency}`}</Text>
      </TouchableOpacity>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Guardar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: 'red' }]}
          onPress={handleDelete}
        >
          <Text style={styles.saveButtonText}>Eliminar</Text>
        </TouchableOpacity>
      </View>

      {/* Modal para seleccionar la frecuencia del hábito */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isFrequencyModalVisible}
        onRequestClose={() => setIsFrequencyModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecciona la Frecuencia</Text>
            {["Todos los días", "Días específicos de la semana", "Días específicos del mes"].map((option) => (
              <TouchableOpacity
                key={option}
                style={[styles.option, selectedFrequency === option && styles.selectedOption]}
                onPress={() => handleFrequencySelection(
                  option as 'Todos los días' | 'Días específicos de la semana' | 'Días específicos del mes'
                )}
              >
                <Text style={styles.optionText}>{option}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.closeButton} onPress={() => setIsFrequencyModalVisible(false)}>
              <Text style={styles.closeButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
  timeButton: {
    padding: 15,
    backgroundColor: '#007bff',
    borderRadius: 5,
    marginBottom: 32,
  },
  buttonText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#fff',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  saveButton: {
    flex: 1,
    padding: 10,
    backgroundColor: '#007bff',
    borderRadius: 8,
    marginHorizontal: 5,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    marginBottom: 16,
    textAlign: 'center',
  },
  option: {
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 8,
  },
  selectedOption: {
    backgroundColor: '#d3d3d3',
  },
  optionText: {
    fontSize: 18,
  },
  checkboxContainerAligned: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
    justifyContent: 'flex-start',
    width: '100%',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: 'gray',
    borderRadius: 3,
    marginRight: 8,
  },
  checkedCheckbox: {
    backgroundColor: '#d3d3d3',
  },
  checkboxLabel: {
    fontSize: 16,
  },
  datesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 16,
  },
  dateButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'gray',
  },
  selectedDateButton: {
    backgroundColor: '#d3d3d3',
  },
  dayButtonText: {
    fontSize: 16,
  },
  closeButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#007bff',
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

