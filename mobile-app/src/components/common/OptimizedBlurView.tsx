// src/components/common/OptimizedBlurView.tsx
import React, { useMemo, useRef, useEffect } from 'react';
import { View, Platform, ViewStyle } from 'react-native';
import { BlurView, BlurViewProps } from 'expo-blur';
import { Colors } from '../../styles';

interface OptimizedBlurViewProps extends Omit<BlurViewProps, 'intensity'> {
  intensity?: number;
  style?: ViewStyle;
  children?: React.ReactNode;
  performanceMode?: 'auto' | 'high' | 'balanced' | 'power-saving';
  reducedMotion?: boolean;
  fallbackOpacity?: number;
}

// Performance-aware blur intensity mapping
const INTENSITY_MAP = {
  'power-saving': {
    light: { 0: 0, 20: 5, 40: 10, 60: 15, 80: 20, 100: 25 },
    heavy: { 0: 0, 20: 3, 40: 6, 60: 9, 80: 12, 100: 15 }
  },
  'balanced': {
    light: { 0: 0, 20: 10, 40: 20, 60: 30, 80: 40, 100: 50 },
    heavy: { 0: 0, 20: 6, 40: 12, 60: 18, 80: 24, 100: 30 }
  },
  'high': {
    light: { 0: 0, 20: 20, 40: 40, 60: 60, 80: 80, 100: 100 },
    heavy: { 0: 0, 20: 15, 40: 30, 60: 45, 80: 60, 100: 75 }
  }
};

// Device performance detection
let devicePerformance: 'high' | 'balanced' | 'power-saving' | null = null;

const detectDevicePerformance = (): 'high' | 'balanced' | 'power-saving' => {
  if (devicePerformance) return devicePerformance;

  // Simple heuristic based on platform
  if (Platform.OS === 'ios') {
    // iOS generally has better blur performance
    devicePerformance = 'high';
  } else {
    // Android varies widely, default to balanced
    devicePerformance = 'balanced';
  }

  return devicePerformance;
};

// Blur cache for performance
const blurCache = new Map<string, ViewStyle>();

export const OptimizedBlurView = React.memo<OptimizedBlurViewProps>(({
  intensity = 60,
  style,
  children,
  performanceMode = 'auto',
  reducedMotion = false,
  fallbackOpacity = 0.95,
  ...props
}) => {
  const mountTimeRef = useRef(Date.now());
  const renderCountRef = useRef(0);

  useEffect(() => {
    renderCountRef.current += 1;
  });

  const optimizedSettings = useMemo(() => {
    const detectedPerformance = performanceMode === 'auto' 
      ? detectDevicePerformance() 
      : performanceMode;

    // Determine blur complexity based on usage
    const isHeavyUsage = renderCountRef.current > 5 || 
                        (Date.now() - mountTimeRef.current) < 1000;
    
    const complexityLevel = isHeavyUsage ? 'heavy' : 'light';
    const intensityMapping = INTENSITY_MAP[detectedPerformance][complexityLevel];
    
    // Map intensity to performance-appropriate value
    const mappedIntensity = intensityMapping[
      Math.round(intensity / 20) * 20 as keyof typeof intensityMapping
    ] || intensity;

    return {
      intensity: mappedIntensity,
      performance: detectedPerformance,
      useNativeDriver: true,
      experimentalBlurMethod: Platform.OS === 'android' ? 'dimezisBlurView' : undefined,
    };
  }, [intensity, performanceMode, reducedMotion]);

  // Generate cache key
  const cacheKey = `${optimizedSettings.intensity}-${optimizedSettings.performance}-${JSON.stringify(style)}`;

  // Fallback for very low performance or reduced motion
  if (reducedMotion || optimizedSettings.performance === 'power-saving') {
    const cachedFallback = blurCache.get(`fallback-${cacheKey}`);
    
    if (cachedFallback) {
      return (
        <View style={cachedFallback}>
          {children}
        </View>
      );
    }

    const fallbackStyle: ViewStyle = {
      backgroundColor: `rgba(255, 255, 255, ${fallbackOpacity * 0.05})`,
      borderWidth: 1,
      borderColor: `rgba(255, 255, 255, ${fallbackOpacity * 0.1})`,
      ...style,
    };

    blurCache.set(`fallback-${cacheKey}`, fallbackStyle);

    return (
      <View style={fallbackStyle}>
        {children}
      </View>
    );
  }

  // Use native blur with optimizations
  return (
    <BlurView
      intensity={optimizedSettings.intensity}
      style={style}
      {...props}
    >
      {children}
    </BlurView>
  );
});

// Specialized blur components for different use cases
export const NavigationBlur = React.memo<Omit<OptimizedBlurViewProps, 'performanceMode'>>(
  (props) => (
    <OptimizedBlurView
      {...props}
      performanceMode="high"
      intensity={props.intensity || 80}
    />
  )
);

export const CardBlur = React.memo<Omit<OptimizedBlurViewProps, 'performanceMode'>>(
  (props) => (
    <OptimizedBlurView
      {...props}
      performanceMode="balanced"
      intensity={props.intensity || 60}
    />
  )
);

export const OverlayBlur = React.memo<Omit<OptimizedBlurViewProps, 'performanceMode'>>(
  (props) => (
    <OptimizedBlurView
      {...props}
      performanceMode="high"
      intensity={props.intensity || 100}
    />
  )
);

export const ListItemBlur = React.memo<Omit<OptimizedBlurViewProps, 'performanceMode'>>(
  (props) => (
    <OptimizedBlurView
      {...props}
      performanceMode="power-saving"
      intensity={props.intensity || 40}
      reducedMotion={true}
    />
  )
);

// Performance monitoring hook
export const useBlurPerformance = () => {
  const renderCount = useRef(0);
  const startTime = useRef(Date.now());

  useEffect(() => {
    renderCount.current += 1;
  });

  const getStats = () => ({
    renderCount: renderCount.current,
    avgRenderTime: (Date.now() - startTime.current) / renderCount.current,
    devicePerformance: detectDevicePerformance(),
    cacheSize: blurCache.size,
  });

  const clearCache = () => {
    blurCache.clear();
  };

  return { getStats, clearCache };
};

export default OptimizedBlurView;