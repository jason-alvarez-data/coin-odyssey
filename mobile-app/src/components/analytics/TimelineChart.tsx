// src/components/analytics/TimelineChart.tsx
import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Rect, Text as SvgText, Line } from 'react-native-svg';
import { BlurView } from 'expo-blur';
import { Colors, Typography, Spacing, GlassmorphismStyles } from '../../styles';

const { width: screenWidth } = Dimensions.get('window');
const chartWidth = screenWidth - 40;
const chartHeight = 160;
const padding = 30;

interface TimelineData {
  period: string;
  count: number;
  value: number;
  label: string;
}

interface TimelineChartProps {
  data: TimelineData[];
  title: string;
  type: 'acquisitions' | 'value';
}

export const TimelineChart: React.FC<TimelineChartProps> = ({ 
  data, 
  title, 
  type 
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

  const innerWidth = chartWidth - padding * 2;
  const innerHeight = chartHeight - padding * 2;
  const barWidth = innerWidth / data.length * 0.7;
  const barSpacing = innerWidth / data.length * 0.3;

  // Get max value for scaling
  const maxValue = Math.max(...data.map(d => type === 'acquisitions' ? d.count : d.value));
  const scaleValue = (value: number) => (value / maxValue) * innerHeight;

  // Format values
  const formatValue = (value: number) => {
    if (type === 'acquisitions') {
      return value.toString();
    } else {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    }
  };

  return (
    <BlurView intensity={60} style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      
      <View style={styles.chartContainer}>
        <Svg width={chartWidth} height={chartHeight}>
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
            const y = padding + (1 - ratio) * innerHeight;
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

          {/* Bars */}
          {data.map((item, index) => {
            const x = padding + index * (barWidth + barSpacing) + barSpacing / 2;
            const value = type === 'acquisitions' ? item.count : item.value;
            const barHeight = scaleValue(value);
            const y = padding + innerHeight - barHeight;

            return (
              <React.Fragment key={item.period}>
                {/* Bar */}
                <Rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill={Colors.primary.gold}
                  opacity={0.8}
                  rx={4}
                />
                
                {/* Value label on top of bar */}
                {barHeight > 20 && (
                  <SvgText
                    x={x + barWidth / 2}
                    y={y - 5}
                    fontSize={10}
                    fill={Colors.text.secondary}
                    textAnchor="middle"
                    fontWeight="bold"
                  >
                    {type === 'acquisitions' ? value : `$${Math.round(value)}`}
                  </SvgText>
                )}

                {/* Period label */}
                <SvgText
                  x={x + barWidth / 2}
                  y={padding + innerHeight + 20}
                  fontSize={10}
                  fill={Colors.text.secondary}
                  textAnchor="middle"
                >
                  {item.label}
                </SvgText>
              </React.Fragment>
            );
          })}

          {/* Y-axis labels */}
          <SvgText
            x={padding - 10}
            y={padding + 5}
            fontSize={10}
            fill={Colors.text.secondary}
            textAnchor="end"
          >
            {type === 'acquisitions' ? maxValue : `$${Math.round(maxValue)}`}
          </SvgText>
          <SvgText
            x={padding - 10}
            y={padding + innerHeight + 5}
            fontSize={10}
            fill={Colors.text.secondary}
            textAnchor="end"
          >
            0
          </SvgText>
        </Svg>
      </View>

      {/* Summary Stats */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total</Text>
          <Text style={styles.summaryValue}>
            {type === 'acquisitions' 
              ? data.reduce((sum, item) => sum + item.count, 0)
              : formatValue(data.reduce((sum, item) => sum + item.value, 0))
            }
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Average</Text>
          <Text style={styles.summaryValue}>
            {type === 'acquisitions'
              ? Math.round(data.reduce((sum, item) => sum + item.count, 0) / data.length)
              : formatValue(data.reduce((sum, item) => sum + item.value, 0) / data.length)
            }
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Peak</Text>
          <Text style={styles.summaryValue}>
            {type === 'acquisitions' ? maxValue : formatValue(maxValue)}
          </Text>
        </View>
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
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.background.cardBorder,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  summaryValue: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary.gold,
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