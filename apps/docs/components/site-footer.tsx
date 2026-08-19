import { GitFork } from 'lucide-react';
import Link from 'next/link';
import { hrefFor } from '../lib/content';
import { dictionaryFor, type Locale } from '../lib/i18n';
import { siteConfig } from '../lib/site';
import { LogoMark } from './logo-mark';

export function SiteFooter({ locale }: { locale: Locale }) {
  const dictionary = dictionaryFor(locale);
  const links = [
    [dictionary.navigation.docs, 'docs'],
    [dictionary.navigation.hooks, 'hooks'],
    [dictionary.navigation.playground, 'playground'],
  ] as const;
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <LogoMark aria-hidden="true" />
          <div>
            <strong>BETTER HOOKS</strong>
            <p>
              {locale === 'en'
                ? 'Type-safe React 19 hooks with predictable behavior.'
                : '类型安全、行为可预测的 React 19 Hook。'}
            </p>
          </div>
        </div>
        <nav aria-label={locale === 'en' ? 'Footer navigation' : '页脚导航'}>
          {links.map(([label, path]) => (
            <Link key={path} href={hrefFor(locale, path)}>
              {label}
            </Link>
          ))}
          <a href={siteConfig.repositoryUrl} target="_blank" rel="noreferrer">
            <GitFork aria-hidden="true" size={15} /> GitHub
          </a>
        </nav>
        <div className="site-footer__meta">
          <span>MIT License</span>
          <span>{dictionary.status.releasePending}</span>
        </div>
      </div>
    </footer>
  );
}
