// Archivo: src/screens/LoginScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor, complete todos los campos.');
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Usuario autenticado:', userCredential.user);
      Alert.alert('Bienvenido', `Hola, ${userCredential.user.email}`);
      navigation.replace('Main'); // Navega al TabNavigator principal
    } catch (error) {
      let errorMessage;
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'Usuario no encontrado. Verifique el correo.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Contraseña incorrecta. Inténtelo de nuevo.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Correo electrónico inválido.';
          break;
        default:
          errorMessage = 'Algo salió mal. Intente de nuevo.';
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
