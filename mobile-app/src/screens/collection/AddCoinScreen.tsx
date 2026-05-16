import React from 'react';
import { Alert, View } from 'react-native';
import { useNavigation, useRoute, RouteProp, CommonActions } from '@react-navigation/native';

import { palette } from '../../theme';
import { CoinForm, CoinFormValues } from '../../components/forms/CoinForm';
import { CoinService } from '../../services/coinService';
import { Logger } from '../../services/logger';
import { CollectionStackParamList } from '../../types/navigation';

export default function AddCoinScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<CollectionStackParamList, 'AddCoin'>>();
  const initialImages = route.params?.initialImages;

  const onSave = async (values: CoinFormValues) => {
    try {
      const newCoin = await CoinService.createCoin({
        name: values.name,
        year: parseInt(values.year, 10),
        denomination: values.denomination,
        country: values.country || undefined,
        mintMark: values.mintMark || undefined,
        grade: values.grade || undefined,
        series: values.series || undefined,
        designer: values.designer || undefined,
        faceValue: values.faceValue ? parseFloat(values.faceValue) : undefined,
        purchasePrice: values.purchasePrice ? parseFloat(values.purchasePrice) : undefined,
        purchaseDate: values.purchaseDate || undefined,
        notes: values.notes || undefined,
        obverseImage: values.obverseUri || undefined,
        reverseImage: values.reverseUri || undefined,
      });

      Logger.info('Coin created', { coinId: newCoin.id, name: newCoin.name });

      Alert.alert('Added', `${newCoin.name} is in your collection.`, [
        {
          text: 'View collection',
          onPress: () =>
            navigation.dispatch(CommonActions.navigate({ name: 'CollectionList' })),
        },
        {
          text: 'Add another',
          style: 'cancel',
          onPress: () => navigation.replace('AddCoin', { initialImages: undefined }),
        },
      ]);
    } catch (err) {
      Logger.error('Failed to add coin', err);
      Alert.alert(
        'Could not save',
        err instanceof Error ? err.message : 'Please try again.'
      );
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <CoinForm
        eyebrow="ADD COIN"
        title="New entry"
        saveLabel="Save coin"
        savingLabel="Saving…"
        initial={{
          obverseUri: initialImages?.obverseUri ?? null,
          reverseUri: initialImages?.reverseUri ?? null,
        }}
        onSave={onSave}
        onCancel={() => navigation.goBack()}
      />
    </View>
  );
}
