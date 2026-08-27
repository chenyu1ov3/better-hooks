# use-websocket

`useWebSocket` manages a browser WebSocket connection, exposes its lifecycle and latest message, and keeps imperative actions stable across renders. Reconnects are opt-in so examples and server rendering never open a network connection by surprise.

## Example

```tsx
'use client';

import { useState } from 'react';
import { useWebSocket } from 'better-hooks/use-websocket';

export function WebSocketStatus() {
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState('hello from better-hooks');
  const socket = useWebSocket('wss://echo.websocket.events', {
    enabled,
    reconnect: { maxAttempts: 3 },
    onMessage: (event) => setMessage(String(event.data)),
  });

  const send = () => {
    socket.send(message);
  };

  return (
    <div>
      <button type="button" onClick={() => setEnabled((value) => !value)}>
        {enabled ? 'Disconnect' : 'Connect'}
      </button>
      <button type="button" disabled={socket.status !== 'open'} onClick={send}>
        Send
      </button>
      <input value={message} onChange={(event) => setMessage(event.target.value)} />
      <output>
        {socket.status}: {String(socket.data ?? 'No messages yet')}
      </output>
    </div>
  );
}
```

## Behavior

The hook starts in `closed` during SSR and while disabled. URL, protocol, or
enabled changes replace the old socket and ignore events from it. Reconnect
policy updates affect future retries without replacing the active socket.
`reconnect` is disabled by default; when enabled it retries server-initiated
closes, including clean close codes, with bounded exponential backoff. `send`
only writes while the socket is `open`; otherwise it throws an
`InvalidStateError` and reports it through `onError`. Native failures from an
open socket and `close` failures are preserved. A callback failure closes the
active socket before the original error is rethrown.
