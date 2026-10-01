import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';

import { HeroPhoto } from '@/components/hero-photo';
import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';

// M-06 Ап уровня (§9.1) — модалка на весь экран, лаймовый фон.
// Открывается из шторки log-workout сразу после ответа сервера (там
// известен новый уровень и XP) или из Home, если рост уровня заметили
// позже (синк офлайн-очереди). +200 ⌾ за ап начисляет on-workout-logged.
export default function LevelUpScreen() {
  const router = useRouter();
  const { level, heroName, username, xp } = useLocalSearchParams<{
    level: string;
    heroName: string;
    username?: string;
    xp?: string;
  }>();

  const pop = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    Animated.spring(pop, { toValue: 1, friction: 5, tension: 90, useNativeDriver: true }).start();
  }, [pop]);

  const reward = xp && Number(xp) > 0 ? `+${xp} XP и +200 ⌾ на баланс.` : '+200 ⌾ на баланс.';

  return (
    <View style={styles.container}>
      <ThemedText type="overline" style={styles.overline}>
        Ап уровня
      </ThemedText>

      <View style={styles.body}>
        <HeroPhoto username={username} height={210} style={styles.photo} />
        <Animated.View style={{ alignSelf: 'flex-start', transform: [{ scale: pop }] }}>
          <ThemedText style={styles.levelNumber}>{level}</ThemedText>
        </Animated.View>
        <ThemedText type="display" style={styles.headline}>
          Новый уровень!
        </ThemedText>
        <ThemedText type="body" style={styles.subtext}>
          {heroName}, так держать. {reward}
        </ThemedText>
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.primary} onPress={() => router.replace('/share')}>
          <ThemedText type="title" style={styles.primaryLabel}>
            Поделиться карточкой
          </ThemedText>
        </Pressable>
        <Pressable style={styles.secondary} onPress={() => router.replace('/home')}>
          <ThemedText type="title" style={styles.secondaryLabel}>
            Продолжить
          </ThemedText>
        </Pressable>
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
  photo: {
    borderRadius: 24,
    backgroundColor: Colors.accentText,
  },
  levelNumber: {
    fontSize: 96,
    lineHeight: 104,
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
  // The shared Button is lime on dark; on this lime screen it would vanish,
  // so the buttons here are inverted (dark pill / dark text).
  primary: {
    height: 64,
    borderRadius: 999,
    backgroundColor: Colors.accentText,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryLabel: {
    color: Colors.accent,
    fontSize: 16,
  },
  secondary: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryLabel: {
    color: Colors.accentText,
    fontSize: 16,
  },
});
