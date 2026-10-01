import { supabase } from '@/lib/supabase';

// Used when a player has no weekly_goals row yet.
export const DEFAULT_WEEKLY_GOAL = 4;

// Monday of the current local week as YYYY-MM-DD (weeks start on Monday, like Home).
function currentWeekStart(now = new Date()): string {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

// Goal in force this week: this week's row, else the latest earlier one, else the default.
// Returns null when the table can't be read (e.g. the SQL wasn't run yet).
export async function fetchCurrentGoal(userId: string): Promise<number | null> {
  const { data, error } = await supabase
    .from('weekly_goals')
    .select('goal')
    .eq('user_id', userId)
    .lte('week_start', currentWeekStart())
    .order('week_start', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error(error);
    return null;
  }
  return data?.goal ?? DEFAULT_WEEKLY_GOAL;
}

// Sets the goal from this week on. Past weeks keep the goal they had.
export async function saveCurrentGoal(userId: string, goal: number): Promise<boolean> {
  const { error } = await supabase
    .from('weekly_goals')
    .upsert({ user_id: userId, week_start: currentWeekStart(), goal }, { onConflict: 'user_id,week_start' });
  if (error) {
    console.error(error);
    return false;
  }
  return true;
}
