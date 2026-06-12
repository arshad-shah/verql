---
title: Privacy Policy
description: How Verql, the desktop database client, handles your data — what stays on your device, what optional features transmit, and what we never collect.
---

_Last updated: 12 June 2026_

> This page is a plain-language privacy policy for the Verql desktop application
> and the verql.arshadshah.com website. It is provided in good faith and should
> be reviewed against the laws that apply to you before you rely on it.

## The short version

Verql is a **desktop application that runs on your own computer**. Your database
connections, credentials, queries, and results stay **on your device**. We do not
operate a server that receives your data, and Verql does not phone home with your
usage or content. The only time data leaves your machine is when **you choose** to
use an optional feature that talks to a third party (an AI provider you
configure), or because the **store/package manager you installed from** collects
its own install metrics.

## Information Verql handles on your device

**Connection details and credentials.** Hostnames, ports, usernames, and
passwords for the databases you connect to are stored locally. Secrets are kept
in your operating system's secure credential store (Keychain on macOS, Credential
Manager / DPAPI on Windows, the Secret Service on Linux), not in plain text, and
are never transmitted to us.

**Your databases, queries, and results.** Everything you do against a database —
schemas you browse, queries you run, rows you view — is processed locally between
Verql and the database server you connected to. We are not a party to that
connection and never see its contents.

**Local application data.** Preferences, open tabs, query history, and diagnostic
logs are stored locally on your device so the app can restore your workspace and
help you troubleshoot. They are not uploaded anywhere by Verql.

## Optional features that send data to third parties

**AI assistant.** If you enable the AI assistant and configure a provider, the
content you send to it — your prompts and any query text or schema you include —
is transmitted to **that provider** so it can respond. You supply your own
account/API key, and your use is governed by that provider's terms and privacy
policy:

- **OpenAI** and **Anthropic** are cloud providers; data you send goes to them.
- **Ollama** runs models **locally on your machine**, so that data does not leave
  your device.

Verql does not operate a proxy or server for these requests, does not store your
prompts on our infrastructure, and only contacts the provider you have configured.

**Plugins.** Verql supports first-party and third-party plugins. A plugin can
process data within the permissions you grant it. Third-party plugins are governed
by their own authors' terms and privacy practices; review them before installing.

## What we do not collect

Verql does not include analytics or telemetry that report your usage, your
queries, or your data back to us. We do not sell or share personal data, because
we do not collect it from the application in the first place.

## Distribution channels and the website

**App stores and package managers.** If you installed Verql from the **Microsoft
Store** or via **Homebrew**, that platform may collect installation, update, and
basic usage metrics under **its own** privacy policy, independent of Verql.

**Updates.** Application updates are delivered by your platform — the Microsoft
Store on Windows, and `brew upgrade` on macOS and Linux — not by a Verql-operated
update service.

**This website.** verql.arshadshah.com is a static documentation site hosted on
Cloudflare Pages. It sets no tracking or advertising cookies. The host may keep
standard server access logs (such as IP address and request time) for security
and reliability, as described in Cloudflare's privacy documentation.

## Children's privacy

Verql is a developer tool and is not directed to children under 13, and we do not
knowingly collect personal information from them.

## Changes to this policy

We may update this policy as the application evolves. Material changes will be
reflected here with an updated "Last updated" date.

## Contact

Questions about privacy can be raised at
[github.com/arshad-shah/verql/issues](https://github.com/arshad-shah/verql/issues).
