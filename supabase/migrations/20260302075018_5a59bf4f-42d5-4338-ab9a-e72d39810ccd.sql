-- Schedule daily phenology aggregation using pg_cron
-- Runs aggregate_phenology() every day at 03:00 UTC
SELECT cron.schedule(
  'daily-phenology-aggregation',
  '0 3 * * *',
  $$SELECT public.aggregate_phenology()$$
);