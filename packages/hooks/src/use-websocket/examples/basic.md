# use-websocket

`useWebSocket` manages a browser WebSocket with observable lifecycle state, raw messages, stable actions, and optional bounded reconnects. This demo connects only on request to a verified public echo endpoint.

## Example

```tsx
'use client';

import { useState } from 'react';
import { useWebSocket } from 'better-hooks/use-websocket';

const echoUrl = 'wss://ws.postman-echo.com/raw';

function describeError(error: unknown) {
  return error instanceof Error ? error.message : 'WebSocket connection failed';
}

export function WebSocketEcho() {
  const [enabled, setEnabled] = useState(false);
  const [draft, setDraft] = useState('Hello from better-hooks');
  const socket = useWebSocket(echoUrl, {
    enabled,
    reconnect: { maxAttempts: 2, initialDelay: 500 },
  });

  const disconnect = () => {
    socket.close(1000, 'Demo disconnected');
    setEnabled(false);
  };
  const send = () => {
    try {
      socket.send(draft);
    } catch {
      // A close between render and click is exposed through socket.error.
    }
  };

  return (
    <div>
      <button type="button" disabled={enabled} onClick={() => setEnabled(true)}>
        Connect
      </button>
      <button type="button" disabled={!enabled} onClick={disconnect}>
        Disconnect
      </button>
      <button
        type="button"
        disabled={!enabled || socket.status === 'connecting'}
        onClick={socket.reconnect}
      >
        Reconnect
      </button>
      <label>
        Message
        <input value={draft} onChange={(event) => setDraft(event.currentTarget.value)} />
      </label>
      <button type="button" disabled={socket.status !== 'open' || !draft} onClick={send}>
        Send
      </button>
      <output aria-live="polite">Status: {socket.status}</output>
      <output>
        Echo: {socket.data === undefined ? 'No message received' : String(socket.data)}
      </output>
      {socket.error === undefined ? null : <output>Error: {describeError(socket.error)}</output>}
    </div>
  );
}
```

## Behavior

Disabled mode and SSR stay `closed` without constructing a socket. URL, protocol, or enabled changes replace the connection and ignore stale events. `send` succeeds only while `open`; every other state throws `InvalidStateError` and stores it in `error`. Manual close suppresses retries, while server-initiated closes use the bounded reconnect policy when enabled.
