import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

// M-1 Регистрация/авторизация (§13.2). Не отдельный ряд в §9.1 —
// экран нужен, чтобы вообще попасть на M-02/M-04. Тот же email+пароль
// упрощение, что и на web (§11.3 Apple ID/Google — отдельный шаг).
export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    if (!email || !password) {
      setError('Заполните email и пароль.');
      return;
    }

    setSubmitting(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);

    if (signInError) {
      console.error(signInError);
      setError('Не удалось войти. Проверьте email и пароль.');
      return;
    }

    router.replace('/onboarding');
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="display" style={styles.title}>
        Войти
      </ThemedText>

      <View style={styles.field}>
        <ThemedText type="bodyMuted">Email</ThemedText>
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
          placeholderTextColor={Colors.textMuted}
        />
      </View>

      <View style={styles.field}>
        <ThemedText type="bodyMuted">Пароль</ThemedText>
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
          placeholderTextColor={Colors.textMuted}
        />
      </View>

      {error && <ThemedText style={styles.error}>{error}</ThemedText>}

      <Button label={submitting ? 'Вход...' : 'Войти'} onPress={handleSubmit} disabled={submitting} />

      <Link href="/signup" style={styles.link}>
        <ThemedText type="bodyMuted">Нет аккаунта? Зарегистрироваться</ThemedText>
      </Link>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.four,
    paddingTop: Spacing.six,
    gap: Spacing.three,
  },
  title: {
    marginBottom: Spacing.two,
  },
  field: {
    gap: Spacing.one,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.card,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    color: Colors.text,
    fontSize: 16,
  },
  error: {
    color: '#ff6b6b',
  },
  link: {
    alignItems: 'center',
    marginTop: Spacing.two,
  },
});
