import { useCallback, useState } from 'react';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import type { ChallengesRow, UserChallengesRow } from '@/lib/database.types';

// What actually counts towards the challenge, taken from how on-workout-logged
// bumps progress for each type (nothing here is a rule the server doesn't apply).
function rulesFor(challenge: ChallengesRow): string[] {
  const live = 'Прогресс обновляется сразу после логирования';
  switch (challenge.type) {
    case 'streak':
      return [
        'Считается текущая серия дней с тренировками',
        'Пропуск не сбрасывает серию, но и не продвигает прогресс',
        live,
      ];
    case 'duration_total':
      return [
        'Считаются минуты залогированных тренировок',
        'Минуты примерные: 20, 40, 60 или 90 по выбору при записи',
        live,
      ];
    default:
      return ['Считается любая залогированная тренировка', live];
  }
}

// M-08 Детали челленджа (§9.1). "Участвовать" — прямой клиентский
// insert в user_challenges (RLS это разрешает own-insert). "Покинуть" —
// Edge Function leave-challenge: на user_challenges у клиента нет ни
// UPDATE, ни DELETE политики (§10).
export default function ChallengeDetailScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [challenge, setChallenge] = useState<ChallengesRow | null>(null);
  const [userChallenge, setUserChallenge] = useState<UserChallengesRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);
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

  async function handleLeave() {
    if (!challenge) return;
    setLeaving(true);
    setError(null);
    const { error: leaveError } = await supabase.functions.invoke('leave-challenge', {
      body: { challenge_id: challenge.id },
    });
    setLeaving(false);
    if (leaveError) {
      console.error(leaveError);
      setError('Не удалось покинуть челлендж. Попробуйте ещё раз.');
      return;
    }
    router.back();
  }

  function confirmLeave() {
    Alert.alert('Покинуть челлендж?', 'Прогресс по нему будет потерян. Позже можно присоединиться снова с нуля.', [
      { text: 'Остаться', style: 'cancel' },
      { text: 'Покинуть', style: 'destructive', onPress: handleLeave },
    ]);
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

        <View style={styles.card}>
          <ThemedText type="overline" style={styles.rulesTitle}>
            Правила
          </ThemedText>
          {rulesFor(challenge).map((rule) => (
            <View key={rule} style={styles.ruleRow}>
              <View style={styles.ruleDot} />
              <ThemedText type="body" style={styles.ruleText}>
                {rule}
              </ThemedText>
            </View>
          ))}
        </View>

        {error && <ThemedText style={styles.error}>{error}</ThemedText>}

        {!userChallenge && (
          <Button label={joining ? 'Присоединяем...' : 'Участвовать'} onPress={handleJoin} disabled={joining} />
        )}
        {userChallenge?.status === 'active' && (
          <Button
            label={leaving ? 'Выходим...' : 'Покинуть челлендж'}
            variant="secondary"
            onPress={confirmLeave}
            disabled={leaving}
          />
        )}
        {userChallenge?.status === 'completed' && <ThemedText type="bodyMuted">Челлендж выполнен.</ThemedText>}
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
    padding: Spacing.card,
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
    borderRadius: Radius.tile,
    backgroundColor: Colors.bg,
    padding: Spacing.two,
    gap: Spacing.one,
  },
  rewardValue: {
    color: Colors.accent,
  },
  rulesTitle: {
    color: Colors.textMuted,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  ruleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 7,
    backgroundColor: Colors.accent,
  },
  ruleText: {
    flex: 1,
  },
  error: {
    color: '#ff6b6b',
  },
});
