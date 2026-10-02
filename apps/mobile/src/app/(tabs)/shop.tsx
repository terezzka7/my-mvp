import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import type { ItemsRow } from '@/lib/database.types';

// M-10 Магазин (§9.1). items — публичный каталог (RLS: select
// authenticated). Владение — user_items (свои строки). Сама покупка
// требует Edge Function buy-item (user_items не пишется с клиента).
export default function ShopScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [items, setItems] = useState<ItemsRow[]>([]);
  const [ownedIds, setOwnedIds] = useState<Set<string>>(new Set());
  const [coins, setCoins] = useState(0);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      let active = true;

      async function load() {
        const [{ data: itemRows, error: itemsError }, { data: ownedRows, error: ownedError }, { data: me, error: meError }] =
          await Promise.all([
            supabase.from('items').select('*').order('created_at', { ascending: true }),
            supabase.from('user_items').select('item_id').eq('user_id', user!.id),
            supabase.from('users').select('currency_earned').eq('id', user!.id).maybeSingle(),
          ]);

        if (!active) return;
        if (itemsError) console.error(itemsError);
        if (ownedError) console.error(ownedError);
        if (meError) console.error(meError);

        setItems(itemRows ?? []);
        setOwnedIds(new Set((ownedRows ?? []).map((r) => r.item_id)));
        setCoins(me?.currency_earned ?? 0);
        setLoading(false);
      }

      load();
      return () => {
        active = false;
      };
    }, [user]),
  );

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <ThemedText type="display">Магазин</ThemedText>
          <View style={styles.coinsBadge}>
            <ThemedText type="body" style={styles.coinsText}>
              {coins} ⌾
            </ThemedText>
          </View>
        </View>

        {loading && <ThemedText type="bodyMuted">Загрузка...</ThemedText>}

        <View style={styles.grid}>
          {items.map((item) => {
            const owned = ownedIds.has(item.id);
            const isPro = item.price_earned == null && item.price_premium == null;
            const priceLabel = owned ? 'Куплено' : isPro ? 'Pro' : `${item.price_earned} ⌾`;
            return (
              <Pressable
                key={item.id}
                style={[styles.card, owned && styles.cardOwned]}
                onPress={() => router.push({ pathname: '/shop-detail', params: { id: item.id } })}
              >
                <Image source={{ uri: item.image_url }} style={styles.itemImage} resizeMode="cover" />
                <ThemedText type="body" style={styles.itemName}>
                  {item.name}
                </ThemedText>
                <ThemedText type="bodyMuted" style={!owned && !isPro ? styles.priceActive : undefined}>
                  {priceLabel}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  coinsBadge: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.pill,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
  },
  coinsText: {
    color: Colors.accentText,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  card: {
    width: '48%',
    borderRadius: Radius.card,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.two,
    gap: Spacing.one,
  },
  cardOwned: {
    borderColor: 'rgba(198,255,0,.35)',
  },
  itemImage: {
    width: '100%',
    height: 90,
    borderRadius: Radius.tile,
    backgroundColor: Colors.bg,
    marginBottom: Spacing.one,
  },
  itemName: {
    fontWeight: '600',
  },
  priceActive: {
    color: Colors.accent,
  },
});
