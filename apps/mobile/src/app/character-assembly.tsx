import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, ScrollView, StyleSheet, View, type ImageSourcePropType } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { assembleCharacter } from '@/lib/finish-onboarding';

// M-03 Сборка персонажа (§9.1, §9.1a) — превью до входа: показывает
// демо-картинку по полу (не результат реального compositing —
// assemble-character требует JWT, которого тут ещё нет). Реальная
// сборка + запись имени происходят молча сразу после регистрации/входа
// (см. signup.tsx/login.tsx), а если сессия уже есть (например, второй
// проход через "Пересобрать"), "Это я" делает это прямо здесь.
//
// DEMO_IMAGES — временные заглушки для демо, пока нет финального арта
// на все пол×стиль комбинации (см. апдейт book §12 про это исключение).
const DEMO_IMAGES: Record<string, ImageSourcePropType> = {
  женский: require('@/assets/demo/female-hero.png'),
  мужской: require('@/assets/demo/male-hero.png'),
};

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function CharacterAssemblyScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { bodyTag, styleTag, name } = useLocalSearchParams<{
    bodyTag: string;
    styleTag: string;
    name?: string;
  }>();
  const [assembling, setAssembling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    if (!user) {
      router.push({ pathname: '/signup', params: { bodyTag, styleTag, name: name ?? '' } });
      return;
    }

    setAssembling(true);
    setError(null);

    const { error: assembleError } = await assembleCharacter({ bodyTag, styleTag, name, userId: user.id });

    setAssembling(false);

    if (assembleError) {
      setError(assembleError);
      return;
    }

    router.replace('/home');
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="display">{name || 'Твой герой'}</ThemedText>

        <View style={styles.chipsRow}>
          <View style={styles.chip}>
            <ThemedText type="body">{capitalize(bodyTag)}</ThemedText>
          </View>
          <View style={styles.chip}>
            <ThemedText type="body">{capitalize(styleTag)}</ThemedText>
          </View>
        </View>
        <View style={styles.chipsRow}>
          <View style={[styles.chip, styles.levelChip]}>
            <ThemedText type="body" style={styles.levelChipText}>
              Ур. 1
            </ThemedText>
          </View>
        </View>

        <View style={styles.imageWrap}>
          <Image source={DEMO_IMAGES[bodyTag]} style={styles.image} resizeMode="contain" />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <ThemedText type="bodyMuted" style={styles.hint}>
          Внешний вид будет меняться вместе с прогрессом.
        </ThemedText>

        {error && <ThemedText style={styles.error}>{error}</ThemedText>}

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
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  content: {
    padding: Spacing.four,
    paddingTop: Spacing.six,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  chip: {
    backgroundColor: '#141414',
    borderRadius: Radius.pill,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  levelChip: {
    backgroundColor: Colors.accent,
  },
  levelChipText: {
    color: Colors.accentText,
    fontWeight: '600',
  },
  imageWrap: {
    alignItems: 'center',
    marginTop: Spacing.five,
  },
  image: {
    width: 260,
    height: 380,
  },
  footer: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  hint: {
    textAlign: 'center',
  },
  error: {
    color: '#ff6b6b',
    textAlign: 'center',
  },
});
