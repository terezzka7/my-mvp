import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import type { WorkoutType } from '@/lib/database.types';
import { resolveDisplayName } from '@/lib/display-name';
import { enqueueWorkoutLog, flushWorkoutLogQueue, type Intensity } from '@/lib/offline-queue';
import { supabase } from '@/lib/supabase';
import { markLevelUpShown, rememberXpGain } from '@/lib/workout-result';

// M-05 Логирование тренировки (§9.1) — нижняя шторка из двух шагов:
// 1) тип, 2) длительность + насколько тяжело. Для "Силовой" на шаге 2
// есть необязательные вес/повторы — без них XP не сможет расти от прироста
// к прошлой тренировке (Риск 4). Запись сначала идёт в офлайн-очередь
// (AsyncStorage), затем сразу пробуем отправить на Edge Function
// on-workout-logged. Если сети нет, запись остаётся в очереди и
// досылается при следующем открытии Home или следующем логе.
const TYPES: { value: WorkoutType; label: string }[] = [
  { value: 'strength', label: 'Силовая' },
  { value: 'cardio', label: 'Кардио' },
  { value: 'flexibility', label: 'Растяжка' },
  { value: 'sports', label: 'Игра' },
];

const EFFORTS: { minutes: number; intensity: Intensity; label: string }[] = [
  { minutes: 20, intensity: 'easy', label: '20 мин · легко' },
  { minutes: 40, intensity: 'medium', label: '40 мин · средне' },
  { minutes: 60, intensity: 'hard', label: '60 мин · тяжело' },
  { minutes: 90, intensity: 'max', label: '90+ мин · макс' },
];

interface HeroInfo {
  level: number;
  name: string;
  username: string;
}

export default function LogWorkoutScreen() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [type, setType] = useState<WorkoutType | null>(null);
  const [effortIndex, setEffortIndex] = useState<number | null>(null);
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // Level before logging — the server's answer is compared against it to
  // decide whether to open the level-up screen.
  const hero = useRef<HeroInfo | null>(null);

  useEffect(() => {
    if (!user) return;
    let active = true;
    Promise.all([
      supabase.from('users').select('username, display_name').eq('id', user.id).maybeSingle(),
      supabase.from('characters').select('name, level').eq('user_id', user.id).maybeSingle(),
    ]).then(([{ data: me }, { data: character }]) => {
      if (!active || !me || !character) return;
      hero.current = {
        level: character.level,
        name: resolveDisplayName(me.display_name, character.name, me.username),
        username: me.username,
      };
    });
    return () => {
      active = false;
    };
  }, [user]);

  async function handleDone() {
    if (!type || effortIndex === null) return;

    // Баг, который реально терял тренировки: экран монтируется со своим
    // useAuth() (getSession() ещё не резолвнулся), и быстрый тап
    // раньше отдавал silent no-op — ни ошибки, ни записи.
    if (!user) {
      setError(
        authLoading
          ? 'Подождите секунду, проверяем сессию...'
          : 'Сессия не найдена. Войдите заново.',
      );
      return;
    }

    let weightKg: number | null = null;
    let repsCount: number | null = null;
    if (type === 'strength' && (weight.trim() || reps.trim())) {
      weightKg = Number(weight.replace(',', '.'));
      repsCount = Number(reps);
      if (!weight.trim() || !reps.trim() || !(weightKg > 0) || !(repsCount > 0)) {
        setError('Укажите и вес, и повторы, или оставьте оба поля пустыми.');
        return;
      }
    }

    const effort = EFFORTS[effortIndex];
    setError(null);
    setSaving(true);

    await enqueueWorkoutLog({
      user_id: user.id,
      type,
      weight_kg: weightKg,
      reps: repsCount,
      duration_minutes: effort.minutes,
      intensity: effort.intensity,
      note: null,
      logged_at: new Date().toISOString(),
      platform_origin: 'ios',
    });

    const result = await flushWorkoutLogQueue(user.id);
    setSaving(false);

    const before = hero.current;
    if (result.character && before && result.character.level > before.level) {
      markLevelUpShown(result.character.level);
      router.replace({
        pathname: '/level-up',
        params: {
          level: String(result.character.level),
          heroName: before.name,
          username: before.username,
          xp: String(result.xpEarned),
        },
      });
      return;
    }

    rememberXpGain(result.xpEarned);
    router.back();
  }

  const canContinue = step === 1 ? type !== null : effortIndex !== null && !saving;

  function handlePrimary() {
    if (step === 1) {
      setError(null);
      setStep(2);
    } else {
      handleDone();
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <View style={styles.headerRow}>
          <ThemedText type="overline">Шаг {step} из 2</ThemedText>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <ThemedText type="body" style={styles.close}>
              ✕
            </ThemedText>
          </Pressable>
        </View>

        <ThemedText type="display" style={styles.title}>
          {step === 1 ? 'Что за тренировка?' : 'Сколько и как тяжело?'}
        </ThemedText>

        <View style={styles.grid}>
          {step === 1
            ? TYPES.map((option) => (
                <Tile
                  key={option.value}
                  label={option.label}
                  selected={type === option.value}
                  onPress={() => setType(option.value)}
                />
              ))
            : EFFORTS.map((option, index) => (
                <Tile
                  key={option.intensity}
                  label={option.label}
                  selected={effortIndex === index}
                  onPress={() => setEffortIndex(index)}
                />
              ))}
        </View>

        {step === 2 && type === 'strength' && (
          <ThemedText type="bodyMuted" style={styles.hint}>
            Вес и повторы по желанию: с ними XP растёт за прогресс.
          </ThemedText>
        )}

        {step === 2 && type === 'strength' && (
          <View style={styles.strengthRow}>
            <View style={styles.field}>
              <ThemedText type="bodyMuted">Вес, кг</ThemedText>
              <TextInput
                value={weight}
                onChangeText={setWeight}
                keyboardType="decimal-pad"
                placeholder="40"
                placeholderTextColor={Colors.textMuted}
                style={styles.input}
              />
            </View>
            <View style={styles.field}>
              <ThemedText type="bodyMuted">Повторы</ThemedText>
              <TextInput
                value={reps}
                onChangeText={setReps}
                keyboardType="number-pad"
                placeholder="10"
                placeholderTextColor={Colors.textMuted}
                style={styles.input}
              />
            </View>
          </View>
        )}

        {error && <ThemedText style={styles.error}>{error}</ThemedText>}

        <Pressable
          onPress={handlePrimary}
          disabled={!canContinue || authLoading}
          style={[styles.primary, canContinue ? styles.primaryOn : styles.primaryOff]}
        >
          <ThemedText type="title" style={canContinue ? styles.primaryLabelOn : styles.primaryLabelOff}>
            {step === 1 ? 'Далее' : saving ? 'Сохранение...' : 'Готово · +XP'}
          </ThemedText>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function Tile({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.tile, selected && styles.tileSelected]}>
      <ThemedText type="body" style={selected && styles.tileLabelSelected}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#151515',
  },
  content: {
    padding: Spacing.four,
    paddingTop: Spacing.three,
    gap: Spacing.three,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  close: {
    color: Colors.textMuted,
    fontSize: 20,
  },
  title: {
    fontSize: 26,
    lineHeight: 32,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  tile: {
    width: '47.5%',
    flexGrow: 1,
    height: 80,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileSelected: {
    borderColor: Colors.accent,
  },
  tileLabelSelected: {
    color: Colors.accent,
  },
  hint: {
    fontSize: 14,
    lineHeight: 20,
  },
  strengthRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  field: {
    flex: 1,
    gap: Spacing.one,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    color: Colors.text,
    fontSize: 16,
  },
  error: {
    color: '#ff6b6b',
  },
  primary: {
    height: 76,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.one,
  },
  primaryOn: {
    backgroundColor: Colors.accent,
  },
  primaryOff: {
    backgroundColor: 'rgba(255,255,255,.08)',
  },
  primaryLabelOn: {
    color: Colors.accentText,
    fontSize: 18,
  },
  primaryLabelOff: {
    color: Colors.textMuted,
    fontSize: 18,
  },
});
