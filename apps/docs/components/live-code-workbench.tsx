'use client';

import dynamic from 'next/dynamic';
import type { LiveCodeEditorProps } from './live-code-editor';

const LiveCodeEditor = dynamic(() => import('./live-code-editor'), {
  ssr: false,
  loading: () => <div className="live-code-loading" aria-hidden="true" />,
});

export function LiveCodeWorkbench(props: LiveCodeEditorProps) {
  return <LiveCodeEditor {...props} />;
}
