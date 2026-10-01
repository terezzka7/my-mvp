import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';

const FEATURES = [
  'Все предметы магазина без монет',
  'Эксклюзивные скины и эффекты: Титановый скин, Аура победителя',
  'Рамки для карточки шеринга',
  'Ранний доступ к сезонным предметам и челленджам',
];

const PLANS = [
  { key: 'month', name: 'Месяц', note: 'списание каждый месяц', price: '399 ₽' },
  { key: 'year', name: 'Год', note: 'экономия 40%', price: '2 690 ₽' },
] as const;

// M-16 Paywall (§9.1). Нет реального платёжного провайдера в этом
// MVP (§11 его не называет) — "Оформить" честно запускает только
// 7-дневный trial в users.subscription_status/expires_at, без
// реального списания денег.
export default function PaywallScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [plan, setPlan] = useState<(typeof PLANS)[number]['key']>('year');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubscribe() {
    if (!user) return;
    setSubmitting(true);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    const { error } = await supabase
      .from('users')
      .update({ subscription_status: 'trial', subscription_expires_at: expiresAt.toISOString() })
      .eq('id', user.id);
    setSubmitting(false);
    if (error) {
      console.error(error);
      return;
    }
    router.back();
  }

  const selected = PLANS.find((p) => p.key === plan)!;

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.back()}>
          <ThemedText type="overline">✕ Закрыть</ThemedText>
        </Pressable>

        <ThemedText type="display" style={styles.title}>
          Buildyfit <ThemedText type="display" style={styles.titleAccent}>Pro</ThemedText>
        </ThemedText>

        <View style={styles.features}>
          {FEATURES.map((f) => (
            <View key={f} style={styles.featureRow}>
              <View style={styles.dot} />
              <ThemedText type="body" style={styles.featureText}>
                {f}
              </ThemedText>
            </View>
          ))}
        </View>

        <View style={styles.plans}>
          {PLANS.map((p) => (
            <Pressable
              key={p.key}
              onPress={() => setPlan(p.key)}
              style={[styles.planRow, plan === p.key && styles.planRowActive]}
            >
              <View>
                <ThemedText type="body" style={styles.planName}>
                  {p.name}
                </ThemedText>
                <ThemedText type="bodyMuted" style={styles.planNote}>
                  {p.note}
                </ThemedText>
              </View>
              <ThemedText type="title" style={plan === p.key ? styles.planPriceActive : undefined}>
                {p.price}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label={submitting ? 'Оформляем...' : `Оформить за ${selected.price}`}
          onPress={handleSubscribe}
          disabled={submitting}
        />
        <ThemedText type="bodyMuted" style={styles.disclaimer}>
          Отмена в любой момент. Первые 7 дней бесплатно.
        </ThemedText>
      </View>
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
  titleAccent: {
    color: Colors.accent,
  },
  features: {
    gap: Spacing.two,
  },
  featureRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent,
    marginTop: 8,
  },
  featureText: {
    flex: 1,
  },
  plans: {
    gap: Spacing.two,
  },
  planRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: Radius.card,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    padding: Spacing.three,
  },
  planRowActive: {
    borderColor: Colors.accent,
  },
  planName: {
    fontWeight: '600',
  },
  planNote: {
    marginTop: Spacing.one,
  },
  planPriceActive: {
    color: Colors.accent,
  },
  footer: {
    padding: Spacing.four,
    gap: Spacing.two,
  },
  disclaimer: {
    textAlign: 'center',
  },
});
