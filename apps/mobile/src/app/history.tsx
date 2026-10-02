import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

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
  const date = new Date(iso);
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
}

// M-13 История тренировок (§9.1). workout_logs — реальные записи,
// новые сверху.
export default function HistoryScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [logs, setLogs] = useState<WorkoutLogsRow[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      let active = true;

      supabase
        .from('workout_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('logged_at', { ascending: false })
        .then(({ data, error }) => {
          if (!active) return;
          if (error) console.error(error);
          setLogs(data ?? []);
          setLoading(false);
        });

      return () => {
        active = false;
      };
    }, [user]),
  );

  const totalXp = logs.reduce((sum, log) => sum + log.xp_earned, 0);

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.back()}>
          <ThemedText type="overline">← Профиль</ThemedText>
        </Pressable>

        <ThemedText type="display" style={styles.title}>
          История
        </ThemedText>
        <ThemedText type="bodyMuted">
          {logs.length} тренировок · {totalXp} XP всего
        </ThemedText>

        {loading && <ThemedText type="bodyMuted">Загрузка...</ThemedText>}
        {!loading && logs.length === 0 && (
          <ThemedText type="bodyMuted">Пока нет залогированных тренировок.</ThemedText>
        )}

        {logs.map((log) => (
          <Pressable
            key={log.id}
            style={styles.row}
            onPress={() => router.push({ pathname: '/workout-detail', params: { id: log.id } })}
          >
            <View style={styles.badge}>
              <ThemedText type="overline">{TYPE_LABELS[log.type].slice(0, 3).toUpperCase()}</ThemedText>
            </View>
            <View style={styles.rowInfo}>
              <ThemedText type="body" style={styles.rowType}>
                {TYPE_LABELS[log.type]}
              </ThemedText>
              <ThemedText type="bodyMuted">
                {formatDate(log.logged_at)}
                {log.duration_minutes ? ` · ${log.duration_minutes} мин` : ''}
              </ThemedText>
            </View>
            <ThemedText type="body" style={styles.xp}>
              +{log.xp_earned}
            </ThemedText>
          </Pressable>
        ))}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: Spacing.four,
    paddingTop: Spacing.six,
    gap: Spacing.two,
  },
  title: {
    marginTop: Spacing.two,
    marginBottom: -Spacing.one,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    padding: Spacing.card,
  },
  badge: {
    width: 44,
    height: 44,
    borderRadius: Radius.tile,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowInfo: {
    flex: 1,
    gap: Spacing.one,
  },
  rowType: {
    fontWeight: '600',
  },
  xp: {
    color: Colors.accent,
    fontWeight: '700',
  },
});
