import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import type { ChallengesRow, UserChallengesRow } from '@/lib/database.types';

type Filter = 'active' | 'open';

interface Row {
  challenge: ChallengesRow;
  userChallenge: UserChallengesRow | null;
}

// M-07 Челленджи (§9.1). challenges — публичный каталог (RLS: select
// authenticated). user_challenges — свои строки, "Участвовать" на
// M-08 — обычный клиентский insert (RLS это разрешает); прогресс же
// обновляет только Edge Function on-workout-logged.
export default function ChallengesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [filter, setFilter] = useState<Filter>('active');
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      let active = true;

      async function load() {
        const [{ data: challenges, error: challengesError }, { data: userChallenges, error: ucError }] =
          await Promise.all([
            supabase.from('challenges').select('*').order('created_at', { ascending: true }),
            supabase.from('user_challenges').select('*').eq('user_id', user!.id),
          ]);

        if (!active) return;
        if (challengesError) console.error(challengesError);
        if (ucError) console.error(ucError);

        const byId = new Map((userChallenges ?? []).map((uc) => [uc.challenge_id, uc]));
        setRows(
          (challenges ?? []).map((c) => ({ challenge: c, userChallenge: byId.get(c.id) ?? null })),
        );
        setLoading(false);
      }

      load();
      return () => {
        active = false;
      };
    }, [user]),
  );

  const visible = rows.filter((r) =>
    filter === 'active' ? r.userChallenge?.status === 'active' : !r.userChallenge,
  );

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="display" style={styles.title}>
          Челленджи
        </ThemedText>

        <View style={styles.filterRow}>
          {(
            [
              ['active', 'Активные'],
              ['open', 'Доступные'],
            ] as const
          ).map(([key, label]) => (
            <Pressable
              key={key}
              onPress={() => setFilter(key)}
              style={[styles.filterChip, filter === key && styles.filterChipActive]}
            >
              <ThemedText type="body" style={filter === key ? styles.filterLabelActive : undefined}>
                {label}
              </ThemedText>
            </Pressable>
          ))}
        </View>

        {loading && <ThemedText type="bodyMuted">Загрузка...</ThemedText>}

        {!loading && visible.length === 0 && (
          <ThemedText type="bodyMuted">
            {filter === 'active' ? 'Нет активных челленджей.' : 'Все челленджи уже взяты.'}
          </ThemedText>
        )}

        {visible.map(({ challenge, userChallenge }) => {
          const pct = Math.round(((userChallenge?.progress ?? 0) / challenge.target_value) * 100);
          return (
            <Pressable
              key={challenge.id}
              style={styles.card}
              onPress={() => router.push({ pathname: '/challenge-detail', params: { id: challenge.id } })}
            >
              <View style={styles.cardTopRow}>
                <ThemedText type="overline">
                  {userChallenge ? 'Активный' : 'Доступный'}
                </ThemedText>
                <ThemedText type="bodyMuted">
                  {challenge.duration_days} дн. · +{challenge.xp_reward} XP
                </ThemedText>
              </View>
              <ThemedText type="title" style={styles.cardTitle}>
                {challenge.title}
              </ThemedText>
              {userChallenge && (
                <>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${pct}%` }]} />
                  </View>
                  <ThemedText type="bodyMuted">
                    {userChallenge.progress} из {challenge.target_value}
                  </ThemedText>
                </>
              )}
            </Pressable>
          );
        })}
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
    marginBottom: Spacing.two,
  },
  filterRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  filterChip: {
    borderRadius: Radius.pill,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  filterLabelActive: {
    color: Colors.accentText,
    fontWeight: '600',
  },
  card: {
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardTitle: {
    marginBottom: Spacing.one,
  },
  progressTrack: {
    height: 6,
    borderRadius: Radius.pill,
    backgroundColor: Colors.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.accent,
  },
});
