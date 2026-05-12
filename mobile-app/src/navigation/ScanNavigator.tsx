import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ScanCaptureScreen from '../screens/scan/ScanCaptureScreen';
import ScanPipelineScreen from '../screens/scan/ScanPipelineScreen';
import ScanReviewScreen from '../screens/scan/ScanReviewScreen';

export type ScanStackParamList = {
  ScanCapture: undefined;
  ScanPipeline: undefined;
  ScanReview: undefined;
};

const Stack = createStackNavigator<ScanStackParamList>();

export default function ScanNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        cardStyle: { backgroundColor: 'transparent' },
      }}
      initialRouteName="ScanCapture"
    >
      <Stack.Screen name="ScanCapture" component={ScanCaptureScreen} />
      <Stack.Screen name="ScanPipeline" component={ScanPipelineScreen} />
      <Stack.Screen name="ScanReview" component={ScanReviewScreen} />
    </Stack.Navigator>
  );
}
