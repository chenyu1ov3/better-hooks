# use-websocket

`useWebSocket` 管理浏览器 WebSocket，并提供可观察的生命周期状态、原始消息、稳定操作和可选的有界重连。此示例只在用户操作后连接到已验证的公共回显端点。

## 示例

```tsx
'use client';

import { useState } from 'react';
import { useWebSocket } from 'better-hooks/use-websocket';

const echoUrl = 'wss://ws.postman-echo.com/raw';

function describeError(error: unknown) {
  return error instanceof Error ? error.message : 'WebSocket 连接失败';
}

export function WebSocketEcho() {
  const [enabled, setEnabled] = useState(false);
  const [draft, setDraft] = useState('来自 better-hooks 的问候');
  const socket = useWebSocket(echoUrl, {
    enabled,
    reconnect: { maxAttempts: 2, initialDelay: 500 },
  });

  const disconnect = () => {
    socket.close(1000, '示例主动断开');
    setEnabled(false);
  };
  const send = () => {
    try {
      socket.send(draft);
    } catch {
      // 渲染与点击之间发生的关闭会通过 socket.error 暴露。
    }
  };

  return (
    <div>
      <button type="button" disabled={enabled} onClick={() => setEnabled(true)}>
        连接
      </button>
      <button type="button" disabled={!enabled} onClick={disconnect}>
        断开
      </button>
      <button
        type="button"
        disabled={!enabled || socket.status === 'connecting'}
        onClick={socket.reconnect}
      >
        重新连接
      </button>
      <label>
        消息
        <input value={draft} onChange={(event) => setDraft(event.currentTarget.value)} />
      </label>
      <button type="button" disabled={socket.status !== 'open' || !draft} onClick={send}>
        发送
      </button>
      <output aria-live="polite">状态：{socket.status}</output>
      <output>回显：{socket.data === undefined ? '尚未收到消息' : String(socket.data)}</output>
      {socket.error === undefined ? null : <output>错误：{describeError(socket.error)}</output>}
    </div>
  );
}
```

## 行为说明

禁用模式和 SSR 都保持 `closed`，不会创建 socket。URL、协议或启用状态变化会替换连接并忽略旧事件。`send` 只能在 `open` 时成功；其他状态会抛出 `InvalidStateError` 并写入 `error`。手动关闭会抑制重试；启用重连后，服务端主动关闭会遵循有上限的重连策略。
