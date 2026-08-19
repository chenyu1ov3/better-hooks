import type { MetadataRoute } from 'next';
import { hrefFor, listDocuments } from '../lib/content';
import type { Locale } from '../lib/i18n';
import { localizedPath } from '../lib/metadata';
import { absolutePageUrl } from '../lib/site';

export const dynamic = 'force-static';

const locales = ['en', 'zh-CN'] as const satisfies readonly Locale[];
const productPages = ['/', '/docs', '/hooks', '/playground', '/changelog'];

type RouteAvailability = Map<string, Set<Locale>>;

function addRoute(routes: RouteAvailability, pathname: string, locale: Locale) {
  const availableLocales = routes.get(pathname) ?? new Set<Locale>();
  availableLocales.add(locale);
  routes.set(pathname, availableLocales);
}

function sitemapDetails(
  pathname: string,
): Pick<MetadataRoute.Sitemap[number], 'changeFrequency' | 'priority'> {
  if (pathname === '/') return { changeFrequency: 'weekly', priority: 1 };
  if (pathname === '/docs' || pathname === '/hooks') {
    return { changeFrequency: 'weekly', priority: 0.9 };
  }
  if (pathname === '/playground') {
    return { changeFrequency: 'monthly', priority: 0.8 };
  }
  if (pathname.startsWith('/hooks/')) {
    return { changeFrequency: 'monthly', priority: 0.8 };
  }
  if (pathname === '/changelog') return { changeFrequency: 'weekly', priority: 0.6 };
  return { changeFrequency: 'monthly', priority: 0.7 };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const routes: RouteAvailability = new Map();

  for (const locale of locales) {
    for (const pathname of productPages) addRoute(routes, pathname, locale);

    for (const document of listDocuments(locale)) {
      const localizedHref = hrefFor(locale, document.slug);
      const pathname =
        locale === 'zh-CN'
          ? localizedHref === '/zh'
            ? '/'
            : localizedHref.slice(3)
          : localizedHref;
      addRoute(routes, pathname, locale);
    }
  }

  return [...routes.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .flatMap(([pathname, availableLocales]) => {
      const languages = Object.fromEntries(
        locales
          .filter((locale) => availableLocales.has(locale))
          .map((locale) => [locale, absolutePageUrl(localizedPath(locale, pathname))]),
      );

      if (availableLocales.has('en')) languages['x-default'] = absolutePageUrl(pathname);

      return locales
        .filter((locale) => availableLocales.has(locale))
        .map((locale) => ({
          url: absolutePageUrl(localizedPath(locale, pathname)),
          alternates: { languages },
          ...sitemapDetails(pathname),
        }));
    });
}
