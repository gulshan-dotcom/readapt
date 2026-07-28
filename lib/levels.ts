export const LEVEL_TITLES: Record<number, string> = {
  1: "Novice",
  2: "Scholar",
  3: "Awakened",
  4: "Strategist",
};

export const MAX_LEVEL = 4;
export const STREAK_THRESHOLD = 7;

export function getLevelTitle(level: number): string {
  return LEVEL_TITLES[level] || LEVEL_TITLES[MAX_LEVEL];
}