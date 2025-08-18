// src/components/debug/AnimationPerformanceTest.tsx
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Colors, Typography, Spacing, GlassmorphismStyles } from '../../styles';
import { CardBlur, OptimizedBlurView } from '../common/OptimizedBlurView';
import { ListOptimizedImage } from '../common/OptimizedImage';
import { useAnimationPerformance, AnimationPerformanceResult } from '../../utils/performanceTracker';
import { useDeviceInfo } from '../../utils/deviceUtils';

interface TestScenario {
  id: string;
  name: string;
  description: string;
  testFunction: () => Promise<AnimationPerformanceResult>;
  category: 'blur' | 'image' | 'scroll' | 'interaction';
}

export const AnimationPerformanceTest = () => {
  const deviceInfo = useDeviceInfo();
  const {
    isTracking,
    results,
    clearResults,
    trackBlurAnimation,
    trackListScrolling,
    trackImageLoading,
    generateReport,
  } = useAnimationPerformance();

  const [runningTest, setRunningTest] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);
  
  // Animation refs for visual tests
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const blurIntensity = useRef(new Animated.Value(0)).current;

  const testScenarios: TestScenario[] = [
    {
      id: 'blur-light',
      name: 'Light Blur Animation',
      description: 'Tests performance with low intensity blur effects',
      testFunction: () => trackBlurAnimation(20, 2000),
      category: 'blur',
    },
    {
      id: 'blur-medium',
      name: 'Medium Blur Animation',
      description: 'Tests performance with medium intensity blur effects',
      testFunction: () => trackBlurAnimation(50, 2000),
      category: 'blur',
    },
    {
      id: 'blur-heavy',
      name: 'Heavy Blur Animation',
      description: 'Tests performance with high intensity blur effects',
      testFunction: () => trackBlurAnimation(100, 2000),
      category: 'blur',
    },
    {
      id: 'small-list',
      name: 'Small Collection Scroll',
      description: 'Tests scrolling performance with 20 items',
      testFunction: () => trackListScrolling(20, 3000),
      category: 'scroll',
    },
    {
      id: 'large-list',
      name: 'Large Collection Scroll',
      description: 'Tests scrolling performance with 100 items',
      testFunction: () => trackListScrolling(100, 3000),
      category: 'scroll',
    },
    {
      id: 'image-loading',
      name: 'Image Loading Stress',
      description: 'Tests performance while loading multiple images',
      testFunction: () => trackImageLoading(10),
      category: 'image',
    },
  ];

  const runTest = async (scenario: TestScenario) => {
    setRunningTest(scenario.id);
    
    try {
      // Start visual animation for test feedback
      if (scenario.category === 'blur') {
        startBlurAnimation();
      } else if (scenario.category === 'interaction') {
        startInteractionAnimation();
      }
      
      await scenario.testFunction();
      
    } catch (error) {
      console.error('Test failed:', error);
    } finally {
      setRunningTest(null);
      stopAllAnimations();
    }
  };

  const runAllTests = async () => {
    for (const scenario of testScenarios) {
      await runTest(scenario);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    setShowReport(true);
  };

  const startBlurAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(blurIntensity, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(blurIntensity, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  };

  const startInteractionAnimation = () => {
    const animations = [
      Animated.loop(
        Animated.sequence([
          Animated.timing(fadeAnim, {
            toValue: 0.3,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ),
      Animated.loop(
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        })
      ),
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ),
    ];

    animations.forEach(animation => animation.start());
  };

  const stopAllAnimations = () => {
    fadeAnim.stopAnimation();
    scaleAnim.stopAnimation();
    rotateAnim.stopAnimation();
    blurIntensity.stopAnimation();
    
    // Reset values
    fadeAnim.setValue(1);
    scaleAnim.setValue(1);
    rotateAnim.setValue(0);
    blurIntensity.setValue(0);
  };

  const getPerformanceColor = (score: number): string => {
    if (score >= 90) return Colors.status.success;
    if (score >= 75) return Colors.primary.gold;
    if (score >= 60) return '#FF8C00';
    return Colors.status.error;
  };

  const renderTestCard = (scenario: TestScenario) => {
    const isRunning = runningTest === scenario.id;
    
    return (
      <CardBlur key={scenario.id} style={styles.testCard}>
        <View style={styles.testHeader}>
          <View style={styles.testInfo}>
            <Text style={styles.testName}>{scenario.name}</Text>
            <Text style={styles.testDescription}>{scenario.description}</Text>
          </View>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>
              {scenario.category.toUpperCase()}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={[
            styles.testButton,
            isRunning && styles.testButtonRunning
          ]}
          onPress={() => runTest(scenario)}
          disabled={isTracking || isRunning}
        >
          {isRunning ? (
            <ActivityIndicator size="small" color={Colors.text.primary} />
          ) : (
            <Text style={styles.testButtonText}>
              {isTracking ? 'Testing...' : 'Run Test'}
            </Text>
          )}
        </TouchableOpacity>
      </CardBlur>
    );
  };

  const renderResults = () => {
    if (results.length === 0) return null;

    return (
      <CardBlur style={styles.resultsCard}>
        <Text style={styles.resultsTitle}>📊 Test Results</Text>
        
        {results.map((result, index) => (
          <View key={index} style={styles.resultItem}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultIndex}>Test {index + 1}</Text>
              <View style={[
                styles.scoreIndicator,
                { backgroundColor: getPerformanceColor(result.smoothnessScore) }
              ]}>
                <Text style={styles.scoreText}>
                  {result.smoothnessScore.toFixed(0)}
                </Text>
              </View>
            </View>
            
            <View style={styles.resultMetrics}>
              <Text style={styles.metricText}>
                FPS: {result.averageFrameRate.toFixed(1)}
              </Text>
              <Text style={styles.metricText}>
                Dropped: {result.droppedFrames}
              </Text>
            </View>
            
            <Text style={styles.recommendation}>
              {result.recommendation}
            </Text>
          </View>
        ))}
        
        <View style={styles.reportActions}>
          <TouchableOpacity
            style={styles.reportButton}
            onPress={() => setShowReport(!showReport)}
          >
            <Text style={styles.reportButtonText}>
              {showReport ? 'Hide Report' : 'Show Full Report'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.clearButton}
            onPress={clearResults}
          >
            <Text style={styles.clearButtonText}>Clear Results</Text>
          </TouchableOpacity>
        </View>
      </CardBlur>
    );
  };

  const renderFullReport = () => {
    if (!showReport || results.length === 0) return null;

    const report = generateReport();
    
    return (
      <CardBlur style={styles.fullReportCard}>
        <Text style={styles.fullReportTitle}>📋 Detailed Performance Report</Text>
        <ScrollView style={styles.reportScroll}>
          <Text style={styles.reportText}>{report}</Text>
        </ScrollView>
      </CardBlur>
    );
  };

  const renderVisualTest = () => {
    const dynamicBlurIntensity = blurIntensity.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 80],
    });

    const rotation = rotateAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    return (
      <CardBlur style={styles.visualTestCard}>
        <Text style={styles.visualTestTitle}>🎬 Visual Performance Test</Text>
        <Text style={styles.visualTestSubtitle}>
          Watch for smoothness during animation tests
        </Text>
        
        <View style={styles.animationContainer}>
          <Animated.View
            style={[
              styles.animationBox,
              {
                opacity: fadeAnim,
                transform: [
                  { scale: scaleAnim },
                  { rotate: rotation },
                ],
              },
            ]}
          >
            <Animated.View style={styles.blurContainer}>
              <OptimizedBlurView 
                intensity={dynamicBlurIntensity}
                style={styles.animatedBlur}
              >
                <Text style={styles.animationText}>🪙</Text>
              </OptimizedBlurView>
            </Animated.View>
          </Animated.View>
        </View>
      </CardBlur>
    );
  };

  return (
    <LinearGradient colors={Colors.background.primary} style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: deviceInfo.responsive.containerPadding }
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>⚡ Animation Performance Test</Text>
          <Text style={styles.headerSubtitle}>
            Test animation smoothness across different scenarios
          </Text>
        </View>

        {renderVisualTest()}

        <CardBlur style={styles.controlsCard}>
          <TouchableOpacity
            style={[
              styles.runAllButton,
              isTracking && styles.runAllButtonDisabled
            ]}
            onPress={runAllTests}
            disabled={isTracking}
          >
            <Text style={styles.runAllButtonText}>
              {isTracking ? 'Running Tests...' : 'Run All Tests'}
            </Text>
          </TouchableOpacity>
        </CardBlur>

        <View style={styles.testsContainer}>
          <Text style={styles.sectionTitle}>Individual Tests</Text>
          {testScenarios.map(renderTestCard)}
        </View>

        {renderResults()}
        {renderFullReport()}

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  headerTitle: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary.gold,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  visualTestCard: {
    ...GlassmorphismStyles.card,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  visualTestTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  visualTestSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  animationContainer: {
    height: 120,
    width: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  animationBox: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blurContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    overflow: 'hidden',
  },
  animatedBlur: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  animationText: {
    fontSize: 32,
  },
  controlsCard: {
    ...GlassmorphismStyles.card,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  runAllButton: {
    backgroundColor: Colors.primary.gold,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  runAllButtonDisabled: {
    backgroundColor: Colors.background.cardBorder,
  },
  runAllButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: '#000',
  },
  testsContainer: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  testCard: {
    ...GlassmorphismStyles.card,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  testHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  testInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  testName: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  testDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  categoryBadge: {
    backgroundColor: Colors.primary.gold,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: '#000',
  },
  testButton: {
    backgroundColor: Colors.background.card,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary.gold,
    alignItems: 'center',
    minHeight: 40,
    justifyContent: 'center',
  },
  testButtonRunning: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
  testButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary.gold,
  },
  resultsCard: {
    ...GlassmorphismStyles.card,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  resultsTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  resultItem: {
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background.cardBorder,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  resultIndex: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },
  scoreIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: '#000',
  },
  resultMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  metricText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  recommendation: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
    lineHeight: 18,
  },
  reportActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
  },
  reportButton: {
    backgroundColor: Colors.background.card,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary.gold,
  },
  reportButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary.gold,
  },
  clearButton: {
    backgroundColor: Colors.status.error,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: 8,
  },
  clearButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: '#fff',
  },
  fullReportCard: {
    ...GlassmorphismStyles.card,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    maxHeight: 400,
  },
  fullReportTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  reportScroll: {
    flex: 1,
  },
  reportText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 18,
  },
  bottomSpacing: {
    height: 40,
  },
});

export default AnimationPerformanceTest;