import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Text, ActivityIndicator, Card } from 'react-native-paper';
import api from '../services/api';

const RegisterScreen = ({ navigation }: any) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!name || !email || !password) {
      setError('Todos los campos son obligatorios.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/register', { name, email, password });
      Alert.alert('Éxito', 'Te has registrado correctamente. Ahora puedes iniciar sesión.');
      navigation.goBack();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al registrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Title title="Crear Cuenta" />
        <Card.Content>
          <TextInput label="Nombre Completo" value={name} onChangeText={setName} style={styles.input} />
          <TextInput label="Email" value={email} onChangeText={setEmail} style={styles.input} autoCapitalize="none" keyboardType="email-address" />
          <TextInput label="Contraseña" value={password} onChangeText={setPassword} secureTextEntry style={styles.input} />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button mode="contained" onPress={handleRegister} disabled={loading} style={styles.button}>
            {loading ? <ActivityIndicator animating={true} color="white" /> : 'Registrar'}
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, justifyContent: 'center', backgroundColor: '#f5f5f5' },
    card: { padding: 10 },
    input: { marginBottom: 16 },
    button: { marginVertical: 8, padding: 4 },
    error: { color: 'red', marginBottom: 12, textAlign: 'center' },
});

export default RegisterScreen;