// src/styles/animations.ts
import { Animated, Easing } from 'react-native';

export const Animations = {
  slideInUp: (value: Animated.Value, delay = 0) => {
    return Animated.timing(value, {
      toValue: 1,
      duration: 500,
      delay,
      easing: Easing.out(Easing.exp),
      useNativeDriver: true,
    });
  },
  
  fadeIn: (value: Animated.Value, delay = 0) => {
    return Animated.timing(value, {
      toValue: 1,
      duration: 300,
      delay,
      useNativeDriver: true,
    });
  },
  
  scaleOnPress: (value: Animated.Value) => {
    return Animated.sequence([
      Animated.timing(value, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(value, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]);
  },
};