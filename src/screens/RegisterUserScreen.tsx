import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { supabase } from '../services/supabase';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootParamList } from '../navigation/AppNavigator'; 

type RegisterUserScreenNavigationProp = StackNavigationProp<RootParamList, 'Registrar Usuario'>;

type Props = {
  navigation: RegisterUserScreenNavigationProp;
};

export default function RegisterUserScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isNavigationReady, setIsNavigationReady] = useState(false);

  useEffect(() => {
    const unsubscribe = navigation.addListener('state', () => {
      if (navigation.getState()) {
        setIsNavigationReady(true);
      }
    });

    return unsubscribe;
  }, [navigation]);

  const handleRegister = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor, complete todos los campos.');
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (error) {
        throw error;
      }

      console.log('Usuario registrado:', data);
      Alert.alert('Registro Exitoso', 'Por favor, revisa tu correo para verificar tu cuenta.');

      // Esperar hasta que la navegación esté lista para evitar problemas
      if (isNavigationReady) {
        setTimeout(() => {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        }, 300); // Pequeño retardo para asegurar la sincronización
      } else {
        console.log('Navegación no está lista, intentando más tarde...');
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Error desconocido');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Crear Cuenta</Text>
      <TextInput
        placeholder="Correo"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        placeholder="Contraseña"
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <View style={styles.buttonContainer}>
        <Button title="Registrar" onPress={handleRegister} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 8,
    backgroundColor: '#f9f9f9',
  },
  buttonContainer: {
    marginVertical: 16,
  },
});
