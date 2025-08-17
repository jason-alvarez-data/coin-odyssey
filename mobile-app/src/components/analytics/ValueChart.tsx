// src/components/analytics/ValueChart.tsx
import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
import { BlurView } from 'expo-blur';
import { Colors, Typography, Spacing, GlassmorphismStyles } from '../../styles';

const { width: screenWidth } = Dimensions.get('window');
const chartWidth = screenWidth - 40;
const chartHeight = 200;
const padding = 40;

interface DataPoint {
  date: string;
  value: number;
}

interface ValueChartProps {
  data: DataPoint[];
  title: string;
  subtitle?: string;
}

export const ValueChart: React.FC<ValueChartProps> = ({ data, title, subtitle }) => {
  if (!data || data.length === 0) {
    return (
      <BlurView intensity={60} style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No data available</Text>
        </View>
      </BlurView>
    );
  }

  // Calculate chart dimensions
  const innerWidth = chartWidth - padding * 2;
  const innerHeight = chartHeight - padding * 2;

  // Get min and max values
  const values = data.map(d => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const valueRange = maxValue - minValue || 1;

  // Create path for the line chart
  const pathData = data.map((point, index) => {
    const x = padding + (index / (data.length - 1)) * innerWidth;
    const y = padding + ((maxValue - point.value) / valueRange) * innerHeight;
    return { x, y, value: point.value };
  });

  // Create SVG path string
  const pathString = pathData.reduce((path, point, index) => {
    const command = index === 0 ? 'M' : 'L';
    return `${path} ${command} ${point.x} ${point.y}`;
  }, '');

  // Create gradient area path
  const areaPathString = pathString + 
    ` L ${pathData[pathData.length - 1].x} ${padding + innerHeight}` +
    ` L ${padding} ${padding + innerHeight} Z`;

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Calculate percentage change
  const firstValue = data[0]?.value || 0;
  const lastValue = data[data.length - 1]?.value || 0;
  const percentageChange = firstValue !== 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;
  const isPositive = percentageChange >= 0;

  return (
    <BlurView intensity={60} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
        <View style={styles.valueContainer}>
          <Text style={styles.currentValue}>{formatCurrency(lastValue)}</Text>
          <View style={[styles.changeIndicator, isPositive ? styles.positive : styles.negative]}>
            <Text style={styles.changeText}>
              {isPositive ? '↗' : '↘'} {Math.abs(percentageChange).toFixed(1)}%
            </Text>
          </View>
        </View>
      </View>

      {/* Chart */}
      <View style={styles.chartContainer}>
        <Svg width={chartWidth} height={chartHeight}>
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
            const y = padding + ratio * innerHeight;
            return (
              <Line
                key={ratio}
                x1={padding}
                y1={y}
                x2={padding + innerWidth}
                y2={y}
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth={1}
              />
            );
          })}

          {/* Area gradient */}
          <Path
            d={areaPathString}
            fill="url(#gradient)"
            fillOpacity={0.2}
          />

          {/* Main line */}
          <Path
            d={pathString}
            stroke={Colors.primary.gold}
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {pathData.map((point, index) => (
            <Circle
              key={index}
              cx={point.x}
              cy={point.y}
              r={4}
              fill={Colors.primary.gold}
              stroke="rgba(255, 255, 255, 0.3)"
              strokeWidth={2}
            />
          ))}

          {/* Value labels */}
          <SvgText
            x={padding}
            y={padding - 10}
            fontSize={12}
            fill={Colors.text.secondary}
            textAnchor="start"
          >
            {formatCurrency(maxValue)}
          </SvgText>
          <SvgText
            x={padding}
            y={padding + innerHeight + 20}
            fontSize={12}
            fill={Colors.text.secondary}
            textAnchor="start"
          >
            {formatCurrency(minValue)}
          </SvgText>

          {/* Define gradient */}
          <Defs>
            <LinearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={Colors.primary.gold} stopOpacity={0.3} />
              <Stop offset="100%" stopColor={Colors.primary.gold} stopOpacity={0} />
            </LinearGradient>
          </Defs>
        </Svg>
      </View>

      {/* Time period labels */}
      <View style={styles.timeLabels}>
        <Text style={styles.timeLabel}>{data[0]?.date}</Text>
        <Text style={styles.timeLabel}>{data[data.length - 1]?.date}</Text>
      </View>
    </BlurView>
  );
};

const styles = StyleSheet.create({
  container: {
    ...GlassmorphismStyles.card,
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  valueContainer: {
    alignItems: 'flex-end',
  },
  currentValue: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary.gold,
    marginBottom: Spacing.xs,
  },
  changeIndicator: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
  },
  positive: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  negative: {
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
  },
  changeText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  timeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: padding,
  },
  timeLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
  },
  emptyState: {
    height: chartHeight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
  },
});