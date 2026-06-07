#!/usr/bin/env bash
# Build the SQLite test database from docker/seed/sqlite.sql.
#
#   scripts/make-sqlite-testdb.sh
#
# Output: docker/testdb.sqlite — open it in Verql with a SQLite connection.
# Uses the host `sqlite3` CLI if available, otherwise falls back to Docker so
# you don't need anything installed besides Docker.
set -euo pipefail

cd "$(dirname "$0")/.."
SEED="docker/seed/sqlite.sql"
OUT="docker/testdb.sqlite"

if [ ! -f "$SEED" ]; then
  echo "error: $SEED not found" >&2
  exit 1
fi

rm -f "$OUT"

if command -v sqlite3 >/dev/null 2>&1; then
  sqlite3 "$OUT" < "$SEED"
elif command -v docker >/dev/null 2>&1; then
  echo "sqlite3 not found on host — building via Docker (alpine)…"
  docker run --rm -i -v "$PWD/docker:/work" -w /work alpine:3.20 \
    sh -c "apk add --no-cache sqlite >/dev/null 2>&1 && sqlite3 testdb.sqlite" < "$SEED"
else
  echo "error: need either the 'sqlite3' CLI or Docker installed" >&2
  exit 1
fi

echo "✓ Created $OUT"
echo "  In Verql: New Connection → SQLite → File: $(pwd)/$OUT"
