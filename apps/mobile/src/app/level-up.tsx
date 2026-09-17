import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';

// M-06 Ап уровня (§9.1) — модалка на весь экран, лаймовый фон.
// Открывается из home.tsx, когда повторный fetch после лога
// тренировки видит level > предыдущий известный уровень.
export default function LevelUpScreen() {
  const router = useRouter();
  const { level, heroName } = useLocalSearchParams<{ level: string; heroName: string }>();

  return (
    <View style={styles.container}>
      <ThemedText type="overline" style={styles.overline}>
        Ап уровня
      </ThemedText>

      <View style={styles.body}>
        <ThemedText style={styles.levelNumber}>{level}</ThemedText>
        <ThemedText type="display" style={styles.headline}>
          {heroName} стала{'\n'}сильнее
        </ThemedText>
        <ThemedText type="body" style={styles.subtext}>
          Открыт новый предмет и +200 ⌾ на баланс.
        </ThemedText>
      </View>

      <View style={styles.actions}>
        <Button label="Поделиться карточкой" onPress={() => router.replace('/share')} />
        <Button label="Продолжить" variant="secondary" onPress={() => router.replace('/home')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.accent,
    padding: Spacing.four,
    paddingTop: Spacing.six,
    justifyContent: 'space-between',
  },
  overline: {
    color: 'rgba(13,13,13,.5)',
  },
  body: {
    gap: Spacing.two,
  },
  levelNumber: {
    fontSize: 96,
    lineHeight: 96,
    fontWeight: '800',
    color: Colors.accentText,
    letterSpacing: -2,
  },
  headline: {
    color: Colors.accentText,
  },
  subtext: {
    color: 'rgba(13,13,13,.6)',
  },
  actions: {
    gap: Spacing.two,
  },
});
