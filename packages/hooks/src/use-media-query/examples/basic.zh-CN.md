# use-media-query

`useMediaQuery` 通过共享外部 store 将 CSS 媒体查询转换为响应式布尔值。调整预览区或浏览器尺寸即可看到模式更新。

## 示例

```tsx
'use client';

import { useMediaQuery } from 'better-hooks/use-media-query';

export function ResponsiveMode() {
  const compact = useMediaQuery('(max-width: 40rem)', { defaultMatches: false });

  return (
    <div>
      <output aria-live="polite">视口模式：{compact ? '紧凑' : '宽屏'}</output>
      <span>{compact ? '单列控件' : '多列控件'}</span>
    </div>
  );
}
```

## 行为说明

`defaultMatches` 提供确定的服务端和不支持浏览器时的值。同一 window 中相同查询的订阅者共享一个原生监听器，最后一个实例卸载后才会移除。查询变化会迁移订阅，同时兼容旧式 `addListener` 浏览器。
