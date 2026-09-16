import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Radius, Spacing } from '@/constants/theme';

// M-04 Home (§9.1, детализация первого визита в §9.1a). Данные —
// моковые; users/characters/streaks/workout_logs подключаются в Слое 2.
const MOCK_CHARACTER = {
  name: 'Герой',
  level: 1,
  xpCurrent: 0,
  xpToNext: 100,
  streak: 0,
};

export default function HomeScreen() {
  const router = useRouter();
  const xpProgress = MOCK_CHARACTER.xpCurrent / MOCK_CHARACTER.xpToNext;

  return (
    <ThemedView style={styles.container}>
      <View style={styles.characterCard}>
        <ThemedText type="overline">Уровень {MOCK_CHARACTER.level}</ThemedText>
        <ThemedText type="display">{MOCK_CHARACTER.name}</ThemedText>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.max(xpProgress, 0.04) * 100}%` }]} />
        </View>
        <ThemedText type="bodyMuted">
          {MOCK_CHARACTER.xpCurrent}/{MOCK_CHARACTER.xpToNext} XP
        </ThemedText>

        <View style={styles.streakRow}>
          <ThemedText type="body">🔥 {MOCK_CHARACTER.streak} дней</ThemedText>
        </View>
      </View>

      <View style={styles.startCard}>
        <ThemedText type="title">Начни путь</ThemedText>
        <ThemedText type="bodyMuted" style={styles.startHint}>
          Залогируй первую тренировку, чтобы получить XP и поднять уровень
        </ThemedText>
      </View>

      <Pressable style={styles.fab} onPress={() => router.push('/log-workout')}>
        <ThemedText type="display" style={styles.fabLabel}>
          +
        </ThemedText>
      </Pressable>
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
  startCard: {
    marginTop: Spacing.four,
    padding: Spacing.four,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  startHint: {
    marginTop: Spacing.one,
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
});
