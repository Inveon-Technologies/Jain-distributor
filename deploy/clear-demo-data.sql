-- Removes every village, shop, salesperson, order and visit, keeping only admin accounts.
-- Use it once to clear the old demo seed before real use starts. It deletes real data too,
-- so take a backup first (deploy/backup-db.sh) and do not run it after salespersons start working.
--
--   docker compose -f docker-compose.prod.yml exec -T db \
--     sh -c 'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"' < clear-demo-data.sql

\echo 'Rows before:'
SELECT (SELECT count(*) FROM villages) AS villages,
       (SELECT count(*) FROM shops) AS shops,
       (SELECT count(*) FROM users WHERE role = 'SALESPERSON') AS salespersons,
       (SELECT count(*) FROM orders) AS orders,
       (SELECT count(*) FROM visits) AS visits;

BEGIN;
DELETE FROM visits;
DELETE FROM orders;
DELETE FROM salesperson_villages;
DELETE FROM shops;
DELETE FROM villages;
DELETE FROM users WHERE role <> 'ADMIN';
ALTER SEQUENCE order_number_seq RESTART WITH 1001;
COMMIT;

\echo 'Rows after (admins kept):'
SELECT (SELECT count(*) FROM villages) AS villages,
       (SELECT count(*) FROM shops) AS shops,
       (SELECT count(*) FROM users WHERE role = 'SALESPERSON') AS salespersons,
       (SELECT count(*) FROM orders) AS orders,
       (SELECT count(*) FROM users WHERE role = 'ADMIN') AS admins;
