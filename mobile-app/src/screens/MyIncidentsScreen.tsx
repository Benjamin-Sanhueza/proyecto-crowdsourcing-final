import React, { useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { Text, Card, Title, Paragraph, Chip, ActivityIndicator, Banner } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';

const MyIncidentsScreen = () => {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchIncidents = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/incidents/user');
      setIncidents(response.data);
    } catch (err) {
      setError('No se pudieron cargar los reportes.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);
  
  useFocusEffect(
    useCallback(() => {
      fetchIncidents();
    }, [fetchIncidents])
  );
  
  if (loading && incidents.length === 0) {
    return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  }

  return (
    <View style={{flex: 1}}>
        <Banner visible={!!error} actions={[{label: 'Reintentar', onPress: fetchIncidents,}]} icon="alert-circle-outline">
            {error}
        </Banner>
        {incidents.length === 0 && !loading ? (
             <View style={styles.center}><Text>Aún no has creado ningún reporte.</Text></View>
        ) : (
            <FlatList
                data={incidents}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.container}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchIncidents} />}
                renderItem={({ item }) => (
                    <Card style={styles.card}>
                    <Card.Content>
                        <Title>{item.title}</Title>
                        <Paragraph>Ubicación: {item.location}</Paragraph>
                        <View style={styles.chipContainer}>
        <Chip icon="tag" style={{flex: 1, marginRight: 8}}>{item.category}</Chip>
        <Chip icon="star" style={{ marginRight: 8 }}>
          {item.satisfaction ? `⭐ ${item.satisfaction}/5` : 'Sin nota'}
        </Chip>
        <Chip icon="list-status" style={{backgroundColor: item.status === 'resolved' ? '#c8e6c9' : (item.status === 'in_progress' ? '#fff9c4' : '#ffcdd2')}}>
          {item.status}
        </Chip>
      </View>
                    </Card.Content>
                    </Card>
                )}
            />
        )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 8 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { marginVertical: 8, marginHorizontal: 8 },
  chipContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
});

export default MyIncidentsScreen;