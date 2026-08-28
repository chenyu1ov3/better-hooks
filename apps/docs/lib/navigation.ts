import { apiEntries, hookCategories } from './hooks';
import { dictionaryFor, type Locale } from './i18n';

export type NavItem = { href: string; label: string };
export type NavGroup = { label: string; items: NavItem[] };

function localized(locale: Locale, path: string) {
  return locale === 'zh-CN' ? `/zh${path === '/' ? '' : path}` : path;
}

export function documentationNavigation(locale: Locale): NavGroup[] {
  const dictionary = dictionaryFor(locale);
  const docs = dictionary.docs;
  return [
    {
      label: docs.start,
      items: [
        { href: localized(locale, '/docs'), label: docs.introduction },
        { href: localized(locale, '/docs/installation'), label: docs.installation },
        { href: localized(locale, '/docs/getting-started'), label: docs.gettingStarted },
      ],
    },
    {
      label: docs.concepts,
      items: [
        { href: localized(locale, '/docs/react-19'), label: docs.react19 },
        { href: localized(locale, '/docs/ssr-rsc'), label: docs.ssrRsc },
        { href: localized(locale, '/docs/performance'), label: docs.performance },
        { href: localized(locale, '/docs/support-matrix'), label: docs.supportMatrix },
      ],
    },
    ...hookCategories.map((category) => ({
      label: dictionary.categories[category],
      items: apiEntries
        .filter((entry) => entry.category === category)
        .map((entry) => ({
          href: localized(locale, `/hooks/${entry.slug}`),
          label: entry.name,
        })),
    })),
  ];
}

export function primaryNavigation(locale: Locale): NavItem[] {
  const dictionary = dictionaryFor(locale);
  return [
    { href: localized(locale, '/docs'), label: dictionary.nav.docs },
    { href: localized(locale, '/hooks'), label: dictionary.nav.hooks },
    { href: localized(locale, '/playground'), label: dictionary.nav.playground },
    { href: localized(locale, '/changelog'), label: dictionary.nav.changelog },
  ];
}
