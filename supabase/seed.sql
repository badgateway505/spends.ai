-- Supabase AI is experimental and may produce inaccurate information
-- Always verify important information independently

-- Insert initial data for development
-- This will be loaded after migrations during `supabase db reset`

-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Example development data (users will be handled by auth system)
-- Groups
insert into public.groups (id, user_id, name, description, archived, created_at, updated_at) 
select 
  gen_random_uuid(),
  auth.uid(),
  unnest(array['Food', 'Transport', 'Monthly payments']),
  unnest(array['Restaurants, cafes, groceries, and food delivery', 'Taxi, Grab, public transport, fuel, and parking', 'Rent, utilities, subscriptions, and recurring bills']),
  false,
  now(),
  now()
where auth.uid() is not null;

-- Tags
insert into public.tags (id, user_id, name, description, created_at, updated_at)
select 
  gen_random_uuid(),
  auth.uid(),
  unnest(array['work', 'personal', 'family', 'urgent', 'subscription', 'one-time']),
  unnest(array['Work-related expenses', 'Personal purchases', 'Family/household', 'Urgent/emergency', 'Recurring subscription', 'One-time purchase']),
  now(),
  now()
where auth.uid() is not null;

-- FX Rates (example current rates)
insert into public.fx_rates (rate_date, usd_per_thb, thb_per_usd, manual, fetched_at)
values 
  (current_date, 0.027, 37.0, false, now()),
  (current_date - interval '1 day', 0.0269, 37.15, false, now() - interval '1 day'),
  (current_date - interval '2 days', 0.0268, 37.3, false, now() - interval '2 days');

-- User settings (will be created for authenticated users)
insert into public.user_settings (user_id, main_currency, include_archived_analytics, updated_at)
select 
  auth.uid(),
  'THB',
  false,
  now()
where auth.uid() is not null;
