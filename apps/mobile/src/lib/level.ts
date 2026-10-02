// Same leveling rule as on-workout-logged: a new character starts at level 1
// with 100 XP to the next level, every level-up multiplies that by 1.5
// (rounded). Replaying the stored xp_earned of the workouts in order gives the
// level a character had after each of them: the workout log is the only source
// of XP, and the level isn't saved per workout.
const INITIAL_XP_TO_NEXT = 100;
const LEVEL_UP_MULTIPLIER = 1.5;

// levels[i] = level right after the i-th workout of `xpEarned`.
export function levelsAfterEach(xpEarned: number[]): number[] {
  let level = 1;
  let xpCurrent = 0;
  let xpToNext = INITIAL_XP_TO_NEXT;
  return xpEarned.map((xp) => {
    xpCurrent += xp;
    while (xpCurrent >= xpToNext) {
      xpCurrent -= xpToNext;
      level += 1;
      xpToNext = Math.round(xpToNext * LEVEL_UP_MULTIPLIER);
    }
    return level;
  });
}
