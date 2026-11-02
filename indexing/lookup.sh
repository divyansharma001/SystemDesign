#!/bin/sh
# How a database finds one row by ID without searching. Needs only Docker.
#   sh lookup.sh
# Loads 1,000,000 rows into Postgres, then shows: how deep the primary-key B-tree is,
# and how many pages one lookup by ID reads (EXPLAIN ANALYZE with BUFFERS).
set -e
docker run -d --rm --name idx-pg -e POSTGRES_PASSWORD=x postgres:16-alpine >/dev/null
trap 'docker stop idx-pg >/dev/null 2>&1' EXIT
until docker exec idx-pg pg_isready -U postgres >/dev/null 2>&1; do sleep 1; done
sleep 2
echo "loading 1,000,000 rows..."
docker exec idx-pg pgbench -U postgres -i -s 10 postgres >/dev/null 2>&1
q() { docker exec idx-pg psql -U postgres -tAc "$1"; }
q "CREATE EXTENSION IF NOT EXISTS pageinspect" >/dev/null
echo "rows:                $(q "SELECT count(*) FROM pgbench_accounts")"
echo "B-tree levels:       $(q "SELECT level + 1 FROM bt_metap('pgbench_accounts_pkey')")  (root to leaf)"
echo "index pages (8 KB):  $(q "SELECT pg_relation_size('pgbench_accounts_pkey') / 8192")"
echo
echo "one lookup by ID:"
docker exec idx-pg psql -U postgres -c "EXPLAIN (ANALYZE, BUFFERS, COSTS OFF) SELECT * FROM pgbench_accounts WHERE aid = 777777;" | grep -E "Index|Buffers|Execution"
echo
echo "(Buffers = pages touched: the index levels plus the row's page. Run it twice: the second run reads them from memory.)"
