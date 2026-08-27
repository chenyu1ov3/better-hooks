---
title: Architecture
description: Package boundaries, runtime ownership, performance evidence, and the decisions that keep Better Hooks predictable.
section: Architecture
order: 8
---

# Architecture

Better Hooks keeps the public API small by making ownership explicit. Package entries define what an application loads, Hook contracts define when work may start, shared stores define who owns native resources, and repository gates verify the artifact that is actually published.

<ArchitectureMap />

## Constraints that shape the system

- **Import safety.** Public modules can be evaluated without `window`, `document`, timers, listeners, or React work starting at import time.
- **Commit ownership.** Long-lived callbacks, subscriptions, and asynchronous tasks start after commit and clean up symmetrically.
- **Explicit package boundaries.** The ESM-only package exposes a root entry and one direct entry per Hook, with React kept external.
- **Observable semantics.** Stable actions, cancellation, stale-run protection, server snapshots, and error propagation are documented behavior rather than implementation accidents.
- **Measured claims.** Size data comes from the current built module graph. Runtime claims must be covered by focused tests.

## Package topology

Direct imports such as `better-hooks/use-media-query` begin at one Hook boundary. The root `better-hooks` entry remains available when an application intentionally wants the complete public graph. Both routes resolve through explicit package exports, and `sideEffects: false` lets consumer tooling reason about unused modules.

<PackageMetrics variant="summary" />

The summary measures the unminified ES2022 output before application-level bundling. React and React DOM are peer dependencies and remain outside every measured graph. See [Performance](/docs/performance) for every direct entry and the exact compression method.

## Runtime ownership

Render computes values but does not acquire host resources. Effects and `useSyncExternalStore` subscriptions own timers, event listeners, observers, storage channels, and network transports. When several consumers can safely share one native source, a scoped store owns that source and releases it after the last subscriber leaves.

Stable public actions do not imply stale closures. Long-lived work reads the latest committed callback through refs updated at commit boundaries. Async generations and cancellation guards prevent work that is no longer current from replacing newer state.

## Change path

1. A Hook lives with its unit, SSR, and type tests under `packages/hooks/src/use-*`.
2. A direct package export makes the runtime and declaration boundary explicit.
3. English and Simplified Chinese examples and reference pages describe the same contract.
4. Package checks import every built export, inspect client directives, measure direct-entry graphs, and validate the packed tarball.
5. Documentation builds statically; browser-level tests cover navigation, examples, responsiveness, and accessibility.

## Decision records

<ArchitectureDecisions />

Each accepted ADR records a durable constraint rather than a temporary implementation detail. A new decision should explain its context, the chosen rule, and the consequences that future changes must preserve.

## Evidence and maintenance

Run `pnpm check` before submitting source or architecture changes. Run `pnpm test:e2e` when the documentation interface changes. The package metric report is regenerated before documentation builds and checked for drift in the repository validation pipeline.
