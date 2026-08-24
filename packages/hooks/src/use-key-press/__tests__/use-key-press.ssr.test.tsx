import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { useKeyPress } from '../index.js';

function Harness(): JSX.Element {
  useKeyPress('Enter', () => undefined);
  return <output>ready</output>;
}

describe('useKeyPress server rendering', () => {
  it('does not access window while rendering on the server', () => {
    expect(renderToString(<Harness />)).toContain('>ready</output>');
  });
});
