import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';

import { palette, fontFamily, radius } from '../../theme';
import {
  Card,
  ConfBadge,
  ConfLevel,
  Icon,
  Eyebrow,
  Button,
} from '../../components/design';
import { ScanStackParamList } from '../../types/navigation';
import { RecognitionConfidence } from '../../types/recognition';
import { useCurrency } from '../../contexts/CurrencyContext';

const DISCLAIMER_THRESHOLD_USD = 200;

interface FieldDef {
  label: string;
  value: string;
  level: ConfLevel;
  score: number;
  sub?: string;
  placeholder?: boolean;
}

function confToLevel(c: RecognitionConfidence | 'high' | 'medium' | 'low' | undefined): ConfLevel {
  switch (c) {
    case 'high':
      return 'h';
    case 'medium':
      return 'm';
    case 'low':
      return 'l';
    default:
      return 'n';
  }
}

function confToScore(c: RecognitionConfidence | 'high' | 'medium' | 'low' | undefined): number {
  switch (c) {
    case 'high':
      return 0.9;
    case 'medium':
      return 0.7;
    case 'low':
      return 0.4;
    default:
      return 0;
  }
}

function buildField(
  label: string,
  raw: string | number | null | undefined,
  conf: RecognitionConfidence | 'high' | 'medium' | 'low' | undefined,
  sub?: string
): FieldDef {
  const has = raw !== null && raw !== undefined && String(raw).trim() !== '';
  return {
    label,
    value: has ? String(raw) : '—',
    level: has ? confToLevel(conf) : 'n',
    score: has ? confToScore(conf) : 0,
    sub: has ? sub : undefined,
    placeholder: !has,
  };
}

export default function ScanReviewScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<ScanStackParamList, 'ScanReview'>>();
  const { result } = route.params;
  const { recognition, pricing, estimatedValue, coin, obverseUri, reverseUri } = result;
  const { format: formatCurrency } = useCurrency();

  const titleLine = useMemo(() => {
    const parts = [recognition.country, recognition.denomination].filter(Boolean);
    return parts.join(' · ') || coin.name || 'Untitled coin';
  }, [recognition, coin]);

  const subtitleLine = useMemo(() => {
    const parts = [
      recognition.year ? String(recognition.year) : null,
      recognition.composition,
      recognition.grade,
    ].filter(Boolean);
    return parts.length ? parts.join(' · ').toUpperCase() : null;
  }, [recognition]);

  const eyebrowText = useMemo(() => {
    const pct = Math.round(confToScore(recognition.confidence) * 100);
    const prefix =
      recognition.confidence === 'high'
        ? '✓ IDENTIFIED'
        : recognition.confidence === 'medium'
        ? '~ IDENTIFIED'
        : 'TENTATIVE';
    return `${prefix} · ${pct}%`;
  }, [recognition]);

  const eyebrowColor =
    recognition.confidence === 'high'
      ? palette.cHigh
      : recognition.confidence === 'medium'
      ? palette.cMed
      : palette.cLow;

  const fields: FieldDef[] = useMemo(() => {
    const base: FieldDef[] = [
      buildField('COUNTRY', recognition.country, recognition.confidence),
      buildField('YEAR', recognition.year, recognition.confidence),
      buildField('DENOMINATION', recognition.denomination, recognition.confidence),
      buildField('MINT MARK', recognition.mintMark, recognition.confidence),
      buildField('COMPOSITION', recognition.composition, recognition.confidence),
      buildField('ESTIMATED GRADE', recognition.grade, recognition.gradeConfidence),
    ];

    if (estimatedValue != null && pricing) {
      const sub =
        pricing.source === 'pcgs'
          ? `PCGS · ${new Date(pricing.lastUpdated).toLocaleDateString()}`
          : `${pricing.source} · estimate`;
      base.push({
        label: 'MARKET VALUE',
        value: formatCurrency(estimatedValue),
        level: confToLevel(pricing.confidence),
        score: confToScore(pricing.confidence),
        sub,
      });
    } else {
      base.push({
        label: 'MARKET VALUE',
        value: '—',
        level: 'n',
        score: 0,
        placeholder: true,
      });
    }

    return base;
  }, [recognition, pricing, estimatedValue]);

  const showDisclaimer =
    (estimatedValue ?? 0) >= DISCLAIMER_THRESHOLD_USD;

  const onEdit = () => {
    navigation.getParent()?.navigate('Collection', {
      screen: 'EditCoin',
      params: { coinId: coin.id },
    });
  };

  const onDone = () => {
    navigation.getParent()?.navigate('Collection');
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 110 }}>
        <View style={styles.header}>
          <Eyebrow color={eyebrowColor}>{eyebrowText}</Eyebrow>
          <Text style={styles.title}>{titleLine}</Text>
          {subtitleLine && <Text style={styles.subtitle}>{subtitleLine}</Text>}
        </View>

        {/* Coin pair — real captured images */}
        <View style={styles.coinPair}>
          {([
            { side: 'OBV', uri: obverseUri },
            { side: 'REV', uri: reverseUri },
          ] as const).map(({ side, uri }) => (
            <View key={side} style={styles.coinSlot}>
              <Image source={{ uri }} style={styles.coinImage} />
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
            {fields.map((f, i) => (
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

        {recognition.notes && (
          <View style={{ paddingHorizontal: 20, paddingBottom: 18 }}>
            <Eyebrow style={{ marginBottom: 8 }}>NOTES</Eyebrow>
            <Card style={{ padding: 14 }}>
              <Text style={styles.notesText}>{recognition.notes}</Text>
            </Card>
          </View>
        )}

        {/* Disclaimer — only for high-value coins */}
        {showDisclaimer && (
          <View style={{ paddingHorizontal: 20, paddingBottom: 22 }}>
            <View style={styles.disclaimer}>
              <Icon name="warning" size={14} color={palette.cLow} />
              <Text style={styles.disclaimerText}>
                Estimated value exceeds ${DISCLAIMER_THRESHOLD_USD}. AI grade estimates are not
                authoritative — for sale, insurance, or auction, get a professional PCGS or NGC
                grade.
              </Text>
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <Button label="Edit details" variant="ghost" onPress={onEdit} flex={1} />
          <Button
            label="Done"
            variant="gold"
            onPress={onDone}
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
  title: {
    fontFamily: fontFamily.display,
    fontSize: 26,
    color: palette.fg,
    letterSpacing: -0.5,
    marginTop: 6,
  },
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
    overflow: 'hidden',
  },
  coinImage: { width: '100%', height: '100%' },
  coinSlotLabel: {
    position: 'absolute',
    top: 10, left: 10,
    fontFamily: fontFamily.mono,
    fontSize: 9,
    color: palette.gold,
    letterSpacing: 1.4,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
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

  notesText: {
    fontFamily: fontFamily.ui,
    fontSize: 13,
    color: palette.fg2,
    lineHeight: 19,
    fontStyle: 'italic',
  },

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
