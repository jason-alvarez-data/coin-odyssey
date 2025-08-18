// src/components/common/OptimizedImage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  Image, 
  View, 
  StyleSheet, 
  ActivityIndicator, 
  Text,
  Animated,
  ViewStyle,
  ImageStyle
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing } from '../../styles';
import { ImageService } from '../../services/imageService';

interface OptimizedImageProps {
  uri: string;
  style?: ImageStyle | ViewStyle;
  placeholder?: React.ReactNode;
  useThumbnail?: boolean;
  fadeIn?: boolean;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
  onLoad?: () => void;
  onError?: (error: any) => void;
  lazy?: boolean;
  priority?: 'high' | 'normal' | 'low';
}

export const OptimizedImage = ({
  uri,
  style,
  placeholder,
  useThumbnail = false,
  fadeIn = true,
  resizeMode = 'cover',
  onLoad,
  onError,
  lazy = false,
  priority = 'normal'
}: OptimizedImageProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [optimizedUri, setOptimizedUri] = useState<string>('');
  const [shouldLoad, setShouldLoad] = useState(!lazy);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (shouldLoad && uri) {
      loadOptimizedImage();
    }
  }, [shouldLoad, uri, useThumbnail]);

  const loadOptimizedImage = async () => {
    if (!uri) return;

    setLoading(true);
    setError(false);
    
    try {
      const cachedUri = await ImageService.getOptimizedImage(uri, useThumbnail);
      
      if (mountedRef.current) {
        setOptimizedUri(cachedUri);
      }
    } catch (err) {
      console.warn('Failed to load optimized image:', err);
      if (mountedRef.current) {
        setOptimizedUri(uri); // Fallback to original
      }
    }
  };

  const handleImageLoad = () => {
    if (!mountedRef.current) return;
    
    setLoading(false);
    onLoad?.();
    
    if (fadeIn) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleImageError = (err: any) => {
    if (!mountedRef.current) return;
    
    setLoading(false);
    setError(true);
    onError?.(err);
    console.warn('Image load error:', err);
  };

  const triggerLoad = () => {
    if (!shouldLoad) {
      setShouldLoad(true);
    }
  };

  const renderPlaceholder = () => {
    if (placeholder) {
      return placeholder;
    }

    return (
      <LinearGradient
        colors={['rgba(255, 215, 0, 0.1)', 'rgba(255, 215, 0, 0.05)']}
        style={[styles.defaultPlaceholder, style]}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator 
              size="small" 
              color={Colors.primary.gold} 
            />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : (
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>🖼️</Text>
            <Text style={styles.errorText}>Image unavailable</Text>
          </View>
        )}
      </LinearGradient>
    );
  };

  const renderLazyPlaceholder = () => (
    <View style={[styles.lazyPlaceholder, style]} onTouchStart={triggerLoad}>
      <LinearGradient
        colors={['rgba(255, 215, 0, 0.1)', 'rgba(255, 215, 0, 0.05)']}
        style={styles.lazyGradient}
      >
        <Text style={styles.lazyIcon}>📷</Text>
        <Text style={styles.lazyText}>Tap to load</Text>
      </LinearGradient>
    </View>
  );

  // Lazy loading - show placeholder until user interaction
  if (lazy && !shouldLoad) {
    return renderLazyPlaceholder();
  }

  // No URI provided
  if (!uri) {
    return renderPlaceholder();
  }

  // Error state
  if (error) {
    return renderPlaceholder();
  }

  // Loading state
  if (loading || !optimizedUri) {
    return renderPlaceholder();
  }

  // Render optimized image
  return (
    <Animated.View style={{ opacity: fadeIn ? fadeAnim : 1 }}>
      <Image
        source={{ uri: optimizedUri }}
        style={style}
        resizeMode={resizeMode}
        onLoad={handleImageLoad}
        onError={handleImageError}
      />
    </Animated.View>
  );
};

// High-performance image component for lists
export const ListOptimizedImage = ({
  uri,
  style,
  ...props
}: OptimizedImageProps) => {
  return (
    <OptimizedImage
      uri={uri}
      style={style}
      useThumbnail={true}
      fadeIn={false}
      lazy={true}
      priority="low"
      {...props}
    />
  );
};

// Hero image component for detail views
export const HeroOptimizedImage = ({
  uri,
  style,
  ...props
}: OptimizedImageProps) => {
  return (
    <OptimizedImage
      uri={uri}
      style={style}
      useThumbnail={false}
      fadeIn={true}
      lazy={false}
      priority="high"
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  defaultPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.card,
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
    marginTop: Spacing.xs,
  },
  errorContainer: {
    alignItems: 'center',
  },
  errorIcon: {
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  errorText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
    textAlign: 'center',
  },
  lazyPlaceholder: {
    overflow: 'hidden',
  },
  lazyGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lazyIcon: {
    fontSize: 32,
    marginBottom: Spacing.xs,
  },
  lazyText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    fontWeight: Typography.fontWeight.medium,
  },
});

export default OptimizedImage;