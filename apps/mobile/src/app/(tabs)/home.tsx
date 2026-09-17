import { useCallback, useRef, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { Image, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { flushWorkoutLogQueue, getPendingCount } from '@/lib/offline-queue';
import { supabase } from '@/lib/supabase';

interface CharacterData {
  name: string;
  level: number;
  xpCurrent: number;
  xpToNext: number;
  streak: number;
  imageUrl: string;
}

const WEEK_LABELS = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // 0 = Monday
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

// M-04 Home (§9.1, детализация в §9.1a). users/characters/streaks —
// реальные запросы. Обновляется по фокусу экрана (useFocusEffect), а
// не только при монтировании — иначе после лога тренировки и возврата
// с /log-workout Home продолжал бы показывать старые данные.
export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [character, setCharacter] = useState<CharacterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [loggedDays, setLoggedDays] = useState<boolean[]>(new Array(7).fill(false));
  const lastKnownLevel = useRef<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      const currentUser = user;
      let active = true;

      async function syncAndLoad() {
        await flushWorkoutLogQueue(currentUser.id);
        const count = await getPendingCount(currentUser.id);
        if (active) setPendingCount(count);

        const weekStart = startOfWeek(new Date());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);

        const [
          { data: characterRow, error: characterError },
          { data: streakRow, error: streakError },
          { data: weekLogs, error: weekLogsError },
        ] = await Promise.all([
          supabase
            .from('characters')
            .select('name, level, xp_current, xp_to_next, image_url')
            .eq('user_id', currentUser.id)
            .maybeSingle(),
          supabase.from('streaks').select('current_streak').eq('user_id', currentUser.id).maybeSingle(),
          supabase
            .from('workout_logs')
            .select('logged_at')
            .eq('user_id', currentUser.id)
            .gte('logged_at', weekStart.toISOString())
            .lt('logged_at', weekEnd.toISOString()),
        ]);

        if (!active) return;

        const firstError = characterError ?? streakError ?? weekLogsError;
        if (firstError) {
          console.error(firstError);
          setError('Не удалось загрузить данные. Попробуйте обновить экран.');
          setLoading(false);
          return;
        }

        if (!characterRow) {
          setError('Персонаж не найден.');
          setLoading(false);
          return;
        }

        const days = new Array(7).fill(false);
        for (const log of weekLogs ?? []) {
          const dayIndex = Math.floor((new Date(log.logged_at).getTime() - weekStart.getTime()) / 86400000);
          if (dayIndex >= 0 && dayIndex < 7) days[dayIndex] = true;
        }
        setLoggedDays(days);

        setError(null);
        setCharacter({
          name: characterRow.name,
          level: characterRow.level,
          xpCurrent: characterRow.xp_current,
          xpToNext: characterRow.xp_to_next,
          streak: streakRow?.current_streak ?? 0,
          imageUrl: characterRow.image_url,
        });
        setLoading(false);

        if (lastKnownLevel.current != null && characterRow.level > lastKnownLevel.current) {
          router.push({
            pathname: '/level-up',
            params: { level: String(characterRow.level), heroName: characterRow.name },
          });
        }
        lastKnownLevel.current = characterRow.level;
      }

      syncAndLoad();
      return () => {
        active = false;
      };
    }, [user, router]),
  );

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {loading && <ThemedText type="bodyMuted">Загрузка...</ThemedText>}
        {error && <ThemedText style={styles.error}>{error}</ThemedText>}

        {!loading && !error && character && (
          <>
            <View style={styles.headerRow}>
              <ThemedText type="overline">Сегодня</ThemedText>
              <ThemedText type="bodyMuted">серия {character.streak} дн.</ThemedText>
            </View>

            <View style={styles.card}>
              <View style={styles.imageWrap}>
                <Image source={{ uri: character.imageUrl }} style={styles.characterImage} resizeMode="contain" />
                <View style={styles.levelBadge}>
                  <ThemedText type="overline" style={styles.levelBadgeText}>
                    LVL {character.level}
                  </ThemedText>
                </View>
              </View>

              <View style={styles.nameRow}>
                <ThemedText type="title">{character.name}</ThemedText>
                <ThemedText type="bodyMuted">
                  {character.xpCurrent} / {character.xpToNext} XP
                </ThemedText>
              </View>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.max(character.xpCurrent / character.xpToNext, 0.04) * 100}%` },
                  ]}
                />
              </View>
            </View>

            <View style={styles.weekRow}>
              {WEEK_LABELS.map((label, i) => (
                <View key={label} style={styles.dayCell}>
                  <ThemedText type="bodyMuted" style={styles.dayLabel}>
                    {label}
                  </ThemedText>
                  <View style={[styles.dayDot, loggedDays[i] && styles.dayDotLit]} />
                </View>
              ))}
            </View>

            {pendingCount > 0 && (
              <ThemedText type="bodyMuted" style={styles.pending}>
                {pendingCount} трен. ждут синхронизации
              </ThemedText>
            )}

            <Button label="Записать тренировку" onPress={() => router.push('/log-workout')} />
            <Button
              label="Прокачать внешний вид"
              variant="secondary"
              onPress={() => router.push('/customize')}
            />
          </>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  card: {
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  imageWrap: {
    height: 230,
    borderRadius: Radius.card,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  characterImage: {
    width: '100%',
    height: '100%',
  },
  levelBadge: {
    position: 'absolute',
    top: Spacing.two,
    left: Spacing.two,
    backgroundColor: Colors.accent,
    borderRadius: Radius.pill,
    paddingVertical: Spacing.half,
    paddingHorizontal: Spacing.two,
  },
  levelBadgeText: {
    color: Colors.accentText,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: Spacing.two,
  },
  progressTrack: {
    height: 8,
    borderRadius: Radius.pill,
    backgroundColor: Colors.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: Radius.pill,
    backgroundColor: Colors.accent,
  },
  weekRow: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    borderRadius: Radius.card,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dayLabel: {
    fontSize: 11,
  },
  dayDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  dayDotLit: {
    backgroundColor: Colors.accent,
  },
  pending: {
    color: Colors.accent,
  },
  error: {
    color: '#ff6b6b',
  },
});
