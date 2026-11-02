#!/bin/sh
# Redis vs Postgres, one client, everything on this machine. Needs only Docker.
#   sh benchmark.sh
# 1. Read one row by primary key: Postgres (pgbench, 1,000,000 rows) vs Redis GET.
# 2. A heavy query (sum over 1,000,000 rows): Postgres runs it every time, Redis returns the saved answer.
set -e
docker run -d --rm --name bench-redis redis:7-alpine >/dev/null
docker run -d --rm --name bench-pg -e POSTGRES_PASSWORD=bench postgres:16-alpine >/dev/null
trap 'docker stop bench-redis bench-pg >/dev/null 2>&1' EXIT
until docker exec bench-pg pg_isready -U postgres >/dev/null 2>&1; do sleep 1; done
sleep 2
echo "loading 1,000,000 rows into Postgres..."
docker exec bench-pg pgbench -U postgres -i -s 10 postgres >/dev/null 2>&1

echo
echo "1. Read one row by primary key"
printf "   Postgres: "
docker exec bench-pg pgbench -U postgres -S -c 1 -T 15 postgres 2>/dev/null | grep "latency average"
printf "   Redis:    "
docker exec bench-redis redis-cli set user:42 '{"id":42,"name":"divyansh"}' >/dev/null
docker exec bench-redis redis-benchmark -n 200000 -c 1 -q get user:42 2>/dev/null | tr '\r' '\n' | tail -1

echo
echo "2. Sum balances over 1,000,000 rows"
printf "   Postgres (runs the query): "
docker exec bench-pg sh -c "echo 'SELECT bid, sum(abalance), count(*) FROM pgbench_accounts GROUP BY bid ORDER BY 2 DESC LIMIT 10;' > /tmp/heavy.sql && pgbench -U postgres -n -f /tmp/heavy.sql -c 1 -T 15 postgres 2>/dev/null | grep 'latency average'"
ANSWER=$(docker exec bench-pg psql -U postgres -tAc "SELECT json_agg(t) FROM (SELECT bid, sum(abalance), count(*) FROM pgbench_accounts GROUP BY bid ORDER BY 2 DESC LIMIT 10) t")
docker exec bench-redis redis-cli set totals "$ANSWER" >/dev/null
printf "   Redis (returns the saved answer): "
docker exec bench-redis redis-benchmark -n 200000 -c 1 -q get totals 2>/dev/null | tr '\r' '\n' | tail -1
