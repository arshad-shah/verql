# Microsoft Store — listing

Paste-ready copy for the Partner Center submission, derived from
[`../brand.md`](../brand.md). Field names and character limits match Partner
Center. Edit shared messaging in `brand.md` first, then reflect it here.

- **Product ID:** `9N97ZSVPSBZ3`
- **MSIX identity:** `Arshadshah.verql` · publisher `CN=2ABEC305-C7D9-4693-92FC-165FCE8EEA94`
- **Pipeline:** `release.yml` → gated `publish-msstore` job (updates the live
  listing on each release). Build the seed/update MSIX on Windows CI — see
  `.github/maintainers/release.md` → "Microsoft Store".

## Product name
```
Verql
```

## Description (≤10,000 chars)
```
Verql is a fast, modern, cross-platform database client built for developers who live in their data.

Connect in seconds and work across very different databases from a single, consistent workspace — PostgreSQL, MySQL, and SQLite are supported natively, and MongoDB, Redis, and Snowflake come bundled as plugins. Verql adapts its language to each one, so document and key/value stores feel native instead of being forced into SQL wording.

WRITE QUERIES FASTER
A focused editor (powered by Monaco, the engine behind VS Code) gives you driver-aware autocomplete, syntax highlighting, and multi-tab editing. Results land in a fast, sortable grid that stays smooth even on large datasets.

EXPLORE WITHOUT WRITING QUERIES
Browse tables, collections, and keys with one click. View interactive entity-relationship diagrams of your schema, and turn query results into charts to spot patterns at a glance.

AN AI ASSISTANT THAT KNOWS YOUR DATABASE
Ask for a query in plain language, get an explanation of what a statement does, or have Verql help you navigate a schema. Bring your own provider — OpenAI, Anthropic, or a fully local model through Ollama — so your workflow stays on your terms.

EXTENSIBLE BY DESIGN
Verql is built around a plugin system with a published SDK (@verql/plugin-sdk). Add new database drivers, exporters and importers, formatters, themes, AI providers, and tools — the same surfaces the built-in features use.

PRIVATE AND SECURE
Connection secrets are stored in the operating system's secure credential store, not in plain text. Verql is free and open source (MIT licensed), so you can see exactly what it does.

Made for keyboards, themed for long sessions (dark, light, and midnight), and designed end to end — from the command palette to the custom window chrome.
```

## What's new in this version (≤1,500 chars)
```
Verql is now available on the Microsoft Store! Install and update it like any other Store app, with no security prompts to click through.

• PostgreSQL, MySQL, and SQLite built in; MongoDB, Redis, and Snowflake via bundled plugins
• A driver-aware query editor and a fast results grid
• Browse data, view ER diagrams, and chart results without writing queries
• An AI assistant you can point at OpenAI, Anthropic, or a local Ollama model
• An open plugin SDK for building your own drivers, exporters, and themes

Thanks for trying Verql — feedback and issues are welcome on GitHub.
```

## Product features (up to 20, ≤200 chars each)
```
Native PostgreSQL, MySQL, and SQLite support
MongoDB, Redis, and Snowflake via bundled plugins
Driver-aware query editor with smart autocomplete
Fast, sortable results grid for large datasets
One-click data browsing for non-SQL stores
Interactive entity-relationship (ER) diagrams
Built-in charts to visualize query results
AI assistant — OpenAI, Anthropic, or local Ollama
Extensible plugin system with a published SDK
Secure credential storage via the OS keyring
Dark, light, and midnight themes
Command palette and app-designed window
Free and open source (MIT)
```

## Search terms (up to 7, ≤30 chars each)
```
database client
SQL editor
PostgreSQL
MySQL
SQLite
MongoDB
Redis
```

## Small fields
- **Copyright and trademark info** (≤200): `Copyright © 2026 Arshad Shah`
- **Additional license terms**: `MIT License — https://github.com/arshad-shah/verql/blob/main/LICENSE`
- **Category / subcategory**: `Developer tools`
- **Developed by / Published by**: `Arshad Shah`

## Store URLs
- **Website**: `https://verql.arshadshah.com`
- **Privacy policy**: `https://verql.arshadshah.com/privacy`
- **Support contact info**: `https://github.com/arshad-shah/verql/issues`

## Properties / declarations
- **Restricted capability — `runFullTrust`.** Expected for any Win32/Electron app
  packaged as MSIX. Partner Center shows a warning and asks you to request
  approval; justification: *"Verql is a full-trust Electron desktop application;
  runFullTrust is required for the packaged Win32 runtime."* Routinely approved.

## Assets checklist (see [`../assets.md`](../assets.md))
- [x] 300×300 Store logo → `assets/store-logo-300.png` (also 512 / 1024)
- [ ] ≥ 1 screenshot, 1366×768+ (suggested set in `assets.md`) — needs the running app
- [ ] Privacy policy page is live at the URL above (the Store rejects a 404 — deploys with `main`)
- [ ] One-time manual seed submission uploaded (`msstore publish` only updates a live app)
