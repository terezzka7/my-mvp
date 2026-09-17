import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';

// M-01b Объяснение (§9.1/§9.2 — питч перед регистрацией, показывается
// только пользователям без сессии сразу после сплэша M-01).
export default function IntroScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.copy}>
        <ThemedText type="display" style={styles.text}>
          Трекай тренировки{'\n'}за 2 тапа{'\n'}
          <ThemedText type="display" style={styles.accent}>
            и качай своего{'\n'}персонажа
          </ThemedText>
          {'\n'}от реального прогресса
        </ThemedText>
      </View>

      <Button label="Собрать персонажа" onPress={() => router.push('/signup')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.six,
    paddingBottom: Spacing.five,
    backgroundColor: Colors.bg,
  },
  copy: {
    gap: 0,
  },
  text: {
    lineHeight: 40,
  },
  accent: {
    color: Colors.accent,
    lineHeight: 40,
  },
});
