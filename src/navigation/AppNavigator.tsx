import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { HabitProvider } from '../context/HabitContext';
import { Text } from 'react-native';

import LoginScreen from '../screens/LoginScreen';
import RegisterUserScreen from '../screens/RegisterUserScreen';
import HabitListScreen from '../screens/HabitListScreen';
import RegisterHabitScreen from '../screens/RegisterHabitScreen';
import ProgressScreen from '../screens/ProgressScreen';
import SettingsScreen from '../screens/SettingsScreen';
import FrequencyScreen from '../screens/FrequencyScreen';
import ReminderScreen from '../screens/ReminderScreen';
import EditHabitScreen from '../screens/EditHabitScreen';

// Definir RootParamList para tipar las pantallas
export type RootParamList = {
  Login: undefined;
  'Registrar Usuario': undefined;
  'Registrar Hábito': undefined;
  Frecuencia: undefined;
  Recordatorio: undefined;
  'Editar Hábito': undefined;
  Main: undefined;
};

const Stack = createStackNavigator<RootParamList>();
const Tab = createBottomTabNavigator();

function MainTabNavigator() {
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="Mis Hábitos"
        component={HabitListScreen}
        options={{
          tabBarLabel: 'Mis Hábitos',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>📋</Text> 
          ),
        }}
      />
      <Tab.Screen
        name="Progreso"
        component={ProgressScreen}
        options={{
          tabBarLabel: 'Progreso',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>📊</Text> 
          ),
        }}
      />
      <Tab.Screen
        name="Ajustes"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Ajustes',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>⚙️</Text> 
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <HabitProvider>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Registrar Usuario" component={RegisterUserScreen} />
        <Stack.Screen name="Registrar Hábito" component={RegisterHabitScreen} />
        <Stack.Screen name="Frecuencia" component={FrequencyScreen} />
        <Stack.Screen name="Recordatorio" component={ReminderScreen} />
        <Stack.Screen name="Editar Hábito" component={EditHabitScreen} />
        <Stack.Screen
          name="Main"
          component={MainTabNavigator}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </HabitProvider>
  );
}
