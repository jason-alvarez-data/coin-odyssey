import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { palette, fontFamily, radius } from '../../theme';
import {
  Card,
  CoinDisc,
  ConfBadge,
  ConfLevel,
  Icon,
  Eyebrow,
  Button,
} from '../../components/design';

interface FieldDef {
  label: string;
  value: string;
  level: ConfLevel;
  score: number;
  sub?: string;
  placeholder?: boolean;
}

const FIELDS: FieldDef[] = [
  { label: 'COUNTRY',         value: 'Mexico',           level: 'h', score: 0.96 },
  { label: 'YEAR',            value: '1943',             level: 'h', score: 0.92 },
  { label: 'DENOMINATION',    value: '20 Centavos',      level: 'h', score: 0.94 },
  { label: 'MINT MARK',       value: 'Mo · Mexico City', level: 'm', score: 0.71 },
  { label: 'SERIES',          value: 'Josefa',           level: 'm', score: 0.68 },
  { label: 'COMPOSITION',     value: 'Bronze',           level: 'h', score: 0.88 },
  { label: 'ESTIMATED GRADE', value: 'VF-30',            level: 'm', score: 0.64 },
  {
    label: 'MARKET VALUE',
    value: '$18.20',
    level: 'h',
    score: 0.89,
    sub: 'PCGS · updated 11 May 2026',
  },
  { label: 'DIAMETER', value: '—', level: 'n', score: 0, placeholder: true },
  { label: 'MASS',     value: '—', level: 'n', score: 0, placeholder: true },
];

export default function ScanReviewScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  const onSave = () => {
    navigation.getParent()?.navigate('Collection');
  };
  const onEdit = () => {
    navigation.goBack();
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 110 }}>
        <View style={styles.header}>
          <Eyebrow color={palette.cHigh}>✓ IDENTIFIED · 96%</Eyebrow>
          <Text style={styles.title}>Mexico · 20 Centavos</Text>
          <Text style={styles.subtitle}>1943 · BRONZE · JOSEFA SERIES</Text>
        </View>

        {/* Coin pair */}
        <View style={styles.coinPair}>
          {(['OBV', 'REV'] as const).map((side) => (
            <View key={side} style={styles.coinSlot}>
              <CoinDisc size={96} label={side} tone="copper" />
              <Text style={styles.coinSlotLabel}>{side}</Text>
            </View>
          ))}
        </View>

        {/* Confidence legend */}
        <View style={styles.legend}>
          <ConfBadge level="h" label="HIGH ≥85" />
          <ConfBadge level="m" label="MED 60–85" />
          <ConfBadge level="l" label="LOW 30–60" />
        </View>

        {/* Field list */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 16 }}>
          <Card style={{ overflow: 'hidden' }}>
            {FIELDS.map((f, i) => (
              <View
                key={f.label}
                style={[
                  styles.field,
                  i > 0 && { borderTopWidth: 1, borderTopColor: palette.line },
                ]}
              >
                <View style={styles.fieldLabelRow}>
                  <Text style={styles.fieldLabel}>{f.label}</Text>
                  {f.placeholder ? (
                    <ConfBadge level="n" label="UNRECOGNIZED" />
                  ) : (
                    <ConfBadge
                      level={f.level}
                      label={f.level === 'h' ? 'HIGH' : f.level === 'm' ? 'MED' : 'LOW'}
                      score={Math.round(f.score * 100)}
                    />
                  )}
                </View>
                <Text
                  style={[
                    styles.fieldValue,
                    f.placeholder && { color: palette.fg3 },
                  ]}
                >
                  {f.value}
                </Text>
                {f.sub ? <Text style={styles.fieldSub}>{f.sub}</Text> : null}
              </View>
            ))}
          </Card>
        </View>

        {/* Disclaimer */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 22 }}>
          <View style={styles.disclaimer}>
            <Icon name="warning" size={14} color={palette.cLow} />
            <Text style={styles.disclaimerText}>
              AI grade estimates are not authoritative. For coins valued over $200,
              professional PCGS or NGC grading is recommended.
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Button label="Edit details" variant="ghost" onPress={onEdit} flex={1} />
          <Button
            label="Save to collection"
            variant="gold"
            onPress={onSave}
            flex={1.4}
            leading={<Icon name="check" size={15} color={palette.goldFg} stroke={2.4} />}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.bg },

  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20 },
  title: { fontFamily: fontFamily.display, fontSize: 26, color: palette.fg, letterSpacing: -0.5, marginTop: 6 },
  subtitle: {
    fontFamily: fontFamily.mono,
    fontSize: 11,
    color: palette.fg3,
    marginTop: 8,
    letterSpacing: 0.5,
  },

  coinPair: { paddingHorizontal: 20, paddingBottom: 18, flexDirection: 'row', gap: 10 },
  coinSlot: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: radius.base,
    backgroundColor: palette.bg2,
    borderWidth: 1,
    borderColor: palette.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinSlotLabel: {
    position: 'absolute',
    top: 10, left: 10,
    fontFamily: fontFamily.mono,
    fontSize: 9,
    color: palette.fg3,
    letterSpacing: 1.4,
  },

  legend: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },

  field: { padding: 12, paddingHorizontal: 16, gap: 4 },
  fieldLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fieldLabel: {
    fontFamily: fontFamily.mono,
    fontSize: 9.5,
    letterSpacing: 1.15,
    textTransform: 'uppercase',
    color: palette.fg3,
  },
  fieldValue: { fontFamily: fontFamily.ui, fontSize: 15, color: palette.fg },
  fieldSub: { fontFamily: fontFamily.mono, fontSize: 10, color: palette.fg4, marginTop: 3 },

  disclaimer: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.warnBorder,
    backgroundColor: palette.warnBg,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  disclaimerText: {
    flex: 1,
    fontFamily: fontFamily.ui,
    fontSize: 11.5,
    color: palette.fg2,
    lineHeight: 17,
  },

  actions: { paddingHorizontal: 20, paddingBottom: 24, flexDirection: 'row', gap: 10 },
});
