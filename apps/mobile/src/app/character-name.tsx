import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Fonts, Spacing } from '@/constants/theme';

// M-02b Имя персонажа — идёт сразу после выбора критериев (M-02),
// тоже до регистрации: и критерии, и имя — вложение пользователя,
// которое должно случиться до "платы" в виде email/пароля (5.2/9.1a).
// Дальше всегда M-03 (превью с демо-картинкой, входа не требует) —
// регистрация идёт уже после него.
export default function CharacterNameScreen() {
  const router = useRouter();
  const { bodyTag, styleTag } = useLocalSearchParams<{ bodyTag: string; styleTag: string }>();
  const [name, setName] = useState('');

  const canContinue = name.trim().length > 0;

  function handleDone() {
    router.push({
      pathname: '/character-assembly',
      params: { bodyTag, styleTag, name: name.trim() },
    });
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <ThemedText type="overline">Шаг 2 из 2</ThemedText>
        <ThemedText type="display" style={styles.title}>
          Придумай имя{'\n'}для персонажа
        </ThemedText>

        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Например, Макс"
          placeholderTextColor={Colors.textMuted}
          style={[styles.input, name.length > 0 && styles.inputFilled]}
          autoFocus
          maxLength={24}
        />

        <ThemedText type="bodyMuted" style={styles.hint}>
          Имя видно на публичной странице{'\n'}и шеринг-карточке.
        </ThemedText>
      </View>

      <View style={styles.footer}>
        <Button label="Готово" disabled={!canContinue} onPress={handleDone} />
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
  title: {
    marginTop: Spacing.two,
    marginBottom: Spacing.five,
  },
  input: {
    fontFamily: Fonts.displayBold,
    fontSize: 22,
    lineHeight: 28,
    color: Colors.text,
    paddingBottom: Spacing.two,
    borderBottomWidth: 2,
    borderBottomColor: Colors.border,
  },
  inputFilled: {
    borderBottomColor: Colors.accent,
  },
  hint: {
    marginTop: Spacing.three,
  },
  footer: {
    padding: Spacing.four,
  },
});
