import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

import { Button } from '@/components/button';
import { HeroPhoto } from '@/components/hero-photo';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { plural } from '@/lib/stats';
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

// Lucide "lock" (ISC): the item is in the shop, not yet yours.
function LockIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={Colors.text} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Rect width={18} height={11} x={3} y={11} rx={2} ry={2} />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </Svg>
  );
}

// M-09 Кастомизация персонажа (§9.1). Каталог — items (читают все
// авторизованные), владение — user_items, экипировка —
// characters.equipped_items (uuid[]), которое RLS разрешает обновлять
// владельцу напрямую. Выбор копится локально и записывается кнопкой
// «Сохранить». Один предмет на слот: новый предмет слота заменяет
// прежний. Закрытый предмет (не куплен) ведёт в карточку магазина.
export default function CustomizeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [items, setItems] = useState<ItemsRow[]>([]);
  const [ownedIds, setOwnedIds] = useState<Set<string>>(new Set());
  const [saved, setSaved] = useState<string[]>([]);
  const [draft, setDraft] = useState<string[]>([]);
  const [username, setUsername] = useState<string | null>(null);
  const [cat, setCat] = useState<ItemSlot | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const [catalog, owned, character, me] = await Promise.all([
      supabase.from('items').select('*').order('created_at', { ascending: true }),
      supabase.from('user_items').select('item_id').eq('user_id', user.id),
      supabase.from('characters').select('equipped_items').eq('user_id', user.id).maybeSingle(),
      supabase.from('users').select('username').eq('id', user.id).maybeSingle(),
    ]);
    for (const result of [catalog, owned, character, me]) {
      if (result.error) console.error(result.error);
    }

    const all = (catalog.data ?? []).filter((it) => !!it.slot);
    const equippedNow = character.data?.equipped_items ?? [];
    setItems(all);
    setOwnedIds(new Set((owned.data ?? []).map((row) => row.item_id)));
    setSaved(equippedNow);
    setDraft(equippedNow);
    setUsername(me.data?.username ?? null);
    setCat((prev) => prev ?? all[0]?.slot ?? null);
    setLoading(false);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const categories = Array.from(new Set(items.map((it) => it.slot).filter((s): s is ItemSlot => !!s)));
  const visibleItems = items.filter((it) => it.slot === cat);
  // Only items that are still owned count as worn.
  const worn = draft.filter((id) => ownedIds.has(id));
  const changed = draft.length !== saved.length || draft.some((id) => !saved.includes(id));

  function handlePick(item: ItemsRow) {
    if (!ownedIds.has(item.id)) {
      router.push({ pathname: '/shop-detail', params: { id: item.id } });
      return;
    }
    if (draft.includes(item.id)) {
      setDraft(draft.filter((id) => id !== item.id));
      return;
    }
    const withoutSlot = draft.filter((id) => items.find((it) => it.id === id)?.slot !== item.slot);
    setDraft([...withoutSlot, item.id]);
  }

  async function handleSave() {
    if (!user) return;
    if (changed) {
      setSaving(true);
      const { error } = await supabase.from('characters').update({ equipped_items: draft }).eq('user_id', user.id);
      setSaving(false);
      if (error) {
        console.error(error);
        return;
      }
      setSaved(draft);
    }
    router.replace('/home');
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.replace('/home')}>
          <ThemedText type="overline">← Дом</ThemedText>
        </Pressable>

        <View style={styles.preview}>
          <HeroPhoto username={username} height={220} />
          <ThemedText type="bodyMuted" style={styles.previewCaption}>
            Надето: {worn.length} {plural(worn.length, 'предмет', 'предмета', 'предметов')}
          </ThemedText>
        </View>

        {loading && <ThemedText type="bodyMuted">Загрузка...</ThemedText>}

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
            const isOwned = ownedIds.has(item.id);
            const isWorn = draft.includes(item.id) && isOwned;
            return (
              <Pressable
                key={item.id}
                onPress={() => handlePick(item)}
                style={[styles.itemCard, isWorn && styles.itemCardActive]}
                accessibilityLabel={`${item.name}${isOwned ? '' : ', закрыто'}`}
              >
                <View style={styles.itemImageWrap}>
                  <Image
                    source={{ uri: item.image_url }}
                    style={[styles.itemImage, !isOwned && styles.itemImageLocked]}
                    resizeMode="cover"
                  />
                  <View style={styles.itemMark}>
                    {!isOwned ? (
                      <LockIcon />
                    ) : (
                      <View style={[styles.markDot, isWorn ? styles.markDotOn : styles.markDotOff]} />
                    )}
                  </View>
                </View>
                <ThemedText type="bodyMuted" numberOfLines={1} style={isWorn ? styles.itemNameActive : undefined}>
                  {item.name}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>

        <Button label="Открыть магазин" variant="secondary" onPress={() => router.push('/shop')} />
        <Button label={saving ? 'Сохраняем...' : 'Сохранить'} onPress={handleSave} disabled={saving} />
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
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    overflow: 'hidden',
  },
  previewCaption: {
    padding: Spacing.three,
  },
  catRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  catChip: {
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: Radius.pill,
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
    borderRadius: Radius.tile,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.two,
    gap: Spacing.one,
  },
  itemCardActive: {
    borderColor: Colors.accent,
  },
  itemImageWrap: {
    width: '100%',
    height: 72,
    borderRadius: Radius.tile,
    backgroundColor: Colors.bg,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemImage: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  itemImageLocked: {
    opacity: 0.35,
  },
  itemMark: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  markDotOn: {
    backgroundColor: Colors.accent,
  },
  markDotOff: {
    borderWidth: 2,
    borderColor: Colors.textMuted,
  },
  itemNameActive: {
    color: Colors.accent,
  },
});
