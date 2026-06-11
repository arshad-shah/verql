---
"verql": patch
---

Security hardening (defense-in-depth).

- **Secret-redacting logger.** The app logger now recursively redacts
  secret-looking object keys (`password`, `token`, `*key`, `secret`,
  `authorization`, `credential`) before serialising a detail object to the
  console or the persisted activity stream — so a careless call site that logs a
  whole `ConnectionProfile` (which holds plaintext secrets in memory) can't leak
  credentials. Free-text strings/stacks are unchanged; non-secret fields are
  preserved verbatim.
- **Explicit zip-slip guard on plugin install.** Before extracting a third-party
  plugin archive, the entry names are validated and any absolute path, Windows
  drive-letter path, or `..` traversal segment is rejected — defense-in-depth
  that no longer trusts `unzip`'s implicit stripping across versions/platforms.
