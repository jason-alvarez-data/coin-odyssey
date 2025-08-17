// src/components/analytics/CountryDistributionChart.tsx
import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Circle, Text as SvgText, Path } from 'react-native-svg';
import { BlurView } from 'expo-blur';
import { Colors, Typography, Spacing, GlassmorphismStyles } from '../../styles';

const { width: screenWidth } = Dimensions.get('window');
const chartSize = Math.min(screenWidth - 80, 200);
const radius = chartSize / 2 - 20;
const centerX = chartSize / 2;
const centerY = chartSize / 2;

interface CountryData {
  country: string;
  count: number;
  percentage: number;
}

interface CountryDistributionChartProps {
  data: CountryData[];
  title: string;
}

export const CountryDistributionChart: React.FC<CountryDistributionChartProps> = ({ 
  data, 
  title 
}) => {
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

  // Colors for different countries
  const colors = [
    Colors.primary.gold,
    '#4CAF50',
    '#2196F3',
    '#FF9800',
    '#9C27B0',
    '#F44336',
    '#00BCD4',
    '#795548',
  ];

  // Calculate angles for pie chart
  let currentAngle = -Math.PI / 2; // Start from top
  const segments = data.map((item, index) => {
    const angle = (item.percentage / 100) * 2 * Math.PI;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    // Calculate path for arc
    const largeArcFlag = angle > Math.PI ? 1 : 0;
    const x1 = centerX + radius * Math.cos(startAngle);
    const y1 = centerY + radius * Math.sin(startAngle);
    const x2 = centerX + radius * Math.cos(endAngle);
    const y2 = centerY + radius * Math.sin(endAngle);

    const pathData = [
      `M ${centerX} ${centerY}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      'Z'
    ].join(' ');

    return {
      ...item,
      pathData,
      color: colors[index % colors.length],
      startAngle,
      endAngle,
    };
  });

  return (
    <BlurView intensity={60} style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      
      <View style={styles.chartContainer}>
        {/* Pie Chart */}
        <Svg width={chartSize} height={chartSize}>
          {segments.map((segment, index) => (
            <React.Fragment key={segment.country}>
              <Path
                d={segment.pathData}
                fill={segment.color}
                opacity={0.8}
              />
              {/* Percentage labels */}
              {segment.percentage > 5 && (
                <SvgText
                  x={centerX + (radius * 0.7) * Math.cos((segment.startAngle + segment.endAngle) / 2)}
                  y={centerY + (radius * 0.7) * Math.sin((segment.startAngle + segment.endAngle) / 2)}
                  fontSize={12}
                  fill="white"
                  textAnchor="middle"
                  fontWeight="bold"
                >
                  {segment.percentage.toFixed(0)}%
                </SvgText>
              )}
            </React.Fragment>
          ))}
          
          {/* Center circle */}
          <Circle
            cx={centerX}
            cy={centerY}
            r={radius * 0.4}
            fill={Colors.background.primary[0]}
            opacity={0.9}
          />
          
          {/* Total count in center */}
          <SvgText
            x={centerX}
            y={centerY - 5}
            fontSize={16}
            fill={Colors.primary.gold}
            textAnchor="middle"
            fontWeight="bold"
          >
            {data.reduce((sum, item) => sum + item.count, 0)}
          </SvgText>
          <SvgText
            x={centerX}
            y={centerY + 15}
            fontSize={12}
            fill={Colors.text.secondary}
            textAnchor="middle"
          >
            Total
          </SvgText>
        </Svg>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {segments.slice(0, 6).map((segment, index) => (
          <View key={segment.country} style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: segment.color }]} />
            <Text style={styles.legendText} numberOfLines={1}>
              {segment.country}
            </Text>
            <Text style={styles.legendCount}>({segment.count})</Text>
          </View>
        ))}
        {data.length > 6 && (
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#666' }]} />
            <Text style={styles.legendText}>
              +{data.length - 6} more
            </Text>
          </View>
        )}
      </View>
    </BlurView>
  );
};

const styles = StyleSheet.create({
  container: {
    ...GlassmorphismStyles.card,
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  chartContainer: {
    marginBottom: Spacing.lg,
  },
  legend: {
    width: '100%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: Spacing.sm,
  },
  legendText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
    fontWeight: Typography.fontWeight.medium,
  },
  legendCount: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginLeft: Spacing.sm,
  },
  emptyState: {
    height: chartSize,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
  },
});