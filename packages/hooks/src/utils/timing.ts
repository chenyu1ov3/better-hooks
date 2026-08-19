export const MAX_TIMER_DELAY: number = 2_147_483_647;

export function normalizeDelay(delay: number): number {
  if (delay > MAX_TIMER_DELAY) {
    return MAX_TIMER_DELAY;
  }
  if (!Number.isFinite(delay) || delay <= 0) return 0;
  return delay;
}
