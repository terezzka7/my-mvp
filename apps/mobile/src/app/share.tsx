import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { Image, Pressable, Share, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';

interface ShareData {
  username: string;
  heroName: string;
  level: number;
  imageUrl: string;
  workouts: number;
  streak: number;
}

// M-11 Шеринг-карточка (§9.1) — модалка. "Отправить" использует
// нативный Share API (встроен в react-native, без новых пакетов) —
// открывает системный шеринг-лист, а не постит напрямую в Instagram
// Stories (для этого нужен отдельный нативный SDK, вне текущего §11).
export default function ShareScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [data, setData] = useState<ShareData | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      let active = true;

      async function load() {
        const [{ data: me }, { data: character }, { count: workouts }, { data: streakRow }] = await Promise.all([
          supabase.from('users').select('username').eq('id', user!.id).maybeSingle(),
          supabase.from('characters').select('name, level, image_url').eq('user_id', user!.id).maybeSingle(),
          supabase.from('workout_logs').select('id', { count: 'exact', head: true }).eq('user_id', user!.id),
          supabase.from('streaks').select('current_streak').eq('user_id', user!.id).maybeSingle(),
        ]);
        if (!active || !me || !character) return;
        setData({
          username: me.username,
          heroName: character.name,
          level: character.level,
          imageUrl: character.image_url,
          workouts: workouts ?? 0,
          streak: streakRow?.current_streak ?? 0,
        });
      }

      load();
      return () => {
        active = false;
      };
    }, [user]),
  );

  async function handleShare() {
    if (!data) return;
    try {
      await Share.share({
        message: `${data.heroName} — уровень ${data.level} в Buildyfit. ${data.workouts} тренировок, серия ${data.streak} дней. buildyfit.app/u/${data.username}`,
      });
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <View style={styles.overlay}>
      <View style={styles.header}>
        <ThemedText type="overline">Шеринг-карточка</ThemedText>
        <Pressable onPress={() => router.back()}>
          <ThemedText type="body" style={styles.close}>
            ✕
          </ThemedText>
        </Pressable>
      </View>

      {data && (
        <View style={styles.card}>
          <View style={styles.cardTopRow}>
            <ThemedText type="title" style={styles.cardBrand}>
              Buildyfit
            </ThemedText>
            <ThemedText type="overline" style={styles.cardLevel}>
              LVL {data.level}
            </ThemedText>
          </View>
          <Image source={{ uri: data.imageUrl }} style={styles.cardImage} resizeMode="contain" />
          <ThemedText type="display" style={styles.cardName}>
            {data.heroName}
          </ThemedText>
          <ThemedText type="body" style={styles.cardStats}>
            {data.workouts} тренировок · серия {data.streak} дней
          </ThemedText>
        </View>
      )}

      <View style={styles.actions}>
        <Button label="Поделиться" onPress={handleShare} />
        <Button label="Закрыть" variant="secondary" onPress={() => router.back()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,.85)',
    padding: Spacing.four,
    paddingTop: Spacing.six,
    justifyContent: 'flex-start',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  close: {
    color: Colors.textMuted,
    fontSize: 20,
  },
  card: {
    borderRadius: Radius.card,
    backgroundColor: Colors.accent,
    padding: Spacing.three,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
  },
  cardBrand: {
    color: Colors.accentText,
  },
  cardLevel: {
    color: 'rgba(13,13,13,.55)',
  },
  cardImage: {
    width: '100%',
    height: 220,
    borderRadius: Radius.card,
  },
  cardName: {
    color: Colors.accentText,
    marginTop: Spacing.two,
  },
  cardStats: {
    color: 'rgba(13,13,13,.6)',
    marginTop: Spacing.one,
  },
  actions: {
    marginTop: Spacing.four,
    gap: Spacing.two,
  },
});
