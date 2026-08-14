#!/usr/bin/env bash
# Load the generated schema + data into the running containers.
# Idempotent: re-running truncates and reloads each table.
set -euo pipefail
cd "$(dirname "$0")"

for pair in "tqhf:legacy-tqhf" "quyq:legacy-quyq"; do
  label="${pair%%:*}"; container="${pair##*:}"
  echo "=== $label ==="
  if ! docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
    echo "  container $container not running — start it with: docker compose up -d"; exit 1
  fi
  echo "  waiting for postgres..."
  until docker exec "$container" pg_isready -U postgres -d "$label" >/dev/null 2>&1; do sleep 1; done

  echo "  creating schema..."
  docker exec -i "$container" psql -v ON_ERROR_STOP=1 -q -U postgres -d "$label" < "out/$label/01-schema.sql"

  echo "  loading data..."
  # truncate first so reloads don't duplicate
  docker exec -i "$container" psql -q -U postgres -d "$label" -c "
    do \$\$ declare r record; begin
      for r in (select schemaname, tablename from pg_tables
                where schemaname not in ('pg_catalog','information_schema'))
      loop execute format('truncate table %I.%I', r.schemaname, r.tablename); end loop;
    end \$\$;" >/dev/null

  # \copy runs client-side; run psql inside the container where /restore is mounted
  docker exec -i -w /restore "$container" psql -v ON_ERROR_STOP=1 -q -U postgres -d "$label" -f 03-load.sql

  echo "  verifying..."
  docker exec -i "$container" psql -U postgres -d "$label" -At -c "
    select coalesce(sum(n_live_tup),0) from pg_stat_user_tables;" | xargs echo "  rows loaded:"
done
echo
echo "Done. Connect with:"
echo "  psql postgresql://postgres:localonly@localhost:55432/tqhf   # old website/analytics"
echo "  psql postgresql://postgres:localonly@localhost:55433/quyq   # old email"
