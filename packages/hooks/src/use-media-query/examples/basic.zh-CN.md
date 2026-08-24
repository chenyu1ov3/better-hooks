# use-media-query

`useMediaQuery` 通过共享的外部状态源订阅 CSS 媒体查询。浏览器查询可用前，服务端默认值可以让渲染结果保持确定。

## 示例

```tsx
'use client';

import { useMediaQuery } from 'better-hooks/use-media-query';

export function ResponsiveMode() {
  const compact = useMediaQuery('(max-width: 48rem)', { defaultMatches: false });
  return <output>{compact ? '紧凑导航' : '完整导航'}</output>;
}
```

## 行为说明

相同查询的订阅者共享一个原生监听器，并在最后一个订阅者卸载后清理。仅支持旧版 `addListener` API 的浏览器也可以使用。
