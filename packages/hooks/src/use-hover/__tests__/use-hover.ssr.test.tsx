import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { useHover } from '../index.js';

function Harness(): JSX.Element {
  return <output>{String(useHover(null))}</output>;
}

describe('useHover server rendering', () => {
  it('renders a deterministic false state without a target', () => {
    expect(renderToString(<Harness />)).toContain('>false</output>');
  });
});
