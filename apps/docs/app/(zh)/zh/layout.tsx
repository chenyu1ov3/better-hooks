import type { ReactNode } from 'react';
import { LocaleDocument } from '../../../components/locale-document';
import { metadataForLocale, viewportForLocale } from '../../../lib/metadata';
import '../../globals.css';

export const metadata = metadataForLocale('zh-CN');
export const viewport = viewportForLocale();

export default function ChineseLayout({ children }: { children: ReactNode }) {
  return <LocaleDocument locale="zh-CN">{children}</LocaleDocument>;
}
