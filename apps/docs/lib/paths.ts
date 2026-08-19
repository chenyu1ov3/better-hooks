import type { Locale } from './i18n';

export function hrefFor(locale: Locale, slug: string[] | string) {
  const parts = Array.isArray(slug) ? slug : slug.split('/').filter(Boolean);
  const prefix = locale === 'zh-CN' ? '/zh' : '';
  return `${prefix}/${parts.join('/')}`.replace(/\/$/, '') || '/';
}

export function oppositeLocale(locale: Locale): Locale {
  return locale === 'en' ? 'zh-CN' : 'en';
}
