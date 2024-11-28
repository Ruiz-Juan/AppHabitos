import * as Notifications from 'expo-notifications';
import { supabase } from './supabase';

export const requestNotificationPermission = async (): Promise<boolean> => {
  try {
    const { data, error: userError } = await supabase.auth.getUser();

    if (userError || !data?.user) {
      throw new Error('Usuario no autenticado');
    }

    const { status } = await Notifications.requestPermissionsAsync();
    const isAuthorized = status === 'granted';

    if (isAuthorized) {
      console.log('Permisos para notificaciones otorgados.');
      return true;
    } else {
      console.warn('Los permisos para notificaciones no fueron otorgados.');
      return false;
    }
  } catch (error) {
    console.error('Error al solicitar permisos de notificaciones:', error);
    return false;
  }
};

export const checkNotificationPermission = async (): Promise<boolean> => {
  try {
    const { data, error: userError } = await supabase.auth.getUser();

    if (userError || !data?.user) {
      throw new Error('Usuario no autenticado');
    }

    const { status } = await Notifications.getPermissionsAsync();
    const isAuthorized = status === 'granted';

    return isAuthorized;
  } catch (error) {
    console.error('Error al verificar permisos de notificaciones:', error);
    return false;
  }
};
