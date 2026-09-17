import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import type { ItemSlot, ItemsRow } from '@/lib/database.types';

const SLOT_LABELS: Record<ItemSlot, string> = {
  head: 'Голова',
  body: 'Тело',
  weapon: 'Оружие',
  cloak: 'Плащ',
  background: 'Фон',
  card_frame: 'Рамка',
};

// M-09 Кастомизация персонажа (§9.1). Владение — user_items, экипировка
// — characters.equipped_items (uuid[]), которое RLS разрешает
// обновлять владельцу напрямую (без Edge Function). Один предмет на
// слот: экипировка нового предмета в слоте снимает предыдущий из
// того же слота.
export default function CustomizeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [ownedItems, setOwnedItems] = useState<ItemsRow[]>([]);
  const [equipped, setEquipped] = useState<string[]>([]);
  const [cat, setCat] = useState<ItemSlot | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    const [{ data: owned, error: ownedError }, { data: characterRow, error: characterError }] =
      await Promise.all([
        supabase.from('user_items').select('items(*)').eq('user_id', user.id),
        supabase.from('characters').select('equipped_items').eq('user_id', user.id).maybeSingle(),
      ]);
    if (ownedError) console.error(ownedError);
    if (characterError) console.error(characterError);

    const items = (owned ?? [])
      .map((row) => row.items as unknown as ItemsRow | null)
      .filter((it): it is ItemsRow => !!it);
    setOwnedItems(items);
    setEquipped(characterRow?.equipped_items ?? []);
    setCat((prev) => prev ?? items[0]?.slot ?? null);
    setLoading(false);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const categories = Array.from(new Set(ownedItems.map((it) => it.slot).filter((s): s is ItemSlot => !!s)));
  const visibleItems = ownedItems.filter((it) => it.slot === cat);

  async function handleEquip(item: ItemsRow) {
    if (!user) return;
    const withoutSlot = equipped.filter((id) => {
      const owned = ownedItems.find((it) => it.id === id);
      return owned?.slot !== item.slot;
    });
    const next = [...withoutSlot, item.id];
    setEquipped(next);
    const { error } = await supabase.from('characters').update({ equipped_items: next }).eq('user_id', user.id);
    if (error) console.error(error);
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.replace('/home')}>
          <ThemedText type="overline">← Home</ThemedText>
        </Pressable>

        <ThemedText type="display" style={styles.title}>
          Кастомизация
        </ThemedText>

        {loading && <ThemedText type="bodyMuted">Загрузка...</ThemedText>}

        {!loading && ownedItems.length === 0 && (
          <ThemedText type="bodyMuted">Пока нет купленных предметов — загляни в магазин.</ThemedText>
        )}

        {categories.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.catRow}>
              {categories.map((slot) => (
                <Pressable
                  key={slot}
                  onPress={() => setCat(slot)}
                  style={[styles.catChip, cat === slot && styles.catChipActive]}
                >
                  <ThemedText type="body" style={cat === slot ? styles.catLabelActive : undefined}>
                    {SLOT_LABELS[slot]}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        )}

        <View style={styles.grid}>
          {visibleItems.map((item) => {
            const isEquipped = equipped.includes(item.id);
            return (
              <Pressable
                key={item.id}
                onPress={() => handleEquip(item)}
                style={[styles.itemCard, isEquipped && styles.itemCardActive]}
              >
                <Image source={{ uri: item.image_url }} style={styles.itemImage} resizeMode="cover" />
                <ThemedText type="bodyMuted" style={isEquipped ? styles.itemNameActive : undefined}>
                  {item.name}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>

        <Button label="Открыть магазин" variant="secondary" onPress={() => router.push('/shop')} />
        <Button label="Сохранить" onPress={() => router.replace('/home')} />
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
  title: {
    marginTop: Spacing.two,
  },
  catRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  catChip: {
    borderRadius: Radius.pill,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  catChipActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  catLabelActive: {
    color: Colors.accentText,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  itemCard: {
    width: '31%',
    borderRadius: Radius.card,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.two,
    gap: Spacing.one,
  },
  itemCardActive: {
    borderColor: Colors.accent,
  },
  itemImage: {
    width: '100%',
    height: 64,
    borderRadius: Radius.card,
    backgroundColor: Colors.bg,
  },
  itemNameActive: {
    color: Colors.accent,
  },
});
