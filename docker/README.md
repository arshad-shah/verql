# Local test databases

A one-command local environment for validating every database type Verql
supports. Spins up **PostgreSQL, MySQL, MongoDB, and Redis** (seeded with a
consistent sample dataset), builds a seeded **SQLite** file, and lists exactly
what to enter in Verql to connect and verify each one.

> **Snowflake** is cloud-only and not part of this local setup — validate it
> against a real (or trial) Snowflake account.

## Prerequisites

- **Docker** + Docker Compose v2 (`docker compose`).
- Optional: the `sqlite3` CLI (the SQLite build falls back to Docker if missing).

## Quick start

```bash
scripts/test-dbs.sh up      # start + seed everything, build the SQLite file
scripts/test-dbs.sh status  # health/status
scripts/test-dbs.sh reset   # wipe volumes and re-seed from scratch
scripts/test-dbs.sh down    # stop (keeps data)
```

Or drive Compose directly:

```bash
docker compose up -d              # start servers
docker compose up redis-seed      # (re)seed Redis
docker compose down -v            # stop + wipe volumes
scripts/make-sqlite-testdb.sh     # build docker/testdb.sqlite
```

> Postgres/MySQL/Mongo run their seed only on **first** init (empty volume).
> Re-seed them with `scripts/test-dbs.sh reset` (or `docker compose down -v`).

## Connection details

Use **Host `localhost`** (or `127.0.0.1`). Every credential below is `verql` /
`verql` unless noted.

| Type | Host | Port | User | Password | Database |
|------|------|------|------|----------|----------|
| PostgreSQL | localhost | 5432 | `verql` | `verql` | `testdb` |
| MySQL | localhost | 3306 | `verql` | `verql` | `testdb` |
| MongoDB | localhost | 27017 | `verql` | `verql` | `testdb` (authSource `admin`) |
| Redis | localhost | 6379 | — | `verql` | db `0` |
| SQLite | — | — | — | — | file: `docker/testdb.sqlite` |

Notes:
- **MySQL** also has a `root` / `root` superuser.
- **MongoDB** root user authenticates against the `admin` database — set
  *Auth source* / *Auth DB* to `admin` if the form asks.
- **Redis** uses `--requirepass verql` (password only, no username).
- **SQLite** is a file — point the SQLite connection at the absolute path printed
  by the build script.

## Sample data (shared across the relational/document stores)

- `users`, `products`, `orders`, `order_items` tables/collections.
- PostgreSQL adds `sales.regions` / `sales.targets` (a second schema) and an
  `order_summary` view; SQLite has the `order_summary` view too.
- MongoDB uses embedded `orders.items` plus an `events` collection.
- Redis has string/counter, hash (`user:*`), list (`recent:orders`, `log:events`),
  set (`tags:*`), sorted set (`leaderboard`), and a TTL key (`session:abc123`).

## Validation checklist

For each type: **New Connection → pick the type → enter the values above →
Test Connection** (expect success), then open a query/explorer tab and run a
sample:

- **PostgreSQL / MySQL / SQLite**
  ```sql
  SELECT u.name, COUNT(o.id) AS orders, SUM(o.total) AS spent
  FROM users u LEFT JOIN orders o ON o.user_id = u.id
  GROUP BY u.name ORDER BY spent DESC NULLS LAST;  -- (drop NULLS LAST on MySQL/SQLite)
  ```
  Also confirm the schema explorer lists the tables/indexes/views.
- **MongoDB** — browse the `users`, `products`, `orders`, `events` collections;
  run a find on `orders` filtered by `status: "shipped"`.
- **Redis** — browse keys; check `HGETALL user:1`, `ZRANGE leaderboard 0 -1 WITHSCORES`,
  `LRANGE recent:orders 0 -1`, and that `session:abc123` shows a TTL.

This exercises connect, schema introspection, querying, and (for the relational
stores) views/indexes across all locally-runnable drivers.
