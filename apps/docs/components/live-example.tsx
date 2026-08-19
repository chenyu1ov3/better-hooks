import type { Locale } from '../lib/i18n';
import type { ApiEntryDefinition } from '../lib/hooks';
import { readExampleSource } from '../lib/examples';
import { LiveCodeWorkbench } from './live-code-workbench';

export function LiveExample({ hook, locale }: { hook: ApiEntryDefinition; locale: Locale }) {
  const source = readExampleSource(hook.slug, locale);
  if (!source) return null;

  return (
    <section
      className="live-example"
      aria-label={locale === 'en' ? `${hook.name} live example` : `${hook.name} 在线示例`}
    >
      <LiveCodeWorkbench
        initialCode={source.code}
        locale={locale}
        name={hook.name}
        sourceUrl={source.sourceUrl}
      />
    </section>
  );
}
