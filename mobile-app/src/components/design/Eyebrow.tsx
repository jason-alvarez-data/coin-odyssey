import React from 'react';
import { Text, StyleSheet, TextStyle, StyleProp } from 'react-native';
import { palette, fontFamily } from '../../theme';

interface Props {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
  color?: string;
}

export const Eyebrow: React.FC<Props> = ({ children, style, color }) => (
  <Text style={[styles.eyebrow, color ? { color } : null, style]}>
    {children as any}
  </Text>
);

const styles = StyleSheet.create({
  eyebrow: {
    fontFamily: fontFamily.mono,
    fontSize: 10.5,
    letterSpacing: 1.47,
    textTransform: 'uppercase',
    color: palette.fg3,
  },
});
