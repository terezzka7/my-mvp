// Hand-off between the log-workout sheet and Home, which is the screen we
// land on afterwards (a screen we navigate back to can't receive params).

let pendingXpGain: number | null = null;
let levelUpShownFor = 0;

// Sheet → Home: "+N XP" to show once, when no level-up screen was needed.
export function rememberXpGain(xp: number) {
  pendingXpGain = xp > 0 ? xp : null;
}

export function takeXpGain(): number | null {
  const xp = pendingXpGain;
  pendingXpGain = null;
  return xp;
}

// The sheet opens the level-up screen itself as soon as the server answers.
// Home also notices level jumps (e.g. after an offline sync) — it must not
// open a second one for a level that was already celebrated.
export function markLevelUpShown(level: number) {
  levelUpShownFor = Math.max(levelUpShownFor, level);
}

export function wasLevelUpShown(level: number): boolean {
  return level <= levelUpShownFor;
}
