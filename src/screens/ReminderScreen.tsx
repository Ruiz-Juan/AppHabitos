import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  GestureResponderEvent,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { HabitContext } from '../context/HabitContext';
import { saveHabitToSupabase } from '../services/supabaseHabits';
import { supabase } from '../services/supabase';
import { scheduleLocalNotification } from '../services/notifications';
import moment from 'moment-timezone'; 

interface ReminderScreenProps {
  navigation: {
    navigate: (screen: string) => void;
    goBack: () => void;
  };
}

const ReminderScreen: React.FC<ReminderScreenProps> = ({ navigation }) => {
  const { habitData, setHabitData } = useContext(HabitContext) as {
    habitData: {
      habitName: string;
      description: string;
      reminderTime: Date | string | null;
      frequency: 'Todos los días' | 'Días específicos de la semana' | 'Días específicos del mes' | '';
      selectedDays: (string | number)[];
      selectedDates: (string | number)[];
      id?: string;
    };
    setHabitData: (data: Partial<typeof habitData>) => void;
  };

  const parseReminderTime = (time: Date | string | null): Date => {
    if (!time) return new Date();
    const parsedDate = typeof time === 'string' ? new Date(time) : time;
    return isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
  };

  const [time, setTime] = useState<Date>(parseReminderTime(habitData.reminderTime));
  const [showPicker, setShowPicker] = useState<boolean>(false);

  const onChange = (event: DateTimePickerEvent, selectedDate?: Date): void => {
    if (selectedDate) {
      setShowPicker(false);
      setTime(selectedDate);
      setHabitData({ ...habitData, reminderTime: selectedDate.toISOString() });
    }
  };

  const handleFinalize = async (): Promise<void> => {
    try {
      if (!habitData.habitName.trim()) {
        Alert.alert('Error', 'El nombre del hábito no puede estar vacío.');
        return;
      }

      const { data, error: userError } = await supabase.auth.getUser();
      if (userError || !data?.user) {
        throw new Error('Usuario no autenticado');
      }

      // Convertir la hora seleccionada a la zona horaria de Bogotá
      const reminderTimeInBogota = moment(time).tz('America/Bogota').format();

      const habitToSave = {
        id: habitData.id,
        user_id: data.user.id,
        habit_name: habitData.habitName,
        description: habitData.description || '',
        reminder_time: reminderTimeInBogota,
        frequency: habitData.frequency || 'Todos los días',
        selected_days: habitData.selectedDays,
        selected_dates: habitData.selectedDates,
      };

      const saveResponse = await saveHabitToSupabase(habitToSave);

      if (saveResponse?.error) {
        throw new Error(saveResponse.error.message);
      }

      // Programar la notificación local usando la hora local
      await scheduleLocalNotification({
        habitName: habitData.habitName,
        reminderTime: time,
        frequency: habitData.frequency as any,
      });

      Alert.alert(
        'Éxito',
        `Hábito guardado y notificación programada correctamente para ${moment(time).tz('America/Bogota').format('DD-MM-YYYY HH:mm')}.`
      );

      navigation.navigate('Mis Hábitos');
    } catch (error) {
      console.error('Error al guardar el hábito:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Error desconocido');
    }
  };

  const handlePrevious = (event: GestureResponderEvent): void => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>¿Cuándo quieres hacerlo?</Text>
      <View style={styles.pickerContainer}>
        <TouchableOpacity
          style={styles.selectTimeButton}
          onPress={() => setShowPicker(true)}
        >
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
        <TouchableOpacity
          style={styles.navigationButton}
          onPress={handlePrevious}
        >
          <Text style={styles.navigationButtonText}>Anterior</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navigationButton}
          onPress={handleFinalize}
        >
          <Text style={styles.navigationButtonText}>Finalizar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

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

export default ReminderScreen;
