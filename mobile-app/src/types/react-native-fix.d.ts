// Fix React 19 + React Native 0.81 type incompatibility.
// React 19's @types/react adds `bigint` to ReactNode,
// but React Native 0.81's type declarations reference an older
// ReactNode that doesn't include it, causing TS2769 errors
// when passing children to RN components.
//
// This override patches the RN component prop types to accept
// React 19's broader ReactNode definition.

import type { ReactNode } from 'react';

// Patch core RN components
declare module 'react-native' {
  interface ViewProps {
    children?: ReactNode | undefined;
  }
  interface TextProps {
    children?: ReactNode | undefined;
  }
  interface ScrollViewProps {
    children?: ReactNode | undefined;
  }
  interface TouchableOpacityProps {
    children?: ReactNode | undefined;
  }
  interface ImageProps {
    style?: import('react-native').StyleProp<
      import('react-native').ImageStyle | import('react-native').ViewStyle
    >;
  }
}

// Patch Expo components
declare module 'expo-blur' {
  interface BlurViewProps {
    children?: ReactNode | undefined;
  }
}

declare module 'expo-linear-gradient' {
  interface LinearGradientProps {
    children?: ReactNode | undefined;
  }
}
