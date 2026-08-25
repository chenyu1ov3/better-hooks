import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { useIntersectionObserver } from '../index.js';

function Harness(): JSX.Element {
  const state = useIntersectionObserver(null);
  return (
    <output
      data-entry={String(state.entry)}
      data-intersecting={String(state.isIntersecting)}
      data-error={String(state.error)}
    />
  );
}

describe('useIntersectionObserver server rendering', () => {
  it('renders a deterministic empty snapshot without browser globals', () => {
    expect(renderToString(<Harness />)).toContain(
      'data-entry="null" data-intersecting="false" data-error="undefined"',
    );
  });
});
