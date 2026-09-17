import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';

// M-03 Сборка персонажа (§9.1, §9.1a). "Это я" вызывает Edge Function
// assemble-character (§7.1/§11.1/§13.2), которая подбирает шаблоны по
// критериям, компонует изображение и сохраняет строку в characters.
// Имя (введено на M-02b, до входа) в саму функцию не передаётся — она
// его не знает, поэтому пишем его отдельным UPDATE своей же строки
// сразу после сборки (RLS разрешает владельцу обновлять characters).
export default function CharacterAssemblyScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { bodyTag, styleTag, name } = useLocalSearchParams<{
    bodyTag: string;
    styleTag: string;
    name?: string;
  }>();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [assembling, setAssembling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setAssembling(true);
    setError(null);

    const { data, error: invokeError } = await supabase.functions.invoke('assemble-character', {
      body: { bodyTag, styleTag },
    });

    if (invokeError || !data?.character) {
      setAssembling(false);
      console.error(invokeError);
      setError('Не удалось собрать персонажа. Попробуйте ещё раз.');
      return;
    }

    if (name && user) {
      const { error: nameError } = await supabase
        .from('characters')
        .update({ name })
        .eq('user_id', user.id);
      if (nameError) {
        console.error(nameError);
      }
    }

    setAssembling(false);
    setPreviewUrl(data.character.image_url);
    router.replace('/home');
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.preview}>
        {previewUrl ? (
          <Image source={{ uri: previewUrl }} style={styles.previewImage} />
        ) : (
          <ThemedText type="overline">Предпросмотр</ThemedText>
        )}
      </View>

      <ThemedText type="title" style={styles.caption}>
        Твой герой готов
      </ThemedText>

      {error && <ThemedText style={styles.error}>{error}</ThemedText>}

      <View style={styles.actions}>
        <Button
          label={assembling ? 'Собираем...' : 'Это я'}
          onPress={handleConfirm}
          disabled={assembling}
        />
        <Button
          label="Пересобрать"
          variant="secondary"
          onPress={() => router.replace('/onboarding')}
          disabled={assembling}
        />
      </View>

      <ThemedText type="bodyMuted" style={styles.hint}>
        Внешний вид будет меняться вместе с прогрессом
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.four,
    justifyContent: 'center',
  },
  preview: {
    height: 320,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  caption: {
    textAlign: 'center',
    marginTop: Spacing.four,
    marginBottom: Spacing.four,
  },
  actions: {
    gap: Spacing.two,
  },
  hint: {
    textAlign: 'center',
    marginTop: Spacing.three,
  },
  error: {
    color: '#ff6b6b',
    textAlign: 'center',
    marginBottom: Spacing.two,
  },
});
