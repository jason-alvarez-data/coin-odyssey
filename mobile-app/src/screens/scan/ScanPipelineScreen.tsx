import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { palette, fontFamily } from '../../theme';
import { CoinDisc, Icon, Eyebrow } from '../../components/design';

interface StageDef {
  title: string;
  detail: string;
  result: string;
}

const STAGES: StageDef[] = [
  { title: 'Identifying coin',   detail: 'Vision · Claude Haiku',                 result: 'Mexico · 20 Centavos · 1943' },
  { title: 'Estimating grade',   detail: 'Sheldon scale · wear, luster, strike',  result: 'VF-30 · medium confidence' },
  { title: 'Looking up value',   detail: 'PCGS price guide',                       result: '$18.20 · updated 11 May 2026' },
  { title: 'Cataloging entry',   detail: 'Saving to your collection',              result: 'Added to collection' },
];

const STAGE_DURATIONS = [900, 1100, 1000, 900];

export default function ScanPipelineScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [stage, setStage] = useState(0);
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    let t = 0;
    STAGE_DURATIONS.forEach((d, i) => {
      t += d;
      timers.push(setTimeout(() => setStage(i + 1), t));
    });
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (stage >= 4) {
      const t = setTimeout(() => {
        navigation.replace('ScanReview');
      }, 700);
      return () => clearTimeout(t);
    }
  }, [stage, navigation]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 110 }}>
        <View style={styles.header}>
          <Eyebrow>SCANNING</Eyebrow>
          <Text style={styles.title}>
            {stage < 4 ? 'One moment…' : 'Done. Review below.'}
          </Text>
        </View>

        {/* Spinning coin */}
        <View style={styles.coinWrap}>
          <View style={styles.coinPositioner}>
            <Animated.View
              style={[
                styles.coinSpinRing,
                { transform: stage < 4 ? [{ rotate }] : [] },
              ]}
            />
            <CoinDisc size={140} label="OBV" tone="copper" />
            {stage >= 1 && (
              <View style={styles.checkBadge}>
                <Icon name="check" size={18} color={palette.goldFg} stroke={2.4} />
              </View>
            )}
          </View>
        </View>

        {/* Stage list */}
        <View style={styles.stageList}>
          {STAGES.map((s, i) => {
            const state: 'done' | 'active' | 'queued' =
              i < stage ? 'done' : i === stage ? 'active' : 'queued';
            return (
              <View key={i}>
                <View style={styles.stage}>
                  <StageBullet state={state} />
                  <View style={styles.stageBody}>
                    <Text
                      style={[
                        styles.stageTitle,
                        state === 'queued' && { color: palette.fg4 },
                      ]}
                    >
                      {s.title}
                    </Text>
                    <Text style={styles.stageDetail}>
                      {state === 'done' ? s.result : s.detail}
                    </Text>
                  </View>
                  {state === 'active' && <ActiveSpinner />}
                </View>
                {i < STAGES.length - 1 && (
                  <View
                    style={[
                      styles.stageConnector,
                      i < stage && { backgroundColor: palette.gold },
                    ]}
                  />
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

function StageBullet({ state }: { state: 'done' | 'active' | 'queued' }) {
  return (
    <View
      style={[
        styles.bullet,
        state === 'done' && { backgroundColor: palette.gold, borderColor: palette.gold },
        state === 'active' && { borderColor: palette.gold },
      ]}
    >
      {state === 'done' && <Icon name="check" size={12} color={palette.goldFg} stroke={2.6} />}
      {state === 'active' && <View style={[styles.bulletInnerDot, { backgroundColor: palette.gold }]} />}
      {state === 'queued' && (
        <View style={[styles.bulletInnerDot, { backgroundColor: palette.fg4, width: 4, height: 4, borderRadius: 2 }]} />
      )}
    </View>
  );
}

function ActiveSpinner() {
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return (
    <Animated.View
      style={[
        styles.activeSpinner,
        { transform: [{ rotate }] },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.bg },

  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 28 },
  title: { fontFamily: fontFamily.display, fontSize: 26, color: palette.fg, letterSpacing: -0.5, marginTop: 6 },

  coinWrap: { paddingHorizontal: 20, paddingBottom: 28, alignItems: 'center' },
  coinPositioner: { width: 140, height: 140, alignItems: 'center', justifyContent: 'center' },
  coinSpinRing: {
    position: 'absolute',
    width: 152, height: 152,
    borderRadius: 76,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.12)',
  },
  checkBadge: {
    position: 'absolute',
    bottom: -8, right: -8,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: palette.gold,
    alignItems: 'center', justifyContent: 'center',
  },

  stageList: { paddingHorizontal: 20, paddingBottom: 24 },
  stage: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, paddingVertical: 14 },
  bullet: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 1, borderColor: palette.line,
    backgroundColor: palette.bg2,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 2,
  },
  bulletInnerDot: { width: 6, height: 6, borderRadius: 3 },
  stageBody: { flex: 1 },
  stageTitle: { fontFamily: fontFamily.ui, fontSize: 14, color: palette.fg },
  stageDetail: {
    fontFamily: fontFamily.mono,
    fontSize: 10.5,
    color: palette.fg4,
    marginTop: 3,
    letterSpacing: 0.4,
  },
  activeSpinner: {
    width: 14, height: 14, borderRadius: 7,
    borderWidth: 1.5, borderColor: palette.gold,
    borderTopColor: 'transparent',
    marginTop: 4,
  },
  stageConnector: {
    width: 1, height: 18,
    backgroundColor: palette.line,
    marginLeft: 11,
  },
});
