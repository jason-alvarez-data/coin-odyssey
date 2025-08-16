import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import SimpleHomeScreen from './src/screens/SimpleHomeScreen';
import SimpleCollectionScreen from './src/screens/SimpleCollectionScreen';
import SimpleCameraScreen from './src/screens/SimpleCameraScreen';
import SimpleAnalyticsScreen from './src/screens/SimpleAnalyticsScreen';
import SimpleProfileScreen from './src/screens/SimpleProfileScreen';
import MapScreen from './src/screens/MapScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#1a1a2e',
            borderTopColor: 'rgba(255, 255, 255, 0.1)',
          },
          tabBarActiveTintColor: '#FFD700',
          tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.7)',
        }}
      >
        <Tab.Screen 
          name="Home" 
          component={SimpleHomeScreen}
          options={{
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>🏠</Text>,
          }}
        />
        <Tab.Screen 
          name="Collection" 
          component={SimpleCollectionScreen}
          options={{
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>🪙</Text>,
          }}
        />
        <Tab.Screen 
          name="Camera" 
          component={SimpleCameraScreen}
          options={{
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>📸</Text>,
          }}
        />
        <Tab.Screen 
          name="Analytics" 
          component={SimpleAnalyticsScreen}
          options={{
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>📊</Text>,
          }}
        />
        <Tab.Screen 
          name="Profile" 
          component={SimpleProfileScreen}
          options={{
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>👤</Text>,
          }}
        />
        <Tab.Screen 
          name="Map" 
          component={MapScreen}
          options={{
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>🗺️</Text>,
          }}
        />
      </Tab.Navigator>
      <StatusBar style="light" />
    </NavigationContainer>
  );
}
