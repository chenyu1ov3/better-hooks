# use-local-storage

`useLocalStorage` 将类型化值与 localStorage 键同步，并暴露可恢复的存储或编解码错误，同时避免在 SSR 期间访问浏览器存储。

## 示例

```tsx
'use client';

import { useLocalStorage } from 'better-hooks/use-local-storage';

type ThemePreference = 'system' | 'light' | 'dark';

export function ThemePreferencePicker() {
  const theme = useLocalStorage<ThemePreference>('better-hooks:theme-example', 'system');

  return (
    <div>
      <button
        type="button"
        aria-pressed={theme.value === 'light'}
        onClick={() => theme.setValue('light')}
      >
        浅色
      </button>
      <button
        type="button"
        aria-pressed={theme.value === 'dark'}
        onClick={() => theme.setValue('dark')}
      >
        深色
      </button>
      <button type="button" aria-pressed={theme.value === 'system'} onClick={theme.remove}>
        跟随系统
      </button>
      <output aria-live="polite">
        {theme.error === undefined ? `已存储偏好：${theme.value}` : '存储不可用'}
      </output>
    </div>
  );
}
```

## 行为说明

初始值只捕获一次，用于 SSR 以及删除键后的回退。同键 Hook 实例共享内存快照，浏览器 `storage` 事件则同步其他文档。函数式更新使用最新共享值；后续操作成功时会清除可恢复错误。
