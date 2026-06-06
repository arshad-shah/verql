---
title: Managing plugins
description: What plugins are, how to enable, disable, install, and uninstall them, and staying safe.
sidebar:
  order: 7
---

Much of what Verql does is delivered through **plugins** — extensions that add
capabilities to the app. From your point of view, a plugin can add things like a
new database driver, a colour theme, an import/export format, an AI provider, or
a panel. Even the built-in PostgreSQL, MySQL, and SQLite drivers are bundled
plugins.

[← Back to the User Guide](/guide/)

## What plugins add

A plugin can contribute one or more of:

- **Database drivers** — support for another database type
- **Themes** — additional colour schemes
- **Import/export formats** — more ways to move data in and out
- **AI providers** — more model backends for the assistant
- **Panels and commands** — extra UI and actions

The plugins settings page shows each plugin's actual contributions so you can see
what it brings.

## Viewing, enabling, and disabling plugins

Open the plugins settings page to see everything that's installed. From there you
can:

- See each plugin's description and what it contributes
- **Enable** or **disable** a plugin — a disabled plugin's contributions are
  removed from the app, and your choice persists across restarts
- **Install** a new plugin or **uninstall** one you no longer want

> The always-on bundled plugins that provide core functionality stay in place;
> optional plugins are the ones you'll typically toggle.

## A word on safety

> **Only install plugins you trust.** A third-party plugin runs with access to
> the app — including, potentially, your connections and the data you can reach.
> Treat installing a plugin like installing any other software: get it from a
> source you trust, and don't install something just because it sounds useful.

Verql includes guardrails to limit what a plugin can do and to protect the
built-in drivers from being impersonated. For the full picture of how Verql
protects you, see [Plugin security](/plugins/security/).

---

Next: [Keeping Verql updated →](/guide/updating/)
