-- Insert initial FX rates for the current date to enable testing
-- This allows expenses to be created with valid fx_rate_date references

INSERT INTO public.fx_rates (rate_date, usd_per_thb, thb_per_usd, manual, fetched_at)
VALUES 
  -- Today's rate
  (CURRENT_DATE, 0.0286, 35.0, true, NOW()),
  -- Yesterday's rate (in case we need it)
  (CURRENT_DATE - INTERVAL '1 day', 0.0287, 34.8, true, NOW()),
  -- Some historical rates for testing
  (CURRENT_DATE - INTERVAL '2 days', 0.0285, 35.1, true, NOW()),
  (CURRENT_DATE - INTERVAL '3 days', 0.0288, 34.7, true, NOW())
ON CONFLICT (rate_date) 
DO UPDATE SET 
  usd_per_thb = EXCLUDED.usd_per_thb,
  thb_per_usd = EXCLUDED.thb_per_usd,
  manual = EXCLUDED.manual,
  fetched_at = EXCLUDED.fetched_at;
