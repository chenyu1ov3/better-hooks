import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { useDocumentVisibility } from '../index.js';

function Harness(): JSX.Element {
  return <output>{useDocumentVisibility()}</output>;
}

describe('useDocumentVisibility server rendering', () => {
  it('falls back to visible without browser globals', () => {
    expect(renderToString(<Harness />)).toContain('>visible</output>');
  });
});
