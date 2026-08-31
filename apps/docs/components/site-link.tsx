'use client';

import Link from 'next/link';
import type { ComponentProps, MouseEvent } from 'react';

const NAVIGATION_FALLBACK_DELAY_MS = 2_000;
const NAVIGATION_COMMIT_POLL_INTERVAL_MS = 100;
const ROUTE_MARKER_SELECTOR = '[data-site-route]';
const routeBaseUrl = 'https://better-hooks.invalid';

let navigationFallbackTimer: number | undefined;
let navigationFallbackPopstateHandler: (() => void) | undefined;

type SiteLinkProps = Omit<ComponentProps<typeof Link>, 'href' | 'prefetch'> & {
  href: string;
};

function normalizeRoute(pathname: string) {
  return pathname.replace(/\/+$/, '') || '/';
}

function routeForHref(href: string) {
  if (href.startsWith('#') || href.startsWith('?')) return null;

  const url = new URL(href, routeBaseUrl);
  if (url.origin !== routeBaseUrl) return null;
  return normalizeRoute(url.pathname);
}

function routeHasCommitted(route: string) {
  return Array.from(document.querySelectorAll<HTMLElement>(ROUTE_MARKER_SELECTOR)).some(
    (marker) => marker.dataset.siteRoute === route && marker.getClientRects().length > 0,
  );
}

function isPlainNavigation(event: MouseEvent<HTMLAnchorElement>) {
  const anchor = event.currentTarget;
  return (
    !event.defaultPrevented &&
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey &&
    (!anchor.target || anchor.target === '_self') &&
    !anchor.hasAttribute('download')
  );
}

function clearNavigationFallback() {
  if (navigationFallbackTimer !== undefined) {
    window.clearTimeout(navigationFallbackTimer);
    navigationFallbackTimer = undefined;
  }
  if (navigationFallbackPopstateHandler) {
    window.removeEventListener('popstate', navigationFallbackPopstateHandler);
    navigationFallbackPopstateHandler = undefined;
  }
}

function watchNavigation(targetRoute: string, fallbackHref: string, replace = false) {
  clearNavigationFallback();

  navigationFallbackPopstateHandler = clearNavigationFallback;
  window.addEventListener('popstate', navigationFallbackPopstateHandler);

  const fallbackAt = performance.now() + NAVIGATION_FALLBACK_DELAY_MS;

  function checkForCommit() {
    if (routeHasCommitted(targetRoute)) {
      clearNavigationFallback();
      return;
    }

    if (performance.now() < fallbackAt) {
      navigationFallbackTimer = window.setTimeout(
        checkForCommit,
        NAVIGATION_COMMIT_POLL_INTERVAL_MS,
      );
      return;
    }

    clearNavigationFallback();
    if (replace) window.location.replace(fallbackHref);
    else window.location.assign(fallbackHref);
  }

  navigationFallbackTimer = window.setTimeout(checkForCommit, NAVIGATION_COMMIT_POLL_INTERVAL_MS);
}

export function SiteLink({ href, onClick, replace, ...props }: SiteLinkProps) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (!isPlainNavigation(event)) return;

    clearNavigationFallback();
    const targetRoute = routeForHref(href);
    if (!targetRoute || routeHasCommitted(targetRoute)) return;

    watchNavigation(targetRoute, event.currentTarget.href, replace);
  }

  return <Link {...props} href={href} prefetch={false} replace={replace} onClick={handleClick} />;
}
