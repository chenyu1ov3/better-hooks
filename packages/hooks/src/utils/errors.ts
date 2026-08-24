/** Receives an error observed by a Hook without changing the original error contract. @public */
export type HookErrorHandler = (error: unknown) => void;

export function notifyHookError(error: unknown, onError: HookErrorHandler | undefined): void {
  onError?.(error);
}
