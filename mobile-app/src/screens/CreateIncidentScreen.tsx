import React, { useState } from 'react';
import { StyleSheet, ScrollView, Alert, Image } from 'react-native';
import { TextInput, Button, ActivityIndicator, Card, SegmentedButtons, Text } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import api from '../services/api'; // Importamos el api corregido del paso 1

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
      Alert.alert('Límite alcanzado', 'Solo 3 imágenes máximo.');
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
    if (!title || !description || !location) {
      Alert.alert('Faltan datos', 'Completa título, descripción y ubicación.');
      return;
    }

    try {
      setLoading(true);

      // 1. PREPARAR EL FORM DATA (DATOS + FOTOS)
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('location', location);
      formData.append('satisfaction', satisfaction); 
      
      images.forEach((image, idx) => {
        const fileName = image.fileName || `photo_${idx}.jpg`;
        const type = fileName.endsWith('.png') ? 'image/png' : 'image/jpeg';

        // @ts-ignore
        formData.append('images', {
          uri: image.uri,
          name: fileName,
          type,
        });
      });

      // 2. ENVIAR A RENDER (Sin hacer ping local)
      console.log('Enviando a:', api.defaults.baseURL);
      
      await api.post('/incidents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data', // Importante para las fotos
        },
      });

      Alert.alert('¡Éxito!', 'Reporte enviado correctamente.');
      navigation.navigate('MyIncidents'); // O volver atrás
      
      // Limpiar campos
      setTitle(''); setDescription(''); setLocation(''); setImages([]);

    } catch (err: any) {
      console.log('Error:', err);
      const msg = err.response?.data?.message || err.message || 'Error de conexión';
      Alert.alert('Error', 'No se pudo enviar: ' + msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Card style={{ padding: 10 }}>
        <Card.Title title="Nuevo Reporte" />
        <Card.Content>
          <TextInput label="Título" value={title} onChangeText={setTitle} style={styles.input} />
          <TextInput label="Descripción" value={description} onChangeText={setDescription} multiline numberOfLines={3} style={styles.input} />
          <TextInput label="Ubicación" value={location} onChangeText={setLocation} style={styles.input} />

          <Text style={{marginTop: 10}}>Categoría</Text>
          <SegmentedButtons
            value={category}
            onValueChange={(v: any) => setCategory(v)}
            buttons={[
              { value: 'equipment', label: 'Equipo' },
              { value: 'infrastructure', label: 'Edificio' },
              { value: 'services', label: 'Servicio' },
            ]}
            style={styles.input}
          />

          <Button icon="camera" mode="outlined" onPress={pickImage} style={styles.button}>
            Foto ({images.length}/3)
          </Button>

          <Button mode="contained" onPress={handleSubmit} disabled={loading} style={styles.button}>
            {loading ? <ActivityIndicator color="white" /> : 'ENVIAR REPORTE'}
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16 },
  input: { marginBottom: 12 },
  button: { marginVertical: 8 },
});

export default CreateIncidentScreen;