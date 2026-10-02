import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import type { WorkoutType } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';
import {
  DAY_LABELS,
  MONTHS,
  TYPE_LABELS,
  addDays,
  buildByDay,
  dayKey,
  goalOfWeek,
  monthView,
  parseDate,
  plural,
  startOfDay,
  startOfWeek,
  sumRange,
  weekView,
  type Bar,
  type GoalFrom,
  type Log,
} from '@/lib/stats';

const FILTERS = ['Неделя', 'Месяц'] as const;
type Filter = (typeof FILTERS)[number];

const PLOT_HEIGHT = 160;
const BAR_WIDTH = 28;

function minutesText(minutes: number): string {
  return minutes > 0 ? `≈${minutes}` : '0';
}

function tickValues(axisMax: number): number[] {
  const step = axisMax <= 6 ? 1 : Math.ceil(axisMax / 5);
  const ticks: number[] = [];
  for (let value = step; value <= axisMax; value += step) ticks.push(value);
  return ticks;
}

// What a tapped bar says, e.g. "Ср · 2 тренировки · Кардио, Силовая · ≈100 мин · +55 XP".
function describeBar(bar: Bar, isWeek: boolean): string {
  const head = isWeek
    ? `${bar.label} · ${bar.count} ${plural(bar.count, 'тренировка', 'тренировки', 'тренировок')}`
    : `${bar.label} · ${bar.count}${bar.goal !== null ? ` из ${bar.goal}` : ''}`;
  const parts = [head];
  if (bar.types.length > 0) parts.push(bar.types.map((type) => TYPE_LABELS[type]).join(', '));
  if (bar.totals.minutes > 0) parts.push(`${minutesText(bar.totals.minutes)} мин`);
  parts.push(`+${bar.totals.xp} XP`);
  return parts.join(' · ');
}

function Tile({ label, value, unit, sub }: { label: string; value: string | number; unit: string; sub: string }) {
  return (
    <View style={[styles.card, styles.tile]}>
      <ThemedText type="overline">{label}</ThemedText>
      <ThemedText type="display">{value}</ThemedText>
      <ThemedText type="bodyMuted">{unit}</ThemedText>
      <ThemedText type="bodyMuted" style={styles.small}>
        {sub}
      </ThemedText>
    </View>
  );
}

function Arrows({ canNext, onPrev, onNext }: { canNext: boolean; onPrev: () => void; onNext: () => void }) {
  return (
    <View style={styles.arrows}>
      <Pressable style={styles.arrow} onPress={onPrev} hitSlop={6} accessibilityLabel="Назад">
        <ThemedText type="title" style={styles.arrowLabel}>
          ‹
        </ThemedText>
      </Pressable>
      <Pressable
        style={[styles.arrow, !canNext && styles.arrowOff]}
        onPress={onNext}
        disabled={!canNext}
        hitSlop={6}
        accessibilityLabel="Вперёд"
      >
        <ThemedText type="title" style={styles.arrowLabel}>
          ›
        </ThemedText>
      </Pressable>
    </View>
  );
}

function ActivityCalendar({ byDay, now }: { byDay: ReturnType<typeof buildByDay>; now: Date }) {
  const [offset, setOffset] = useState(0);
  const today = startOfDay(now);
  const first = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const last = new Date(first.getFullYear(), first.getMonth(), daysInMonth);
  const leading = (first.getDay() + 6) % 7;

  const totals = sumRange(byDay, first, last);
  let activeDays = 0;
  for (let d = 1; d <= daysInMonth; d += 1) {
    if (byDay.has(dayKey(new Date(first.getFullYear(), first.getMonth(), d)))) activeDays += 1;
  }

  const monthName = MONTHS[first.getMonth()];
  const title = `${monthName[0].toUpperCase()}${monthName.slice(1)} ${first.getFullYear()}`;

  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <View>
          <ThemedText type="title">Активность</ThemedText>
          <ThemedText type="bodyMuted">{title}</ThemedText>
        </View>
        <Arrows canNext={offset < 0} onPrev={() => setOffset((v) => v - 1)} onNext={() => setOffset((v) => v + 1)} />
      </View>

      <View style={styles.calStats}>
        <View>
          <ThemedText type="display">{totals.count}</ThemedText>
          <ThemedText type="bodyMuted" style={styles.small}>
            {plural(totals.count, 'тренировка', 'тренировки', 'тренировок')} в месяце
          </ThemedText>
        </View>
        <View>
          <ThemedText type="display">{activeDays}</ThemedText>
          <ThemedText type="bodyMuted" style={styles.small}>
            {plural(activeDays, 'день', 'дня', 'дней')} с тренировкой
          </ThemedText>
        </View>
      </View>

      <View style={styles.calGrid}>
        {DAY_LABELS.map((label) => (
          <View key={label} style={styles.calCell}>
            <ThemedText type="bodyMuted" style={styles.small}>
              {label}
            </ThemedText>
          </View>
        ))}
        {Array.from({ length: leading }, (_, i) => (
          <View key={`blank-${i}`} style={styles.calCell} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const date = new Date(first.getFullYear(), first.getMonth(), i + 1);
          const trained = byDay.has(dayKey(date));
          const isToday = date.getTime() === today.getTime();
          const isFuture = date.getTime() > today.getTime();
          return (
            <View key={i} style={styles.calCell}>
              <View style={[styles.calDay, trained && styles.calDayOn, isToday && styles.calDayToday]}>
                <ThemedText
                  type="bodyMuted"
                  style={[
                    styles.calDayText,
                    isFuture && styles.calDayFuture,
                    isToday && !trained && styles.calDayTodayText,
                    trained && styles.calDayOnText,
                  ]}
                >
                  {i + 1}
                </ThemedText>
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.accent }]} />
          <ThemedText type="bodyMuted" style={styles.small}>
            была тренировка
          </ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.legendToday]} />
          <ThemedText type="bodyMuted" style={styles.small}>
            сегодня
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

// Everything the Home stats block draws, from already-loaded data.
export function StatsView({ logs, goals, now }: { logs: Log[]; goals: GoalFrom[]; now: Date }) {
  const [filter, setFilter] = useState<Filter>('Неделя');
  // 0 = current week/month, -1 = previous, …
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);

  const byDay = useMemo(() => buildByDay(logs), [logs]);
  const isWeek = filter === 'Неделя';
  const view = useMemo(
    () => (isWeek ? weekView(byDay, offset, now) : monthView(byDay, offset, now, goals)),
    [byDay, goals, isWeek, offset, now],
  );

  // Current week and month: the tiles and the goal.
  const thisWeekStart = startOfWeek(now);
  const week = sumRange(byDay, thisWeekStart, addDays(thisWeekStart, 6));
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const month = sumRange(byDay, monthStart, monthEnd);
  const goalNow = goalOfWeek(goals, thisWeekStart);
  const monthName = MONTHS[now.getMonth()];

  // Same period as `month`, so the counts add up to the "за месяц" number.
  const typeTotals: Record<WorkoutType, number> = { strength: 0, cardio: 0, flexibility: 0, sports: 0, other: 0 };
  for (const log of logs) {
    const day = startOfDay(new Date(log.logged_at)).getTime();
    if (day >= monthStart.getTime() && day <= monthEnd.getTime()) typeTotals[log.type] += 1;
  }
  const typeCounts = (Object.keys(typeTotals) as WorkoutType[])
    .filter((type) => type !== 'other' || typeTotals.other > 0)
    .map((type) => ({ type, count: typeTotals[type] }))
    .sort((a, b) => b.count - a.count);
  const maxType = Math.max(1, ...typeCounts.map((item) => item.count));

  // "+N% to last week": only on the week view, only when it grew.
  let delta: number | null = null;
  if (isWeek) {
    const shown = addDays(startOfWeek(now), offset * 7);
    const previous = sumRange(byDay, addDays(shown, -7), addDays(shown, -1)).count;
    if (previous > 0 && view.total > previous) delta = Math.round(((view.total - previous) / previous) * 100);
  }

  const subtitle = isWeek
    ? `Цель: ${goalOfWeek(goals, addDays(startOfWeek(now), offset * 7))} в неделю`
    : 'Цель каждой недели отмечена чертой';
  const ticks = tickValues(view.axisMax);
  const picked = selected !== null ? view.bars[selected] : undefined;
  const left = Math.max(0, goalNow - week.count);

  function changeFilter(next: Filter) {
    setFilter(next);
    setOffset(0);
    setSelected(null);
  }

  function move(delta: number) {
    setOffset((value) => value + delta);
    setSelected(null);
  }

  return (
    <View style={styles.section}>
      <ThemedText type="title">Статистика</ThemedText>

      <View style={styles.filters}>
        {FILTERS.map((option) => (
          <Pressable
            key={option}
            onPress={() => changeFilter(option)}
            style={[styles.filter, filter === option && styles.filterOn]}
          >
            <ThemedText type="body" style={filter === option ? styles.filterOnText : undefined}>
              {option}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      {logs.length === 0 && (
        <ThemedText type="bodyMuted">Пока нет тренировок. Запишите первую, и здесь появятся данные.</ThemedText>
      )}

      <View style={styles.tiles}>
        <Tile label="Тренировок" value={week.count} unit="на этой неделе" sub={`${month.count} за ${monthName}`} />
        <Tile
          label="Минут"
          value={minutesText(week.minutes)}
          unit="за неделю"
          sub={`${minutesText(month.minutes)} за ${monthName}`}
        />
      </View>

      <View style={styles.card}>
        <View style={styles.cardHead}>
          <View style={styles.cardHeadText}>
            <ThemedText type="title">Тренировки</ThemedText>
            <ThemedText type="bodyMuted">{subtitle}</ThemedText>
            <ThemedText type="bodyMuted" style={styles.small}>
              {view.rangeLabel}
            </ThemedText>
            {delta !== null && (
              <View style={styles.delta}>
                <ThemedText type="bodyMuted" style={styles.deltaText}>
                  +{delta}% к прошлой неделе
                </ThemedText>
              </View>
            )}
          </View>
          <Arrows canNext={offset < 0} onPrev={() => move(-1)} onNext={() => move(1)} />
        </View>

        <View style={styles.plotRow}>
          <View style={styles.axis}>
            {ticks.map((tick) => (
              <ThemedText
                key={tick}
                type="bodyMuted"
                style={[styles.tick, { bottom: (tick / view.axisMax) * PLOT_HEIGHT - 8 }]}
              >
                {tick}
              </ThemedText>
            ))}
            <ThemedText type="bodyMuted" style={[styles.tick, { bottom: -8 }]}>
              0
            </ThemedText>
          </View>

          <View style={styles.plotCol}>
            <View style={styles.plot}>
              {ticks.map((tick) => (
                <View key={tick} style={[styles.gridLine, { bottom: (tick / view.axisMax) * PLOT_HEIGHT }]} />
              ))}
              <View style={[styles.gridLine, styles.gridZero, { bottom: 0 }]} />

              <View style={[styles.bars, styles.plotBars]}>
                {view.bars.map((bar, i) => {
                  const height = (bar.count / view.axisMax) * PLOT_HEIGHT;
                  return (
                    <Pressable
                      key={bar.key}
                      style={styles.barSlot}
                      onPress={() => setSelected(selected === i ? null : i)}
                      accessibilityLabel={describeBar(bar, isWeek)}
                    >
                      {bar.goal !== null && (
                        <View style={[styles.goalTick, { bottom: (bar.goal / view.axisMax) * PLOT_HEIGHT }]} />
                      )}
                      {bar.count > 0 && (
                        <>
                          <View
                            style={[
                              styles.barFill,
                              { height },
                              bar.isCurrent && styles.barCurrent,
                              selected === i && styles.barSelected,
                            ]}
                          />
                          <ThemedText type="body" style={[styles.barValue, { bottom: height + 2 }]}>
                            {bar.count}
                          </ThemedText>
                        </>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.bars}>
              {view.bars.map((bar) => (
                <View key={bar.key} style={styles.labelSlot}>
                  <ThemedText
                    type="bodyMuted"
                    numberOfLines={1}
                    style={[styles.barLabel, bar.isCurrent && styles.barLabelCurrent, bar.isFuture && styles.barLabelFuture]}
                  >
                    {bar.label}
                  </ThemedText>
                </View>
              ))}
            </View>
          </View>
        </View>

        {!isWeek && (
          <View style={styles.legendItem}>
            <View style={styles.goalSwatch} />
            <ThemedText type="bodyMuted" style={styles.small}>
              цель недели
            </ThemedText>
          </View>
        )}

        <ThemedText type="bodyMuted" style={styles.small}>
          {picked && picked.count > 0 ? describeBar(picked, isWeek) : 'Нажмите на столбик, чтобы увидеть детали'}
        </ThemedText>
        <ThemedText type="bodyMuted">
          XP за {isWeek ? 'неделю' : 'месяц'}: <ThemedText type="body">+{view.xp}</ThemedText>
        </ThemedText>
      </View>

      <View style={styles.card}>
        <ThemedText type="overline">Цель недели</ThemedText>
        <View style={styles.goalRow}>
          <ThemedText type="display">
            {week.count}/{goalNow}
          </ThemedText>
          <ThemedText type="bodyMuted">тренировок</ThemedText>
        </View>
        <View style={styles.goalTrack}>
          <View style={[styles.goalFill, { width: `${Math.min(week.count / goalNow, 1) * 100}%` }]} />
        </View>
        <ThemedText type="bodyMuted">{left > 0 ? `Осталось ${left} до цели` : 'Цель недели выполнена'}</ThemedText>
      </View>

      <View style={styles.card}>
        <ThemedText type="overline">По типам · {monthName}</ThemedText>
        <View style={styles.types}>
          {typeCounts.map((item) => (
            <View key={item.type}>
              <View style={styles.typeRow}>
                <ThemedText type="body">{TYPE_LABELS[item.type]}</ThemedText>
                <ThemedText type="bodyMuted">{item.count}</ThemedText>
              </View>
              <View style={styles.typeTrack}>
                <View style={[styles.typeFill, { width: `${(item.count / maxType) * 100}%` }]} />
              </View>
            </View>
          ))}
        </View>
      </View>

      <ActivityCalendar byDay={byDay} now={now} />
    </View>
  );
}

// Statistics under the hero on Home: the same numbers as the web Stats page, drawn from the
// same helpers (src/lib/stats.ts). `refreshKey` changes whenever Home has just (re)loaded.
export function StatsSection({ userId, refreshKey }: { userId: string; refreshKey: number }) {
  const [now] = useState(() => new Date());
  const [logs, setLogs] = useState<Log[]>([]);
  const [goals, setGoals] = useState<GoalFrom[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      const [logsResult, goalsResult] = await Promise.all([
        supabase
          .from('workout_logs')
          .select('logged_at, type, duration_minutes, xp_earned')
          .eq('user_id', userId)
          .order('logged_at', { ascending: true }),
        supabase.from('weekly_goals').select('week_start, goal').eq('user_id', userId).order('week_start', { ascending: true }),
      ]);
      if (!active) return;

      // A failed goals read (e.g. the SQL wasn't run yet) falls back to the default goal.
      if (goalsResult.error) console.error(goalsResult.error);
      else setGoals(goalsResult.data.map((row) => ({ from: parseDate(row.week_start), goal: row.goal })));

      if (logsResult.error) {
        console.error(logsResult.error);
        setFailed(true);
      } else {
        setFailed(false);
        setLogs(logsResult.data);
      }
      setLoaded(true);
    }

    load();
    return () => {
      active = false;
    };
  }, [userId, refreshKey]);

  if (!loaded) return null;
  if (failed) {
    return <ThemedText type="bodyMuted">Не удалось загрузить статистику.</ThemedText>;
  }
  return <StatsView logs={logs} goals={goals} now={now} />;
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.three,
    marginTop: Spacing.three,
  },
  small: {
    fontSize: 13,
    lineHeight: 18,
  },
  card: {
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    padding: Spacing.card,
    gap: Spacing.two,
  },
  cardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  cardHeadText: {
    flex: 1,
  },
  filters: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  filter: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterOn: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  filterOnText: {
    color: Colors.accentText,
  },
  tiles: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  tile: {
    flex: 1,
    gap: 0,
  },
  arrows: {
    flexDirection: 'row',
  },
  arrow: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowOff: {
    opacity: 0.3,
  },
  arrowLabel: {
    color: Colors.textMuted,
  },
  delta: {
    alignSelf: 'flex-start',
    marginTop: Spacing.two,
    paddingVertical: Spacing.half,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(198,255,0,0.12)',
  },
  deltaText: {
    fontSize: 13,
    lineHeight: 18,
    color: Colors.accent,
  },
  plotRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.four,
    paddingBottom: Spacing.one,
  },
  axis: {
    width: 22,
    height: PLOT_HEIGHT,
  },
  tick: {
    position: 'absolute',
    right: 0,
    fontSize: 12,
    lineHeight: 16,
  },
  plotCol: {
    flex: 1,
    gap: Spacing.two,
  },
  plot: {
    height: PLOT_HEIGHT,
  },
  gridLine: {
    position: 'absolute',
    left: -4,
    right: -4,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  gridZero: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  bars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  plotBars: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  barSlot: {
    width: BAR_WIDTH,
    height: '100%',
  },
  barFill: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: Radius.pill,
    backgroundColor: Colors.accent,
  },
  barCurrent: {
    borderWidth: 2,
    borderColor: 'rgba(198,255,0,0.35)',
  },
  barSelected: {
    backgroundColor: '#E2FF73',
  },
  barValue: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 18,
  },
  goalTick: {
    position: 'absolute',
    left: -6,
    right: -6,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.75)',
  },
  labelSlot: {
    width: BAR_WIDTH,
    height: 18,
  },
  barLabel: {
    position: 'absolute',
    left: -14,
    width: BAR_WIDTH + 28,
    // react-native-web caps a numberOfLines Text at 100% of its parent (28px here).
    maxWidth: BAR_WIDTH + 28,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 16,
  },
  barLabelCurrent: {
    color: Colors.accent,
  },
  barLabelFuture: {
    opacity: 0.45,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  goalSwatch: {
    width: 18,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.75)',
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.two,
  },
  goalTrack: {
    height: 8,
    borderRadius: Radius.pill,
    backgroundColor: Colors.border,
    overflow: 'hidden',
  },
  goalFill: {
    height: '100%',
    borderRadius: Radius.pill,
    backgroundColor: Colors.accent,
  },
  types: {
    gap: Spacing.three,
    marginTop: Spacing.two,
  },
  typeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  typeTrack: {
    height: 2,
    marginTop: Spacing.one,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  typeFill: {
    height: '100%',
    backgroundColor: Colors.accent,
  },
  calStats: {
    flexDirection: 'row',
    gap: Spacing.five,
    marginVertical: Spacing.two,
  },
  calGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calDay: {
    width: '84%',
    aspectRatio: 1,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calDayOn: {
    backgroundColor: Colors.accent,
  },
  calDayToday: {
    borderWidth: 2,
    borderColor: 'rgba(198,255,0,0.55)',
  },
  calDayText: {
    fontSize: 15,
    lineHeight: 20,
  },
  calDayFuture: {
    opacity: 0.4,
  },
  calDayTodayText: {
    color: Colors.accent,
  },
  calDayOnText: {
    color: Colors.accentText,
    fontFamily: 'Inter_700Bold',
  },
  legend: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginTop: Spacing.two,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendToday: {
    borderWidth: 2,
    borderColor: 'rgba(198,255,0,0.55)',
  },
});
