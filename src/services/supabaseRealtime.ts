import { supabase } from './supabase';

/**
 * Suscribirse a cambios en la tabla `habits` usando Supabase.
 * @param {Function} callback - Función que será ejecutada en cada cambio.
 */
export const subscribeToHabits = async (callback: (payload: any) => void) => {
  try {
    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user) {
      throw new Error('Usuario no autenticado');
    }

    const user = data.user;

    // Suscribirse a cambios en la tabla 'habits' solo para el usuario autenticado
    const subscription = supabase
      .channel('table-habits') 
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'habits', filter: `user_id=eq.${user.id}` }, 
        (payload) => {
          console.log('Cambio detectado en la tabla `habits`:', payload);
          callback(payload);
        }
      )
      .subscribe();

    return subscription;

  } catch (err) {
    console.error('Error al suscribirse a los hábitos:', err.message);
    throw err;
  }
};

/**
 * Cancelar una suscripción a un canal de Supabase.
 * @param {any} subscription
 */
export const unsubscribeFromHabits = (subscription: any) => {
  try {
    supabase.removeChannel(subscription);
    console.log('Suscripción cancelada con éxito');
  } catch (error) {
    console.error('Error al cancelar la suscripción:', error.message);
  }
};

