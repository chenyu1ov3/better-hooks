/**
 * Receives an error observed by a Hook without changing the original error contract.
 * Observer failures are reported in a microtask so they cannot replace the original error.
 * @public
 */
export type HookErrorHandler = (error: unknown) => void;

export function notifyHookError(error: unknown, onError: HookErrorHandler | undefined): void {
  if (!onError) return;

  try {
    onError(error);
  } catch (observerError) {
    queueMicrotask(() => {
      throw observerError;
    });
  }
}
