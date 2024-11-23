// Archivo: src/services/notifications.js
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

const SERVER_URL = 'https://apphabitos-backend-production.up.railway.app';

export const registerForPushNotificationsAsync = async () => {
  let token;
  if (Constants.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      alert('Se necesitan permisos para enviar notificaciones.');
      return;
    }
    token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log("Push Token:", token);
  } else {
    alert('Debe usar un dispositivo físico para recibir notificaciones.');
  }

  return token;
};

export const scheduleHabitNotification = async (pushToken, habitName, message, scheduledTime, timeZone) => {
  try {
    const response = await fetch(SERVER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pushToken,
        habitName,
        message,
        scheduledTime,
        timeZone, // Enviar la zona horaria al servidor
      }),
    });

    if (!response.ok) {
      throw new Error('Error al programar la notificación.');
    }

    console.log('Notificación programada en el servidor.');
  } catch (error) {
    console.error('Error al enviar notificación al servidor:', error);
  }
};



