'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { ComponentProps, FocusEvent, MouseEvent, PointerEvent, TouchEvent } from 'react';

const NAVIGATION_FALLBACK_DELAY_MS = 750;
const ROUTE_MARKER_SELECTOR = '[data-site-route]';
const routeBaseUrl = 'https://better-hooks.invalid';

let navigationFallbackTimer: number | undefined;
let navigationFallbackObserver: MutationObserver | undefined;
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
  if (navigationFallbackObserver) {
    navigationFallbackObserver.disconnect();
    navigationFallbackObserver = undefined;
  }
  if (navigationFallbackPopstateHandler) {
    window.removeEventListener('popstate', navigationFallbackPopstateHandler);
    navigationFallbackPopstateHandler = undefined;
  }
}

function watchNavigation(targetRoute: string, fallbackHref: string, replace = false) {
  clearNavigationFallback();

  navigationFallbackObserver = new MutationObserver(() => {
    if (routeHasCommitted(targetRoute)) clearNavigationFallback();
  });
  navigationFallbackObserver.observe(document.body, {
    attributeFilter: ['data-site-route'],
    attributes: true,
    childList: true,
    subtree: true,
  });

  navigationFallbackPopstateHandler = clearNavigationFallback;
  window.addEventListener('popstate', navigationFallbackPopstateHandler);

  navigationFallbackTimer = window.setTimeout(() => {
    clearNavigationFallback();
    if (replace) window.location.replace(fallbackHref);
    else window.location.assign(fallbackHref);
  }, NAVIGATION_FALLBACK_DELAY_MS);
}

export function SiteLink({
  href,
  onClick,
  onFocus,
  onMouseEnter,
  onPointerDown,
  onTouchStart,
  replace,
  ...props
}: SiteLinkProps) {
  const [prefetchHref, setPrefetchHref] = useState<string | null>(null);

  function prepareRoute() {
    const targetRoute = routeForHref(href);
    if (!targetRoute || routeHasCommitted(targetRoute)) return;
    setPrefetchHref(href);
  }

  function handleFocus(event: FocusEvent<HTMLAnchorElement>) {
    onFocus?.(event);
    if (!event.defaultPrevented) prepareRoute();
  }

  function handleMouseEnter(event: MouseEvent<HTMLAnchorElement>) {
    onMouseEnter?.(event);
    if (!event.defaultPrevented) prepareRoute();
  }

  function handlePointerDown(event: PointerEvent<HTMLAnchorElement>) {
    onPointerDown?.(event);
    if (!event.defaultPrevented) prepareRoute();
  }

  function handleTouchStart(event: TouchEvent<HTMLAnchorElement>) {
    onTouchStart?.(event);
    if (!event.defaultPrevented) prepareRoute();
  }

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (!isPlainNavigation(event)) return;

    clearNavigationFallback();
    const targetRoute = routeForHref(href);
    if (!targetRoute || routeHasCommitted(targetRoute)) return;

    watchNavigation(targetRoute, event.currentTarget.href, replace);
  }

  return (
    <Link
      {...props}
      href={href}
      prefetch={prefetchHref === href}
      replace={replace}
      onClick={handleClick}
      onFocus={handleFocus}
      onMouseEnter={handleMouseEnter}
      onPointerDown={handlePointerDown}
      onTouchStart={handleTouchStart}
    />
  );
}
