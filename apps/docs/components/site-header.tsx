import { GitFork } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { hrefFor, oppositeLocale, type SearchEntry } from '../lib/content';
import { dictionaryFor, type Locale } from '../lib/i18n';
import { primaryNavigation } from '../lib/navigation';
import { siteConfig } from '../lib/site';
import { GlobalSearch } from './global-search';
import { LanguageLink } from './language-link';
import { LogoMark } from './logo-mark';
import { MobileNavigation } from './mobile-navigation';
import { SiteLink } from './site-link';
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
    <header className="sticky top-0 z-50 h-16 border-b border-border/80 bg-background/95 backdrop-blur-md print:hidden">
      <div className="mx-auto flex h-full w-[calc(100%-1.5rem)] max-w-[90rem] items-center gap-2.5 xl:w-[calc(100%-2.5rem)] xl:gap-7">
        <SiteLink
          className="group inline-flex min-h-11 min-w-11 shrink-0 items-center gap-2.5 text-[13px] font-extrabold text-foreground sm:text-sm"
          href={hrefFor(locale, [])}
          aria-label={locale === 'en' ? 'Better Hooks home' : 'Better Hooks 首页'}
        >
          <LogoMark
            className="size-7 text-foreground transition-opacity duration-150 group-hover:opacity-65 sm:size-[30px]"
            aria-hidden="true"
          />
          <span className="max-[389px]:hidden">BETTER HOOKS</span>
        </SiteLink>
        <nav
          className="hidden items-center gap-1 xl:flex"
          aria-label={locale === 'en' ? 'Primary navigation' : '主导航'}
        >
          {navigation.map((item) => (
            <SiteLink
              className="rounded-md px-2.5 py-2 text-[13px] font-semibold text-muted-foreground transition-[color,background-color] duration-150 hover:bg-muted hover:text-foreground aria-[current=page]:bg-muted aria-[current=page]:text-foreground"
              key={item.href}
              href={item.href}
              aria-current={
                currentHref === item.href || currentHref.startsWith(`${item.href}/`)
                  ? 'page'
                  : undefined
              }
            >
              {item.label}
            </SiteLink>
          ))}
        </nav>
        <div className="ml-auto flex min-w-0 items-center gap-1.5">
          <GlobalSearch locale={locale} entries={searchEntries} />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                asChild
                variant="outline"
                className="hidden h-11 gap-2 border-border bg-background px-3 text-xs text-muted-foreground shadow-none md:inline-flex"
              >
                <a
                  href={siteConfig.repositoryUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={dictionary.actions.viewOnGitHub}
                >
                  <GitFork aria-hidden="true" size={18} />
                  <span className="hidden lg:inline">GitHub</span>
                </a>
              </Button>
            </TooltipTrigger>
            <TooltipContent sideOffset={6}>{dictionary.actions.viewOnGitHub}</TooltipContent>
          </Tooltip>
          <LanguageLink href={languageHref} hrefLang={oppositeLocale(locale)}>
            {locale === 'en' ? '中文' : 'EN'}
          </LanguageLink>
          <ThemeMenu locale={locale} />
          <MobileNavigation
            items={navigation}
            currentHref={currentHref}
            menuLabel={dictionary.actions.openMenu}
            closeLabel={dictionary.actions.closeMenu}
            githubLabel={dictionary.navigation.github}
          />
        </div>
      </div>
    </header>
  );
}
