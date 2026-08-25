'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { LiveCodeEditorProps, LiveCodeEditorVariant } from './live-code-editor';

function LiveCodeLoading({ variant }: { readonly variant: LiveCodeEditorVariant }) {
  return (
    <div
      className={cn(
        'live-code-loading block min-w-0 overflow-hidden border border-border bg-background p-3',
        variant === 'playground'
          ? 'min-h-[520px] rounded-t-none rounded-b-md border-t-0 lg:h-[560px]'
          : 'min-h-[390px] rounded-md',
      )}
      aria-hidden="true"
    >
      <Skeleton className="h-11 w-full" />
      <div
        className={cn(
          'mt-3 grid min-h-[310px] grid-cols-1 gap-3',
          variant === 'playground' && 'min-h-[430px] lg:grid-cols-[minmax(0,55fr)_minmax(0,45fr)]',
        )}
      >
        <Skeleton className="min-h-[310px]" />
        {variant === 'playground' ? <Skeleton className="hidden min-h-[310px] lg:block" /> : null}
      </div>
    </div>
  );
}

const loadLiveCodeEditor = () => import('./live-code-editor');
const EmbeddedLiveCodeEditor = dynamic(loadLiveCodeEditor, {
  ssr: false,
  loading: () => <LiveCodeLoading variant="embedded" />,
});
const PlaygroundLiveCodeEditor = dynamic(loadLiveCodeEditor, {
  ssr: false,
  loading: () => <LiveCodeLoading variant="playground" />,
});

export function LiveCodeWorkbench({ variant = 'embedded', ...props }: LiveCodeEditorProps) {
  const Editor = variant === 'playground' ? PlaygroundLiveCodeEditor : EmbeddedLiveCodeEditor;
  return <Editor {...props} variant={variant} />;
}
