import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { LucideIcon } from '@/components/lucide-icon';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { resolveDisplayName } from '@/lib/display-name';
import { plural } from '@/lib/stats';
import { supabase } from '@/lib/supabase';

interface ProfileData {
  username: string;
  name: string;
  level: number;
  xpCurrent: number;
  xpToNext: number;
  workouts: number;
  streak: number;
  longestStreak: number;
  ownedCount: number;
}

// M-12 Профиль (§9.1). Все поля — реальные запросы (users/characters/
// streaks/workout_logs count/user_items count).
export default function ProfileScreen() {
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
          supabase.from('characters').select('name, level, xp_current, xp_to_next').eq('user_id', user!.id).maybeSingle(),
          supabase.from('streaks').select('current_streak, longest_streak').eq('user_id', user!.id).maybeSingle(),
          supabase.from('workout_logs').select('id', { count: 'exact', head: true }).eq('user_id', user!.id),
          supabase.from('user_items').select('id', { count: 'exact', head: true }).eq('user_id', user!.id),
        ]);

        if (!active) return;
        const firstError = meError ?? characterError ?? streakError ?? workoutsError ?? itemsError;
        if (firstError) console.error(firstError);

        if (me && character) {
          const streak = streakRow?.current_streak ?? 0;
          setData({
            username: me.username,
            name: resolveDisplayName(me.display_name, character.name, me.username),
            level: character.level,
            xpCurrent: character.xp_current,
            xpToNext: character.xp_to_next,
            workouts: workoutsCount ?? 0,
            streak,
            longestStreak: Math.max(streakRow?.longest_streak ?? 0, streak),
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

  return <ProfileView data={data} />;
}

// Everything the screen draws, from already-loaded data.
export function ProfileView({ data }: { data: ProfileData }) {
  const router = useRouter();
  const xpLeft = Math.max(0, data.xpToNext - data.xpCurrent);
  const xpShare = data.xpToNext > 0 ? data.xpCurrent / data.xpToNext : 0;

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="display" style={styles.title}>
          Профиль
        </ThemedText>

        <View style={styles.headerRow}>
          <Avatar username={data.username} size={72} />
          <View style={styles.headerInfo}>
            <ThemedText type="title" style={styles.name} numberOfLines={1}>
              {data.name}
            </ThemedText>
            <View style={styles.linkPill}>
              <LucideIcon name="link" color={Colors.textMuted} size={14} />
              <ThemedText type="bodyMuted" style={styles.linkText} numberOfLines={1} ellipsizeMode="tail">
                buildyfit.app/u/{data.username}
              </ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.levelTop}>
            <View>
              <ThemedText type="overline">Уровень</ThemedText>
              <ThemedText type="display" style={styles.levelNumber}>
                {data.level}
              </ThemedText>
            </View>
            <ThemedText type="bodyMuted" style={styles.xpText}>
              {data.xpCurrent} / {data.xpToNext} XP
            </ThemedText>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.max(xpShare, 0.04) * 100}%` }]} />
          </View>
          <ThemedText type="bodyMuted" style={styles.small}>
            До {data.level + 1} уровня осталось {xpLeft} XP
          </ThemedText>
        </View>

        <View style={styles.bento}>
          <View style={styles.streakCard}>
            <LucideIcon name="flame" color={Colors.accentText} size={28} />
            <View>
              <ThemedText type="display" style={styles.streakNumber}>
                {data.streak}
              </ThemedText>
              <ThemedText type="title" style={styles.streakLabel}>
                {plural(data.streak, 'день', 'дня', 'дней')} подряд
              </ThemedText>
              <ThemedText type="bodyMuted" style={styles.streakRecord}>
                Рекорд: {data.longestStreak}
              </ThemedText>
            </View>
          </View>

          <View style={styles.stack}>
            <View style={styles.mini}>
              <View style={styles.miniTop}>
                <View style={styles.miniIcon}>
                  <LucideIcon name="dumbbell" color={Colors.accent} size={18} />
                </View>
                <ThemedText type="title" style={styles.miniNumber}>
                  {data.workouts}
                </ThemedText>
              </View>
              <ThemedText type="bodyMuted" style={styles.small} numberOfLines={1}>
                {plural(data.workouts, 'тренировка', 'тренировки', 'тренировок')}
              </ThemedText>
            </View>
            <View style={styles.mini}>
              <View style={styles.miniTop}>
                <View style={styles.miniIcon}>
                  <LucideIcon name="shopping-bag" color={Colors.accent} size={18} />
                </View>
                <ThemedText type="title" style={styles.miniNumber}>
                  {data.ownedCount}
                </ThemedText>
              </View>
              <ThemedText type="bodyMuted" style={styles.small} numberOfLines={1}>
                {plural(data.ownedCount, 'предмет', 'предмета', 'предметов')}
              </ThemedText>
            </View>
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
  small: {
    fontSize: 14,
    lineHeight: 20,
  },
  headerRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    gap: Spacing.two,
    alignItems: 'flex-start',
  },
  name: {
    fontSize: 22,
    lineHeight: 28,
  },
  linkPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + Spacing.half,
    maxWidth: '100%',
    height: 32,
    paddingHorizontal: Spacing.three - Spacing.one,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  linkText: {
    flexShrink: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  card: {
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    padding: Spacing.three + Spacing.one,
    gap: Spacing.two,
  },
  levelTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  levelNumber: {
    fontSize: 48,
    lineHeight: 52,
  },
  xpText: {
    paddingBottom: Spacing.one,
  },
  progressTrack: {
    height: 10,
    borderRadius: Radius.pill,
    backgroundColor: Colors.border,
    overflow: 'hidden',
    marginTop: Spacing.one,
  },
  progressFill: {
    height: '100%',
    borderRadius: Radius.pill,
    backgroundColor: Colors.accent,
  },
  bento: {
    flexDirection: 'row',
    gap: Spacing.three - Spacing.one,
  },
  streakCard: {
    flex: 1,
    minHeight: 184,
    justifyContent: 'space-between',
    borderRadius: Radius.card,
    backgroundColor: Colors.accent,
    padding: Spacing.three + Spacing.one,
  },
  streakNumber: {
    color: Colors.accentText,
    fontSize: 64,
    lineHeight: 68,
  },
  streakLabel: {
    color: Colors.accentText,
    fontSize: 16,
    lineHeight: 22,
  },
  streakRecord: {
    color: 'rgba(13,13,13,0.6)',
    fontSize: 14,
    lineHeight: 20,
  },
  stack: {
    flex: 1.1,
    gap: Spacing.three - Spacing.one,
  },
  mini: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.one,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.three - Spacing.half,
  },
  miniTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + Spacing.half,
  },
  miniIcon: {
    width: 32,
    height: 32,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  miniNumber: {
    fontSize: 26,
    lineHeight: 30,
  },
  links: {
    gap: Spacing.two + Spacing.half,
  },
  linkRow: {
    minHeight: 64,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.three + Spacing.one,
  },
});
