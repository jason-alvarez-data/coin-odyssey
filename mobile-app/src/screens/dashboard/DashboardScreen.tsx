import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

import { palette, fontFamily, spacing, radius } from '../../theme';
import {
  CoinDisc,
  DiscTone,
  Icon,
  MiniChart,
  Stat,
  Eyebrow,
  Card,
  WorldMap,
} from '../../components/design';

import { CoinService } from '../../services/coinService';
import type { Coin } from '../../types/coin';
import { useAuth } from '../../hooks/useAuth';

interface Stats {
  totalCoins: number;
  totalValue: number;
  uniqueCountries: number;
  countryCodes: string[];
  recentCoins: Coin[];
  monthlySeries: number[];
}

const FALLBACK_SERIES = [
  18200, 18600, 19100, 19350, 19600, 20100, 20450, 20800, 21500, 22100, 22600, 23420,
];

const MONTH_TICKS = ["MAY '25", 'AUG', 'NOV', 'FEB', "MAY '26"];

const COUNTRY_TO_CODE: Record<string, string> = {
  'United States': 'US', USA: 'US', America: 'US',
  Canada: 'CA',
  Mexico: 'MX',
  'United Kingdom': 'UK', UK: 'UK', Britain: 'UK', England: 'UK',
  France: 'FR',
  Germany: 'DE',
  Italy: 'IT',
  Spain: 'ES',
  Brazil: 'BR',
  Argentina: 'AR',
  Russia: 'RU',
  China: 'CN',
  Japan: 'JP',
  India: 'IN',
  'South Africa': 'ZA',
  Egypt: 'EG',
  Australia: 'AU',
  'New Zealand': 'NZ',
  Greece: 'GR',
  Türkiye: 'TR', Turkey: 'TR',
  Kenya: 'KE',
  Thailand: 'TH',
  Indonesia: 'ID',
  Peru: 'PE',
  Chile: 'CL',
  Poland: 'PL',
  Sweden: 'SE',
  Philippines: 'PH',
  Vietnam: 'VN',
  'South Korea': 'KR', Korea: 'KR',
  Morocco: 'MA',
  Nigeria: 'NG',
  Switzerland: 'CH',
  Netherlands: 'NL',
};

function toneFor(coin: Coin): DiscTone {
  const v = coin.purchasePrice || 0;
  if (v > 200) return 'gold';
  if (v > 30) return 'silver';
  return 'copper';
}

function formatRelative(iso?: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  const diff = Date.now() - date.getTime();
  const day = 86400000;
  const days = Math.floor(diff / day);
  if (days < 1) return 'today';
  if (days === 1) return '1d ago';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

function buildMonthlySeries(coins: Coin[]): number[] {
  if (coins.length === 0) return FALLBACK_SERIES;
  const buckets = new Array(12).fill(0);
  const now = new Date();
  const cutoff = new Date(now.getFullYear(), now.getMonth() - 11, 1).getTime();

  for (const c of coins) {
    const t = new Date(c.createdAt || now).getTime();
    if (t < cutoff) buckets.forEach((_, i) => (buckets[i] += c.purchasePrice || 0));
    else {
      const d = new Date(t);
      const idx = (d.getFullYear() - now.getFullYear()) * 12 + (d.getMonth() - now.getMonth()) + 11;
      for (let i = Math.max(0, idx); i < 12; i++) buckets[i] += c.purchasePrice || 0;
    }
  }
  if (buckets.every((v) => v === 0)) return FALLBACK_SERIES;
  return buckets;
}

function dollarsK(n: number): { whole: string; decimal: string } {
  const fixed = n.toFixed(2);
  const [whole, dec] = fixed.split('.');
  const withCommas = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return { whole: `$${withCommas}`, decimal: `.${dec}` };
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user } = useAuth();

  const [stats, setStats] = useState<Stats | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const coins = await CoinService.getUserCoins();
    const totalValue = coins.reduce((s, c) => s + (c.purchasePrice || 0), 0);
    const countries = new Set<string>();
    const codes = new Set<string>();
    for (const c of coins) {
      if (c.country) {
        countries.add(c.country);
        const code = COUNTRY_TO_CODE[c.country];
        if (code) codes.add(code);
      }
    }
    const recentCoins = [...coins]
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      )
      .slice(0, 4);

    setStats({
      totalCoins: coins.length,
      totalValue,
      uniqueCountries: countries.size,
      countryCodes: Array.from(codes),
      recentCoins,
      monthlySeries: buildMonthlySeries(coins),
    });
  }, []);

  useEffect(() => {
    load().catch(() => setStats(null));
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load().catch(() => undefined);
    setRefreshing(false);
  }, [load]);

  const username = user?.user_metadata?.firstName || user?.email?.split('@')[0] || 'Collector';
  const initial = username[0]?.toUpperCase() || 'C';

  const tv = stats?.totalValue ?? 0;
  const { whole, decimal } = dollarsK(tv);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 110 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={palette.gold}
          />
        }
      >
        {/* Top bar */}
        <View style={styles.topBar}>
          <View style={styles.topBarLeft}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.welcomeBack}>WELCOME BACK</Text>
              <Text style={styles.username}>{username}</Text>
            </View>
          </View>
          <Pressable style={styles.bell}>
            <Icon name="bell" size={16} color={palette.fg2} />
            <View style={styles.bellDot} />
          </Pressable>
        </View>

        {/* Portfolio hero */}
        <View style={styles.heroBlock}>
          <Eyebrow>PORTFOLIO VALUE · USD</Eyebrow>
          <View style={styles.heroValueRow}>
            <Text style={styles.heroValueBig}>{whole}</Text>
            <Text style={styles.heroValueDecimal}>{decimal}</Text>
          </View>
          <View style={styles.deltaRow}>
            <Text style={styles.deltaText}>▲ $820.40 · 3.6%</Text>
            <View style={styles.dotSep} />
            <Text style={styles.deltaPeriod}>30 DAYS</Text>
          </View>
        </View>

        {/* Chart card */}
        <View style={styles.section}>
          <Card style={{ padding: 16, paddingBottom: 10 }}>
            <View style={styles.chartHeader}>
              <Eyebrow>VALUE · LAST 12 MONTHS</Eyebrow>
              <Text style={styles.usdLabel}>USD</Text>
            </View>
            <MiniChart data={stats?.monthlySeries || FALLBACK_SERIES} width={320} height={108} />
            <View style={styles.monthTicks}>
              {MONTH_TICKS.map((m) => (
                <Text key={m} style={styles.tickText}>
                  {m}
                </Text>
              ))}
            </View>
          </Card>
        </View>

        {/* Stat tiles */}
        <View style={[styles.section, styles.statsRow]}>
          <View style={{ flex: 1 }}>
            <Stat eyebrow="COINS" value={String(stats?.totalCoins ?? 0)} />
          </View>
          <View style={{ flex: 1 }}>
            <Stat eyebrow="COUNTRIES" value={String(stats?.uniqueCountries ?? 0)} />
          </View>
        </View>

        {/* Coverage map preview */}
        <View style={styles.section}>
          <Pressable onPress={() => navigation.navigate('Map')}>
            <Card style={{ padding: 16, overflow: 'hidden' }}>
              <View style={styles.coverageHeader}>
                <Eyebrow>COVERAGE</Eyebrow>
                <Text style={styles.coverageCount}>
                  {stats?.uniqueCountries ?? 0} / 195
                </Text>
              </View>
              <View style={styles.coverageMap}>
                <WorldMap
                  width={300}
                  size="compact"
                  collected={stats?.countryCodes || []}
                />
              </View>
              <View style={styles.coverageFooter}>
                <Text style={styles.legend}>
                  <Text style={{ color: palette.gold }}>● </Text>
                  COLLECTED ·{' '}
                  <Text style={{ color: palette.fg4 }}>● </Text>
                  UNCOLLECTED
                </Text>
                <Text style={styles.exploreArrow}>EXPLORE →</Text>
              </View>
            </Card>
          </Pressable>
        </View>

        {/* Scan CTA */}
        <View style={styles.section}>
          <Pressable onPress={() => navigation.navigate('Scan')}>
            <LinearGradient
              colors={[palette.ctaTopWarm, palette.ctaBotWarm]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ctaCard}
            >
              <View style={styles.ctaIcon}>
                <Icon name="scan" size={26} stroke={1.8} color={palette.goldFg} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.ctaTitle}>Scan a coin</Text>
                <Text style={styles.ctaSub}>Identify, grade, price &amp; catalog in seconds</Text>
              </View>
              <Icon name="arrow-right" size={18} color={palette.gold} />
            </LinearGradient>
          </Pressable>
        </View>

        {/* Recently added */}
        <View style={[styles.section, styles.recentHeader]}>
          <Eyebrow>RECENTLY ADDED</Eyebrow>
          <Pressable onPress={() => navigation.navigate('Collection')}>
            <Text style={styles.viewAll}>VIEW ALL →</Text>
          </Pressable>
        </View>
        <View style={styles.section}>
          <Card style={{ overflow: 'hidden' }}>
            {(stats?.recentCoins || []).slice(0, 4).map((c, i) => (
              <View
                key={c.id}
                style={[
                  styles.row,
                  i > 0 && { borderTopWidth: 1, borderTopColor: palette.line2 },
                ]}
              >
                <CoinDisc
                  size={42}
                  label={String(c.year).slice(-2)}
                  tone={toneFor(c)}
                  imageSource={c.obverseImage ? { uri: c.obverseImage } : undefined}
                />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={styles.rowTitleLine}>
                    <Text style={styles.rowName} numberOfLines={1}>
                      {c.specificCoinName || c.denomination || 'Coin'}
                    </Text>
                    <Text style={styles.rowYear}>{c.year}</Text>
                  </View>
                  <Text style={styles.rowSub} numberOfLines={1}>
                    {c.country} · {c.grade || '—'}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.rowValue}>${(c.purchasePrice || 0).toFixed(2)}</Text>
                  <Text style={styles.rowAdded}>{formatRelative(c.createdAt)}</Text>
                </View>
              </View>
            ))}
            {(!stats || stats.recentCoins.length === 0) && (
              <View style={styles.emptyRow}>
                <Text style={styles.emptyText}>No coins yet. Tap Scan to add your first.</Text>
              </View>
            )}
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.bg },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 22,
  },
  topBarLeft: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: palette.gold,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontFamily: fontFamily.displayMedium, fontSize: 15, color: palette.goldFg },
  welcomeBack: {
    fontFamily: fontFamily.mono,
    fontSize: 11,
    color: palette.fg3,
    letterSpacing: 0.5,
  },
  username: { fontFamily: fontFamily.ui, fontSize: 13, color: palette.fg, marginTop: 1 },
  bell: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 1, borderColor: palette.line,
    backgroundColor: palette.bg2,
    alignItems: 'center', justifyContent: 'center',
  },
  bellDot: {
    position: 'absolute', top: 8, right: 9,
    width: 6, height: 6, borderRadius: 3, backgroundColor: palette.gold,
  },

  heroBlock: { paddingHorizontal: 20, paddingBottom: 18 },
  heroValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 10 },
  heroValueBig: {
    fontFamily: fontFamily.display, fontSize: 52, color: palette.fg, letterSpacing: -1.04,
  },
  heroValueDecimal: {
    fontFamily: fontFamily.display, fontSize: 22, color: palette.fg3, letterSpacing: -0.4,
  },
  deltaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  deltaText: { fontFamily: fontFamily.mono, color: palette.cHigh, fontSize: 12 },
  dotSep: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: palette.fg4 },
  deltaPeriod: { fontFamily: fontFamily.mono, color: palette.fg3, fontSize: 12 },

  section: { paddingHorizontal: 20, paddingBottom: 16 },

  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  usdLabel: { fontFamily: fontFamily.mono, fontSize: 10, color: palette.fg3 },
  monthTicks: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  tickText: { fontFamily: fontFamily.mono, fontSize: 9.5, color: palette.fg4, letterSpacing: 0.95 },

  statsRow: { flexDirection: 'row', gap: 10 },

  coverageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  coverageCount: { fontFamily: fontFamily.mono, fontSize: 10, color: palette.fg3 },
  coverageMap: { alignItems: 'center', marginVertical: 4, marginBottom: 8 },
  coverageFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  legend: { fontFamily: fontFamily.mono, fontSize: 10.5, color: palette.fg3, letterSpacing: 0.63 },
  exploreArrow: { fontFamily: fontFamily.mono, fontSize: 10, color: palette.gold, letterSpacing: 1 },

  ctaCard: {
    padding: 18, borderRadius: radius.base,
    borderWidth: 1, borderColor: palette.ctaBorder,
    flexDirection: 'row', alignItems: 'center', gap: 16,
  },
  ctaIcon: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: palette.gold,
    alignItems: 'center', justifyContent: 'center',
  },
  ctaTitle: { fontFamily: fontFamily.display, fontSize: 18, color: palette.fg, lineHeight: 22 },
  ctaSub: { fontFamily: fontFamily.ui, fontSize: 12, color: palette.fg2, marginTop: 3 },

  recentHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 14 },
  viewAll: { fontFamily: fontFamily.mono, fontSize: 10, color: palette.gold, letterSpacing: 1 },

  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16 },
  rowTitleLine: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  rowName: { fontFamily: fontFamily.ui, fontSize: 14, color: palette.fg, flexShrink: 1 },
  rowYear: { fontFamily: fontFamily.mono, fontSize: 10.5, color: palette.fg4 },
  rowSub: { fontFamily: fontFamily.ui, fontSize: 11.5, color: palette.fg3, marginTop: 2 },
  rowValue: { fontFamily: fontFamily.mono, fontSize: 13, color: palette.fg },
  rowAdded: { fontFamily: fontFamily.mono, fontSize: 10, color: palette.fg4 },

  emptyRow: { padding: 24, alignItems: 'center' },
  emptyText: { fontFamily: fontFamily.ui, fontSize: 13, color: palette.fg3 },
});
