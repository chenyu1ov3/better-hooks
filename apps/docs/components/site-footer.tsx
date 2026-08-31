import { GitFork, PackageOpen } from 'lucide-react';
import { hrefFor } from '../lib/content';
import { dictionaryFor, type Locale } from '../lib/i18n';
import { siteConfig } from '../lib/site';
import { LogoMark } from './logo-mark';
import { SiteLink } from './site-link';

export function SiteFooter({ locale }: { locale: Locale }) {
  const dictionary = dictionaryFor(locale);
  const links = [
    [dictionary.navigation.docs, 'docs'],
    [dictionary.navigation.hooks, 'hooks'],
    [dictionary.navigation.playground, 'playground'],
    [dictionary.navigation.changelog, 'changelog'],
  ] as const;
  return (
    <footer className="site-footer border-t border-border bg-card print:hidden">
      <div className="mx-auto grid w-full max-w-[1360px] grid-cols-1 items-center gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(260px,1fr)_auto_auto] lg:gap-10 lg:py-10">
        <SiteLink
          href={hrefFor(locale, '')}
          className="flex min-h-11 max-w-full w-fit items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
        >
          <LogoMark className="size-9 text-foreground" aria-hidden="true" />
          <span className="min-w-0">
            <strong className="block text-sm font-extrabold text-foreground">BETTER HOOKS</strong>
            <span className="mt-0.5 block text-xs break-words text-muted-foreground [overflow-wrap:anywhere]">
              {locale === 'en'
                ? 'Type-safe hooks with predictable behavior.'
                : '类型安全、行为可预测的 Hooks。'}
            </span>
          </span>
        </SiteLink>
        <nav
          className="flex flex-wrap items-center gap-x-4 gap-y-1 lg:justify-center"
          aria-label={locale === 'en' ? 'Footer navigation' : '页脚导航'}
        >
          {links.map(([label, path]) => (
            <SiteLink
              key={path}
              href={hrefFor(locale, path)}
              className="inline-flex min-h-11 items-center text-[13px] text-muted-foreground transition-colors hover:text-foreground"
            >
              {label}
            </SiteLink>
          ))}
          <a
            href={siteConfig.npmUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
          >
            <PackageOpen aria-hidden="true" size={15} /> npm
          </a>
          <a
            href={siteConfig.repositoryUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
          >
            <GitFork aria-hidden="true" size={15} /> GitHub
          </a>
        </nav>
        <div className="grid justify-items-start text-xs text-muted-foreground lg:justify-items-end">
          <a
            className="inline-flex min-h-11 items-center transition-colors hover:text-foreground"
            href={`${siteConfig.repositoryUrl}/blob/main/LICENSE`}
          >
            MIT License
          </a>
        </div>
      </div>
    </footer>
  );
}
