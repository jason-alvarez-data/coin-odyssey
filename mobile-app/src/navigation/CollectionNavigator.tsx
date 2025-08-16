// src/navigation/CollectionNavigator.tsx
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { CollectionStackParamList } from '../types/navigation';
import CollectionListScreen from '../screens/collection/CollectionListScreen';
import CoinDetailScreen from '../screens/collection/CoinDetailScreen';
import AddCoinScreen from '../screens/collection/AddCoinScreen';
import EditCoinScreen from '../screens/collection/EditCoinScreen';

const Stack = createStackNavigator<CollectionStackParamList>();

export default function CollectionNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        cardStyle: { backgroundColor: 'transparent' },
      }}
      initialRouteName="CollectionList"
    >
      <Stack.Screen name="CollectionList" component={CollectionListScreen} />
      <Stack.Screen name="CoinDetail" component={CoinDetailScreen} />
      <Stack.Screen name="AddCoin" component={AddCoinScreen} />
      <Stack.Screen name="EditCoin" component={EditCoinScreen} />
    </Stack.Navigator>
  );
}