import React from 'react';
import { View, Text, StyleSheet, ImageSourcePropType, Image } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import { palette, fontFamily } from '../../theme';

export type DiscTone = 'gold' | 'silver' | 'copper';

interface Props {
  size?: number;
  label?: string;
  tone?: DiscTone;
  imageSource?: ImageSourcePropType;
}

const toneColors: Record<DiscTone, [string, string, string]> = {
  gold:   [palette.goldCoinHi,  palette.goldCoinMid,  palette.goldCoinLo],
  silver: [palette.silverHi,    palette.silverMid,    palette.silverLo],
  copper: [palette.copperHi,    palette.copperMid,    palette.copperLo],
};

export const CoinDisc: React.FC<Props> = ({ size = 56, label = 'OBV', tone = 'gold', imageSource }) => {
  const [hi, mid, lo] = toneColors[tone];
  const labelSize = Math.max(7.5, size * 0.13);
  const innerInset = size * 0.08;
  const gradientId = `coin-${tone}-${size}`;

  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: size / 2 }]}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient
            id={gradientId}
            cx={size * 0.3}
            cy={size * 0.25}
            rx={size}
            ry={size}
            fx={size * 0.3}
            fy={size * 0.25}
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0%" stopColor={hi} />
            <Stop offset="45%" stopColor={mid} />
            <Stop offset="100%" stopColor={lo} />
          </RadialGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${gradientId})`} />
      </Svg>
      {imageSource ? (
        <Image source={imageSource} style={[StyleSheet.absoluteFill, { borderRadius: size / 2 }]} resizeMode="cover" />
      ) : (
        <>
          <View
            style={[
              styles.dashRing,
              {
                top: innerInset,
                left: innerInset,
                right: innerInset,
                bottom: innerInset,
                borderRadius: (size - innerInset * 2) / 2,
              },
            ]}
          />
          <Text style={[styles.label, { fontSize: labelSize }]} numberOfLines={1}>
            {label}
          </Text>
        </>
      )}
      <View style={[styles.innerHighlight, { borderRadius: size / 2 }]} pointerEvents="none" />
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: palette.bg3,
  },
  dashRing: {
    position: 'absolute',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  label: {
    fontFamily: fontFamily.mono,
    color: 'rgba(255,255,255,0.42)',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  innerHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
});
