import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { resolveDisplayName } from '@/lib/display-name';
import { supabase } from '@/lib/supabase';

interface ProfileData {
  username: string;
  name: string;
  level: number;
  xpCurrent: number;
  workouts: number;
  streak: number;
  ownedCount: number;
}

// M-12 Профиль (§9.1). Все поля — реальные запросы (users/characters/
// streaks/workout_logs count/user_items count).
export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      let active = true;

      async function load() {
        const [
          { data: me, error: meError },
          { data: character, error: characterError },
          { data: streakRow, error: streakError },
          { count: workoutsCount, error: workoutsError },
          { count: itemsCount, error: itemsError },
        ] = await Promise.all([
          supabase.from('users').select('username, display_name').eq('id', user!.id).maybeSingle(),
          supabase.from('characters').select('name, level, xp_current').eq('user_id', user!.id).maybeSingle(),
          supabase.from('streaks').select('current_streak').eq('user_id', user!.id).maybeSingle(),
          supabase.from('workout_logs').select('id', { count: 'exact', head: true }).eq('user_id', user!.id),
          supabase.from('user_items').select('id', { count: 'exact', head: true }).eq('user_id', user!.id),
        ]);

        if (!active) return;
        const firstError = meError ?? characterError ?? streakError ?? workoutsError ?? itemsError;
        if (firstError) console.error(firstError);

        if (me && character) {
          setData({
            username: me.username,
            name: resolveDisplayName(me.display_name, character.name, me.username),
            level: character.level,
            xpCurrent: character.xp_current,
            workouts: workoutsCount ?? 0,
            streak: streakRow?.current_streak ?? 0,
            ownedCount: itemsCount ?? 0,
          });
        }
        setLoading(false);
      }

      load();
      return () => {
        active = false;
      };
    }, [user]),
  );

  if (loading || !data) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="bodyMuted">Загрузка...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="display" style={styles.title}>
          Профиль
        </ThemedText>

        <View style={styles.headerRow}>
          <Avatar username={data.username} size={82} />
          <View style={styles.headerInfo}>
            <ThemedText type="title">{data.name}</ThemedText>
            <ThemedText type="overline">
              уровень {data.level} · {data.xpCurrent} XP
            </ThemedText>
            <ThemedText type="bodyMuted">buildyfit.app/u/{data.username}</ThemedText>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <ThemedText type="title">{data.workouts}</ThemedText>
            <ThemedText type="bodyMuted">тренировок</ThemedText>
          </View>
          <View style={styles.stat}>
            <ThemedText type="title">{data.streak}</ThemedText>
            <ThemedText type="bodyMuted">дней серия</ThemedText>
          </View>
          <View style={styles.stat}>
            <ThemedText type="title" style={styles.ownedValue}>
              {data.ownedCount}
            </ThemedText>
            <ThemedText type="bodyMuted">предметов</ThemedText>
          </View>
        </View>

        <View style={styles.links}>
          <Pressable style={styles.linkRow} onPress={() => router.push('/history')}>
            <ThemedText type="title">История тренировок</ThemedText>
            <ThemedText type="bodyMuted">›</ThemedText>
          </Pressable>
          <Pressable style={styles.linkRow} onPress={() => router.push('/share')}>
            <ThemedText type="title">Поделиться профилем</ThemedText>
            <ThemedText type="bodyMuted">›</ThemedText>
          </Pressable>
          <Pressable style={styles.linkRow} onPress={() => router.push('/settings')}>
            <ThemedText type="title">Настройки</ThemedText>
            <ThemedText type="bodyMuted">›</ThemedText>
          </Pressable>
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
  title: {
    marginBottom: Spacing.one,
  },
  headerRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    gap: Spacing.one,
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
  ownedValue: {
    color: Colors.accent,
  },
  links: {
    gap: Spacing.two,
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    padding: Spacing.three,
  },
});
