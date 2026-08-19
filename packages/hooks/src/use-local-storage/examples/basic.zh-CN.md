# use-local-storage

`useLocalStorage` 会让类型安全的值与 `localStorage` 存储项保持同步，通过 `error` 暴露持久化失败，并保证 SSR 期间不访问浏览器存储。

## 示例

```tsx
'use client';

import { useLocalStorage } from 'better-hook/use-local-storage';

export function ThemePreference() {
  const theme = useLocalStorage('theme:v1', 'system');

  return (
    <div>
      <button type="button" onClick={() => theme.setValue('light')}>
        浅色
      </button>
      <button type="button" onClick={() => theme.setValue('dark')}>
        深色
      </button>
      <button type="button" onClick={theme.remove}>
        跟随系统
      </button>
      <output>
        {theme.error
          ? '存储不可用'
          : theme.value === 'light'
            ? '浅色'
            : theme.value === 'dark'
              ? '深色'
              : '跟随系统'}
      </output>
    </div>
  );
}
```

## 行为说明

函数式更新和使用同一存储项的 Hook 实例共享内存快照。删除存储项会恢复首次捕获的初始值；下一次操作成功后，可恢复的存储错误会被清除。
