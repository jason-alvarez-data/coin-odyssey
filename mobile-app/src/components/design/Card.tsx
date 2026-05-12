import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { palette, radius } from '../../theme';

interface Props extends ViewProps {
  quiet?: boolean;
}

export const Card: React.FC<Props> = ({ quiet, style, children, ...rest }) => (
  <View style={[quiet ? styles.quiet : styles.card, style]} {...rest}>
    {children}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.bg2,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: radius.base,
  },
  quiet: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: radius.base,
  },
});
