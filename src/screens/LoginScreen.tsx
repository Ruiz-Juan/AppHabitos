import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { supabase } from '../services/supabase';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootParamList } from '../navigation/AppNavigator'; // Importa RootParamList para definir tipos

type LoginScreenNavigationProp = StackNavigationProp<RootParamList, 'Login'>;

type Props = {
  navigation: LoginScreenNavigationProp;
};

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isNavigationReady, setIsNavigationReady] = useState(false);

  useEffect(() => {
    // Verificar cuando la navegación esté lista
    const unsubscribe = navigation.addListener('state', () => {
      if (navigation.getState()) {
        setIsNavigationReady(true);
      }
    });

    return unsubscribe;
  }, [navigation]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor, complete todos los campos.');
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        throw error;
      }

      console.log('Usuario autenticado:', data);
      Alert.alert('Bienvenido', `Hola, ${data.user.email}`);

      // Esperar hasta que la navegación esté lista para evitar problemas
      if (isNavigationReady) {
        setTimeout(() => {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Main' }],
          });
        }, 300); // Pequeño retardo para asegurar la sincronización
      } else {
        console.log('Navegación no está lista, intentando más tarde...');
      }
    } catch (error) {
      let errorMessage = 'Algo salió mal. Intente de nuevo.';
      if (error.message === 'Invalid login credentials') {
        errorMessage = 'Credenciales incorrectas. Verifique el correo o la contraseña.';
      }
      Alert.alert('Error', errorMessage);
    }
  };

  const navigateToRegister = () => {
    navigation.navigate('Registrar Usuario');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Iniciar Sesión</Text>
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
        secureTextEntry
        onChangeText={setPassword}
      />
      <View style={styles.buttonContainer}>
        <Button title="Iniciar Sesión" onPress={handleLogin} />
      </View>
      <View style={styles.registerContainer}>
        <Text>¿No tienes una cuenta?</Text>
        <Button title="Regístrate" onPress={navigateToRegister} />
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
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 8,
    backgroundColor: '#f9f9f9',
  },
  buttonContainer: {
    marginVertical: 16,
  },
  registerContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
});
