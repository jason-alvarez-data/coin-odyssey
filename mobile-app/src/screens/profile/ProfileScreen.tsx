import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { palette, fontFamily, radius } from '../../theme';
import { Card, Icon, Eyebrow } from '../../components/design';
import { useAuth } from '../../hooks/useAuth';
import { CoinService } from '../../services/coinService';

interface UserStats {
  totalCoins: number;
  memberSince: string;
}

interface Row {
  label: string;
  value?: string;
  chev?: boolean;
  danger?: boolean;
  onPress?: () => void;
}

interface Section {
  title: string;
  rows: Row[];
}

const APP_VERSION = '1.0.0 (412)';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const [stats, setStats] = useState<UserStats>({ totalCoins: 0, memberSince: '—' });

  const load = useCallback(async () => {
    try {
      const coins = await CoinService.getUserCoins();
      const created = user?.created_at ? new Date(user.created_at) : null;
      const memberSince = created
        ? created.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase()
        : '—';
      setStats({ totalCoins: coins.length, memberSince });
    } catch {
      setStats({ totalCoins: 0, memberSince: '—' });
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const fullName =
    (user?.user_metadata?.firstName as string | undefined) ||
    (user?.email?.split('@')[0] as string | undefined) ||
    'Collector';
  const email = user?.email || '—';
  const initial = (fullName[0] || 'C').toUpperCase();

  const handleSignOut = useCallback(() => {
    Alert.alert('Sign out', 'Sign out of your account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: () => {
          signOut().catch(() => undefined);
        },
      },
    ]);
  }, [signOut]);

  const sections: Section[] = [
    {
      title: 'ACCOUNT',
      rows: [
        { label: 'Email', value: email },
        { label: 'Subscription', value: 'Coin Odyssey+', chev: true },
        { label: 'Sync status', value: 'Up to date · just now' },
      ],
    },
    {
      title: 'PREFERENCES',
      rows: [
        { label: 'Theme', value: 'System' },
        { label: 'Currency', value: 'USD' },
        { label: 'Default grade scale', value: 'Sheldon (US)' },
      ],
    },
    {
      title: 'DATA',
      rows: [
        { label: 'Export catalog', chev: true },
        { label: 'Sign out', chev: true, onPress: handleSignOut },
        { label: 'Delete account', chev: true, danger: true },
      ],
    },
  ];

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 110 }}>
        <View style={styles.header}>
          <Eyebrow>YOU</Eyebrow>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>

        {/* Profile card */}
        <View style={styles.section}>
          <Card style={styles.profileCard}>
            <View style={styles.profileAvatar}>
              <Text style={styles.profileAvatarText}>{initial}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.profileName} numberOfLines={1}>{fullName}</Text>
              <Text style={styles.profileMeta}>
                MEMBER SINCE {stats.memberSince} · {stats.totalCoins} COIN{stats.totalCoins === 1 ? '' : 'S'}
              </Text>
            </View>
            <Icon name="chevron-right" size={16} color={palette.fg3} />
          </Card>
        </View>

        {sections.map((sec) => (
          <View key={sec.title} style={styles.section}>
            <Eyebrow style={{ paddingHorizontal: 0, marginBottom: 8 }}>{sec.title}</Eyebrow>
            <Card style={{ overflow: 'hidden' }}>
              {sec.rows.map((r, i) => (
                <Pressable
                  key={r.label}
                  onPress={r.onPress}
                  style={[
                    styles.row,
                    i > 0 && { borderTopWidth: 1, borderTopColor: palette.line2 },
                  ]}
                >
                  <Text style={[styles.rowLabel, r.danger && { color: palette.cLow }]}>{r.label}</Text>
                  {r.value ? <Text style={styles.rowValue}>{r.value}</Text> : null}
                  {r.chev ? (
                    <Icon name="chevron-right" size={14} color={palette.fg3} />
                  ) : null}
                </Pressable>
              ))}
            </Card>
          </View>
        ))}

        <View style={styles.versionFooter}>
          <Text style={styles.versionText}>COIN ODYSSEY · v{APP_VERSION}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.bg },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 22 },
  headerTitle: {
    fontFamily: fontFamily.display,
    fontSize: 30,
    color: palette.fg,
    letterSpacing: -0.6,
    marginTop: 6,
  },

  section: { paddingHorizontal: 20, paddingBottom: 16 },

  profileCard: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  profileAvatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: palette.gold,
    alignItems: 'center', justifyContent: 'center',
  },
  profileAvatarText: {
    fontFamily: fontFamily.display,
    fontSize: 22,
    color: palette.goldFg,
  },
  profileName: { fontFamily: fontFamily.ui, fontSize: 15, color: palette.fg },
  profileMeta: {
    fontFamily: fontFamily.mono,
    fontSize: 10.5,
    color: palette.fg3,
    marginTop: 2,
    letterSpacing: 0.63,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  rowLabel: { flex: 1, fontFamily: fontFamily.ui, fontSize: 13.5, color: palette.fg },
  rowValue: {
    fontFamily: fontFamily.mono,
    fontSize: 11,
    color: palette.fg3,
    marginRight: 6,
  },

  versionFooter: { padding: 24, alignItems: 'center' },
  versionText: { fontFamily: fontFamily.mono, fontSize: 10, color: palette.fg4, letterSpacing: 1 },
});
