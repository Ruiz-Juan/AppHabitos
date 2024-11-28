import { supabase } from './supabase';
import uuid from 'react-native-uuid'; // Importa la función para generar UUID desde react-native-uuid
import moment from 'moment-timezone';

interface HabitData {
  id?: string; // ID ahora es opcional
  user_id: string;
  habit_name: string;
  description: string;
  reminder_time: string | null;
  frequency: string;
  selected_days: (string | number)[];
  selected_dates: (string | number)[];
}

// Función para guardar o actualizar un hábito
export const saveHabitToSupabase = async (habit: HabitData) => {
  try {
    if (!habit.id) {
      // Generar un nuevo ID si no existe
      habit.id = uuid.v4() as string; // Usar uuid de react-native-uuid
    }

    // Convertir la hora de recordatorio a UTC antes de guardarla en la base de datos
    if (habit.reminder_time) {
      habit.reminder_time = moment(habit.reminder_time)
        .tz('America/Bogota')
        .utc()
        .format(); // Convertir la hora a UTC para almacenarla
    }

    const { data, error } = await supabase
      .from('habits')
      .upsert([habit], { onConflict: 'id' }); // Cambiar a 'id' como string

    if (error) {
      console.error('Error al guardar el hábito en Supabase:', error);
      return { error };
    }

    console.log('Hábito guardado en Supabase:', data);
    return { data };
  } catch (error) {
    console.error('Error al guardar el hábito:', error);
    return { error }; // Regresar error en lugar de lanzarlo
  }
};
