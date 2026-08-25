export const siteConfig = {
  name: 'Better Hooks',
  packageName: 'better-hooks',
  description:
    'Typed, composable React 19 hooks with predictable cleanup and explicit runtime boundaries.',
  repositoryUrl: 'https://github.com/chenyu1ov3/better-hooks',
  npmUrl: 'https://www.npmjs.com/package/better-hooks',
  origin: 'https://chenyu1ov3.github.io',
  basePath: '/better-hooks',
} as const;

function cleanBasePath(value: string) {
  const trimmed = value.trim();
  if (!trimmed || trimmed === '/') return '';
  return `/${trimmed.replace(/^\/+|\/+$/g, '')}`;
}

export const basePath = cleanBasePath(process.env.NEXT_PUBLIC_BASE_PATH ?? siteConfig.basePath);

export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ?? `${siteConfig.origin}${basePath || siteConfig.basePath}`
).replace(/\/$/, '');

export function absoluteUrl(pathname = '/') {
  const path = pathname === '/' ? '' : `/${pathname.replace(/^\/+/, '')}`;
  return `${siteUrl}${path}`;
}

export function absolutePageUrl(pathname = '/') {
  const url = absoluteUrl(pathname);
  return url.endsWith('/') ? url : `${url}/`;
}

export function assetUrl(pathname: string) {
  return `${basePath}/${pathname.replace(/^\/+/, '')}`.replace(/\/{2,}/g, '/');
}
