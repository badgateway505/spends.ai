-- Update analytics views to include group icons and colors
-- Migration: 20241101000006_update_views.sql

-- Drop dependent views to safely change base view columns
drop view if exists public.group_spending_summary;
drop view if exists public.daily_spending_summary;
drop view if exists public.spends_with_conversions;

-- Recreate spends_with_conversions view with group icon and color
create or replace view public.spends_with_conversions as
select 
  s.*,
  -- Convert to THB
  case 
    when s.currency = 'THB' then s.amount
    else round(s.amount * fx.thb_per_usd)
  end as amount_thb,
  -- Convert to USD  
  case 
    when s.currency = 'USD' then s.amount
    else round(s.amount * fx.usd_per_thb)
  end as amount_usd,
  -- Group and tag names for easier querying
  g.name as group_name,
  t.name as tag_name,
  fx.thb_per_usd,
  fx.usd_per_thb,
  -- New fields appended to avoid rename constraints
  g.icon as group_icon,
  g.color as group_color
from public.spends s
left join public.groups g on s.group_id = g.id
left join public.tags t on s.tag_id = t.id
left join public.fx_rates fx on s.fx_rate_date = fx.rate_date;

-- Recreate daily_spending_summary view
create or replace view public.daily_spending_summary as
select 
  user_id,
  date(user_local_datetime) as spend_date,
  currency,
  count(*) as transaction_count,
  sum(amount) as total_amount,
  sum(amount_thb) as total_thb,
  sum(amount_usd) as total_usd
from public.spends_with_conversions
where not archived
group by user_id, date(user_local_datetime), currency;

-- Recreate group_spending_summary view
create or replace view public.group_spending_summary as
select 
  user_id,
  group_id,
  group_name,
  count(*) as transaction_count,
  sum(amount_thb) as total_thb,
  sum(amount_usd) as total_usd,
  avg(amount_thb) as avg_thb,
  avg(amount_usd) as avg_usd,
  min(created_at) as first_spend,
  max(created_at) as last_spend
from public.spends_with_conversions
where not archived
group by user_id, group_id, group_name;

-- Ensure grants
grant select on public.spends_with_conversions to authenticated;
grant select on public.daily_spending_summary to authenticated;
grant select on public.group_spending_summary to authenticated;
