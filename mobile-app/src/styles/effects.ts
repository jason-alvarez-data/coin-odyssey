// src/styles/effects.ts
import { ViewStyle } from 'react-native';

export const GlassmorphismStyles = {
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    overflow: 'hidden',
    // Note: react-native-blur or expo-blur for backdrop effects
  } as ViewStyle,
  
  navigation: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
    overflow: 'hidden',
  } as ViewStyle,
  
  premiumCard: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 16,
    overflow: 'hidden',
  } as ViewStyle,
};