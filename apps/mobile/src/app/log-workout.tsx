import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { enqueueWorkoutLog, flushWorkoutLogQueue } from '@/lib/offline-queue';

// M-05 Логирование тренировки (§9.1). Этап C: запись сначала уходит в
// офлайн-очередь (AsyncStorage), затем — попытка сразу отправить в
// Supabase. Если сети нет, запись остаётся в очереди и досылается
// при следующем открытии Home или следующем логе.
const WORKOUT_TYPES = ['strength', 'cardio', 'flexibility', 'sports', 'other'] as const;
const LAST_LOG = { weightKg: '40', reps: '10' };

export default function LogWorkoutScreen() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [type, setType] = useState<(typeof WORKOUT_TYPES)[number]>('strength');
  const [weight, setWeight] = useState(LAST_LOG.weightKg);
  const [reps, setReps] = useState(LAST_LOG.reps);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    // Баг, который реально терял тренировки: экран монтируется со своим
    // useAuth() (getSession() ещё не резолвнулся), и быстрый тап
    // по "Сохранить" раньше отдавал silent no-op — ни ошибки, ни записи.
    if (!user) {
      setError(
        authLoading
          ? 'Подождите секунду, проверяем сессию...'
          : 'Сессия не найдена. Войдите заново.',
      );
      return;
    }

    const weightKg = Number(weight);
    const repsCount = Number(reps);
    if (!weight || !reps || Number.isNaN(weightKg) || Number.isNaN(repsCount)) {
      setError('Заполните вес и повторения.');
      return;
    }
    setError(null);
    setSaving(true);

    // Заглушка вместо Edge Function on-workout-logged (§13.2) — та
    // считает реальный XP по приросту к предыдущему логу того же типа.
    // Здесь — простая формула только чтобы протестировать offline-пайплайн.
    const xpEarned = Math.round((weightKg * repsCount) / 10);
    const currencyEarned = Math.round(xpEarned / 2);

    await enqueueWorkoutLog({
      user_id: user.id,
      type,
      weight_kg: weightKg,
      reps: repsCount,
      duration_minutes: null,
      note: null,
      xp_earned: xpEarned,
      currency_earned: currencyEarned,
      logged_at: new Date().toISOString(),
      platform_origin: 'ios',
    });

    await flushWorkoutLogQueue(user.id);

    setSaving(false);
    router.back();
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Лог тренировки</ThemedText>

      <View style={styles.typeRow}>
        {WORKOUT_TYPES.map((option) => (
          <Pressable
            key={option}
            onPress={() => setType(option)}
            style={[styles.typeChip, type === option && styles.typeChipSelected]}
          >
            <ThemedText type="body" style={type === option && styles.typeChipTextSelected}>
              {option}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      <View style={styles.field}>
        <ThemedText type="bodyMuted">Вес, кг</ThemedText>
        <TextInput
          value={weight}
          onChangeText={setWeight}
          keyboardType="numeric"
          style={styles.input}
          placeholderTextColor={Colors.textMuted}
        />
      </View>

      <View style={styles.field}>
        <ThemedText type="bodyMuted">Повторения</ThemedText>
        <TextInput
          value={reps}
          onChangeText={setReps}
          keyboardType="numeric"
          style={styles.input}
          placeholderTextColor={Colors.textMuted}
        />
      </View>

      {error && <ThemedText style={styles.error}>{error}</ThemedText>}

      <Button
        label={saving ? 'Сохранение...' : 'Сохранить'}
        onPress={handleSave}
        disabled={saving || authLoading}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.four,
    paddingTop: Spacing.six,
    gap: Spacing.three,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  typeChip: {
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
  },
  typeChipSelected: {
    borderColor: Colors.accent,
    backgroundColor: Colors.surface,
  },
  typeChipTextSelected: {
    color: Colors.accent,
  },
  field: {
    gap: Spacing.one,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.card,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    color: Colors.text,
    fontSize: 16,
  },
  error: {
    color: '#ff6b6b',
  },
});
