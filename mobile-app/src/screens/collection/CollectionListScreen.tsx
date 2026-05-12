import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { palette, fontFamily, radius } from '../../theme';
import { CoinDisc, Icon, Eyebrow, Card, DiscTone } from '../../components/design';
import { CoinService } from '../../services/coinService';
import type { Coin } from '../../types/coin';

const CHIPS = ['All', 'Silver', 'Gold', 'Pre-1950', 'MS-60+', 'Americas'];

function toneFor(coin: Coin): DiscTone {
  const v = coin.purchasePrice || 0;
  if (v > 200) return 'gold';
  if (v > 30) return 'silver';
  return 'copper';
}

function chipMatches(coin: Coin, chip: string): boolean {
  switch (chip) {
    case 'All':
      return true;
    case 'Silver':
      return (coin.purchasePrice || 0) >= 30 && (coin.purchasePrice || 0) < 200;
    case 'Gold':
      return (coin.purchasePrice || 0) >= 200;
    case 'Pre-1950':
      return (coin.year || 0) < 1950;
    case 'MS-60+': {
      const g = (coin.grade || '').toUpperCase();
      if (!g.startsWith('MS-')) return false;
      const n = parseInt(g.slice(3), 10);
      return Number.isFinite(n) && n >= 60;
    }
    case 'Americas': {
      const c = (coin.country || '').toLowerCase();
      return /(united states|canada|mexico|brazil|argentina|chile|peru|colombia|venezuela)/.test(c);
    }
    default:
      return true;
  }
}

export default function CollectionListScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [coins, setCoins] = useState<Coin[]>([]);
  const [query, setQuery] = useState('');
  const [activeChip, setActiveChip] = useState('All');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await CoinService.getUserCoins();
      setCoins(data);
    } catch {
      setCoins([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return coins.filter((c) => {
      if (!chipMatches(c, activeChip)) return false;
      if (!q) return true;
      return (
        (c.specificCoinName || '').toLowerCase().includes(q) ||
        (c.country || '').toLowerCase().includes(q) ||
        String(c.year || '').includes(q) ||
        (c.denomination || '').toLowerCase().includes(q)
      );
    });
  }, [coins, query, activeChip]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 110 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.gold} />
        }
      >
        <View style={styles.header}>
          <Eyebrow>COLLECTION · {coins.length}</Eyebrow>
          <Text style={styles.headerTitle}>Catalog</Text>
        </View>

        <View style={styles.searchWrap}>
          <View style={styles.searchBar}>
            <Icon name="search" size={15} color={palette.fg3} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search name, country, year…"
              placeholderTextColor={palette.fg3}
              style={styles.searchInput}
              returnKeyType="search"
            />
            <Icon name="filter" size={15} color={palette.fg3} />
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {CHIPS.map((chip) => {
            const active = activeChip === chip;
            return (
              <Pressable
                key={chip}
                onPress={() => setActiveChip(chip)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{chip}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.grid}>
          {filtered.map((c) => (
            <Pressable
              key={c.id}
              onPress={() => navigation.navigate('CoinDetail', { coin: c })}
              style={styles.gridCellWrap}
            >
              <Card style={styles.gridCard}>
                <View style={styles.cardImage}>
                  <CoinDisc
                    size={84}
                    label={String(c.year).slice(-2)}
                    tone={toneFor(c)}
                    imageSource={c.obverseImage ? { uri: c.obverseImage } : undefined}
                  />
                </View>
                <View>
                  <Text style={styles.cardName} numberOfLines={1}>
                    {c.specificCoinName || c.denomination || 'Coin'}
                  </Text>
                  <Text style={styles.cardSub} numberOfLines={1}>
                    {(c.country || '—').toUpperCase()} · {c.year}
                  </Text>
                </View>
                <View style={styles.cardFooter}>
                  <Text style={styles.cardValue}>${(c.purchasePrice || 0).toFixed(2)}</Text>
                  <Text style={styles.cardGrade}>{c.grade || '—'}</Text>
                </View>
              </Card>
            </Pressable>
          ))}
          {filtered.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                {coins.length === 0
                  ? 'No coins yet. Tap Scan to add your first.'
                  : 'No matches for the current filter.'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.bg },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 14 },
  headerTitle: {
    fontFamily: fontFamily.display,
    fontSize: 30,
    color: palette.fg,
    letterSpacing: -0.6,
    marginTop: 6,
  },

  searchWrap: { paddingHorizontal: 20, paddingBottom: 12 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: palette.bg2,
    borderWidth: 1,
    borderColor: palette.line,
  },
  searchInput: {
    flex: 1,
    color: palette.fg,
    fontFamily: fontFamily.ui,
    fontSize: 13,
    paddingVertical: 0,
  },

  chipsRow: { paddingHorizontal: 20, paddingBottom: 16, flexDirection: 'row', gap: 8 },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.line,
  },
  chipActive: {
    borderColor: palette.gold,
    backgroundColor: palette.chipActiveBg,
  },
  chipText: {
    fontFamily: fontFamily.mono,
    fontSize: 11,
    color: palette.fg2,
    letterSpacing: 0.66,
  },
  chipTextActive: { color: palette.gold },

  grid: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridCellWrap: { width: '48%' },
  gridCard: { padding: 12, gap: 10 },
  cardImage: {
    aspectRatio: 1,
    borderRadius: radius.sm,
    backgroundColor: palette.bg3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardName: { fontFamily: fontFamily.ui, fontSize: 13, color: palette.fg, lineHeight: 16 },
  cardSub: {
    fontFamily: fontFamily.mono,
    fontSize: 10,
    color: palette.fg3,
    marginTop: 2,
    letterSpacing: 0.6,
  },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardValue: { fontFamily: fontFamily.mono, fontSize: 12, color: palette.fg2 },
  cardGrade: {
    fontFamily: fontFamily.mono,
    fontSize: 9.5,
    color: palette.fg4,
    letterSpacing: 0.95,
  },

  emptyState: { width: '100%', padding: 32, alignItems: 'center' },
  emptyText: { fontFamily: fontFamily.ui, fontSize: 13, color: palette.fg3, textAlign: 'center' },
});
