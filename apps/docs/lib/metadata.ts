import type { Metadata, Viewport } from 'next';
import type { DocumentRecord } from './content';
import type { Locale } from './i18n';
import { absolutePageUrl, absoluteUrl, siteConfig } from './site';

type PageMetadataOptions = {
  locale: Locale;
  pathname?: string;
  title?: string;
  description?: string;
};

type BreadcrumbListItem = {
  '@type': 'ListItem';
  position: number;
  name: string;
  item: string;
};

const localizedMetadata = {
  en: {
    title: 'Better Hooks - Typed React 19 hooks',
    description: siteConfig.description,
    imageAlt: 'Better Hooks - typed, composable React 19 hooks',
    openGraphLocale: 'en_US',
    alternateOpenGraphLocale: 'zh_CN',
    keywords: ['React 19', 'React Hooks', 'TypeScript', 'SSR', 'React Server Components'],
  },
  'zh-CN': {
    title: 'Better Hooks - 面向 React 19 的类型安全 Hook',
    description:
      '面向 React 19 的类型安全 Hook，API 易于组合，资源清理可靠，客户端与服务端边界清晰。',
    imageAlt: 'Better Hooks - 面向 React 19 的类型安全 Hook',
    openGraphLocale: 'zh_CN',
    alternateOpenGraphLocale: 'en_US',
    keywords: ['React 19', 'React Hooks', 'TypeScript', '服务端渲染', 'React Server Components'],
  },
} as const;

function normalizePathname(pathname: string) {
  const trimmed = pathname.trim().replace(/^\/+|\/+$/g, '');
  return trimmed ? `/${trimmed}` : '/';
}

function unlocalizedPathname(pathname: string) {
  const normalized = normalizePathname(pathname);
  if (normalized === '/zh') return '/';
  return normalized.startsWith('/zh/') ? normalized.slice(3) : normalized;
}

export function localizedPath(locale: Locale, pathname = '/') {
  const normalized = unlocalizedPathname(pathname);
  if (locale === 'en') return normalized;
  return normalized === '/' ? '/zh' : `/zh${normalized}`;
}

export function languageAlternates(pathname = '/') {
  const normalized = unlocalizedPathname(pathname);
  return {
    en: absolutePageUrl(localizedPath('en', normalized)),
    'zh-CN': absolutePageUrl(localizedPath('zh-CN', normalized)),
    'x-default': absolutePageUrl(localizedPath('en', normalized)),
  };
}

export function metadataForPage({
  locale,
  pathname = '/',
  title,
  description,
}: PageMetadataOptions): Metadata {
  const copy = localizedMetadata[locale];
  const canonicalPath = localizedPath(locale, pathname);
  const canonical = absolutePageUrl(canonicalPath);
  const resolvedTitle = title ?? copy.title;
  const resolvedDescription = description ?? copy.description;
  const socialImage = absoluteUrl('/opengraph-image.png');

  return {
    metadataBase: new URL(absolutePageUrl('/')),
    applicationName: siteConfig.name,
    title: title
      ? title
      : {
          default: copy.title,
          template: `%s | ${siteConfig.name}`,
        },
    description: resolvedDescription,
    keywords: [...copy.keywords],
    authors: [{ name: 'Better Hooks contributors', url: siteConfig.repositoryUrl }],
    creator: 'Better Hooks contributors',
    category: 'technology',
    alternates: {
      canonical,
      languages: languageAlternates(pathname),
    },
    manifest: absoluteUrl('/manifest.webmanifest'),
    icons: {
      icon: [{ url: absoluteUrl('/better-hooks-mark.svg'), type: 'image/svg+xml' }],
      shortcut: [absoluteUrl('/better-hooks-mark.svg')],
    },
    openGraph: {
      type: 'website',
      url: canonical,
      siteName: siteConfig.name,
      title: resolvedTitle,
      description: resolvedDescription,
      locale: copy.openGraphLocale,
      alternateLocale: copy.alternateOpenGraphLocale,
      images: [
        {
          url: socialImage,
          width: 1200,
          height: 630,
          alt: copy.imageAlt,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: resolvedTitle,
      description: resolvedDescription,
      images: [{ url: socialImage, alt: copy.imageAlt }],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
  };
}

export function metadataForLocale(locale: Locale): Metadata {
  return metadataForPage({ locale, pathname: '/' });
}

export function viewportForLocale(): Viewport {
  return {
    colorScheme: 'light dark',
    themeColor: '#ffffff',
  };
}

export function metadataForDocument(document: DocumentRecord): Metadata {
  return metadataForPage({
    locale: document.locale,
    pathname: `/${document.slug.join('/')}`,
    title: document.title,
    description: document.description,
  });
}

export function jsonLdForLocale(locale: Locale) {
  const copy = localizedMetadata[locale];
  const url = absolutePageUrl(localizedPath(locale));

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${url}#website`,
        name: siteConfig.name,
        url,
        description: copy.description,
        inLanguage: locale,
      },
      {
        '@type': 'SoftwareSourceCode',
        '@id': `${absolutePageUrl('/')}#source`,
        name: siteConfig.packageName,
        description: copy.description,
        codeRepository: siteConfig.repositoryUrl,
        license: `${siteConfig.repositoryUrl}/blob/main/LICENSE`,
        programmingLanguage: 'TypeScript',
        runtimePlatform: 'React 19',
        url: absolutePageUrl('/'),
      },
    ],
  };
}

export function jsonLdForDocument(document: DocumentRecord) {
  const pathname = `/${document.slug.join('/')}`;
  const url = absolutePageUrl(localizedPath(document.locale, pathname));
  const sectionPath = document.slug[0] ? `/${document.slug[0]}` : '/';
  const sectionName =
    document.slug[0] === 'hooks'
      ? document.locale === 'zh-CN'
        ? 'Hook'
        : 'Hooks'
      : document.locale === 'zh-CN'
        ? '文档'
        : 'Documentation';
  const breadcrumbs: BreadcrumbListItem[] = [
    {
      '@type': 'ListItem',
      position: 1,
      name: siteConfig.name,
      item: absolutePageUrl(localizedPath(document.locale)),
    },
  ];

  if (document.slug.length > 1) {
    breadcrumbs.push({
      '@type': 'ListItem',
      position: 2,
      name: sectionName,
      item: absolutePageUrl(localizedPath(document.locale, sectionPath)),
    });
  }

  breadcrumbs.push({
    '@type': 'ListItem',
    position: breadcrumbs.length + 1,
    name: document.title,
    item: url,
  });

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'TechArticle',
        '@id': `${url}#article`,
        headline: document.title,
        description: document.description,
        inLanguage: document.locale,
        mainEntityOfPage: url,
        url,
        isPartOf: {
          '@id': `${absolutePageUrl(localizedPath(document.locale))}#website`,
        },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${url}#breadcrumb`,
        itemListElement: breadcrumbs,
      },
    ],
  };
}
