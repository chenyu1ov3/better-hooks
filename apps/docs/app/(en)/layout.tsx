import '@fontsource-variable/onest';
import '@fontsource/ibm-plex-mono/400.css';
import type { ReactNode } from 'react';
import { LocaleDocument } from '../../components/locale-document';
import { metadataForLocale, viewportForLocale } from '../../lib/metadata';
import '../globals.css';

export const metadata = metadataForLocale('en');
export const viewport = viewportForLocale();

export default function EnglishLayout({ children }: { children: ReactNode }) {
  return <LocaleDocument locale="en">{children}</LocaleDocument>;
}
