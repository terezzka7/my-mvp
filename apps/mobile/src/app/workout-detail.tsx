import { useCallback, useState } from 'react';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import type { WorkoutLogsRow, WorkoutType } from '@/lib/database.types';

const TYPE_LABELS: Record<WorkoutType, string> = {
  strength: 'Силовая',
  cardio: 'Кардио',
  flexibility: 'Растяжка',
  sports: 'Игра',
  other: 'Другое',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
}

// M-14 Детали тренировки (§9.1). Реальные поля из workout_logs —
// "интенсивность" и "уровень после" из макета не хранятся в §10, так
// что вместо них показываем то, что реально есть: вес/повторения.
export default function WorkoutDetailScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [log, setLog] = useState<WorkoutLogsRow | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!user || !id) return;
      let active = true;
      supabase
        .from('workout_logs')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .maybeSingle()
        .then(({ data, error }) => {
          if (!active) return;
          if (error) console.error(error);
          setLog(data ?? null);
          setLoading(false);
        });
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
          {log.duration_minutes != null && (
            <View style={styles.stat}>
              <ThemedText type="bodyMuted">Длительность</ThemedText>
              <ThemedText type="title">{log.duration_minutes} мин</ThemedText>
            </View>
          )}
          <View style={styles.stat}>
            <ThemedText type="bodyMuted">Получено</ThemedText>
            <ThemedText type="title" style={styles.xpValue}>
              +{log.xp_earned} XP
            </ThemedText>
          </View>
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
    padding: Spacing.three,
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
    padding: Spacing.three,
    gap: Spacing.two,
  },
});
