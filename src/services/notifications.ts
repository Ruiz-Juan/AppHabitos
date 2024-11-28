import * as Notifications from 'expo-notifications';
import { supabase } from './supabase';
import moment from 'moment-timezone';

export interface ScheduleNotificationParams {
  habitName: string;
  reminderTime: Date;
  frequency: 'Todos los días' | 'Días específicos de la semana' | 'Días específicos del mes';
  selectedDays?: number[];
  selectedDates?: number[];
}

Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const { data, error: userError } = await supabase.auth.getUser();

    if (userError || !data?.user) {
      console.error('Usuario no autenticado');
      return {
        shouldShowAlert: false, 
        shouldPlaySound: false,
        shouldSetBadge: false,
      };
    }

    // Verificar si la notificación pertenece al usuario actual
    const notificationUserId = notification.request.content.data?.userId;
    if (notificationUserId && notificationUserId === data.user.id) {
      return {
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      };
    } else {
      return {
        shouldShowAlert: false,
        shouldPlaySound: false,
        shouldSetBadge: false,
      };
    }
  },
});

export const scheduleLocalNotification = async ({
  habitName,
  reminderTime,
}: ScheduleNotificationParams): Promise<void> => {
  try {
    const { data, error: userError } = await supabase.auth.getUser();

    if (userError || !data?.user) {
      throw new Error('Usuario no autenticado');
    }

    // Convertir la hora a la zona horaria 'America/Bogota'
    const localTime = moment(reminderTime).tz('America/Bogota');
    const localHour = localTime.hour();
    const localMinute = localTime.minute();

    if (localTime.isAfter(moment())) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `¡Es hora de: ${habitName}!`,
          body: 'No olvides completar este hábito.',
          data: { userId: data.user.id }, // Asociar la notificación con el usuario actual
        },
        trigger: {
          type: 'daily', // Especificar que el trigger es diario
          hour: localHour,
          minute: localMinute,
          repeats: true,
        } as Notifications.DailyTriggerInput,
      });
      console.log(`Notificación local programada para: ${localTime.format('YYYY-MM-DD HH:mm')} en zona horaria de Bogotá`);
    }
  } catch (error) {
    console.error('Error al programar la notificación:', error);
  }
};

/**
 * Cancelar todas las notificaciones programadas para un usuario.
 */
export const cancelUserNotifications = async (): Promise<void> => {
  try {
    // Obtener usuario autenticado de Supabase
    const { data, error: userError } = await supabase.auth.getUser();

    if (userError || !data?.user) {
      throw new Error('Usuario no autenticado');
    }

    // Cancelar todas las notificaciones del usuario autenticado
    const allNotifications = await Notifications.getAllScheduledNotificationsAsync();
    for (const notification of allNotifications) {
      if (notification.content.data?.userId === data.user.id) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    }

    console.log(`Notificaciones canceladas para el usuario: ${data.user.id}`);
  } catch (error) {
    console.error('Error al cancelar las notificaciones:', error);
  }
};

/**
 * Reprogramar las notificaciones de un usuario al iniciar sesión.
 */
export const reprogramUserNotifications = async (): Promise<void> => {
  try {
    // Obtener usuario autenticado desde Supabase
    const { data, error: userError } = await supabase.auth.getUser();
    if (userError || !data?.user) {
      throw new Error('Usuario no autenticado');
    }

    // Obtener los hábitos del usuario desde Supabase
    const { data: habits, error: habitsError } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', data.user.id);

    if (habitsError) {
      throw new Error('Error al obtener los hábitos del usuario');
    }

    // Reprogramar notificaciones para cada hábito del usuario
    for (const habit of habits) {
      if (habit.reminder_time) {
        await scheduleLocalNotification({
          habitName: habit.habit_name,
          reminderTime: new Date(habit.reminder_time),
          frequency: habit.frequency,
          selectedDays: habit.selected_days,
          selectedDates: habit.selected_dates,
        });
      }
    }

    console.log(`Notificaciones reprogramadas para el usuario: ${data.user.id}`);
  } catch (error) {
    console.error('Error al reprogramar las notificaciones:', error);
  }
};
