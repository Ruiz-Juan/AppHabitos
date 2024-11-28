import React, { createContext, useState, useEffect, ReactNode } from 'react';
import * as Notifications from 'expo-notifications';
import { subscribeToHabits, unsubscribeFromHabits } from '../services/supabaseRealtime';
import { saveHabitToSupabase } from '../services/supabaseHabits';
import { supabase } from '../services/supabase';
import uuid from 'react-native-uuid';
import moment from 'moment-timezone';

interface HabitData {
  id?: string; 
  habitName: string;
  description: string;
  reminderTime: Date | null;
  frequency: 'Todos los días' | 'Días específicos de la semana' | 'Días específicos del mes' | '';
  selectedDays: string[];
  selectedDates: number[];
}

interface HabitContextProps {
  habitData: HabitData;
  setHabitData: React.Dispatch<React.SetStateAction<HabitData>>;
  saveHabit: (habit: Partial<HabitData>) => Promise<void>;
}

interface HabitProviderProps {
  children: ReactNode;
}

export const HabitContext = createContext<HabitContextProps | undefined>(undefined);

export const HabitProvider: React.FC<HabitProviderProps> = ({ children }) => {
  const [habitData, setHabitData] = useState<HabitData>({
    habitName: '',
    description: '',
    reminderTime: null,
    frequency: '',
    selectedDays: [],
    selectedDates: [],
  });

  const [subscription, setSubscription] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  // Efecto para obtener el usuario autenticado desde Supabase
  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) {
        console.log('Usuario no autenticado');
        setUser(null);
      } else {
        setUser(data.user);
      }
    };

    fetchUser();
  }, []);

  // Suscripción a cambios en la tabla de hábitos
  useEffect(() => {
    if (!user) {
      console.log('Usuario no autenticado, no se suscribirá a cambios de hábitos.');
      return;
    }

    if (!supabase || !supabase.from) {
      console.error('Supabase no está inicializado correctamente o el cliente no está disponible aún.');
      return;
    }

    // Suscripción a cambios en la tabla `habits`
    const sub = subscribeToHabits((payload) => {
      if (payload.eventType === 'INSERT') {
        const { habit_name, reminder_time } = payload.new;
        scheduleLocalNotification(habit_name, reminder_time);
      }
    });

    setSubscription(sub);

    return () => {
      if (subscription) unsubscribeFromHabits(subscription);
    };
  }, [user]);

  // Función para programar notificaciones locales
  const scheduleLocalNotification = async (habitName: string, reminderTime: string) => {
    const time = moment(reminderTime).tz('America/Bogota').toDate();
    if (time.getTime() > Date.now()) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `¡Es hora de: ${habitName}!`,
          body: 'No olvides completar este hábito.',
        },
        trigger: time,
      });
      console.log(`Notificación local programada para: ${time}`);
    }
  };

  // Función para guardar un hábito en Supabase
  const saveHabit = async (habit: Partial<HabitData>) => {
    try {
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      // Convertir las propiedades para que coincidan con los nombres en la base de datos
      const habitToSave = {
        id: habit.id || (uuid.v4() as string), 
        user_id: user.id, 
        habit_name: habit.habitName || habitData.habitName,
        description: habit.description || habitData.description,
        reminder_time: habit.reminderTime
          ? moment(habit.reminderTime).tz('America/Bogota').utc().format() 
          : habitData.reminderTime
          ? moment(habitData.reminderTime).tz('America/Bogota').utc().format()
          : null,
        frequency: habit.frequency || habitData.frequency,
        selected_days: habit.selectedDays || habitData.selectedDays,
        selected_dates: habit.selectedDates || habitData.selectedDates,
      };

      // Guardar el hábito en Supabase
      const response = await saveHabitToSupabase(habitToSave);
      if (response.error) {
        throw response.error;
      }
      console.log('Hábito guardado en Supabase:', habitToSave);
    } catch (error) {
      console.error('Error al guardar el hábito:', error);
      throw error;
    }
  };

  return (
    <HabitContext.Provider
      value={{
        habitData,
        setHabitData,
        saveHabit,
      }}
    >
      {children}
    </HabitContext.Provider>
  );
};
