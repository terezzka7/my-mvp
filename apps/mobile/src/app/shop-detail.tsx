import { useCallback, useState } from 'react';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import type { ItemsRow } from '@/lib/database.types';

// M-10a Детали покупки (§9.1). "Купить" вызывает Edge Function
// buy-item — user_items не пишется с клиента (§10: только
// service_role). Pro-предметы (price_earned и price_premium оба null)
// ведут на Paywall вместо покупки за монеты.
export default function ShopDetailScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [item, setItem] = useState<ItemsRow | null>(null);
  const [owned, setOwned] = useState(false);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user || !id) return;
    const [{ data: itemRow, error: itemError }, { data: ownedRow, error: ownedError }] = await Promise.all([
      supabase.from('items').select('*').eq('id', id).maybeSingle(),
      supabase.from('user_items').select('id').eq('user_id', user.id).eq('item_id', id).maybeSingle(),
    ]);
    if (itemError) console.error(itemError);
    if (ownedError) console.error(ownedError);
    setItem(itemRow ?? null);
    setOwned(!!ownedRow);
    setLoading(false);
  }, [user, id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const isPro = item && item.price_earned == null && item.price_premium == null;

  async function handleBuy() {
    if (!item) return;
    if (isPro) {
      router.push('/paywall');
      return;
    }
    if (owned) {
      router.push('/customize');
      return;
    }
    setBuying(true);
    setError(null);
    const { error: invokeError } = await supabase.functions.invoke('buy-item', {
      body: { itemId: item.id },
    });
    setBuying(false);
    if (invokeError) {
      console.error(invokeError);
      setError('Не удалось купить. Проверьте баланс.');
      return;
    }
    load();
  }

  if (loading || !item) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="bodyMuted">Загрузка...</ThemedText>
      </ThemedView>
    );
  }

  const buyLabel = isPro
    ? 'Открыть с Buildyfit Pro'
    : owned
      ? 'Надеть предмет'
      : buying
        ? 'Покупаем...'
        : `Купить за ${item.price_earned} ⌾`;

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.back()}>
          <ThemedText type="overline">← Магазин</ThemedText>
        </Pressable>

        <Image source={{ uri: item.image_url }} style={styles.preview} resizeMode="cover" />

        <ThemedText type="display">{item.name}</ThemedText>
        {item.description && <ThemedText type="bodyMuted">{item.description}</ThemedText>}

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <ThemedText type="bodyMuted">Слот</ThemedText>
            <ThemedText type="title">{item.slot ?? '—'}</ThemedText>
          </View>
          <View style={styles.stat}>
            <ThemedText type="bodyMuted">Цена</ThemedText>
            <ThemedText type="title" style={styles.priceValue}>
              {isPro ? 'Pro' : `${item.price_earned} ⌾`}
            </ThemedText>
          </View>
        </View>

        {error && <ThemedText style={styles.error}>{error}</ThemedText>}

        <Button label={buyLabel} onPress={handleBuy} disabled={buying} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: Spacing.four,
    paddingTop: Spacing.six,
    gap: Spacing.three,
  },
  preview: {
    height: 260,
    borderRadius: Radius.card,
    backgroundColor: Colors.surface,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  stat: {
    flex: 1,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    padding: Spacing.two,
    gap: Spacing.one,
  },
  priceValue: {
    color: Colors.accent,
  },
  error: {
    color: '#ff6b6b',
  },
});
