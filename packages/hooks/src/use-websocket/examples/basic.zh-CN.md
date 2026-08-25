# use-websocket

`useWebSocket` 管理浏览器 WebSocket 连接，提供生命周期状态和最新消息，并在渲染之间保持命令函数稳定。重连默认关闭，因此示例和服务端渲染不会意外发起网络连接。

## 示例

```tsx
'use client';

import { useState } from 'react';
import { useWebSocket } from 'better-hooks/use-websocket';

export function WebSocketStatus() {
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState('来自 better-hooks 的问候');
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
        {enabled ? '断开' : '连接'}
      </button>
      <button type="button" disabled={socket.status !== 'open'} onClick={send}>
        发送
      </button>
      <input value={message} onChange={(event) => setMessage(event.target.value)} />
      <output>
        {socket.status}: {String(socket.data ?? '尚未收到消息')}
      </output>
    </div>
  );
}
```

## 行为说明

服务端渲染和禁用时 Hook 的初始状态为 `closed`。URL、协议或启用状态变化会替换旧连接，并忽略旧连接迟到的事件；重连策略更新只影响后续重连，不会替换活动连接。重连默认关闭，开启后会对服务端主动关闭（包括正常关闭码）使用有上限的指数退避。`send` 只会在连接为 `open` 时发送；其他状态会抛出 `InvalidStateError`，并通过 `onError` 报告。已打开连接的原生发送错误和 `close` 错误会保留。回调异常会先关闭活动连接，再重新抛出原始错误。
