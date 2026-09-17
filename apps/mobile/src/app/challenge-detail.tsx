import { useCallback, useState } from 'react';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import type { ChallengesRow, UserChallengesRow } from '@/lib/database.types';

// M-08 Детали челленджа (§9.1). "Участвовать" — прямой клиентский
// insert в user_challenges (RLS это разрешает own-insert). Обратного
// действия ("покинуть") нет — на user_challenges нет ни UPDATE, ни
// DELETE политики для клиента (§10), только Edge Function.
export default function ChallengeDetailScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [challenge, setChallenge] = useState<ChallengesRow | null>(null);
  const [userChallenge, setUserChallenge] = useState<UserChallengesRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user || !id) return;
    const [{ data: challengeRow, error: challengeError }, { data: ucRow, error: ucError }] =
      await Promise.all([
        supabase.from('challenges').select('*').eq('id', id).maybeSingle(),
        supabase.from('user_challenges').select('*').eq('user_id', user.id).eq('challenge_id', id).maybeSingle(),
      ]);
    if (challengeError) console.error(challengeError);
    if (ucError) console.error(ucError);
    setChallenge(challengeRow ?? null);
    setUserChallenge(ucRow ?? null);
    setLoading(false);
  }, [user, id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function handleJoin() {
    if (!user || !challenge) return;
    setJoining(true);
    setError(null);
    const { error: insertError } = await supabase
      .from('user_challenges')
      .insert({ user_id: user.id, challenge_id: challenge.id, progress: 0, status: 'active', completed_at: null });
    setJoining(false);
    if (insertError) {
      console.error(insertError);
      setError('Не удалось присоединиться. Попробуйте ещё раз.');
      return;
    }
    load();
  }

  if (loading || !challenge) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="bodyMuted">Загрузка...</ThemedText>
      </ThemedView>
    );
  }

  const pct = Math.round(((userChallenge?.progress ?? 0) / challenge.target_value) * 100);

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.back()}>
          <ThemedText type="overline">← Челленджи</ThemedText>
        </Pressable>

        <ThemedText type="display" style={styles.title}>
          {challenge.title}
        </ThemedText>
        <ThemedText type="bodyMuted">{challenge.description}</ThemedText>

        <View style={styles.card}>
          <View style={styles.cardTopRow}>
            <ThemedText type="bodyMuted">Прогресс</ThemedText>
            <ThemedText type="title" style={styles.pct}>
              {userChallenge ? `${pct}%` : '—'}
            </ThemedText>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${userChallenge ? pct : 0}%` }]} />
          </View>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <ThemedText type="title">{userChallenge?.progress ?? 0}</ThemedText>
              <ThemedText type="bodyMuted">выполнено</ThemedText>
            </View>
            <View style={styles.stat}>
              <ThemedText type="title">{challenge.target_value}</ThemedText>
              <ThemedText type="bodyMuted">цель</ThemedText>
            </View>
            <View style={styles.stat}>
              <ThemedText type="title" style={styles.rewardValue}>
                +{challenge.xp_reward}
              </ThemedText>
              <ThemedText type="bodyMuted">XP</ThemedText>
            </View>
          </View>
        </View>

        {error && <ThemedText style={styles.error}>{error}</ThemedText>}

        <Button
          label={userChallenge ? 'Вы участвуете' : joining ? 'Присоединяем...' : 'Участвовать'}
          onPress={handleJoin}
          disabled={!!userChallenge || joining}
        />
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
    alignItems: 'baseline',
  },
  pct: {
    color: Colors.accent,
  },
  progressTrack: {
    height: 8,
    borderRadius: Radius.pill,
    backgroundColor: Colors.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.accent,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  stat: {
    flex: 1,
    borderRadius: Radius.card,
    backgroundColor: Colors.bg,
    padding: Spacing.two,
    gap: Spacing.one,
  },
  rewardValue: {
    color: Colors.accent,
  },
  error: {
    color: '#ff6b6b',
  },
});
