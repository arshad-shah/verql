# Connecting to a database

Everything in Verql starts with a **connection profile** — a saved set of details
(host, port, database, credentials, options) for one database. Once a profile is
saved, you can connect to it any time from the sidebar.

[← Back to the User Guide](./README.md)

## Supported databases

| Database | How it's provided |
|----------|-------------------|
| PostgreSQL | Native (bundled driver) |
| MySQL | Native (bundled driver) |
| SQLite | Native (bundled driver) |
| MongoDB | Bundled plugin |
| Redis | Bundled plugin |
| Snowflake | Bundled plugin |

Each driver — including PostgreSQL, MySQL, and SQLite — is itself a plugin, so
the list of databases Verql can talk to grows as plugins are added. See
[Managing plugins](./managing-plugins.md).

## Creating a connection profile

1. Open the connection form (the new-connection action in the sidebar).
2. Choose the database type. The form fields adapt to what that driver needs —
   for example, SQLite asks for a file path, while PostgreSQL and MySQL ask for a
   host, port, database name, and credentials.
3. Fill in the details and save the profile.

You can keep as many profiles as you like and edit them later.

### A few per-database notes

- **SQLite** connects to a local file — point it at your `.db` / `.sqlite` file.
- **PostgreSQL** supports SSL. When SSL is enabled, Verql verifies the server's
  certificate by default. The connection form includes an **SSL Mode** choice:
  pick **Verify (recommended)** for secure connections, or
  **Skip verification (insecure)** only if you understand the risk (for example,
  a self-signed cert on a trusted private network).
- **MongoDB, Redis, Snowflake** each expose the fields their driver needs.

## Connecting and disconnecting

Select a saved profile in the sidebar to connect. Once connected, its schema
loads into the browser (see [Exploring your schema](./exploring-schema.md)) and
you can open query tabs against it.

Disconnect when you're done. Verql clears the cached schema for a profile when
you disconnect, so reconnecting always reflects the live database rather than a
stale snapshot.

## SSH tunnels

If your database is only reachable through a bastion / jump host, Verql can open
an **SSH tunnel** for the connection. The SSH tunnel is a bundled *connection
middleware* — it wraps the connection, opening the tunnel before the database
connects and closing it cleanly afterward. Configure the tunnel details
(SSH host, port, user, and key or password) as part of the connection profile.

Because it's middleware rather than core code, the same tunnel option is
available to every driver.

## How your credentials are stored

Verql does **not** write database passwords or other secrets to disk in plain
text. Secrets are stored encrypted in your operating system's keychain via
Electron's [`safeStorage`](https://www.electronjs.org/docs/latest/api/safe-storage):

- **macOS:** the system Keychain
- **Windows:** the Credential Manager / DPAPI
- **Linux:** the available secret service (e.g. the GNOME Keyring / KWallet)

Non-secret profile details (host, port, database name, options) are saved in
Verql's configuration file; only the secrets live in the keychain. The encrypted
credentials file is also written with owner-only permissions so it isn't readable
by other users on a shared machine.

> AI provider API keys are stored the same way — see
> [The AI assistant](./ai-assistant.md).

---

Next: [Running queries →](./querying.md)
