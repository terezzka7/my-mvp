import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';

// M-01 Сплэш (§9.1): нет сессии → /login; есть сессия, но нет
// персонажа → /onboarding (M-02); есть и то и другое → /home (M-04).
export default function SplashScreen() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    let active = true;

    async function decideRoute() {
      if (!user) {
        router.replace('/login');
        return;
      }

      const { data: character, error } = await supabase
        .from('characters')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

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
