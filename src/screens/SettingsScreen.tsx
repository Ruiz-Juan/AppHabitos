import React from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import { supabase } from '../services/supabase';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

interface SettingsScreenProps {
  navigation: StackNavigationProp<any, any>; 
  route: RouteProp<any, any>;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      console.log('Cerrar sesión exitoso');
      navigation.replace('Login'); 
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Error desconocido');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ajustes</Text>
      <Button title="Cerrar Sesión" onPress={handleLogout} />
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
    marginBottom: 16,
    textAlign: 'center',
  },
});

export default SettingsScreen;
