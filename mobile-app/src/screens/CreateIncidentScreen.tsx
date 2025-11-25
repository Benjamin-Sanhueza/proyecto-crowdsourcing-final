import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import { TextInput, Button, ActivityIndicator, Card, SegmentedButtons, Text } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import api from '../services/api'; 

const CreateIncidentScreen = ({ navigation }: any) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'equipment' | 'infrastructure' | 'services'>('equipment');
  const [location, setLocation] = useState('');
  const [satisfaction, setSatisfaction] = useState<'1' | '2' | '3' | '4' | '5'>('3');
  const [images, setImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    if (images.length >= 3) {
      Alert.alert('Límite alcanzado', 'Solo puedes seleccionar hasta 3 imágenes.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled) setImages((prev) => [...prev, ...result.assets]);
  };

  const handleSubmit = async () => {
    if (!title || !description || !location || !category) {
      Alert.alert('Campos requeridos', 'Por favor, completa todos los campos.');
      return;
    }

    try {
      setLoading(true);

      try {
        const ping = await fetch('http://10.0.2.2:4000/');
        const txt = await ping.text();
        console.log('RAW PING:', ping.status, txt);
      } catch (e: any) {
        console.log('RAW PING FAIL:', e?.message || e);
        Alert.alert('Sin conexión al backend', e?.message || 'Revisa red/puerto');
        return;
      }

      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('location', location);
      formData.append('satisfaction', satisfaction); 
      images.forEach((image, idx) => {
        const fileName =
          (image.fileName && image.fileName.includes('.'))
            ? image.fileName
            : `photo_${idx}.jpg`;

        let type: string = 'image/jpeg';
        const ext = fileName.split('.').pop()?.toLowerCase();
        if (ext === 'png') type = 'image/png';
        if (ext === 'jpeg' || ext === 'jpg') type = 'image/jpeg';

        formData.append('images', {
          uri: image.uri,
          name: fileName,
          type,
        } as any);
      });

      const token = await SecureStore.getItemAsync('token');
      if (!token) {
        Alert.alert('Sesión', 'No hay token. Inicia sesión nuevamente.');
        return;
      }

      const base = (api.defaults.baseURL || '').replace(/\/$/, '');
      const url = `${base}/incidents`;

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        body: formData as any,
      });

      const text = await res.text();
      console.log('CREATE STATUS:', res.status, 'BODY:', text);

      if (!res.ok) {
        try {
          const j = JSON.parse(text);
          throw new Error(j?.message || `HTTP ${res.status}`);
        } catch {
          throw new Error(text || `HTTP ${res.status}`);
        }
      }

      Alert.alert('Éxito', 'Incidencia reportada correctamente.');
      navigation.navigate('MyIncidents');
      setTitle('');
      setDescription('');
      setLocation('');
      setImages([]);
      setSatisfaction('3');
      setCategory('equipment');
    } catch (err: any) {
      console.log('Create incident failed - message:', err?.message || err);
      Alert.alert('Error', err?.message || 'No se pudo reportar la incidencia.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Card style={{ padding: 10 }}>
        <Card.Title title="Nuevo Reporte de Incidencia" />
        <Card.Content>
          <TextInput
            label="Título (Ej: Proyector no enciende)"
            value={title}
            onChangeText={setTitle}
            style={styles.input}
          />
          <TextInput
            label="Descripción detallada"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            style={styles.input}
          />
          <TextInput
            label="Ubicación (Ej: Sala B-201)"
            value={location}
            onChangeText={setLocation}
            style={styles.input}
          />

          <SegmentedButtons
            value={category}
            onValueChange={(v: any) => setCategory(v)}
            style={styles.input}
            buttons={[
              { value: 'equipment', label: 'Equipo' },
              { value: 'infrastructure', label: 'Edificio' },
              { value: 'services', label: 'Servicio' },
            ]}
          />

          <Text style={{ marginBottom: 8, marginTop: 8 }}>Satisfacción (1–5)</Text>
          <SegmentedButtons
            value={satisfaction}
            onValueChange={(v: any) => setSatisfaction(v)}
            style={styles.input}
            buttons={[
              { value: '1', label: '1' },
              { value: '2', label: '2' },
              { value: '3', label: '3' },
              { value: '4', label: '4' },
              { value: '5', label: '5' },
            ]}
          />

          <Button icon="camera" mode="outlined" onPress={pickImage} style={styles.button}>
            Añadir Imagen ({images.length}/3)
          </Button>

          <ScrollView horizontal style={styles.imagePreviewContainer}>
            {images.map((img, index) => (
              <Image key={index} source={{ uri: img.uri }} style={styles.imagePreview} />
            ))}
          </ScrollView>

          <Button mode="contained" onPress={handleSubmit} disabled={loading} style={styles.button}>
            {loading ? <ActivityIndicator animating={true} color="white" /> : 'Enviar Reporte'}
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#f5f5f5' },
  input: { marginBottom: 16 },
  button: { marginVertical: 8, padding: 4 },
  imagePreviewContainer: { flexDirection: 'row', marginBottom: 16, height: 110 },
  imagePreview: { width: 100, height: 100, marginRight: 8, borderRadius: 4, borderWidth: 1, borderColor: '#ccc' },
});

export default CreateIncidentScreen;
