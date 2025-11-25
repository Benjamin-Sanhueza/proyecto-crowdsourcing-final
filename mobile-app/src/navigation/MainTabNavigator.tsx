import React from 'react';
import { createMaterialBottomTabNavigator } from '@react-navigation/material-bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../context/AuthContext';

import MyIncidentsScreen from '../screens/MyIncidentsScreen';
import CreateIncidentScreen from '../screens/CreateIncidentScreen';
import { Button } from 'react-native-paper';

const Tab = createMaterialBottomTabNavigator();

const MainTabNavigator = () => {
  const { logout } = useAuth();
  return (
    <>
      <Tab.Navigator
        initialRouteName="MyIncidents"
        activeColor="#6200ee"
        inactiveColor="#3e2465"
        barStyle={{ backgroundColor: 'white' }}
      >
        <Tab.Screen
          name="MyIncidents"
          component={MyIncidentsScreen}
          options={{
            tabBarLabel: 'Mis Reportes',
            tabBarIcon: ({ color }) => (
              <Icon name="format-list-bulleted" color={color} size={26} />
            ),
          }}
        />
        <Tab.Screen
          name="CreateIncident"
          component={CreateIncidentScreen}
          options={{
            tabBarLabel: 'Reportar',
            tabBarIcon: ({ color }) => (
              <Icon name="plus-box" color={color} size={26} />
            ),
          }}
        />
      </Tab.Navigator>
      <Button icon="logout" mode="contained" onPress={logout} style={{ borderRadius: 0 }}>
        Cerrar Sesión
      </Button>
    </>
  );
};

export default MainTabNavigator;