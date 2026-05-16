import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { palette, fontFamily, radius } from '../../theme';
import { Eyebrow, Icon } from '../design';
import { CurrencyCode, CURRENCY_OPTIONS } from '../../contexts/CurrencyContext';

interface Props {
  visible: boolean;
  current: CurrencyCode;
  onSelect: (c: CurrencyCode) => void;
  onClose: () => void;
}

export const CurrencyPicker: React.FC<Props> = ({ visible, current, onSelect, onClose }) => {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.handle} />
        <View style={styles.titleRow}>
          <Eyebrow>CURRENCY</Eyebrow>
          <Pressable onPress={onClose} hitSlop={10}>
            <Icon name="x" size={18} color={palette.fg} stroke={2.4} />
          </Pressable>
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          {CURRENCY_OPTIONS.map((opt) => {
            const selected = opt.code === current;
            return (
              <Pressable
                key={opt.code}
                onPress={() => {
                  onSelect(opt.code);
                  onClose();
                }}
                style={styles.row}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.code, selected && { color: palette.gold }]}>
                    {opt.code} · {opt.symbol}
                  </Text>
                  <Text style={styles.label}>{opt.label}</Text>
                </View>
                <View style={[styles.radio, selected && styles.radioActive]}>
                  {selected && <View style={styles.radioDot} />}
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '70%',
    backgroundColor: palette.bg,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderTopWidth: 1,
    borderColor: palette.line,
    paddingTop: 8,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: palette.line,
    marginBottom: 12,
  },
  titleRow: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  row: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: palette.line2,
  },
  code: {
    fontFamily: fontFamily.uiMedium,
    fontSize: 14,
    color: palette.fg,
  },
  label: {
    fontFamily: fontFamily.mono,
    fontSize: 10.5,
    color: palette.fg3,
    marginTop: 2,
    letterSpacing: 0.4,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: palette.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: { borderColor: palette.gold },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: palette.gold },
});
