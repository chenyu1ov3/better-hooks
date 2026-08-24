import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

const reviewScreenshotDirectory = resolve(tmpdir(), 'better-hooks-review-screenshots');

function reviewScreenshot(name: string) {
  return resolve(reviewScreenshotDirectory, name);
}

const viewports = [
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1280, height: 800 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
] as const;

const representativeViewports = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
] as const;

const keyPageRoutes = [
  { name: 'Hooks explorer', path: 'hooks' },
  { name: 'Playground', path: 'playground' },
  { name: 'Hook reference', path: 'hooks/use-debounce' },
] as const;

const defaultExampleText = {
  'use-toggle': 'Show details',
  'use-boolean': 'Hidden',
  'use-controllable-state': '0',
  'use-previous': '0 to 0',
  'use-latest': 'Report later',
  'use-debounce': 'Search',
  'use-throttle': 'Value',
  'use-debounce-fn': 'Save now',
  'use-throttle-fn': 'Move the pointer here.',
  'use-document-visibility': 'visible',
  'use-timeout': 'Saved successfully',
  'use-interval': /Pause at \d+/,
  'use-async': 'Ready',
  'use-event-listener': /\d+px/,
  'use-click-outside': 'Account settings',
  'use-hover': /Hovered|Move here/,
  'use-key-press': null,
  'use-lock-fn': 'Save',
  'use-memoized-fn': 'Greet',
  'use-media-query': /(?:Compact|Full) navigation/,
  'use-window-size': /\d+ x \d+/,
  'use-online': /Online|Offline/,
  'use-input': 'Ada',
  'use-local-storage': 'System',
  'use-session-storage': 'Discard',
  'use-is-mounted': 'idle',
  'use-isomorphic-layout-effect': /Measured width: \d+px/,
  'use-reset-state': 'Reset',
  'use-safe-state': /Count: 0/,
  'use-storage': 'Visits:',
  'use-unmounted-ref': 'Waiting',
} as const;

function appRoute(path = '') {
  const suffixIndex = path.search(/[?#]/);
  const pathname = suffixIndex === -1 ? path : path.slice(0, suffixIndex);
  const suffix = suffixIndex === -1 ? '' : path.slice(suffixIndex);
  const normalized = pathname.replace(/^\/+|\/+$/g, '');
  return `${normalized ? `./${normalized}/` : './'}${suffix}`;
}

async function openPage(page: Page, path = '') {
  const response = await page.goto(appRoute(path), { waitUntil: 'networkidle' });
  expect(response?.ok(), `Expected ${path || 'home'} to return a successful response`).toBe(true);
  await expect(page.locator('main')).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}

async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => {
    const root = document.documentElement;
    const body = document.body;
    const viewportWidth = window.innerWidth;
    const overflowers = Array.from(body.querySelectorAll<HTMLElement>('*'))
      .map((element) => {
        const bounds = element.getBoundingClientRect();
        return {
          element: `${element.tagName.toLocaleLowerCase()}${element.id ? `#${element.id}` : ''}${
            element.classList.length ? `.${Array.from(element.classList).join('.')}` : ''
          }`,
          left: Math.round(bounds.left),
          right: Math.round(bounds.right),
          width: Math.round(bounds.width),
        };
      })
      .filter(({ left, right, width }) => width > 0 && (left < -1 || right > viewportWidth + 1))
      .slice(0, 8);

    return {
      clientWidth: root.clientWidth,
      scrollWidth: Math.max(root.scrollWidth, body.scrollWidth),
      viewportWidth,
      overflowers,
    };
  });

  expect(
    dimensions.scrollWidth,
    `Horizontal overflow at ${dimensions.viewportWidth}px: ${JSON.stringify(dimensions.overflowers)}`,
  ).toBeLessThanOrEqual(dimensions.clientWidth + 1);
}

async function expectWithinViewport(page: Page) {
  const dimensions = await page.evaluate(() => ({
    bodyHeight: document.body.scrollHeight,
    rootHeight: document.documentElement.scrollHeight,
    viewportHeight: window.innerHeight,
  }));

  expect(
    Math.max(dimensions.bodyHeight, dimensions.rootHeight),
    `Homepage exceeds the ${dimensions.viewportHeight}px viewport: ${JSON.stringify(dimensions)}`,
  ).toBeLessThanOrEqual(dimensions.viewportHeight + 1);
}

async function expectWcagAa(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa'])
    .analyze();
  const summary = results.violations
    .map(
      (violation) =>
        `${violation.id} (${violation.impact ?? 'unknown'}): ${violation.help}\n${violation.nodes
          .map((node) => `  ${node.target.join(' ')}`)
          .join('\n')}`,
    )
    .join('\n\n');

  expect(results.violations, summary || 'No WCAG A/AA violations').toEqual([]);
}

test.describe('responsive layout', () => {
  for (const viewport of viewports) {
    test(`home has no horizontal overflow at ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await openPage(page);
      await expect(page.getByRole('heading', { level: 1, name: 'Better Hooks' })).toBeVisible();
      await expectNoHorizontalOverflow(page);
      await expectWithinViewport(page);
      if (viewport.width === 1440) {
        await page.screenshot({
          path: reviewScreenshot('home-en-1440x900.png'),
          animations: 'disabled',
        });
      }
    });
  }

  for (const route of keyPageRoutes) {
    for (const viewport of representativeViewports) {
      test(`${route.name} has no horizontal overflow at the ${viewport.name} viewport`, async ({
        page,
      }) => {
        await page.setViewportSize(viewport);
        await openPage(page, route.path);
        await expectNoHorizontalOverflow(page);
      });
    }
  }
});

test.describe('brand structure', () => {
  test('Hero title stays typographic and the header mark uses path-only geometry', async ({
    page,
  }) => {
    await openPage(page);

    const heroHeading = page.locator('.hero h1');
    await expect(heroHeading).toHaveText('Better Hooks');
    await expect(heroHeading.locator('svg')).toHaveCount(0);

    const mark = page.locator('.site-header .brand > svg.brand__mark');
    await expect(mark).toHaveCount(1);
    await expect(mark.locator('path')).toHaveCount(2);
    await expect(mark.locator('circle, rect')).toHaveCount(0);
  });

  test('Homepage uses the Hook animation without the legacy logo, footer, or commit loop', async ({
    page,
  }) => {
    await openPage(page);
    await expect(page.getByTestId('hook-lifecycle-visual')).toBeVisible();
    await expect(page.locator('.hero__visual svg, .hero__visual .hero__mark')).toHaveCount(0);
    await expect(page.locator('.site-footer')).toHaveCount(0);
    await expect(page.locator('.commit-loop')).toHaveCount(0);
  });
});

test.describe('core interactions', () => {
  test('global search opens with Ctrl+K and Cmd+K and navigates to a result', async ({ page }) => {
    await openPage(page);
    const dialog = page.locator('dialog.search-dialog');

    for (const shortcut of ['Control+K', 'Meta+K']) {
      await page.keyboard.press(shortcut);
      await expect(dialog).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(dialog).toBeHidden();
    }

    await page.keyboard.press('Control+K');
    const searchbox = dialog.getByRole('combobox', { name: 'Search documentation' });
    await expect(searchbox).toHaveAttribute('aria-expanded', 'true');
    await searchbox.fill('useDebounce');
    const result = dialog.getByRole('option', { name: /useDebounce/ }).first();
    await expect(result).toBeVisible();
    await expect(searchbox).toHaveAttribute('aria-activedescendant', 'global-docs-search-option-0');
    await result.click();
    await expect(page).toHaveURL(/\/hooks\/use-debounce\/$/);
    await expect(page.getByRole('heading', { level: 1, name: 'useDebounce' })).toBeVisible();
  });

  test('theme choice applies immediately and survives reload', async ({ page }) => {
    await openPage(page);
    await page.locator('.control-menu > summary').click();
    await page.getByRole('radio', { name: 'Dark' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect
      .poll(() =>
        page.evaluate(() => {
          const value = localStorage.getItem('better-hooks:prefs:v1');
          return value ? (JSON.parse(value) as { theme?: string }).theme : undefined;
        }),
      )
      .toBe('dark');

    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.locator('.control-menu > summary').click();
    const dark = page.getByRole('radio', { name: 'Dark' });
    const system = page.getByRole('radio', { name: 'System' });
    await expect(dark).toHaveAttribute('aria-checked', 'true');
    await dark.focus();
    await page.keyboard.press('Home');
    await expect(system).toHaveAttribute('aria-checked', 'true');
    await expect(system).toBeFocused();
    await page.keyboard.press('ArrowLeft');
    await expect(dark).toHaveAttribute('aria-checked', 'true');
    await expect(dark).toBeFocused();
  });

  test('mobile navigation opens, closes, and follows internal links', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openPage(page);
    const menuButton = page.getByRole('button', { name: 'Open menu' });
    const dialog = page.locator('dialog.mobile-menu');

    await expect(menuButton).toBeVisible();
    await menuButton.click();
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Close menu' }).click();
    await expect(dialog).toBeHidden();

    await menuButton.click();
    await dialog.getByRole('link', { name: 'Hooks', exact: true }).click();
    await expect(page).toHaveURL(/\/hooks\/$/);
    await expect(dialog).toBeHidden();
  });

  test('Hooks explorer filters results and restores URL state', async ({ page }) => {
    await openPage(page, 'hooks');
    const explorer = page.locator('.product-page .hook-explorer');
    const results = explorer.locator('.hook-result');

    await explorer.getByRole('button', { name: 'Async', exact: true }).click();
    await expect.poll(() => new URL(page.url()).searchParams.get('category')).toBe('async');
    expect(await results.count()).toBeGreaterThan(0);
    for (const label of await results
      .locator('.hook-result__topline span:first-child')
      .allTextContents()) {
      expect(label).toBe('Async');
    }

    await explorer.getByRole('searchbox').fill('useAsync');
    await expect(results).toHaveCount(1);
    await expect(
      results.getByRole('link', { name: 'useAsync', exact: true }).first(),
    ).toBeVisible();
    await expect.poll(() => new URL(page.url()).searchParams.get('q')).toBe('useAsync');

    await page.reload({ waitUntil: 'networkidle' });
    await expect(explorer.getByRole('searchbox')).toHaveValue('useAsync');
    await expect(results).toHaveCount(1);
  });

  test('Playground selector reads and updates the hook query parameter', async ({ page }) => {
    await openPage(page, 'playground?hook=use-throttle');
    const playground = page.locator('.playground-workbench');
    const selector = playground.getByRole('combobox', { name: 'Example' });

    await expect(selector).toHaveValue('use-throttle');
    await expect(playground.locator('.live-code-panel-heading')).toHaveText('useThrottle preview');

    await selector.selectOption('use-async');
    await expect.poll(() => new URL(page.url()).searchParams.get('hook')).toBe('use-async');
    await expect(playground.locator('.live-code-panel-heading')).toHaveText('useAsync preview');
  });

  test('Playground loads Hook modules only when selected', async ({ page }) => {
    const requestedHookChunks = new Set<string>();
    page.on('request', (request) => {
      const filename = new URL(request.url()).pathname.split('/').at(-1);
      if (filename?.startsWith('better-hooks-')) {
        requestedHookChunks.add(filename.replace(/\.[^.]+\.js$/, ''));
      }
    });

    await openPage(page, 'playground');
    const playground = page.locator('.playground-workbench');
    const preview = playground.locator('.live-code-preview__canvas');
    await expect(preview.getByText('Search', { exact: true })).toBeVisible();
    expect([...requestedHookChunks]).toEqual(['better-hooks-use-debounce']);

    await playground.getByRole('combobox', { name: 'Example' }).selectOption('use-async');
    await expect(preview.getByText('Ready', { exact: true })).toBeVisible();
    expect([...requestedHookChunks]).toEqual([
      'better-hooks-use-debounce',
      'better-hooks-use-async',
    ]);
  });

  test('Playground reports a Hook chunk failure without discarding the editor', async ({
    page,
  }) => {
    await openPage(page, 'playground');
    const playground = page.locator('.playground-workbench');
    const selector = playground.getByRole('combobox', { name: 'Example' });
    await expect(playground.locator('.live-code-preview__canvas')).toContainText('Search');

    await page.route('**/better-hooks-use-async.*.js', (route) => route.abort());
    await selector.selectOption('use-async');
    await expect(playground.getByRole('alert')).toContainText(
      'Unable to load module "better-hooks/use-async"',
    );
    await expect(
      playground.getByRole('textbox', { name: 'Editable TSX', exact: true }),
    ).toContainText("from 'better-hooks/use-async'");

    await page.unroute('**/better-hooks-use-async.*.js');
    await selector.selectOption('use-debounce');
    await selector.selectOption('use-async');
    await expect(playground.locator('.live-code-preview__canvas')).toContainText('Ready');
    await expect(playground.getByRole('alert')).toHaveCount(0);
  });

  test('Hook example edits its preview, reports errors, copies, and resets', async ({ page }) => {
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await openPage(page, 'hooks/use-debounce');
    const workbench = page.locator('.live-example .live-code-workbench');
    const preview = workbench.locator('.live-code-preview__canvas');

    await expect(preview.getByText('Search', { exact: true })).toBeVisible();
    await workbench.getByRole('button', { name: 'Edit code' }).click();

    const editor = workbench.getByRole('textbox', { name: 'Editable TSX', exact: true });
    const reset = workbench.getByRole('button', { name: 'Reset example' });
    await expect(editor).toHaveAttribute('contenteditable', /^(?:true|plaintext-only)$/);
    await expect(editor).toContainText("from 'better-hooks/use-debounce'");

    await editor.fill(`export function SearchPreview() {
  return <output>Edited preview</output>;
}`);
    await editor.press('ArrowRight');
    await expect(preview.getByText('Edited preview', { exact: true })).toBeVisible();
    await expect(reset).toBeEnabled();

    await workbench.getByRole('button', { name: 'Copy', exact: true }).click();
    await expect(workbench.getByRole('button', { name: 'Copied', exact: true })).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toContain('Edited preview');

    await editor.fill(`import { nope } from 'left-pad';

export function BrokenExample() {
  return <p>Broken</p>;
}`);
    await editor.press('ArrowRight');
    await expect(workbench.getByRole('alert')).toContainText('Unsupported import "left-pad"');

    await reset.click();
    await expect(workbench.getByRole('alert')).toHaveCount(0);
    await expect(editor).toContainText("from 'better-hooks/use-debounce'");
    await expect(preview.getByText('Search', { exact: true })).toBeVisible();
    await expect(reset).toBeDisabled();
  });

  test('All 31 default Playground examples compile and render', async ({ page }) => {
    await openPage(page, 'playground');
    const playground = page.locator('.playground-workbench');
    const selector = playground.getByRole('combobox', { name: 'Example' });
    const options = await selector.locator('option').evaluateAll((elements) =>
      elements.map((element) => ({
        label: element.textContent?.trim() ?? '',
        value: (element as HTMLOptionElement).value,
      })),
    );

    expect(options).toHaveLength(31);
    expect(options.map(({ value }) => value).sort()).toEqual(
      Object.keys(defaultExampleText).sort(),
    );

    for (const { label, value } of options) {
      await selector.selectOption(value);
      await expect(playground.locator('.live-code-panel-heading')).toHaveText(`${label} preview`);
      await expect(
        playground.getByRole('textbox', { name: 'Editable TSX', exact: true }),
      ).toContainText(`better-hooks/${value}`);
      const expectedText = defaultExampleText[value as keyof typeof defaultExampleText];
      if (expectedText !== null) {
        await expect(playground.locator('.live-code-preview__canvas')).toContainText(expectedText);
      }
      await expect(playground.getByRole('alert')).toHaveCount(0);
    }
  });

  test('language switch preserves the documentation route and updates html lang', async ({
    page,
  }) => {
    await openPage(page, 'docs/getting-started');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');

    await page.locator('.language-link').click();
    await expect(page).toHaveURL(/\/zh\/docs\/getting-started\/$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');

    await page.locator('.language-link').click();
    await expect(page).toHaveURL(/\/docs\/getting-started\/$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });

  test('language switch preserves Hook Explorer filters and the page hash', async ({ page }) => {
    await openPage(page, 'hooks');
    const explorer = page.locator('.product-page .hook-explorer');

    await explorer.getByRole('button', { name: 'Async', exact: true }).click();
    await explorer.getByRole('searchbox').fill('useAsync');
    await expect.poll(() => new URL(page.url()).searchParams.get('category')).toBe('async');
    await expect.poll(() => new URL(page.url()).searchParams.get('q')).toBe('useAsync');
    await page.evaluate(() => {
      window.location.hash = 'main-content';
    });
    await expect.poll(() => new URL(page.url()).hash).toBe('#main-content');

    await page.locator('.language-link').click();
    await expect.poll(() => new URL(page.url()).pathname).toMatch(/\/zh\/hooks\/$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
    await expect.poll(() => new URL(page.url()).searchParams.get('category')).toBe('async');
    await expect.poll(() => new URL(page.url()).searchParams.get('q')).toBe('useAsync');
    await expect.poll(() => new URL(page.url()).hash).toBe('#main-content');
    await expect(explorer.getByRole('searchbox')).toHaveValue('useAsync');

    await page.locator('.language-link').click();
    await expect.poll(() => new URL(page.url()).pathname).toMatch(/\/hooks\/$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect.poll(() => new URL(page.url()).searchParams.get('category')).toBe('async');
    await expect.poll(() => new URL(page.url()).searchParams.get('q')).toBe('useAsync');
    await expect.poll(() => new URL(page.url()).hash).toBe('#main-content');
  });
});

test.describe('documentation navigation', () => {
  test('Examples navigation, routes, and sitemap entries are removed', async ({
    page,
    request,
  }) => {
    await openPage(page);
    await expect(
      page.locator('.site-header').getByRole('link', { name: 'Examples', exact: true }),
    ).toHaveCount(0);

    for (const path of ['examples', 'zh/examples']) {
      const response = await request.get(appRoute(path));
      expect(response.status(), `Expected /${path}/ to return 404`).toBe(404);
    }

    const sitemapResponse = await request.get('./sitemap.xml');
    expect(sitemapResponse.ok()).toBe(true);
    expect(await sitemapResponse.text()).not.toContain('/examples/');
  });

  test('aggregate storage entry has bilingual docs, a live example, and typed code labels', async ({
    page,
  }) => {
    await openPage(page, 'hooks/use-storage');
    await expect(page.getByRole('heading', { level: 1, name: 'use-storage' })).toBeVisible();
    await expect(page.locator('.live-example .live-code-preview__canvas')).toBeVisible();
    await expect(
      page.locator('.prose-doc .code-frame__bar').first().getByText('ts', { exact: true }),
    ).toBeVisible();

    await page.locator('.language-link').click();
    await expect(page).toHaveURL(/\/zh\/hooks\/use-storage\/$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
    await expect(page.getByRole('heading', { level: 1, name: 'use-storage' })).toBeVisible();
  });

  test('desktop documentation shows a linked table of contents', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, 'docs/getting-started');
    const tableOfContents = page.locator('aside.toc');
    const firstLink = tableOfContents.locator('nav a').first();

    await expect(tableOfContents).toBeVisible();
    await expect(page.locator('details.toc-mobile')).toBeHidden();
    await expect(firstLink).toBeVisible();
    const target = await firstLink.getAttribute('href');
    expect(target).toMatch(/^#/);
    await firstLink.click();
    await expect(page).toHaveURL(new RegExp(`${target}$`));
    await expect(page.locator(target!)).toBeVisible();
  });

  test('mobile documentation exposes the TOC and docs drawer', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openPage(page, 'docs/getting-started');
    const mobileToc = page.locator('details.toc-mobile');

    await expect(page.locator('aside.toc')).toBeHidden();
    await expect(mobileToc).toBeVisible();
    await mobileToc.locator('summary').click();
    await expect(mobileToc.locator('nav a').first()).toBeVisible();

    const docsMenu = page.locator('.mobile-docs-nav');
    await docsMenu.getByRole('button', { name: 'Docs', exact: true }).click();
    const dialog = docsMenu.locator('dialog');
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByRole('link', { name: 'Getting started', exact: true }),
    ).toHaveAttribute('aria-current', 'page');
    await dialog.getByRole('button', { name: 'Close menu' }).click();
    await expect(dialog).toBeHidden();
  });
});

test.describe('WCAG A/AA', () => {
  const routes = [
    { path: '', name: 'home', viewport: { width: 1280, height: 800 } },
    { path: 'hooks', name: 'Hooks explorer', viewport: { width: 1280, height: 800 } },
    {
      path: 'hooks/use-debounce',
      name: 'Hook reference',
      viewport: { width: 1280, height: 800 },
      screenshot: 'hook-use-debounce-en-1280x800.png',
    },
    { path: 'playground', name: 'Playground', viewport: { width: 1280, height: 800 } },
    { path: 'changelog', name: 'changelog', viewport: { width: 1280, height: 800 } },
    {
      path: 'docs/getting-started',
      name: 'documentation',
      viewport: { width: 1280, height: 800 },
    },
    {
      path: 'zh',
      name: 'Chinese home',
      viewport: { width: 390, height: 844 },
      screenshot: 'home-zh-390x844.png',
    },
  ] as const;

  for (const route of routes) {
    test(`${route.name} has no automated WCAG A/AA violations`, async ({ page }) => {
      await page.setViewportSize(route.viewport);
      await openPage(page, route.path);
      await expectWcagAa(page);
      if ('screenshot' in route) {
        await page.screenshot({
          path: reviewScreenshot(route.screenshot),
          animations: 'disabled',
        });
      }
    });
  }

  test('mobile documentation has no automated WCAG A/AA violations', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openPage(page, 'docs/getting-started');
    await expectWcagAa(page);
  });
});

test('reduced motion removes long-running CSS motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openPage(page);
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(
    true,
  );

  const longRunningAnimations = await page.evaluate(() =>
    document.getAnimations().flatMap((animation) => {
      const timing = animation.effect?.getComputedTiming();
      const duration =
        typeof timing?.duration === 'number' ? timing.duration : Number.POSITIVE_INFINITY;
      return animation.playState === 'running' && duration > 100
        ? [{ duration, playState: animation.playState }]
        : [];
    }),
  );

  expect(longRunningAnimations).toEqual([]);
  await expect(page.locator('.commit-loop')).toHaveCount(0);
});
