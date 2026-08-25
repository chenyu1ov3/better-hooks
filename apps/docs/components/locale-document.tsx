import type { ReactNode } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { Locale } from '../lib/i18n';
import { jsonLdForLocale } from '../lib/metadata';

const themeBootScript = `(function(){try{var raw=localStorage.getItem('better-hooks:prefs:v1');var saved=raw?JSON.parse(raw).theme:'system';var preference=saved==='light'||saved==='dark'?saved:'system';var resolved=preference==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):preference;document.documentElement.dataset.themePreference=preference;document.documentElement.dataset.theme=resolved;document.documentElement.style.colorScheme=resolved;var metas=document.querySelectorAll('meta[name="theme-color"]');metas.forEach(function(meta,index){if(index)meta.remove();else meta.setAttribute('content',resolved==='dark'?'#09090b':'#ffffff')})}catch(e){}})()`;

export function LocaleDocument({ locale, children }: { locale: Locale; children: ReactNode }) {
  const jsonLd = JSON.stringify(jsonLdForLocale(locale)).replace(/</g, '\\u003c');
  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        <script
          id="better-hooks-theme-bootstrap"
          dangerouslySetInnerHTML={{ __html: themeBootScript }}
        />
        <script
          id="better-hooks-site-json-ld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd }}
        />
        <TooltipProvider delayDuration={300}>{children}</TooltipProvider>
      </body>
    </html>
  );
}
