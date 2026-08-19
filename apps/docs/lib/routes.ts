import { listDocuments, readDocument } from './content';
import type { Locale } from './i18n';

export const productRoutes = ['hooks', 'playground', 'changelog'] as const;
export type ProductRoute = (typeof productRoutes)[number];

export function isProductRoute(value: string): value is ProductRoute {
  return productRoutes.some((route) => route === value);
}

export function staticPaths(locale: Locale) {
  return [
    [],
    ...productRoutes.map((route) => [route]),
    ...listDocuments(locale).map((document) => document.slug),
  ];
}

export function documentForPath(locale: Locale, path: string[]) {
  return readDocument(locale, path);
}
