// src/navigation/DashboardNavigator.tsx
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import MapScreen from '../screens/MapScreen';

export type DashboardStackParamList = {
  DashboardHome: undefined;
  Map: undefined;
};

const Stack = createStackNavigator<DashboardStackParamList>();

export default function DashboardNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName="DashboardHome"
    >
      <Stack.Screen 
        name="DashboardHome" 
        component={DashboardScreen}
      />
      <Stack.Screen 
        name="Map" 
        component={MapScreen}
      />
    </Stack.Navigator>
  );
}