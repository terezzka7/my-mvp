import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Radius, Spacing } from '@/constants/theme';

// M-03 Сборка персонажа (§9.1, §9.1a). Реальная генерация из template_assets
// (Edge Function assemble-character) — Слой 2; здесь мок-заглушка.
export default function CharacterAssemblyScreen() {
  const router = useRouter();

  return (
    <ThemedView style={styles.container}>
      <View style={styles.preview}>
        <ThemedText type="overline">Предпросмотр</ThemedText>
      </View>

      <ThemedText type="title" style={styles.caption}>
        Твой герой готов
      </ThemedText>

      <View style={styles.actions}>
        <Button label="Это я" onPress={() => router.replace('/home')} />
        <Button
          label="Пересобрать"
          variant="secondary"
          onPress={() => router.replace('/onboarding')}
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
});
