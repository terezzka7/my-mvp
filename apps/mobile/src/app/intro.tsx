import { useRouter } from 'expo-router';
import { Image, StyleSheet, useWindowDimensions, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';

// assets/images/intro-hero.png is 1000×1542 (the waving hero from the web Hero).
const HERO_ASPECT = 1542 / 1000;
// Share of the screen width the hero takes; she is pinned to the bottom right
// and cropped by the screen edge, like in the design.
const HERO_WIDTH_SHARE = 0.9;

// M-01b Объяснение (§9.1/§9.2 — питч перед регистрацией, показывается
// только пользователям без сессии сразу после сплэша M-01).
export default function IntroScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const heroWidth = width * HERO_WIDTH_SHARE;

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

      {/* Right padding keeps the label clear of the hero's hip in front of the button's right end. */}
      <Button label="Собрать персонажа" style={styles.cta} onPress={() => router.push('/onboarding')} />

      {/* Drawn last: the hero stands in front of the button. Touches pass through, so the whole button still works. */}
      <View style={styles.heroLayer} pointerEvents="none">
        <Image
          source={require('@/assets/images/intro-hero.png')}
          style={{ width: heroWidth, height: heroWidth * HERO_ASPECT }}
          resizeMode="contain"
        />
      </View>
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
    overflow: 'hidden',
  },
  copy: {
    gap: 0,
  },
  // A bit smaller than the default display size so "от реального прогресса" fits one line.
  text: {
    fontSize: 27,
    lineHeight: 31,
  },
  accent: {
    color: Colors.accent,
    fontSize: 27,
    lineHeight: 31,
  },
  cta: {
    paddingRight: Spacing.six,
  },
  heroLayer: {
    position: 'absolute',
    right: 0,
    bottom: -Spacing.three,
  },
});
