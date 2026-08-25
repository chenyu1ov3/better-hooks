import packageManifest from 'better-hooks/package.json';
import type { Locale } from './i18n';

export type ChangelogSection = {
  readonly title: string;
  readonly description: string;
};

export type ChangelogRelease = {
  readonly version: string;
  readonly eyebrow: string;
  readonly description: string;
  readonly sections: readonly ChangelogSection[];
  readonly viewNpm: string;
  readonly history: string;
};

type LocalizedRelease = Record<Locale, Omit<ChangelogRelease, 'version'>>;

const releaseCatalog: Record<string, LocalizedRelease> = {
  '0.2.0': {
    en: {
      eyebrow: 'Project history',
      description: 'Published package history, grouped by release impact.',
      sections: [
        {
          title: 'Minor Changes',
          description:
            'Added eight Hook primitives: memoized callbacks, safe and resettable state, unmount tracking, document visibility, keyboard shortcuts, hover tracking, and locked async actions. Extended scheduling and browser Hooks with observable error handling and cleanup-before-propagation semantics.',
        },
        {
          title: 'Patch Changes',
          description:
            'Hardened Hook behavior across async cancellation, controlled state, scheduling, DOM, browser state, and storage edge cases. Added broader runtime, SSR, type, and per-file coverage checks, plus bilingual Markdown examples for every Hook entry.',
        },
      ],
      viewNpm: 'View this version on npm',
      history: 'GitHub Release',
    },
    'zh-CN': {
      eyebrow: '项目历史',
      description: '按发布影响分类记录已发布 npm 包的变更。',
      sections: [
        {
          title: '次版本更新',
          description:
            '新增八个 Hook 原语：记忆化回调、安全状态与可重置状态、卸载跟踪、文档可见性、键盘快捷键、悬停跟踪和异步操作锁；同时为调度与浏览器 Hook 补充可观察错误处理，以及先清理再传播的异常语义。',
        },
        {
          title: '补丁更新',
          description:
            '强化异步取消、受控状态、调度、DOM、浏览器状态和存储边界行为；补充运行时、SSR、类型与逐文件覆盖检查，并为每个 Hook 入口提供双语 Markdown 示例。',
        },
      ],
      viewNpm: '在 npm 查看此版本',
      history: 'GitHub Release',
    },
  },
  '1.0.0': {
    en: {
      eyebrow: 'Stable release',
      description: 'The frozen 1.0.0 public API and its runtime guarantees.',
      sections: [
        {
          title: 'Public API freeze',
          description:
            'Stabilized 30 Hooks with explicit ESM exports, typed declarations, predictable cleanup, and documented SSR boundaries.',
        },
        {
          title: 'Behavioral clarifications',
          description:
            'Keyboard filter arrays represent independent alternatives; write a string such as `ctrl+s` for a chord. Error observers remain observable without replacing the original thrown error or rejected promise.',
        },
      ],
      viewNpm: 'View this version on npm',
      history: 'GitHub Release',
    },
    'zh-CN': {
      eyebrow: '稳定版本',
      description: '冻结 1.0.0 公开 API，并明确运行时保证。',
      sections: [
        {
          title: '冻结公开 API',
          description:
            '稳定 30 个 Hook，提供明确的 ESM exports、类型声明、可预测的清理逻辑，以及有文档说明的 SSR 边界。',
        },
        {
          title: '明确行为语义',
          description:
            '键盘过滤数组表示彼此独立的候选项；组合快捷键请使用 `ctrl+s` 这样的字符串。错误观察器保持可观察，但不会替换原始抛出或 Promise 拒绝。',
        },
      ],
      viewNpm: '在 npm 查看此版本',
      history: 'GitHub Release',
    },
  },
};

function fallbackRelease(version: string): LocalizedRelease {
  const prerelease = version.includes('-');
  return {
    en: {
      eyebrow: prerelease ? 'Release candidate' : 'Stable release',
      description: `Release notes for better-hooks ${version}, verified from the package artifact.`,
      sections: [
        {
          title: 'Release notes',
          description:
            'See the package CHANGELOG and the linked GitHub Release for the complete user-facing changes.',
        },
        {
          title: 'Verification',
          description:
            'The published artifact is checked for its ESM exports, declarations, runtime imports, and provenance.',
        },
      ],
      viewNpm: 'View this version on npm',
      history: 'GitHub Release',
    },
    'zh-CN': {
      eyebrow: prerelease ? '候选版本' : '稳定版本',
      description: `better-hooks ${version} 的发布说明，内容来自已验证的包产物。`,
      sections: [
        {
          title: '发布说明',
          description: '完整的面向用户变更请查看包 CHANGELOG 以及下方链接的 GitHub Release。',
        },
        {
          title: '发布校验',
          description: '发布产物会校验 ESM 导出、类型声明、运行时导入和 provenance。',
        },
      ],
      viewNpm: '在 npm 查看此版本',
      history: 'GitHub Release',
    },
  };
}

export function changelogFor(locale: Locale): ChangelogRelease {
  const version = packageManifest.version;
  const localized = (releaseCatalog[version] ?? fallbackRelease(version))[locale];
  return { version, ...localized };
}
