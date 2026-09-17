import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';

// M-02 Онбординг — выбор критериев (§9.1, детализация в §9.1a).
// Пол определяет базовый нейтральный силуэт тела (не комплекцию —
// та будет меняться от прогресса в будущих версиях, не в этом MVP).
// Критерии выбираются ДО регистрации (снижает трение на самом опасном
// моменте CJM, см. 5.2/9.1a) — assemble-character требует JWT, поэтому
// без сессии критерии передаются дальше на /signup и уходят в M-03
// уже после входа.
const GENDER_OPTIONS = ['Мужской', 'Женский'];
const STYLE_OPTIONS = ['Классика', 'Ретро', 'Стрит', 'Футуризм'];

function randomOf<T>(options: T[]): T {
  return options[Math.floor(Math.random() * options.length)];
}

export default function OnboardingScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [gender, setGender] = useState<string | null>(null);
  const [style, setStyle] = useState<string | null>(null);

  const canContinue = gender !== null && style !== null;

  function goToAssembly() {
    const bodyTag = (gender ?? randomOf(GENDER_OPTIONS)).toLowerCase();
    const styleTag = (style ?? randomOf(STYLE_OPTIONS)).toLowerCase();

    if (user) {
      router.push({ pathname: '/character-assembly', params: { bodyTag, styleTag } });
    } else {
      router.push({ pathname: '/signup', params: { bodyTag, styleTag } });
    }
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="overline">Шаг 1 из 2</ThemedText>
        <ThemedText type="display" style={styles.title}>
          Каким будет твой герой?
        </ThemedText>

        <ThemedText type="title" style={styles.sectionLabel}>
          Пол
        </ThemedText>
        <View style={styles.optionsGrid}>
          {GENDER_OPTIONS.map((option) => (
            <Chip
              key={option}
              label={option}
              selected={gender === option}
              onPress={() => setGender(option)}
            />
          ))}
        </View>

        <ThemedText type="title" style={styles.sectionLabel}>
          Стиль
        </ThemedText>
        <View style={styles.optionsGrid}>
          {STYLE_OPTIONS.map((option) => (
            <Chip
              key={option}
              label={option}
              selected={style === option}
              onPress={() => setStyle(option)}
            />
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button label="Далее" disabled={!canContinue} onPress={goToAssembly} />
        <Pressable onPress={goToAssembly} style={styles.skip}>
          <ThemedText type="bodyMuted">Пропустить — собрать случайно</ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <ThemedText type="body" style={selected && styles.chipTextSelected}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.four,
    paddingTop: Spacing.six,
    gap: Spacing.two,
  },
  title: {
    marginTop: Spacing.two,
    marginBottom: Spacing.four,
  },
  sectionLabel: {
    marginTop: Spacing.four,
    marginBottom: Spacing.two,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  chipSelected: {
    borderColor: Colors.accent,
    backgroundColor: Colors.surface,
  },
  chipTextSelected: {
    color: Colors.accent,
  },
  footer: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  skip: {
    alignItems: 'center',
  },
});
