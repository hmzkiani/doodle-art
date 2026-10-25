const KEY = 'doodle-land-rewards-v1';
export type RewardProgress = { saved: number; drawings: number; colored: number; shapes: number; rainbows: number; tutorials: number; traces: number };
export type Badge = { id: keyof RewardProgress | 'tutorial' | 'trace'; title: string; detail: string; icon: string };
const blank: RewardProgress = { saved: 0, drawings: 0, colored: 0, shapes: 0, rainbows: 0, tutorials: 0, traces: 0 };
export const badges: Badge[] = [
  { id: 'drawings', title: 'First doodle', detail: 'Save your first drawing', icon: '✏️' },
  { id: 'colored', title: 'Color explorer', detail: 'Save a colored page', icon: '🌈' },
  { id: 'shapes', title: 'Shape explorer', detail: 'Save a picture with a shape', icon: '⭐' },
  { id: 'rainbows', title: 'Rainbow artist', detail: 'Save a rainbow-brush picture', icon: '🖍️' },
  { id: 'saved', title: 'Art box friend', detail: 'Save five different pictures', icon: '🖼️' },
  { id: 'tutorial', title: 'Step by step', detail: 'Finish a drawing lesson', icon: '📖' },
  { id: 'trace', title: 'Practice pal', detail: 'Try a tracing guide', icon: '✍️' },
];
export function getRewardProgress(): RewardProgress {
  try { return { ...blank, ...JSON.parse(localStorage.getItem(KEY) || '{}') } as RewardProgress; }
  catch { return { ...blank }; }
}
export function saveRewardProgress(next: RewardProgress) {
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* rewards are optional when storage is unavailable */ }
}
