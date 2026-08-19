import { GitFork, Star } from 'lucide-react';
import Link from 'next/link';
import { hrefFor, oppositeLocale, type SearchEntry } from '../lib/content';
import { dictionaryFor, type Locale } from '../lib/i18n';
import { primaryNavigation } from '../lib/navigation';
import { siteConfig } from '../lib/site';
import { GlobalSearch } from './global-search';
import { LanguageLink } from './language-link';
import { LogoMark } from './logo-mark';
import { MobileNavigation } from './mobile-navigation';
import { ThemeMenu } from './theme-menu';

export function SiteHeader({
  locale,
  currentPath,
  searchEntries,
}: {
  locale: Locale;
  currentPath: string[];
  searchEntries: SearchEntry[];
}) {
  const dictionary = dictionaryFor(locale);
  const navigation = primaryNavigation(locale);
  const languageHref = hrefFor(oppositeLocale(locale), currentPath);
  const currentHref = hrefFor(locale, currentPath);
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link
          className="brand"
          href={hrefFor(locale, [])}
          aria-label={locale === 'en' ? 'Better Hooks home' : 'Better Hooks 首页'}
        >
          <LogoMark className="brand__mark" aria-hidden="true" />
          <span>BETTER HOOKS</span>
          <small>{dictionary.status.preview}</small>
        </Link>
        <nav className="primary-nav" aria-label={locale === 'en' ? 'Primary navigation' : '主导航'}>
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={
                currentHref === item.href || currentHref.startsWith(`${item.href}/`)
                  ? 'page'
                  : undefined
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="site-header__actions">
          <GlobalSearch locale={locale} entries={searchEntries} />
          <a
            className="github-star"
            href={siteConfig.repositoryUrl}
            target="_blank"
            rel="noreferrer"
            aria-label={dictionary.actions.viewOnGitHub}
          >
            <GitFork aria-hidden="true" size={17} />
            <Star aria-hidden="true" size={14} />
            <span>Star</span>
          </a>
          <LanguageLink href={languageHref} hrefLang={oppositeLocale(locale)}>
            {locale === 'en' ? '中文' : 'EN'}
          </LanguageLink>
          <ThemeMenu locale={locale} />
          <MobileNavigation
            items={navigation}
            menuLabel={dictionary.actions.openMenu}
            closeLabel={dictionary.actions.closeMenu}
            githubLabel={dictionary.navigation.github}
          />
        </div>
      </div>
    </header>
  );
}
