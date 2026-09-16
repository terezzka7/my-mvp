import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

// M-01 Сплэш (§9.1). Слой 2 подставит сюда реальную проверку сессии
// (Supabase Auth) и решит, вести на онбординг или сразу на Home.
export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const timeout = setTimeout(() => {
      router.replace('/onboarding');
    }, 800);
    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="display">Fitness RPG Tracker</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
});
