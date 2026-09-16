import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Radius, Spacing } from '@/constants/theme';

// M-02 Онбординг — выбор критериев (§9.1, детализация в §9.1a).
// Пул шаблонов — моковый, реальный подбор из template_assets придёт в Слое 2.
const BODY_OPTIONS = ['Атлетичный', 'Плотный', 'Стройный', 'Нейтральный'];
const STYLE_OPTIONS = ['Спортивный минимализм', 'Уличный', 'Классический зал'];

export default function OnboardingScreen() {
  const router = useRouter();
  const [body, setBody] = useState<string | null>(null);
  const [style, setStyle] = useState<string | null>(null);

  const canContinue = body !== null && style !== null;

  function goToAssembly() {
    router.push('/character-assembly');
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="overline">Шаг 1 из 2</ThemedText>
        <ThemedText type="display" style={styles.title}>
          Каким будет твой герой?
        </ThemedText>

        <ThemedText type="title" style={styles.sectionLabel}>
          Телосложение
        </ThemedText>
        <View style={styles.optionsGrid}>
          {BODY_OPTIONS.map((option) => (
            <Chip
              key={option}
              label={option}
              selected={body === option}
              onPress={() => setBody(option)}
            />
          ))}
        </View>

        <ThemedText type="title" style={styles.sectionLabel}>
          Стиль/архетип
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
