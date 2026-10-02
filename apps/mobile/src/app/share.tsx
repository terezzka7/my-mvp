import { useCallback, useRef, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { Pressable, Share, StyleSheet, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

import { Button } from '@/components/button';
import { HeroPhoto } from '@/components/hero-photo';
import { ThemedText } from '@/components/themed-text';
import { WEB_URL } from '@/constants/links';
import { Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { resolveDisplayName } from '@/lib/display-name';
import { supabase } from '@/lib/supabase';

interface ShareData {
  username: string;
  name: string;
  level: number;
  workouts: number;
  streak: number;
}

// M-11 Шеринг-карточка (§9.1) — модалка. "Поделиться" рендерит карточку
// в PNG (react-native-view-shot, добавлен с разрешения — его нет в §11) и
// отдаёт файл нативному Share API: системный шеринг-лист, а не прямой
// пост в Instagram Stories (для этого нужен отдельный нативный SDK).
export default function ShareScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [data, setData] = useState<ShareData | null>(null);
  const captureViewRef = useRef<View>(null);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      let active = true;

      async function load() {
        const [{ data: me }, { data: character }, { count: workouts }, { data: streakRow }] = await Promise.all([
          supabase.from('users').select('username, display_name').eq('id', user!.id).maybeSingle(),
          supabase.from('characters').select('name, level').eq('user_id', user!.id).maybeSingle(),
          supabase.from('workout_logs').select('id', { count: 'exact', head: true }).eq('user_id', user!.id),
          supabase.from('streaks').select('current_streak').eq('user_id', user!.id).maybeSingle(),
        ]);
        if (!active || !me || !character) return;
        setData({
          username: me.username,
          name: resolveDisplayName(me.display_name, character.name, me.username),
          level: character.level,
          workouts: workouts ?? 0,
          streak: streakRow?.current_streak ?? 0,
        });
      }

      load();
      return () => {
        active = false;
      };
    }, [user]),
  );

  // Renders the card to a PNG and hands the file to the system share sheet
  // (Telegram, Messages, "Save Image"…). If rendering fails, falls back to
  // sharing the text with the profile link so the button never does nothing.
  async function handleShare() {
    if (!data) return;

    let imageUri: string | null = null;
    try {
      imageUri = await captureRef(captureViewRef, { format: 'png', quality: 1, result: 'tmpfile' });
    } catch (err) {
      console.error(err);
    }

    try {
      if (imageUri) {
        await Share.share({ url: imageUri });
      } else {
        await Share.share({
          message: `${data.name} — уровень ${data.level} в Buildyfit. ${data.workouts} тренировок, серия ${data.streak} дней. ${WEB_URL}/u/${data.username}`,
        });
      }
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <View style={styles.overlay}>
      {data && (
        <View style={styles.card}>
          <Pressable style={styles.close} onPress={() => router.back()} hitSlop={12}>
            <ThemedText type="body" style={styles.closeLabel}>
              ✕
            </ThemedText>
          </Pressable>

          {/* Only this block ends up in the shared picture: the ✕ stays out. */}
          <View ref={captureViewRef} collapsable={false} style={styles.captured}>
            <View style={styles.cardText}>
              <ThemedText type="overline">LVL {data.level}</ThemedText>
              <ThemedText type="title" style={styles.cardName}>
                {data.name}
              </ThemedText>
              <ThemedText type="bodyMuted" style={styles.cardStats}>
                {data.workouts} тренировок · серия {data.streak} дней
              </ThemedText>
            </View>

            <HeroPhoto username={data.username} height={320} style={styles.cardImage} />
          </View>
        </View>
      )}

      <View style={styles.actions}>
        <Button label="Поделиться" onPress={handleShare} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,.85)',
    padding: Spacing.four,
    paddingTop: Spacing.six,
    justifyContent: 'flex-start',
  },
  // Same card as the web ShareCard: dark, hairline border, big rounded
  // corners, centred level/name/stats, photo bleeding to the bottom edge.
  card: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bg,
    overflow: 'hidden',
  },
  captured: {
    backgroundColor: Colors.bg,
  },
  close: {
    position: 'absolute',
    top: Spacing.three,
    right: Spacing.three + Spacing.two,
    zIndex: 1,
  },
  closeLabel: {
    color: 'rgba(255,255,255,.6)',
    fontSize: 18,
  },
  cardText: {
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
  },
  cardName: {
    fontSize: 18,
    lineHeight: 24,
    marginTop: Spacing.two,
  },
  cardStats: {
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255,255,255,.6)',
    marginTop: Spacing.one,
  },
  cardImage: {
    marginTop: Spacing.three,
  },
  actions: {
    marginTop: Spacing.four,
    gap: Spacing.two,
  },
});
