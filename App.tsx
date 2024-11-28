import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AppNavigator from './src/navigation/AppNavigator';
import * as Notifications from 'expo-notifications';
import { supabase } from './src/services/supabase'; 
import LoginScreen from './src/screens/LoginScreen';
import { HabitProvider } from './src/context/HabitContext';

const Stack = createStackNavigator();

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuthStatus = async () => {
      const { data } = await supabase.auth.getSession();
      setIsAuthenticated(!!data.session);
    };

    checkAuthStatus();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    // Configuración de notificaciones locales
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    const registerForPushNotifications = async () => {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        const { status: newStatus } = await Notifications.requestPermissionsAsync();
        if (newStatus !== 'granted') {
          Alert.alert('Permiso requerido', 'Se necesitan permisos de notificación para continuar.');
          return;
        }
      }

      const token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log('Token de notificaciones locales:', token);
    };

    // Solicitar permisos de notificación si el usuario está autenticado
    if (isAuthenticated) {
      registerForPushNotifications();
    }

    // Desuscribirse del listener cuando el componente sea desmontado
    return () => {
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [isAuthenticated]);

  if (isAuthenticated === null) {
    return null;
  }

  return (
    <NavigationContainer>
      <HabitProvider>
        <Stack.Navigator>
          {isAuthenticated ? (
            <Stack.Screen name="Home" component={AppNavigator} options={{ headerShown: false }} />
          ) : (
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          )}
        </Stack.Navigator>
      </HabitProvider>
    </NavigationContainer>
  );
};

export default App;
