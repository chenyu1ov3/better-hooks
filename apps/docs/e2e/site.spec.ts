import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

const reviewScreenshotDirectory = resolve(tmpdir(), 'better-hooks-review-screenshots');

function reviewScreenshot(name: string) {
  return resolve(reviewScreenshotDirectory, name);
}

const viewports = [
  { width: 320, height: 568 },
  { width: 340, height: 640 },
  { width: 361, height: 640 },
  { width: 370, height: 640 },
  { width: 375, height: 667 },
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 667, height: 375 },
  { width: 768, height: 1024 },
  { width: 844, height: 390 },
  { width: 1024, height: 768 },
  { width: 1280, height: 800 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
] as const;

const desktopHomeViewports = [
  { width: 1024, height: 768 },
  { width: 1280, height: 800 },
  { width: 1440, height: 900 },
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
  'use-unmounted-ref': 'Waiting',
} as const;

function appRoute(path = '') {
  const suffixIndex = path.search(/[?#]/);
  const pathname = suffixIndex === -1 ? path : path.slice(0, suffixIndex);
  const suffix = suffixIndex === -1 ? '' : path.slice(suffixIndex);
  const normalized = pathname.replace(/^\/+|\/+$/g, '');
  return `${normalized ? `./${normalized}/` : './'}${suffix}`;
}

function hookNameForSlug(slug: string) {
  return slug.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

async function choosePlaygroundExample(page: Page, selector: Locator, name: string) {
  await selector.click();
  const option = page.getByRole('option', { name, exact: true });
  await expect(option).toBeVisible();
  await option.click();
  await expect(selector).toContainText(name);
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

async function expectHomeFitsViewport(page: Page) {
  const dimensions = await page.evaluate(() => {
    const root = document.documentElement;
    return {
      clientHeight: root.clientHeight,
      scrollHeight: root.scrollHeight,
      viewportHeight: window.innerHeight,
      viewportWidth: window.innerWidth,
    };
  });

  expect(
    dimensions.scrollHeight,
    `Home scrolls vertically: ${JSON.stringify(dimensions)}`,
  ).toBeLessThanOrEqual(dimensions.clientHeight + 1);
}

async function expectCompactProductSpacing(page: Page, path: 'hooks' | 'playground' | 'changelog') {
  const productPage = page.locator('main > .page-container');
  const intro = productPage.locator(':scope > header');
  const content =
    path === 'hooks'
      ? productPage.getByRole('searchbox').locator('..')
      : path === 'playground'
        ? productPage.locator('.playground-workbench')
        : productPage.locator(':scope > article');
  const [pageBounds, introBounds, contentBounds, paddingTop] = await Promise.all([
    productPage.boundingBox(),
    intro.boundingBox(),
    content.boundingBox(),
    productPage.evaluate((element) => Number.parseFloat(getComputedStyle(element).paddingTop)),
  ]);

  expect(pageBounds).not.toBeNull();
  expect(introBounds).not.toBeNull();
  expect(contentBounds).not.toBeNull();
  expect(paddingTop).toBeGreaterThan(0);
  expect(introBounds!.y - pageBounds!.y).toBeLessThanOrEqual(paddingTop + 1);
  expect(contentBounds!.y - (introBounds!.y + introBounds!.height)).toBeLessThanOrEqual(50);
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
    test(`home has no horizontal overflow at ${viewport.width}x${viewport.height}`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await openPage(page);
      await expect(page.getByRole('heading', { level: 1, name: 'Better Hooks' })).toBeVisible();
      await expectNoHorizontalOverflow(page);
      if (viewport.width === 1440) {
        await page.screenshot({
          path: reviewScreenshot('home-en-1440x900.png'),
          animations: 'disabled',
        });
      }
      if (viewport.width === 320) {
        await page.screenshot({
          path: reviewScreenshot('home-en-320x568.png'),
          animations: 'disabled',
        });
      }
    });
  }

  for (const viewport of desktopHomeViewports) {
    test(`desktop home fits without vertical scrolling at ${viewport.width}x${viewport.height}`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await openPage(page);

      const hero = page.getByRole('region', { name: 'Better Hooks' });
      await expect(hero).toBeVisible();
      await expect(hero.getByRole('heading', { level: 1, name: 'Better Hooks' })).toBeVisible();
      await expect(hero.getByRole('link', { name: 'Read the docs' })).toBeVisible();
      await expect(hero.getByRole('link', { name: 'View on GitHub' })).toBeVisible();
      await expect(page.getByTestId('hook-lifecycle-visual')).toBeVisible();
      await expectNoHorizontalOverflow(page);
      await expectHomeFitsViewport(page);
    });
  }

  test('mobile header controls retain 44px targets at the minimum width', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await openPage(page);
    const targets = [
      page.getByRole('button', { name: 'Search documentation' }),
      page.getByRole('link', { name: '中文' }),
      page.getByRole('button', { name: 'Theme' }),
      page.getByRole('button', { name: 'Open menu' }),
    ];

    for (const target of targets) {
      await expect(target).toBeVisible();
      const bounds = await target.boundingBox();
      expect(bounds).not.toBeNull();
      expect(bounds!.width).toBeGreaterThanOrEqual(44);
      expect(bounds!.height).toBeGreaterThanOrEqual(44);
    }
  });

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

  test('product pages keep compact intro and content spacing', async ({ page }) => {
    for (const viewport of [
      { width: 390, height: 844 },
      { width: 1440, height: 900 },
    ]) {
      await page.setViewportSize(viewport);
      for (const path of ['hooks', 'playground', 'changelog']) {
        await openPage(page, path);
        await expectCompactProductSpacing(page, path as 'hooks' | 'playground' | 'changelog');
      }
    }
  });
});

test.describe('brand structure', () => {
  test('Hero title stays typographic and the header mark uses path-only geometry', async ({
    page,
  }) => {
    await openPage(page);

    const heroHeading = page.getByRole('heading', { level: 1, name: 'Better Hooks' });
    await expect(heroHeading).toHaveText('Better Hooks');
    await expect(heroHeading.locator('svg')).toHaveCount(0);

    const mark = page
      .getByRole('banner')
      .getByRole('link', { name: 'Better Hooks home' })
      .locator('svg');
    await expect(mark).toHaveCount(1);
    await expect(mark.locator('path')).toHaveCount(2);
    await expect(mark.locator('circle, rect')).toHaveCount(0);
  });

  test('Homepage debounce runtime publishes only after changes settle', async ({ page }) => {
    await openPage(page);
    const runtime = page.getByTestId('hook-lifecycle-visual');
    const input = runtime.getByRole('textbox', { name: 'Try a value' });
    const published = runtime.getByLabel('Published value');

    await expect(runtime).toBeVisible();
    await expect(published).toHaveText('search hooks');
    await input.fill('effect cleanup');
    await expect(runtime.getByText('effect cleanup', { exact: true }).first()).toBeVisible();
    await expect(runtime.getByText('Waiting for changes to settle', { exact: true })).toBeVisible();
    await expect(published).toHaveText('search hooks');
    await expect(published).toHaveText('effect cleanup');
  });

  test('Homepage exposes install and real project links', async ({ context, page }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await openPage(page);

    const install = page.getByLabel('Install better-hooks');
    await expect(install.getByText('pnpm add better-hooks', { exact: true })).toBeVisible();
    const commandColors = await install
      .locator('[data-highlighted-command] span')
      .evaluateAll((tokens) =>
        Array.from(new Set(tokens.map((token) => getComputedStyle(token).color))).filter(
          (color) => color !== 'rgba(0, 0, 0, 0)',
        ),
      );
    expect(commandColors.length).toBeGreaterThan(1);
    await install.getByRole('button', { name: 'Copy install command' }).click();
    await expect(install.getByRole('button', { name: 'Install command copied' })).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe('pnpm add better-hooks');

    await expect(
      page.getByRole('banner').getByRole('link', { name: 'View on GitHub' }),
    ).toHaveAttribute('href', 'https://github.com/chenyu1ov3/better-hooks');
  });

  test('Homepage and footer keep version-specific technology labels out of product chrome', async ({
    page,
  }) => {
    await openPage(page);
    await expect(page.getByText('React 19', { exact: true })).toHaveCount(0);
    await expect(page.getByText('TypeScript', { exact: true })).toHaveCount(0);
    await expect(page.getByText('Preview', { exact: true })).toHaveCount(0);
    await expect(page.getByText('Star', { exact: true })).toHaveCount(0);
    await expect(page.getByText('Not yet published on npm', { exact: true })).toHaveCount(0);

    await openPage(page, 'hooks');
    const footer = page.getByRole('contentinfo');
    await expect(footer).not.toContainText('React 19');
    await expect(footer).not.toContainText('TypeScript');
    await expect(footer.getByRole('link', { name: /BETTER HOOKS/ })).toHaveAttribute(
      'href',
      /\/better-hooks\/$/,
    );
  });
});

test.describe('core interactions', () => {
  test('browser extension head scripts do not shift app hydration', async ({ page }) => {
    const hydrationErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error' && /hydration|hydrated/i.test(message.text())) {
        hydrationErrors.push(message.text());
      }
    });
    await page.route('**/zh/', async (route) => {
      const response = await route.fetch();
      const body = (await response.text()).replace(
        '<head>',
        '<head><script data-extension-injected src="data:text/javascript,"></script>',
      );
      await route.fulfill({ response, body });
    });

    await openPage(page, 'zh');

    await expect(page.locator('head > [data-extension-injected]')).toHaveCount(1);
    await expect(page.locator('body > #better-hooks-theme-bootstrap')).toHaveCount(1);
    await expect(page.locator('body > #better-hooks-site-json-ld')).toHaveAttribute(
      'type',
      'application/ld+json',
    );
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    expect(
      await page.locator('#better-hooks-site-json-ld').evaluate((script) => {
        const value = JSON.parse(script.textContent ?? '') as { '@context'?: string };
        return value['@context'];
      }),
    ).toBe('https://schema.org');
    expect(hydrationErrors).toEqual([]);
  });

  test('global search opens with Ctrl+K and Cmd+K and navigates to a result', async ({ page }) => {
    await openPage(page);
    const dialog = page.getByRole('dialog', { name: 'Search documentation' });

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
    const themeTrigger = page.getByRole('button', { name: 'Theme' });
    const header = page.getByRole('banner');
    const headerBorders = await Promise.all(
      [
        header.getByRole('button', { name: 'Search documentation' }),
        header.getByRole('link', { name: 'View on GitHub' }),
      ].map((control) => control.evaluate((element) => getComputedStyle(element).borderColor)),
    );
    const lightBorder = await page.evaluate(() => {
      const probe = document.createElement('span');
      probe.style.color = 'var(--border)';
      document.body.append(probe);
      const color = getComputedStyle(probe).color;
      probe.remove();
      return color;
    });
    expect(headerBorders).toEqual([lightBorder, lightBorder]);

    await themeTrigger.click();
    const themeMenu = page.locator('[data-slot="dropdown-menu-content"]');
    await expect(themeMenu).toBeVisible();
    await expect
      .poll(() => themeMenu.evaluate((element) => getComputedStyle(element).borderColor))
      .toBe(lightBorder);
    await page.getByRole('menuitemradio', { name: 'Dark' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#09090b');
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
    await themeTrigger.click();
    const darkBorder = await page.evaluate(() => {
      const probe = document.createElement('span');
      probe.style.color = 'var(--border)';
      document.body.append(probe);
      const color = getComputedStyle(probe).color;
      probe.remove();
      return color;
    });
    await expect
      .poll(() => themeMenu.evaluate((element) => getComputedStyle(element).borderColor))
      .toBe(darkBorder);
    const dark = page.getByRole('menuitemradio', { name: 'Dark' });
    const system = page.getByRole('menuitemradio', { name: 'System' });
    await expect(dark).toHaveAttribute('aria-checked', 'true');
    await dark.focus();
    await page.keyboard.press('Home');
    await expect(system).toBeFocused();
    await expect(dark).toHaveAttribute('aria-checked', 'true');
    await page.keyboard.press('End');
    await expect(dark).toHaveAttribute('aria-checked', 'true');
    await expect(dark).toBeFocused();

    await page.keyboard.press('Escape');
    await themeTrigger.click();
    await page.getByRole('menuitemradio', { name: 'Light' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#ffffff');
  });

  test('mobile navigation opens, closes, and follows internal links', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await openPage(page);
    const menuButton = page.getByRole('button', { name: 'Open menu' });
    const dialog = page.getByRole('dialog', { name: 'Open menu' });

    await expect(menuButton).toBeVisible();
    await menuButton.click();
    await expect(dialog).toBeVisible();
    const headingBounds = await dialog.getByRole('heading', { name: 'Open menu' }).boundingBox();
    const closeBounds = await dialog.getByRole('button', { name: 'Close menu' }).boundingBox();
    expect(headingBounds).not.toBeNull();
    expect(closeBounds).not.toBeNull();
    expect(closeBounds!.width).toBeCloseTo(44, 2);
    expect(closeBounds!.height).toBeCloseTo(44, 2);
    expect(
      Math.abs(
        headingBounds!.y + headingBounds!.height / 2 - (closeBounds!.y + closeBounds!.height / 2),
      ),
    ).toBeLessThanOrEqual(1);
    expect(headingBounds!.x).toBeLessThan(closeBounds!.x);
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();

    await menuButton.click();
    await dialog.getByRole('link', { name: 'Hooks', exact: true }).click();
    await expect(page).toHaveURL(/\/hooks\/$/);
    await expect(dialog).toBeHidden();

    await menuButton.click();
    await expect(dialog.getByRole('link', { name: 'Hooks', exact: true })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  test('Hooks explorer filters results and restores URL state', async ({ page }) => {
    await openPage(page, 'hooks');
    const explorer = page.locator('main');
    const results = explorer.locator('article');

    await explorer.getByRole('button', { name: 'Async', exact: true }).click();
    await expect.poll(() => new URL(page.url()).searchParams.get('category')).toBe('async');
    await expect(results).toHaveCount(8);
    await expect(results.getByText('React 19', { exact: true })).toHaveCount(0);
    await expect(results.getByText('Async', { exact: true })).toHaveCount(0);
    await expect(
      results.getByRole('link', { name: 'useAsync', exact: true }).first(),
    ).toBeVisible();
    const hookName = results.getByRole('link', { name: 'useAsync', exact: true }).first();
    await expect
      .poll(() => hookName.evaluate((link) => Number.parseInt(getComputedStyle(link).fontWeight)))
      .toBeGreaterThanOrEqual(600);
    await hookName.hover();
    await expect
      .poll(() => hookName.evaluate((link) => getComputedStyle(link).textDecorationLine))
      .toContain('underline');
    await expect(results.getByRole('link', { name: 'useToggle', exact: true })).toHaveCount(0);

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
    await expect(page.getByText(/package built from this workspace/i)).toHaveCount(0);
    const playground = page.locator('.playground-workbench');
    const selector = playground.getByRole('combobox', { name: 'Example' });

    await expect(selector).toContainText('useThrottle');
    await expect(playground.locator('.live-code-preview .live-code-panel-heading')).toHaveText(
      'useThrottle preview',
    );

    await choosePlaygroundExample(page, selector, 'useAsync');
    await expect.poll(() => new URL(page.url()).searchParams.get('hook')).toBe('use-async');
    await expect(playground.locator('.live-code-preview .live-code-panel-heading')).toHaveText(
      'useAsync preview',
    );
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
    expect([...requestedHookChunks]).toEqual([]);

    await choosePlaygroundExample(
      page,
      playground.getByRole('combobox', { name: 'Example' }),
      'useAsync',
    );
    await expect(preview.getByText('Ready', { exact: true })).toBeVisible();
    expect([...requestedHookChunks]).toEqual(['better-hooks-use-async']);
  });

  test('Playground reports a Hook chunk failure without discarding the editor', async ({
    page,
  }) => {
    await openPage(page, 'playground');
    const playground = page.locator('.playground-workbench');
    const selector = playground.getByRole('combobox', { name: 'Example' });
    await expect(playground.locator('.live-code-preview__canvas')).toContainText('Search');

    await page.route('**/better-hooks-use-async.*.js', (route) => route.abort());
    await choosePlaygroundExample(page, selector, 'useAsync');
    await expect(playground.getByRole('alert')).toContainText(
      'Unable to load module "better-hooks/use-async"',
    );
    await expect(
      playground.getByRole('textbox', { name: 'Editable TSX', exact: true }),
    ).toContainText("from 'better-hooks/use-async'");

    await page.unroute('**/better-hooks-use-async.*.js');
    await choosePlaygroundExample(page, selector, 'useDebounce');
    await choosePlaygroundExample(page, selector, 'useAsync');
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

  test('All 30 default Playground examples compile and render', async ({ page }) => {
    await openPage(page, 'playground');
    const playground = page.locator('.playground-workbench');
    const selector = playground.getByRole('combobox', { name: 'Example' });
    const examples = Object.entries(defaultExampleText).map(([value, expectedText]) => ({
      expectedText,
      label: hookNameForSlug(value),
      value,
    }));

    await selector.click();
    const optionLabels = (await page.getByRole('option').allTextContents()).map((label) =>
      label.trim(),
    );
    expect(optionLabels).toHaveLength(30);
    expect(optionLabels.sort()).toEqual(examples.map(({ label }) => label).sort());
    await page.keyboard.press('Escape');

    for (const { expectedText, label, value } of examples) {
      await choosePlaygroundExample(page, selector, label);
      await expect(playground.locator('.live-code-preview .live-code-panel-heading')).toHaveText(
        `${label} preview`,
      );
      await expect(
        playground.getByRole('textbox', { name: 'Editable TSX', exact: true }),
      ).toContainText(`better-hooks/${value}`);
      if (expectedText !== null) {
        await expect(playground.locator('.live-code-preview__canvas')).toContainText(expectedText);
      }
      await expect(playground.getByRole('alert')).toHaveCount(0);
    }
  });

  test('Playground desktop panes keep a 55/45 split and equal working height', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, 'playground');
    const workbench = page.locator('.playground-workbench .live-code-workbench');
    const source = workbench.locator('.live-code-source');
    const preview = workbench.locator('.live-code-preview');
    const [workbenchBounds, sourceBounds, previewBounds] = await Promise.all([
      workbench.boundingBox(),
      source.boundingBox(),
      preview.boundingBox(),
    ]);

    expect(workbenchBounds).not.toBeNull();
    expect(sourceBounds).not.toBeNull();
    expect(previewBounds).not.toBeNull();
    expect(workbenchBounds!.height).toBeCloseTo(560, 0);
    expect(Math.abs(sourceBounds!.height - previewBounds!.height)).toBeLessThanOrEqual(1);
    expect(sourceBounds!.width / (sourceBounds!.width + previewBounds!.width)).toBeGreaterThan(
      0.53,
    );
    expect(sourceBounds!.width / (sourceBounds!.width + previewBounds!.width)).toBeLessThan(0.57);
  });

  test('Playground mobile tabs preserve each Hook draft and expose editor focus', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openPage(page, 'playground');
    const playground = page.locator('.playground-workbench');
    const codeTab = playground.getByRole('tab', { name: 'Code', exact: true });
    const previewTab = playground.getByRole('tab', { name: 'Preview', exact: true });
    const editor = playground.getByRole('textbox', { name: 'Editable TSX', exact: true });

    await expect(codeTab).toHaveAttribute('data-state', 'active');
    await expect(editor).toBeVisible();
    await editor.fill(`export function SearchPreview() {
  return <output>Mobile draft</output>;
}`);
    await editor.press('ArrowRight');
    await editor.focus();
    await expect
      .poll(() => editor.evaluate((element) => getComputedStyle(element).outlineWidth))
      .not.toBe('0px');

    await previewTab.click();
    await expect(previewTab).toHaveAttribute('data-state', 'active');
    await expect(
      playground.locator('.live-code-preview__canvas').getByText('Mobile draft', { exact: true }),
    ).toBeVisible();
    await codeTab.click();
    await expect(editor).toContainText('Mobile draft');

    const selector = playground.getByRole('combobox', { name: 'Example' });
    await choosePlaygroundExample(page, selector, 'useAsync');
    await choosePlaygroundExample(page, selector, 'useDebounce');
    await expect(editor).toContainText('Mobile draft');
  });

  test('Playground controls remain usable without overflow at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await openPage(page, 'playground');
    await expectNoHorizontalOverflow(page);
    const playground = page.locator('.playground-workbench');
    const targets = [
      playground.getByRole('combobox', { name: 'Example' }),
      playground.getByRole('button', { name: 'Copy', exact: true }),
      playground.getByRole('button', { name: 'Reset example' }),
      playground.getByRole('tab', { name: 'Code', exact: true }),
      playground.getByRole('tab', { name: 'Preview', exact: true }),
    ];

    for (const target of targets) {
      const bounds = await target.boundingBox();
      expect(bounds).not.toBeNull();
      expect(bounds!.width).toBeGreaterThanOrEqual(44);
      expect(bounds!.height).toBeGreaterThanOrEqual(44);
    }
  });

  test('Playground example selector keeps a visible border in dark mode', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await openPage(page, 'playground');
    const selector = page
      .locator('.playground-workbench')
      .getByRole('combobox', { name: 'Example' });
    const colors = await selector.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        background: style.backgroundColor,
        border: style.borderColor,
        borderWidth: style.borderWidth,
      };
    });

    expect(colors.borderWidth).not.toBe('0px');
    expect(colors.border).not.toBe(colors.background);
    await selector.focus();
    await expect(selector).toBeFocused();
  });

  test('language switch preserves the documentation route and updates html lang', async ({
    page,
  }) => {
    await openPage(page, 'docs/getting-started');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');

    await page.getByRole('link', { name: '中文', exact: true }).click();
    await expect(page).toHaveURL(/\/zh\/docs\/getting-started\/$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');

    await page.getByRole('link', { name: 'EN', exact: true }).click();
    await expect(page).toHaveURL(/\/docs\/getting-started\/$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });

  test('language switch preserves Hook Explorer filters and the page hash', async ({ page }) => {
    await openPage(page, 'hooks');
    const explorer = page.locator('main');

    await explorer.getByRole('button', { name: 'Async', exact: true }).click();
    await explorer.getByRole('searchbox').fill('useAsync');
    await expect.poll(() => new URL(page.url()).searchParams.get('category')).toBe('async');
    await expect.poll(() => new URL(page.url()).searchParams.get('q')).toBe('useAsync');
    await page.evaluate(() => {
      window.location.hash = 'main-content';
    });
    await expect.poll(() => new URL(page.url()).hash).toBe('#main-content');

    await page.getByRole('link', { name: '中文', exact: true }).click();
    await expect.poll(() => new URL(page.url()).pathname).toMatch(/\/zh\/hooks\/$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
    await expect.poll(() => new URL(page.url()).searchParams.get('category')).toBe('async');
    await expect.poll(() => new URL(page.url()).searchParams.get('q')).toBe('useAsync');
    await expect.poll(() => new URL(page.url()).hash).toBe('#main-content');
    await expect(explorer.getByRole('searchbox')).toHaveValue('useAsync');

    await page.getByRole('link', { name: 'EN', exact: true }).click();
    await expect.poll(() => new URL(page.url()).pathname).toMatch(/\/hooks\/$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect.poll(() => new URL(page.url()).searchParams.get('category')).toBe('async');
    await expect.poll(() => new URL(page.url()).searchParams.get('q')).toBe('useAsync');
    await expect.poll(() => new URL(page.url()).hash).toBe('#main-content');
  });
});

test.describe('documentation navigation', () => {
  test('Removed routes and sitemap entries stay unavailable', async ({ page, request }) => {
    await openPage(page);
    await expect(
      page.getByRole('banner').getByRole('link', { name: 'Examples', exact: true }),
    ).toHaveCount(0);

    for (const path of ['examples', 'zh/examples', 'hooks/use-storage', 'zh/hooks/use-storage']) {
      const response = await request.get(appRoute(path));
      expect(response.status(), `Expected /${path}/ to return 404`).toBe(404);
    }

    const sitemapResponse = await request.get('./sitemap.xml');
    expect(sitemapResponse.ok()).toBe(true);
    expect(await sitemapResponse.text()).not.toContain('/examples/');
  });

  test('Architecture decision records are archived outside the public docs', async ({
    page,
    request,
  }) => {
    await openPage(page, 'docs');
    const docsNavigation = page.getByRole('navigation', { name: 'Docs' }).filter({ visible: true });
    const navigationText = (await docsNavigation.allTextContents()).join(' ');
    expect(navigationText).not.toContain('Architecture decisions');
    expect(navigationText).not.toContain('架构决策记录');

    await page.keyboard.press('Control+K');
    const searchDialog = page.getByRole('dialog', { name: 'Search documentation' });
    const searchbox = searchDialog.getByRole('combobox', { name: 'Search documentation' });
    await searchbox.fill('ADR 001');
    await expect(searchDialog.getByText('No results found.', { exact: true })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(searchDialog).toBeHidden();

    for (const path of [
      'docs/architecture/adr/001-boundaries',
      'zh/docs/architecture/adr/001-boundaries',
    ]) {
      const response = await request.get(appRoute(path));
      expect(response.status(), `Expected /${path}/ to return 404`).toBe(404);
    }

    const sitemapResponse = await request.get('./sitemap.xml');
    expect(sitemapResponse.ok()).toBe(true);
    const sitemap = await sitemapResponse.text();
    expect(sitemap).not.toContain('/docs/architecture/adr/');
    expect(sitemap).not.toContain('/zh/docs/architecture/adr/');

    await page.getByRole('link', { name: '中文', exact: true }).click();
    await expect(page).toHaveURL(/\/zh\/docs\/$/);
    await page.keyboard.press('Control+K');
    const chineseSearch = page.getByRole('dialog', { name: '搜索文档' });
    const chineseSearchbox = chineseSearch.getByRole('combobox', { name: '搜索文档' });
    await chineseSearchbox.fill('架构决策');
    await expect(chineseSearch.getByText('没有找到匹配内容。', { exact: true })).toBeVisible();
  });

  test('Code and terminal frames expose the right gutter and copy clean source', async ({
    context,
    page,
  }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await openPage(page, 'docs/installation');
    const terminal = page.locator('[data-code-variant="terminal"]').first();
    const terminalLine = terminal.locator('code > [data-line], code > .line').first();

    await expect(terminal).toHaveAttribute('data-language', 'sh');
    await expect
      .poll(() => terminalLine.evaluate((line) => getComputedStyle(line, '::before').content))
      .toContain('$ ');
    const terminalSyntaxColors = await terminal
      .locator('[style*="--shiki-light"]')
      .evaluateAll((tokens) =>
        Array.from(new Set(tokens.map((token) => getComputedStyle(token).color))).filter(
          (color) => color !== 'rgba(0, 0, 0, 0)',
        ),
      );
    expect(terminalSyntaxColors.length).toBeGreaterThan(1);
    await expect
      .poll(() =>
        terminal.evaluate((frame) => {
          const source = frame.querySelector('pre');
          return source ? source.scrollWidth <= source.clientWidth + 1 : false;
        }),
      )
      .toBe(true);
    await terminal.getByRole('button', { name: 'Copy code' }).click();
    await expect(terminal.getByRole('button', { name: 'Code copied' })).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe('pnpm add better-hooks');

    await page.setViewportSize({ width: 320, height: 568 });
    await openPage(page, 'hooks/use-debounce');
    const source = page.locator('[data-code-variant="code"]').first();
    const sourceLine = source.locator('code > [data-line], code > .line').first();
    await expect(source).toHaveAttribute('data-language', 'ts');
    await expect
      .poll(() => sourceLine.evaluate((line) => getComputedStyle(line, '::before').content))
      .toMatch(/counter|1/);
    await expect
      .poll(() =>
        source.evaluate((frame) => {
          const pre = frame.querySelector('pre');
          return pre
            ? {
                fits: pre.scrollWidth <= pre.clientWidth + 1,
                whiteSpace: getComputedStyle(pre).whiteSpace,
              }
            : null;
        }),
      )
      .toEqual({ fits: true, whiteSpace: 'pre-wrap' });
    const syntaxColors = await source
      .locator('[style*="--shiki-light"]')
      .evaluateAll((tokens) =>
        Array.from(new Set(tokens.map((token) => getComputedStyle(token).color))).filter(
          (color) => color !== 'rgba(0, 0, 0, 0)',
        ),
      );
    expect(syntaxColors.length).toBeGreaterThan(3);

    await page.evaluate(() => {
      Object.defineProperty(Clipboard.prototype, 'writeText', {
        configurable: true,
        value: () => Promise.reject(new Error('Clipboard unavailable')),
      });
    });
    await source.getByRole('button', { name: 'Copy code' }).click();
    await expect(source.getByRole('button', { name: 'Code copied' })).toBeVisible();

    await page.waitForTimeout(1900);
    await page.evaluate(() => {
      Object.defineProperty(document, 'execCommand', {
        configurable: true,
        value: () => false,
      });
    });
    await source.getByRole('button', { name: 'Copy code' }).click();
    await expect(
      source.getByRole('button', { name: 'Copy failed. Select the code manually.' }),
    ).toBeVisible();
  });

  test('Document headings expose stable permalinks in both locales', async ({ page }) => {
    await openPage(page, 'docs/getting-started');
    const englishHeading = page.getByRole('heading', {
      level: 2,
      name: /Choose a Hook by lifecycle problem/,
    });
    const englishLink = englishHeading.getByRole('link', {
      name: 'Permalink to Choose a Hook by lifecycle problem',
    });
    const englishId = await englishHeading.getAttribute('id');
    expect(englishId).toBeTruthy();
    await expect(englishLink).toHaveAttribute('href', `#${englishId}`);

    await page.getByRole('link', { name: '中文', exact: true }).click();
    const chineseHeading = page.getByRole('heading', { level: 2, name: /按生命周期问题选择 Hook/ });
    const chineseId = await chineseHeading.getAttribute('id');
    expect(chineseId).toBeTruthy();
    await expect(
      chineseHeading.getByRole('link', { name: '按生命周期问题选择 Hook 的固定链接' }),
    ).toHaveAttribute('href', `#${chineseId}`);
  });

  test('Documentation typography remains readable and overflow is locally contained', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await openPage(page, 'docs/getting-started');
    const paragraph = page.locator('main article p').first();
    const typography = await paragraph.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        fontSize: Number.parseFloat(style.fontSize),
        lineHeight: Number.parseFloat(style.lineHeight),
      };
    });
    expect(typography.fontSize).toBeGreaterThanOrEqual(16);
    expect(typography.lineHeight / typography.fontSize).toBeGreaterThanOrEqual(1.6);
    await expectNoHorizontalOverflow(page);

    await openPage(page, 'docs/support-matrix');
    const tableRegion = page.getByRole('region', { name: /Data table/ }).first();
    await tableRegion.focus();
    await expect(tableRegion).toBeFocused();
    await expectNoHorizontalOverflow(page);
  });

  test('Core concept pages describe lifecycle and runtime contracts in both locales', async ({
    page,
  }) => {
    await openPage(page, 'docs/react-19');
    await expect(
      page.getByRole('heading', { level: 2, name: 'Actions stay usable across renders' }),
    ).toBeVisible();
    await expect(page.locator('main article')).toContainText('Errors remain observable');

    await page.getByRole('link', { name: '中文', exact: true }).click();
    await expect(
      page.getByRole('heading', { level: 2, name: '操作函数跨渲染保持可用' }),
    ).toBeVisible();
    await expect(page.locator('main article')).toContainText('错误保持可观察');

    await openPage(page, 'zh/docs/ssr-rsc');
    await expect(
      page.getByRole('heading', { level: 2, name: '在调用 Hook 的位置设置边界' }),
    ).toBeVisible();
    await expect(page.locator('main article')).toContainText('选择确定的服务端快照');
  });

  test('document labels are meaningful and useKeyPress documents the frozen chord contract', async ({
    page,
  }) => {
    await openPage(page, 'docs/getting-started');
    await expect(page.getByRole('group', { name: 'Hook metadata' })).toHaveCount(0);

    await openPage(page, 'hooks/use-key-press');
    const metadata = page.getByRole('group', { name: 'Hook metadata' });
    await expect(metadata).toContainText('Browser & DOM');
    await expect(metadata).toContainText('Client Component');
    await expect(page.locator('main article')).toContainText(
      'Arrays always represent independent alternatives',
    );
    await expect(page.locator('main article')).toContainText("'ctrl+s'");

    await page.getByRole('link', { name: '中文', exact: true }).click();
    await expect(page.getByRole('group', { name: 'Hook 元数据' })).toBeVisible();
    await expect(page.locator('main article')).toContainText('数组始终表示彼此独立的候选项');
    await expect(page.locator('main article')).toContainText("'ctrl+s'");
  });

  test('Changelog renders the package version and release data in both languages', async ({
    page,
  }) => {
    await openPage(page, 'changelog');
    const versionHeading = page.getByRole('heading', { level: 2 });
    await expect(versionHeading).toHaveText(/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/);
    const version = (await versionHeading.textContent())?.trim();
    expect(version).toBeTruthy();
    await expect(page.locator('main article').getByRole('heading', { level: 3 })).toHaveCount(2);
    await expect(
      page.getByRole('link', { name: new RegExp(`View this version on npm: ${version}`) }),
    ).toHaveAttribute('href', `https://www.npmjs.com/package/better-hooks/v/${version}`);
    await expect(page.getByRole('link', { name: 'GitHub Release' })).toHaveAttribute(
      'href',
      `https://github.com/chenyu1ov3/better-hooks/releases/tag/better-hooks@${version}`,
    );
    await expect(page.getByText('Not yet published on npm', { exact: true })).toHaveCount(0);

    await page.getByRole('link', { name: '中文', exact: true }).click();
    await expect(page).toHaveURL(/\/zh\/changelog\/$/);
    await expect(page.getByRole('heading', { level: 2, name: version! })).toBeVisible();
    await expect(page.locator('main article').getByRole('heading', { level: 3 })).toHaveCount(2);
    await expect(
      page.getByRole('link', { name: new RegExp(`在 npm 查看此版本: ${version}`) }),
    ).toHaveAttribute('href', `https://www.npmjs.com/package/better-hooks/v/${version}`);
    await expect(page.getByRole('link', { name: 'GitHub Release' })).toHaveAttribute(
      'href',
      `https://github.com/chenyu1ov3/better-hooks/releases/tag/better-hooks@${version}`,
    );
  });

  test('desktop documentation shows a linked table of contents', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, 'docs/getting-started');
    const tableOfContents = page.getByRole('complementary', { name: 'On this page' });
    const firstLink = tableOfContents.locator('nav a').first();

    await expect(tableOfContents).toBeVisible();
    await expect(page.getByRole('button', { name: 'On this page', exact: true })).toBeHidden();
    await expect(firstLink).toBeVisible();
    const target = await firstLink.getAttribute('href');
    expect(target).toMatch(/^#/);
    await firstLink.click();
    await expect(page).toHaveURL(new RegExp(`${target}$`));
    await expect(page.locator(target!)).toBeVisible();
    await expect(firstLink).toHaveAttribute('aria-current', 'location');
  });

  test('mobile documentation exposes the TOC and docs drawer', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openPage(page, 'docs/getting-started');
    const mobileToc = page.locator('[data-toc-variant="mobile"]');
    const tocSummary = mobileToc.locator('summary');

    await expect(page.getByRole('complementary', { name: 'On this page' })).toBeHidden();
    await expect(mobileToc).toBeVisible();
    await tocSummary.click();
    await expect(
      mobileToc.getByRole('navigation', { name: 'On this page' }).getByRole('link').first(),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Docs', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Docs' });
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByRole('link', { name: 'Getting started', exact: true }),
    ).toHaveAttribute('aria-current', 'page');
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });
});

test.describe('WCAG A/AA', () => {
  const themedRoutes = [
    { path: '', name: 'home' },
    { path: 'hooks', name: 'Hooks explorer' },
    { path: 'playground', name: 'Playground' },
    { path: 'docs/getting-started', name: 'documentation' },
  ] as const;

  for (const colorScheme of ['light', 'dark'] as const) {
    for (const route of themedRoutes) {
      test(`${route.name} has no automated WCAG A/AA violations in ${colorScheme} mode`, async ({
        page,
      }) => {
        await page.emulateMedia({ colorScheme });
        await page.setViewportSize({ width: 1280, height: 800 });
        await openPage(page, route.path);
        await expect(page.locator('html')).toHaveAttribute('data-theme', colorScheme);
        await expectWcagAa(page);
        if (route.path === '' && colorScheme === 'dark') {
          await page.screenshot({
            path: reviewScreenshot('home-en-dark-1280x800.png'),
            animations: 'disabled',
          });
        }
      });
    }
  }

  const additionalLightRoutes = [
    {
      path: 'hooks/use-debounce',
      name: 'Hook reference',
      viewport: { width: 1280, height: 800 },
      screenshot: 'hook-use-debounce-en-1280x800.png',
    },
    { path: 'changelog', name: 'changelog', viewport: { width: 1280, height: 800 } },
    {
      path: 'zh',
      name: 'Chinese home',
      viewport: { width: 390, height: 844 },
      screenshot: 'home-zh-390x844.png',
    },
  ] as const;

  for (const route of additionalLightRoutes) {
    test(`${route.name} has no automated WCAG A/AA violations in light mode`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'light' });
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
    await page.emulateMedia({ colorScheme: 'light' });
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
  const runtime = page.getByTestId('hook-lifecycle-visual');
  await runtime.getByRole('textbox', { name: 'Try a value' }).fill('reduced motion value');

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
  await expect(runtime.getByLabel('Published value')).toHaveText('reduced motion value');
});
