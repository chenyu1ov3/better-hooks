'use client';

import { Check, Copy, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { CodeBlockLabels } from './code-block-config';

type CopyStatus = 'idle' | 'copied' | 'failed';

function legacyCopy(value: string): boolean {
  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  textarea.style.pointerEvents = 'none';
  document.body.append(textarea);
  textarea.select();

  try {
    return document.execCommand('copy');
  } finally {
    textarea.remove();
  }
}

export function CodeCopyButton({ value, labels }: { value: string; labels: CodeBlockLabels }) {
  const [status, setStatus] = useState<CopyStatus>('idle');
  const timeoutRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    },
    [],
  );

  const currentLabel =
    status === 'copied' ? labels.copied : status === 'failed' ? labels.copyFailed : labels.copy;

  async function copyCode() {
    let copied = false;

    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable');
      await navigator.clipboard.writeText(value);
      copied = true;
    } catch {
      copied = legacyCopy(value);
    }

    setStatus(copied ? 'copied' : 'failed');

    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => setStatus('idle'), 1800);
  }

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-11 rounded-md text-[var(--code-muted)] hover:bg-accent hover:text-[var(--code-foreground)] sm:size-9"
            onClick={copyCode}
            aria-label={currentLabel}
          >
            {status === 'copied' ? (
              <Check aria-hidden="true" size={16} />
            ) : status === 'failed' ? (
              <X aria-hidden="true" size={16} />
            ) : (
              <Copy aria-hidden="true" size={16} />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent sideOffset={6}>{currentLabel}</TooltipContent>
      </Tooltip>
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {status === 'idle' ? '' : currentLabel}
      </span>
    </>
  );
}
