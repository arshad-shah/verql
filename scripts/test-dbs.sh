#!/usr/bin/env bash
# Manage the local test databases used to validate Verql connections.
#
#   scripts/test-dbs.sh up       # start Postgres/MySQL/Mongo/Redis (+seed) + build SQLite
#   scripts/test-dbs.sh down     # stop containers (keep data)
#   scripts/test-dbs.sh reset    # wipe volumes and recreate everything from seed
#   scripts/test-dbs.sh seed     # re-run the Redis seed and rebuild the SQLite file
#   scripts/test-dbs.sh sqlite   # (re)build only docker/testdb.sqlite
#   scripts/test-dbs.sh status   # show container + health status
#
# Note: Postgres/MySQL/Mongo only run their SQL/JS seed on FIRST init (empty
# volume). Use `reset` to re-seed those from scratch.
set -euo pipefail
cd "$(dirname "$0")/.."

compose() { docker compose "$@"; }

up() {
  echo "› Starting databases…"
  compose up -d --wait postgres mysql mongodb redis
  echo "› Seeding Redis…"
  compose up --no-log-prefix redis-seed
  echo "› Building SQLite file…"
  bash scripts/make-sqlite-testdb.sh
  echo
  status
  echo
  echo "All set. Connection details: docker/README.md"
}

case "${1:-up}" in
  up) up ;;
  down) compose down ;;
  reset) compose down -v; up ;;
  seed)
    compose up --no-log-prefix redis-seed
    bash scripts/make-sqlite-testdb.sh
    ;;
  sqlite) bash scripts/make-sqlite-testdb.sh ;;
  status) compose ps ;;
  *) echo "usage: $0 {up|down|reset|seed|sqlite|status}" >&2; exit 1 ;;
esac
