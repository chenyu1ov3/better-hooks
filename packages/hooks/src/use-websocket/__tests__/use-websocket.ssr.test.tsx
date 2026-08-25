import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useWebSocket } from '../index.js';

function Harness(): JSX.Element {
  const socket = useWebSocket('wss://example.invalid/socket');
  return <output data-status={socket.status} data-data={String(socket.data)} />;
}

describe('useWebSocket server rendering', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('keeps a closed snapshot without constructing a browser socket', () => {
    const constructor = vi.fn(() => {
      throw new Error('WebSocket must not be constructed during SSR');
    });
    vi.stubGlobal('WebSocket', constructor);

    const html = renderToString(<Harness />);

    expect(html).toContain('data-status="closed"');
    expect(html).toContain('data-data="undefined"');
    expect(constructor).not.toHaveBeenCalled();
  });
});
