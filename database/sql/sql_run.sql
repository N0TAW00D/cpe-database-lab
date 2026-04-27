\set ON_ERROR_STOP on

-- Safe deploy script — creates missing tables and inserts seed data without dropping anything.
-- Safe to rerun on an existing database: uses IF NOT EXISTS and ON CONFLICT DO NOTHING.
-- For a full reset (drop + recreate), use sql_reset.sql instead.
-- Example usage: psql -f sql_run.sql
-- Database: PostgreSQL (Docker)

\ir 001_schema.sql
\ir invoice_lab3_delta.sql
\ir invoice_lab4_delta.sql
\ir 003_seed.sql
