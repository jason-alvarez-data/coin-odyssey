import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { palette, fontFamily, radius } from '../../theme';
import { Card, CoinDisc, Icon, Eyebrow } from '../../components/design';

type Side = 'OBV' | 'REV';

export default function ScanCaptureScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  const [obvCaptured, setObvCaptured] = useState(false);
  const [revCaptured, setRevCaptured] = useState(false);
  const currentSide: Side = !obvCaptured ? 'OBV' : 'REV';
  const stepText = currentSide === 'OBV' ? 'STEP 1 OF 2 · OBVERSE' : 'STEP 2 OF 2 · REVERSE';
  const titleText = currentSide === 'OBV' ? 'Capture the front' : 'Capture the back';

  const capture = () => {
    if (!obvCaptured) {
      setObvCaptured(true);
      return;
    }
    setRevCaptured(true);
    navigation.navigate('ScanPipeline');
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 110 }}>
        <View style={styles.header}>
          <Eyebrow>{stepText}</Eyebrow>
          <Text style={styles.title}>{titleText}</Text>
        </View>

        {/* Viewfinder */}
        <View style={styles.viewfinderWrap}>
          <View style={styles.viewfinder}>
            <View style={styles.alignRingOuter}>
              <View style={styles.alignRingInner} />
              <Text style={styles.alignLabel}>ALIGN {currentSide}ERSE</Text>
            </View>
            {/* Corner brackets */}
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
            <View style={styles.viewfinderFooter}>
              <Text style={styles.viewfinderFooterText}>● FOCUS LOCKED</Text>
              <Text style={styles.viewfinderFooterText}>1:1 · f/1.8</Text>
            </View>
          </View>
        </View>

        {/* Tip */}
        <View style={styles.tipWrap}>
          <Card quiet style={styles.tipCard}>
            <Icon name="info" size={14} color={palette.gold} />
            <Text style={styles.tipText}>
              Place coin on a neutral, evenly-lit surface. Avoid glare on metallic strikes.
            </Text>
          </Card>
        </View>

        {/* Capture controls */}
        <View style={styles.controls}>
          <Pressable style={styles.smallBtn}>
            <Icon name="grid" size={18} color={palette.fg} />
          </Pressable>
          <Pressable onPress={capture} style={styles.shutter}>
            <View style={styles.shutterInner} />
          </Pressable>
          <Pressable style={styles.smallBtn}>
            <Icon name="edit" size={16} color={palette.fg} />
          </Pressable>
        </View>

        {/* Captured strip */}
        <View style={styles.capturedSection}>
          <Eyebrow style={{ marginBottom: 10 }}>CAPTURED</Eyebrow>
          <View style={styles.capturedRow}>
            <CapturedSlot label="OBV" filled={obvCaptured} tone="copper" />
            <CapturedSlot label="REV" filled={revCaptured} tone="copper" />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function CapturedSlot({
  label,
  filled,
  tone,
}: {
  label: string;
  filled: boolean;
  tone: 'gold' | 'silver' | 'copper';
}) {
  return (
    <View
      style={[
        styles.capturedSlot,
        filled
          ? { borderStyle: 'solid', backgroundColor: palette.bg2 }
          : { borderStyle: 'dashed' },
      ]}
    >
      {filled ? (
        <CoinDisc size={84} label={label} tone={tone} />
      ) : (
        <View style={{ alignItems: 'center', gap: 6 }}>
          <Icon name="plus" size={16} color={palette.fg4} />
          <Text style={styles.capturedPlaceholder}>{label}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.bg },

  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 14 },
  title: { fontFamily: fontFamily.display, fontSize: 26, color: palette.fg, letterSpacing: -0.5, marginTop: 6 },

  viewfinderWrap: { paddingHorizontal: 20, paddingBottom: 16 },
  viewfinder: {
    aspectRatio: 1,
    borderRadius: radius.lg,
    backgroundColor: palette.bg2,
    borderWidth: 1,
    borderColor: palette.line,
    overflow: 'hidden',
    position: 'relative',
  },
  alignRingOuter: {
    position: 'absolute',
    top: '10%', left: '10%', right: '10%', bottom: '10%',
    borderRadius: 999,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  alignRingInner: {
    position: 'absolute',
    top: '8%', left: '8%', right: '8%', bottom: '8%',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  alignLabel: {
    fontFamily: fontFamily.mono,
    fontSize: 10,
    letterSpacing: 2,
    color: 'rgba(255,255,255,0.4)',
  },
  corner: {
    position: 'absolute',
    width: 24, height: 24,
    borderColor: palette.gold,
  },
  cornerTL: { top: 14, left: 14, borderTopWidth: 2, borderLeftWidth: 2 },
  cornerTR: { top: 14, right: 14, borderTopWidth: 2, borderRightWidth: 2 },
  cornerBL: { bottom: 14, left: 14, borderBottomWidth: 2, borderLeftWidth: 2 },
  cornerBR: { bottom: 14, right: 14, borderBottomWidth: 2, borderRightWidth: 2 },
  viewfinderFooter: {
    position: 'absolute', bottom: 14, left: 14, right: 14,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  viewfinderFooterText: {
    fontFamily: fontFamily.mono,
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1,
  },

  tipWrap: { paddingHorizontal: 20, paddingBottom: 14 },
  tipCard: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', padding: 12 },
  tipText: {
    flex: 1,
    fontFamily: fontFamily.ui,
    fontSize: 11.5,
    color: palette.fg2,
    lineHeight: 16,
  },

  controls: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
  },
  smallBtn: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: palette.bg3,
    alignItems: 'center', justifyContent: 'center',
  },
  shutter: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: palette.gold,
    borderWidth: 4,
    borderColor: palette.goldRing,
    alignItems: 'center', justifyContent: 'center',
  },
  shutterInner: { width: 0, height: 0 },

  capturedSection: { paddingHorizontal: 20, paddingBottom: 24 },
  capturedRow: { flexDirection: 'row', gap: 10 },
  capturedSlot: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: radius.base,
    borderWidth: 1,
    borderColor: palette.line,
    alignItems: 'center', justifyContent: 'center',
  },
  capturedPlaceholder: {
    fontFamily: fontFamily.mono,
    fontSize: 9.5,
    color: palette.fg4,
    letterSpacing: 1.33,
  },
});
