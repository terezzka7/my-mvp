import { useCallback, useState } from 'react';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { levelsAfterEach } from '@/lib/level';
import { supabase } from '@/lib/supabase';
import type { WorkoutLogsRow, WorkoutType } from '@/lib/database.types';

const TYPE_LABELS: Record<WorkoutType, string> = {
  strength: 'Силовая',
  cardio: 'Кардио',
  flexibility: 'Растяжка',
  sports: 'Игра',
  other: 'Другое',
};

// "Сегодня, 08:20" / "Вчера, 08:20" / "12 октября, 08:20".
function formatDate(iso: string) {
  const date = new Date(iso);
  const time = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const daysAgo = Math.round((startOfDay(new Date()) - startOfDay(date)) / 86400000);
  if (daysAgo === 0) return `Сегодня, ${time}`;
  if (daysAgo === 1) return `Вчера, ${time}`;
  return `${date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}, ${time}`;
}

// Intensity isn't stored in §10, but the log sheet ties it 1:1 to the length
// it offers (20 легко, 40 средне, 60 тяжело, 90+ максимум), so for workouts
// written that way it can be read back from duration_minutes. Any other
// length (older or web-made logs) shows no intensity rather than a guess.
const INTENSITY_BY_MINUTES: Record<number, string> = {
  20: 'Легко',
  40: 'Средне',
  60: 'Тяжело',
  90: 'Максимум',
};

// M-14 Детали тренировки (§9.1). Реальные поля из workout_logs;
// "интенсивность" и "уровень после" не хранятся в §10 и восстанавливаются
// (см. выше и lib/level.ts), а если восстановить честно нельзя, то не
// показываются.
export default function WorkoutDetailScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [log, setLog] = useState<WorkoutLogsRow | null>(null);
  const [levelAfter, setLevelAfter] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!user || !id) return;
      let active = true;

      async function load() {
        const userId = user!.id;
        const [{ data, error }, { data: allLogs }, { data: character }] = await Promise.all([
          supabase.from('workout_logs').select('*').eq('id', id).eq('user_id', userId).maybeSingle(),
          supabase.from('workout_logs').select('id, xp_earned').eq('user_id', userId).order('logged_at', { ascending: true }),
          supabase.from('characters').select('level').eq('user_id', userId).maybeSingle(),
        ]);
        if (!active) return;
        if (error) console.error(error);

        // Replaying every workout must land on the character's real level, otherwise
        // some XP came from elsewhere and "level after" would be a guess: hide it.
        let level: number | null = null;
        if (allLogs && character) {
          const levels = levelsAfterEach(allLogs.map((row) => row.xp_earned));
          const index = allLogs.findIndex((row) => row.id === id);
          if (index >= 0 && levels[levels.length - 1] === character.level) level = levels[index];
        }

        setLog(data ?? null);
        setLevelAfter(level);
        setLoading(false);
      }

      load();
      return () => {
        active = false;
      };
    }, [user, id]),
  );

  async function handleShare() {
    router.push('/share');
  }

  if (loading || !log) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="bodyMuted">Загрузка...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.back()}>
          <ThemedText type="overline">← История</ThemedText>
        </Pressable>

        <ThemedText type="display" style={styles.title}>
          {TYPE_LABELS[log.type]}
        </ThemedText>
        <ThemedText type="bodyMuted">{formatDate(log.logged_at)}</ThemedText>

        <View style={styles.statsGrid}>
          {log.duration_minutes != null && (
            <View style={styles.stat}>
              <ThemedText type="bodyMuted">Длительность</ThemedText>
              <ThemedText type="title">{log.duration_minutes} мин</ThemedText>
            </View>
          )}
          {log.duration_minutes != null && INTENSITY_BY_MINUTES[log.duration_minutes] && (
            <View style={styles.stat}>
              <ThemedText type="bodyMuted">Интенсивность</ThemedText>
              <ThemedText type="title">{INTENSITY_BY_MINUTES[log.duration_minutes]}</ThemedText>
            </View>
          )}
          <View style={styles.stat}>
            <ThemedText type="bodyMuted">Получено</ThemedText>
            <ThemedText type="title" style={styles.xpValue}>
              +{log.xp_earned} XP
            </ThemedText>
          </View>
          {levelAfter !== null && (
            <View style={styles.stat}>
              <ThemedText type="bodyMuted">Уровень после</ThemedText>
              <ThemedText type="title">{levelAfter}</ThemedText>
            </View>
          )}
          {log.weight_kg != null && (
            <View style={styles.stat}>
              <ThemedText type="bodyMuted">Вес</ThemedText>
              <ThemedText type="title">{log.weight_kg} кг</ThemedText>
            </View>
          )}
          {log.reps != null && (
            <View style={styles.stat}>
              <ThemedText type="bodyMuted">Повторения</ThemedText>
              <ThemedText type="title">{log.reps}</ThemedText>
            </View>
          )}
        </View>

        {log.note && (
          <View style={styles.noteCard}>
            <ThemedText type="overline">Заметка</ThemedText>
            <ThemedText type="body">{log.note}</ThemedText>
          </View>
        )}

        <Button label="Поделиться" variant="secondary" onPress={handleShare} />
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  stat: {
    flexBasis: '48%',
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    padding: Spacing.card,
    gap: Spacing.one,
  },
  xpValue: {
    color: Colors.accent,
  },
  noteCard: {
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    padding: Spacing.card,
    gap: Spacing.two,
  },
});
