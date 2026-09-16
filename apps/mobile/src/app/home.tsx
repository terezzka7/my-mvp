import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

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
}

// M-04 Home (§9.1, детализация в §9.1a). users/characters/streaks —
// реальные запросы. Этап C: досылает отложенные workout_logs из
// офлайн-очереди при каждом открытии экрана.
export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [character, setCharacter] = useState<CharacterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);

  // Этап C: досылаем всё, что накопилось офлайн, при каждом открытии Home.
  useEffect(() => {
    let active = true;

    async function sync() {
      if (!user) return;
      await flushWorkoutLogQueue(user.id);
      const count = await getPendingCount(user.id);
      if (active) setPendingCount(count);
    }

    sync();
    return () => {
      active = false;
    };
  }, [user]);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!user) return;

      const [{ data: characterRow, error: characterError }, { data: streakRow, error: streakError }] =
        await Promise.all([
          supabase
            .from('characters')
            .select('name, level, xp_current, xp_to_next')
            .eq('user_id', user.id)
            .maybeSingle(),
          supabase.from('streaks').select('current_streak').eq('user_id', user.id).maybeSingle(),
        ]);

      if (!active) return;

      const firstError = characterError ?? streakError;
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

      setCharacter({
        name: characterRow.name,
        level: characterRow.level,
        xpCurrent: characterRow.xp_current,
        xpToNext: characterRow.xp_to_next,
        streak: streakRow?.current_streak ?? 0,
      });
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [user]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace('/login');
  }

  return (
    <ThemedView style={styles.container}>
      <Pressable style={styles.logout} onPress={handleLogout}>
        <ThemedText type="bodyMuted">Выйти</ThemedText>
      </Pressable>

      {loading && <ThemedText type="bodyMuted">Загрузка...</ThemedText>}
      {error && <ThemedText style={styles.error}>{error}</ThemedText>}

      {!loading && !error && character && (
        <>
          <View style={styles.characterCard}>
            <ThemedText type="overline">Уровень {character.level}</ThemedText>
            <ThemedText type="display">{character.name}</ThemedText>

            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.max(character.xpCurrent / character.xpToNext, 0.04) * 100}%` },
                ]}
              />
            </View>
            <ThemedText type="bodyMuted">
              {character.xpCurrent}/{character.xpToNext} XP
            </ThemedText>

            <View style={styles.streakRow}>
              <ThemedText type="body">🔥 {character.streak} дней</ThemedText>
            </View>

            {pendingCount > 0 && (
              <ThemedText type="bodyMuted" style={styles.pending}>
                {pendingCount} трен. ждут синхронизации
              </ThemedText>
            )}
          </View>

          <Pressable style={styles.fab} onPress={() => router.push('/log-workout')}>
            <ThemedText type="display" style={styles.fabLabel}>
              +
            </ThemedText>
          </Pressable>
        </>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.four,
    paddingTop: Spacing.six,
  },
  characterCard: {
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  progressTrack: {
    height: 8,
    borderRadius: Radius.pill,
    backgroundColor: Colors.border,
    overflow: 'hidden',
    marginTop: Spacing.two,
  },
  progressFill: {
    height: '100%',
    borderRadius: Radius.pill,
    backgroundColor: Colors.accent,
  },
  streakRow: {
    marginTop: Spacing.two,
  },
  fab: {
    position: 'absolute',
    right: Spacing.four,
    bottom: Spacing.five,
    width: 64,
    height: 64,
    borderRadius: Radius.pill,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabLabel: {
    color: Colors.accentText,
    lineHeight: 34,
  },
  error: {
    color: '#ff6b6b',
  },
  logout: {
    alignSelf: 'flex-end',
    marginBottom: Spacing.two,
  },
  pending: {
    marginTop: Spacing.one,
    color: Colors.accent,
  },
});
