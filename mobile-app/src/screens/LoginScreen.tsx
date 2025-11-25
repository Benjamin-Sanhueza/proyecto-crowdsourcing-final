import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Text, ActivityIndicator, Card } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/auth/login', { email, password });
      await login(response.data.user, response.data.token);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Title title="Iniciar Sesión" />
        <Card.Content>
          <TextInput label="Email" value={email} onChangeText={setEmail} style={styles.input} keyboardType="email-address" autoCapitalize="none" />
          <TextInput label="Contraseña" value={password} onChangeText={setPassword} secureTextEntry style={styles.input} />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button mode="contained" onPress={handleLogin} disabled={loading} style={styles.button}>
            {loading ? <ActivityIndicator animating={true} color="white" /> : 'Ingresar'}
          </Button>
          <Button onPress={() => navigation.navigate('Register')} disabled={loading}>
            ¿No tienes cuenta? Regístrate
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

export default LoginScreen;