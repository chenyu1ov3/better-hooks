import type { Locale } from '../lib/i18n';

export const SHIKI_THEMES = {
  light: 'github-light-default',
  dark: 'github-dark-default',
} as const;

const TERMINAL_LANGUAGES = new Set([
  'bash',
  'console',
  'powershell',
  'ps1',
  'pwsh',
  'sh',
  'shell',
  'zsh',
]);

export type CodeBlockVariant = 'code' | 'terminal';

export type CodeBlockLabels = {
  copy: string;
  copied: string;
  copyFailed: string;
};

export function normalizeCodeLanguage(language: string): string {
  return language.trim().toLowerCase() || 'text';
}

export function codeBlockVariant(language: string): CodeBlockVariant {
  return TERMINAL_LANGUAGES.has(normalizeCodeLanguage(language)) ? 'terminal' : 'code';
}

export function isPowerShellLanguage(language: string): boolean {
  return ['powershell', 'ps1', 'pwsh'].includes(normalizeCodeLanguage(language));
}

export function isConsoleLanguage(language: string): boolean {
  return normalizeCodeLanguage(language) === 'console';
}

export function codeBlockLabels(locale: Locale): CodeBlockLabels {
  if (locale === 'zh-CN') {
    return {
      copy: '复制代码',
      copied: '代码已复制',
      copyFailed: '复制失败，请手动选择代码',
    };
  }

  return {
    copy: 'Copy code',
    copied: 'Code copied',
    copyFailed: 'Copy failed. Select the code manually.',
  };
}
