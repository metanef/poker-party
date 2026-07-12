---
name: Vite config overrides for GitHub Actions / external CI
description: How to add a second build target (e.g. GitHub Pages) to an artifact whose default vite.config.ts is Replit-dev-specific.
---

Replit-generated `vite.config.ts` for an artifact often hard-requires Replit-managed env vars (`PORT`, `BASE_PATH`) and won't run in an external CI environment (e.g. a GitHub Actions build for GitHub Pages).

**Why:** Passing a second `--config` flag on top of an existing npm script that already hardcodes `--config vite.config.ts` is fragile — behavior depends on how the underlying CLI parser resolves duplicate flags, and it reads as a bug on review even when it happens to work.

**How to apply:** Create a separate standalone config file (e.g. `vite.config.github-pages.ts`) with no Replit env dependency, and add a dedicated `package.json` script (e.g. `"build:pages": "vite build --config vite.config.github-pages.ts"`) that CI calls directly, instead of overriding flags on the existing `build` script.
