import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { useResizeObserver } from '../index.js';

function Harness(): JSX.Element {
  const state = useResizeObserver(null);
  return (
    <output
      data-rect={String(state.rect)}
      data-width={String(state.width)}
      data-height={String(state.height)}
      data-error={String(state.error)}
    />
  );
}

describe('useResizeObserver server rendering', () => {
  it('renders a deterministic empty snapshot without browser globals', () => {
    expect(renderToString(<Harness />)).toContain(
      'data-rect="null" data-width="0" data-height="0" data-error="undefined"',
    );
  });
});
