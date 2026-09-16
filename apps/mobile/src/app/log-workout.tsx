import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Radius, Spacing } from '@/constants/theme';

// M-05 Логирование тренировки (§9.1). Вес/повторения автоподставлены
// из мокового "последнего лога" — реальная история из workout_logs
// придёт в Слое 2. Этап C (offline-кэш перед отправкой в Supabase)
// подключится сюда же.
const WORKOUT_TYPES = ['strength', 'cardio', 'flexibility', 'sports', 'other'] as const;
const LAST_LOG = { weightKg: '40', reps: '10' };

export default function LogWorkoutScreen() {
  const router = useRouter();
  const [type, setType] = useState<(typeof WORKOUT_TYPES)[number]>('strength');
  const [weight, setWeight] = useState(LAST_LOG.weightKg);
  const [reps, setReps] = useState(LAST_LOG.reps);
  const [error, setError] = useState<string | null>(null);

  function handleSave() {
    if (!weight || !reps) {
      setError('Заполните вес и повторения.');
      return;
    }
    setError(null);
    // Слой 2: supabase.from('workout_logs').insert(...) + offline-очередь (Этап C)
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

      <Button label="Сохранить" onPress={handleSave} />
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
