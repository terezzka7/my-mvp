import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import type { UsersRow } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

interface Toggle {
  key: 'push_enabled' | 'reminder_enabled' | 'is_private';
  label: string;
}

const TOGGLES: Toggle[] = [
  { key: 'push_enabled', label: 'Push-уведомления о челленджах' },
  { key: 'reminder_enabled', label: 'Напоминание залогировать тренировку' },
  { key: 'is_private', label: 'Скрыть публичный профиль' },
];

// M-15 Настройки (§9.1). Тумблеры пишутся в users.push_enabled /
// reminder_enabled / is_private — новые колонки поверх §10 (см.
// supabase/add_settings_columns.sql), запись реальная. push/reminder
// сами по себе не подключены ни к какой push-инфраструктуре — это вне
// MVP, тумблеры лишь хранят намерение пользователя на будущее.
export default function SettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [email, setEmail] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [nameMessage, setNameMessage] = useState<string | null>(null);
  const [values, setValues] = useState<Record<Toggle['key'], boolean>>({
    push_enabled: true,
    reminder_enabled: true,
    is_private: false,
  });
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      let active = true;
      supabase
        .from('users')
        .select('email, display_name, push_enabled, reminder_enabled, is_private')
        .eq('id', user.id)
        .maybeSingle()
        .then(({ data, error }) => {
          if (!active) return;
          if (error) console.error(error);
          if (data) {
            setEmail(data.email);
            setDisplayName(data.display_name ?? '');
            setValues({
              push_enabled: data.push_enabled,
              reminder_enabled: data.reminder_enabled,
              is_private: data.is_private,
            });
          }
          setLoading(false);
        });
      return () => {
        active = false;
      };
    }, [user]),
  );

  async function toggle(key: Toggle['key']) {
    if (!user) return;
    const next = !values[key];
    setValues((prev) => ({ ...prev, [key]: next }));
    const patch: Partial<UsersRow> = { [key]: next };
    const { error } = await supabase.from('users').update(patch).eq('id', user.id);
    if (error) {
      console.error(error);
      setValues((prev) => ({ ...prev, [key]: !next }));
    }
  }

  async function saveName() {
    if (!user) return;
    setSavingName(true);
    setNameMessage(null);
    const trimmed = displayName.trim();
    // Empty clears display_name, so screens fall back to the hero name.
    const { error } = await supabase
      .from('users')
      .update({ display_name: trimmed || null })
      .eq('id', user.id);
    setSavingName(false);
    if (error) {
      console.error(error);
      setNameMessage('Не удалось сохранить имя. Попробуйте ещё раз.');
      return;
    }
    setDisplayName(trimmed);
    setNameMessage('Имя сохранено.');
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace('/login');
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    const { error } = await supabase.functions.invoke('delete-account');
    setDeleting(false);

    if (error) {
      console.error(error);
      Alert.alert('Не удалось удалить аккаунт', 'Попробуйте ещё раз.');
      return;
    }

    await supabase.auth.signOut();
    router.replace('/login');
  }

  function confirmDeleteAccount() {
    Alert.alert('Вы уверены?', 'Действие необратимо. Персонаж, тренировки и статистика будут удалены навсегда.', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Да, удалить', style: 'destructive', onPress: handleDeleteAccount },
    ]);
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => router.back()}>
          <ThemedText type="overline">← Профиль</ThemedText>
        </Pressable>

        <ThemedText type="display" style={styles.title}>
          Настройки
        </ThemedText>

        <Pressable style={styles.proBanner} onPress={() => router.push('/paywall')}>
          <ThemedText type="overline" style={styles.proOverline}>
            Buildyfit Pro
          </ThemedText>
          <ThemedText type="title" style={styles.proTitle}>
            Все предметы и статистика
          </ThemedText>
        </Pressable>

        {!loading && (
          <View style={styles.nameBlock}>
            <ThemedText type="bodyMuted">Имя</ThemedText>
            <TextInput
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Как вас показывать"
              placeholderTextColor={Colors.textMuted}
              style={styles.nameInput}
              maxLength={24}
              autoCapitalize="words"
            />
            {nameMessage && <ThemedText type="bodyMuted">{nameMessage}</ThemedText>}
            <Button
              label={savingName ? 'Сохранение...' : 'Сохранить имя'}
              onPress={saveName}
              disabled={savingName}
            />
          </View>
        )}

        {!loading && (
          <View style={styles.group}>
            {TOGGLES.map((t) => (
              <Pressable key={t.key} style={styles.toggleRow} onPress={() => toggle(t.key)}>
                <ThemedText type="body" style={styles.toggleLabel}>
                  {t.label}
                </ThemedText>
                <View style={[styles.track, values[t.key] && styles.trackOn]}>
                  <View style={[styles.knob, values[t.key] && styles.knobOn]} />
                </View>
              </Pressable>
            ))}
          </View>
        )}

        <View style={styles.group}>
          <View style={styles.infoRow}>
            <ThemedText type="body">Аккаунт</ThemedText>
            <ThemedText type="bodyMuted">{email}</ThemedText>
          </View>
          <View style={styles.infoRow}>
            <ThemedText type="body">Версия</ThemedText>
            <ThemedText type="bodyMuted">1.0.0 (MVP)</ThemedText>
          </View>
          <Pressable style={styles.infoRow} onPress={handleLogout}>
            <ThemedText type="body" style={styles.logout}>
              Выйти
            </ThemedText>
          </Pressable>
        </View>

        <View style={styles.dangerGroup}>
          <Pressable
            style={styles.dangerRow}
            onPress={confirmDeleteAccount}
            disabled={deleting}
          >
            <ThemedText type="body" style={styles.dangerLabel}>
              {deleting ? 'Удаляем...' : 'Удалить аккаунт'}
            </ThemedText>
          </Pressable>
          <ThemedText type="bodyMuted" style={styles.dangerHint}>
            Персонаж, тренировки и статистика удаляются без возможности восстановления.
          </ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: Spacing.four,
    paddingTop: Spacing.six,
    gap: Spacing.three,
  },
  title: {
    marginTop: Spacing.two,
  },
  proBanner: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.card,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  proOverline: {
    color: 'rgba(13,13,13,.55)',
  },
  proTitle: {
    color: Colors.accentText,
  },
  nameBlock: {
    gap: Spacing.two,
  },
  nameInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.card,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    color: Colors.text,
    fontSize: 16,
  },
  group: {
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    overflow: 'hidden',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.three,
    gap: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  toggleLabel: {
    flex: 1,
  },
  track: {
    width: 48,
    height: 29,
    borderRadius: Radius.pill,
    backgroundColor: '#2E2E2E',
    padding: 3,
    justifyContent: 'center',
  },
  trackOn: {
    backgroundColor: Colors.accent,
  },
  knob: {
    width: 23,
    height: 23,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  knobOn: {
    alignSelf: 'flex-end',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  logout: {
    color: '#ff6b6b',
  },
  dangerGroup: {
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: 'rgba(255,107,107,.35)',
    padding: Spacing.three,
    gap: Spacing.two,
  },
  dangerRow: {
    alignItems: 'center',
  },
  dangerLabel: {
    color: '#ff6b6b',
    fontWeight: '600',
  },
  dangerHint: {
    textAlign: 'center',
  },
});
