import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { Pressable, Share, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { HeroPhoto } from '@/components/hero-photo';
import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { resolveDisplayName } from '@/lib/display-name';
import { supabase } from '@/lib/supabase';

interface ShareData {
  username: string;
  name: string;
  level: number;
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
          supabase.from('users').select('username, display_name').eq('id', user!.id).maybeSingle(),
          supabase.from('characters').select('name, level').eq('user_id', user!.id).maybeSingle(),
          supabase.from('workout_logs').select('id', { count: 'exact', head: true }).eq('user_id', user!.id),
          supabase.from('streaks').select('current_streak').eq('user_id', user!.id).maybeSingle(),
        ]);
        if (!active || !me || !character) return;
        setData({
          username: me.username,
          name: resolveDisplayName(me.display_name, character.name, me.username),
          level: character.level,
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
        message: `${data.name} — уровень ${data.level} в Buildyfit. ${data.workouts} тренировок, серия ${data.streak} дней. buildyfit.app/u/${data.username}`,
      });
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <View style={styles.overlay}>
      {data && (
        <View style={styles.card}>
          <Pressable style={styles.close} onPress={() => router.back()} hitSlop={12}>
            <ThemedText type="body" style={styles.closeLabel}>
              ✕
            </ThemedText>
          </Pressable>

          <View style={styles.cardText}>
            <ThemedText type="overline">LVL {data.level}</ThemedText>
            <ThemedText type="title" style={styles.cardName}>
              {data.name}
            </ThemedText>
            <ThemedText type="bodyMuted" style={styles.cardStats}>
              {data.workouts} тренировок · серия {data.streak} дней
            </ThemedText>
          </View>

          <HeroPhoto username={data.username} height={320} style={styles.cardImage} />
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
  // Same card as the web ShareCard: dark, hairline border, big rounded
  // corners, centred level/name/stats, photo bleeding to the bottom edge.
  card: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bg,
    overflow: 'hidden',
  },
  close: {
    position: 'absolute',
    top: Spacing.three,
    right: Spacing.three + Spacing.two,
    zIndex: 1,
  },
  closeLabel: {
    color: 'rgba(255,255,255,.6)',
    fontSize: 18,
  },
  cardText: {
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
  },
  cardName: {
    fontSize: 18,
    lineHeight: 24,
    marginTop: Spacing.two,
  },
  cardStats: {
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255,255,255,.6)',
    marginTop: Spacing.one,
  },
  cardImage: {
    marginTop: Spacing.three,
  },
  actions: {
    marginTop: Spacing.four,
    gap: Spacing.two,
  },
});
