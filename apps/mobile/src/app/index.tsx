import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';

// M-01 Сплэш (§9.1): нет сессии → M-01b /intro; есть сессия, но нет
// персонажа → /onboarding (M-02); есть и то и другое → /home (M-04).
// Держим кислотный экран минимум 2с (бренд-момент), даже если сессия
// резолвится быстрее.
const MIN_SPLASH_MS = 2000;

export default function SplashScreen() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    let active = true;
    const minDelay = new Promise((resolve) => setTimeout(resolve, MIN_SPLASH_MS));

    async function decideRoute() {
      if (!user) {
        await minDelay;
        if (active) router.replace('/intro');
        return;
      }

      const [{ data: character, error }] = await Promise.all([
        supabase.from('characters').select('id').eq('user_id', user.id).maybeSingle(),
        minDelay,
      ]);

      if (!active) return;

      if (error) {
        console.error(error);
      }

      router.replace(character ? '/home' : '/onboarding');
    }

    decideRoute();
    return () => {
      active = false;
    };
  }, [loading, user, router]);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ThemedText type="display" style={styles.title}>
        Buildyfit
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    backgroundColor: Colors.accent,
  },
  title: {
    color: '#000000',
  },
});
