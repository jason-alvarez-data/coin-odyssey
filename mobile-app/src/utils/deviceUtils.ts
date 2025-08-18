// src/utils/deviceUtils.ts
import React from 'react';
import { Dimensions, Platform, PixelRatio } from 'react-native';

export interface DeviceInfo {
  width: number;
  height: number;
  scale: number;
  fontScale: number;
  isTablet: boolean;
  isSmallDevice: boolean;
  isLargeDevice: boolean;
  deviceType: 'phone' | 'tablet';
  orientation: 'portrait' | 'landscape';
}

export class DeviceUtils {
  private static dimensions = Dimensions.get('window');
  private static screen = Dimensions.get('screen');

  static getDeviceInfo(): DeviceInfo {
    const { width, height, scale, fontScale } = this.dimensions;
    const shortDimension = Math.min(width, height);
    const longDimension = Math.max(width, height);
    
    // Device type detection
    const isTablet = (shortDimension >= 600 && longDimension >= 960) || 
                     (Platform.OS === 'ios' && (width >= 768 || height >= 768));
    
    const isSmallDevice = shortDimension < 360;
    const isLargeDevice = shortDimension > 414;
    
    const orientation = width > height ? 'landscape' : 'portrait';
    
    return {
      width,
      height,
      scale,
      fontScale,
      isTablet,
      isSmallDevice,
      isLargeDevice,
      deviceType: isTablet ? 'tablet' : 'phone',
      orientation,
    };
  }

  static getResponsiveDimensions() {
    const deviceInfo = this.getDeviceInfo();
    
    return {
      // Container dimensions
      containerPadding: deviceInfo.isSmallDevice ? 12 : deviceInfo.isTablet ? 24 : 16,
      cardMargin: deviceInfo.isSmallDevice ? 8 : deviceInfo.isTablet ? 16 : 12,
      
      // Grid columns for coin collection
      gridColumns: deviceInfo.isTablet 
        ? (deviceInfo.orientation === 'landscape' ? 4 : 3)
        : (deviceInfo.orientation === 'landscape' ? 3 : 2),
      
      // Image sizes
      coinImageSize: deviceInfo.isSmallDevice ? 80 : deviceInfo.isTablet ? 150 : 120,
      heroImageHeight: deviceInfo.isTablet ? 300 : 200,
      
      // Font scaling
      fontScaleMultiplier: Math.min(Math.max(deviceInfo.fontScale, 0.8), 1.3),
      
      // Safe area adjustments
      topSafeArea: Platform.OS === 'ios' ? (deviceInfo.height >= 812 ? 44 : 20) : 0,
      bottomSafeArea: Platform.OS === 'ios' ? (deviceInfo.height >= 812 ? 34 : 0) : 0,
    };
  }

  static getTestDevices() {
    return {
      // Common iPhone sizes
      iPhoneSE: { width: 375, height: 667, scale: 2, name: 'iPhone SE' },
      iPhone12: { width: 390, height: 844, scale: 3, name: 'iPhone 12/13/14' },
      iPhone12Pro: { width: 393, height: 852, scale: 3, name: 'iPhone 12/13/14 Pro' },
      iPhone12ProMax: { width: 428, height: 926, scale: 3, name: 'iPhone 12/13/14 Pro Max' },
      iPhone15Pro: { width: 393, height: 852, scale: 3, name: 'iPhone 15 Pro' },
      iPhone15ProMax: { width: 430, height: 932, scale: 3, name: 'iPhone 15 Pro Max' },
      
      // Common Android sizes
      galaxyS21: { width: 384, height: 854, scale: 2.75, name: 'Galaxy S21' },
      galaxyS21Ultra: { width: 412, height: 915, scale: 3.5, name: 'Galaxy S21 Ultra' },
      pixelXL: { width: 412, height: 732, scale: 3.5, name: 'Pixel XL' },
      
      // Tablets
      iPadMini: { width: 744, height: 1133, scale: 2, name: 'iPad Mini' },
      iPad: { width: 820, height: 1180, scale: 2, name: 'iPad' },
      iPadPro: { width: 1024, height: 1366, scale: 2, name: 'iPad Pro 12.9"' },
      
      // Small devices
      smallAndroid: { width: 320, height: 568, scale: 2, name: 'Small Android' },
    };
  }

  static calculateOptimalCardWidth(containerWidth: number, deviceInfo: DeviceInfo): number {
    const { gridColumns } = this.getResponsiveDimensions();
    const padding = deviceInfo.isTablet ? 24 : 16;
    const spacing = deviceInfo.isTablet ? 16 : 12;
    
    const availableWidth = containerWidth - (padding * 2);
    const cardWidth = (availableWidth - (spacing * (gridColumns - 1))) / gridColumns;
    
    return Math.max(cardWidth, 120); // Minimum card width
  }

  static getAdaptiveStyles(deviceInfo: DeviceInfo) {
    const responsive = this.getResponsiveDimensions();
    
    return {
      container: {
        paddingHorizontal: responsive.containerPadding,
        paddingTop: responsive.topSafeArea,
        paddingBottom: responsive.bottomSafeArea,
      },
      
      coinCard: {
        width: deviceInfo.isTablet ? '30%' : '48%',
        marginBottom: responsive.cardMargin,
        minHeight: deviceInfo.isSmallDevice ? 180 : deviceInfo.isTablet ? 250 : 200,
      },
      
      coinImage: {
        height: responsive.coinImageSize,
      },
      
      text: {
        fontSize: {
          xs: Math.round(10 * responsive.fontScaleMultiplier),
          sm: Math.round(12 * responsive.fontScaleMultiplier),
          md: Math.round(14 * responsive.fontScaleMultiplier),
          lg: Math.round(16 * responsive.fontScaleMultiplier),
          xl: Math.round(18 * responsive.fontScaleMultiplier),
          '2xl': Math.round(20 * responsive.fontScaleMultiplier),
          '3xl': Math.round(24 * responsive.fontScaleMultiplier),
        },
      },
      
      spacing: {
        xs: deviceInfo.isSmallDevice ? 4 : 6,
        sm: deviceInfo.isSmallDevice ? 6 : 8,
        md: deviceInfo.isSmallDevice ? 8 : 12,
        lg: deviceInfo.isSmallDevice ? 12 : 16,
        xl: deviceInfo.isSmallDevice ? 16 : 20,
        '2xl': deviceInfo.isSmallDevice ? 20 : 24,
        '3xl': deviceInfo.isSmallDevice ? 24 : 32,
      },
      
      form: {
        inputHeight: deviceInfo.isSmallDevice ? 44 : deviceInfo.isTablet ? 56 : 48,
        buttonHeight: deviceInfo.isSmallDevice ? 44 : deviceInfo.isTablet ? 56 : 48,
        dropdownMaxHeight: deviceInfo.isTablet ? 300 : 250,
      },
    };
  }

  static logDeviceInfo(): void {
    const deviceInfo = this.getDeviceInfo();
    const responsive = this.getResponsiveDimensions();
    
    console.log('🔧 Device Information:', {
      dimensions: `${deviceInfo.width}x${deviceInfo.height}`,
      scale: deviceInfo.scale,
      fontScale: deviceInfo.fontScale,
      deviceType: deviceInfo.deviceType,
      orientation: deviceInfo.orientation,
      isSmallDevice: deviceInfo.isSmallDevice,
      isLargeDevice: deviceInfo.isLargeDevice,
      gridColumns: responsive.gridColumns,
      containerPadding: responsive.containerPadding,
    });
  }
}

// Hook for using device info in components
export const useDeviceInfo = () => {
  const [deviceInfo, setDeviceInfo] = React.useState(() => DeviceUtils.getDeviceInfo());

  React.useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDeviceInfo(DeviceUtils.getDeviceInfo());
    });

    return () => subscription?.remove();
  }, []);

  return {
    ...deviceInfo,
    responsive: DeviceUtils.getResponsiveDimensions(),
    adaptiveStyles: DeviceUtils.getAdaptiveStyles(deviceInfo),
  };
};