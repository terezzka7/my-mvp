import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

export default function SignupScreen() {
  const router = useRouter();
  const { bodyTag, styleTag } = useLocalSearchParams<{ bodyTag?: string; styleTag?: string }>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkEmailMessage, setCheckEmailMessage] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    setCheckEmailMessage(null);

    if (!email || !password || !confirmPassword) {
      setError('Заполните все поля.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Пароли не совпадают.');
      return;
    }
    if (password.length < 6) {
      setError('Пароль должен быть не короче 6 символов.');
      return;
    }

    setSubmitting(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { platform_origin: 'ios' } },
    });
    setSubmitting(false);

    if (signUpError) {
      console.error(signUpError);
      setError('Не удалось зарегистрироваться. Попробуйте ещё раз.');
      return;
    }

    if (data.session) {
      if (bodyTag && styleTag) {
        router.replace({ pathname: '/character-assembly', params: { bodyTag, styleTag } });
      } else {
        router.replace('/onboarding');
      }
      return;
    }

    setCheckEmailMessage('Проверьте почту и подтвердите регистрацию, затем войдите.');
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="display" style={styles.title}>
        Регистрация
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

      <View style={styles.field}>
        <ThemedText type="bodyMuted">Повторите пароль</ThemedText>
        <TextInput
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          style={styles.input}
          placeholderTextColor={Colors.textMuted}
        />
      </View>

      {error && <ThemedText style={styles.error}>{error}</ThemedText>}
      {checkEmailMessage && <ThemedText style={styles.success}>{checkEmailMessage}</ThemedText>}

      <Button
        label={submitting ? 'Регистрация...' : 'Зарегистрироваться'}
        onPress={handleSubmit}
        disabled={submitting}
      />

      <Link
        href={bodyTag && styleTag ? { pathname: '/login', params: { bodyTag, styleTag } } : '/login'}
        style={styles.link}
      >
        <ThemedText type="bodyMuted">Уже есть аккаунт? Войти</ThemedText>
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
  success: {
    color: Colors.accent,
  },
  link: {
    alignItems: 'center',
    marginTop: Spacing.two,
  },
});
