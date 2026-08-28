# use-copy-to-clipboard

`useCopyToClipboard` 通过浏览器 Clipboard API 写入文本，并暴露当前操作状态。

## 示例

```tsx
'use client';

import { useCopyToClipboard } from 'better-hooks/use-copy-to-clipboard';

export function CopyToClipboardExample() {
  const clipboard = useCopyToClipboard();
  const handleCopy = () => {
    void clipboard.copy('Better Hooks').catch(() => undefined);
  };

  return (
    <div>
      <button type="button" onClick={handleCopy}>
        复制
      </button>
      <output>{clipboard.status === 'success' ? clipboard.copiedText : '准备就绪'}</output>
    </div>
  );
}
```

## 行为说明

只有客户端组件完成提交后才会调用 Clipboard API。写入成功会保存复制的文本；写入失败会更新 `error`，在配置时调用 `onError`，并保留原始 Promise 拒绝。较新的写入不会被旧结果覆盖。
