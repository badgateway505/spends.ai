-- Analytics views and functions
-- This migration creates views and functions for efficient analytics queries

-- Drop existing views first (in reverse dependency order)
DROP VIEW IF EXISTS public.group_spending_summary;
DROP VIEW IF EXISTS public.daily_spending_summary;
DROP VIEW IF EXISTS public.spends_with_conversions;

-- Create view for spends with converted amounts
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
  fx.usd_per_thb
from public.spends s
left join public.groups g on s.group_id = g.id
left join public.tags t on s.tag_id = t.id
left join public.fx_rates fx on s.fx_rate_date = fx.rate_date;

-- Daily spending summary view (FIXED)
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

-- Group spending summary view
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

-- Analytics function: Get spending summary for date range
create or replace function public.get_spending_summary(
  start_date timestamptz,
  end_date timestamptz,
  include_archived boolean default false
)
returns table (
  total_transactions bigint,
  total_thb numeric,
  total_usd numeric,
  avg_thb numeric,
  avg_usd numeric,
  currency_breakdown jsonb,
  top_groups jsonb,
  daily_totals jsonb
) as $$
declare
  archive_filter boolean := include_archived;
begin
  return query
  with filtered_spends as (
    select * from public.spends_with_conversions
    where user_id = auth.uid()
      and created_at between start_date and end_date
      and (archive_filter or not archived)
  ),
  currency_stats as (
    select 
      currency,
      count(*) as count,
      sum(amount) as total
    from filtered_spends
    group by currency
  ),
  group_stats as (
    select 
      group_name,
      sum(amount_thb) as total_thb,
      count(*) as count
    from filtered_spends
    where group_name is not null
    group by group_name
    order by total_thb desc
    limit 5
  ),
  daily_stats as (
    select 
      date(user_local_datetime) as day,
      sum(amount_thb) as total_thb
    from filtered_spends
    group by date(user_local_datetime)
    order by day
  )
  select 
    (select count(*) from filtered_spends)::bigint,
    (select coalesce(sum(amount_thb), 0) from filtered_spends)::numeric,
    (select coalesce(sum(amount_usd), 0) from filtered_spends)::numeric,
    (select coalesce(avg(amount_thb), 0) from filtered_spends)::numeric,
    (select coalesce(avg(amount_usd), 0) from filtered_spends)::numeric,
    (select coalesce(jsonb_agg(to_jsonb(currency_stats)), '[]'::jsonb) from currency_stats),
    (select coalesce(jsonb_agg(to_jsonb(group_stats)), '[]'::jsonb) from group_stats),
    (select coalesce(jsonb_agg(to_jsonb(daily_stats)), '[]'::jsonb) from daily_stats);
end;
$$ language plpgsql security definer;

-- Function: Get group spending breakdown
create or replace function public.get_group_breakdown(
  start_date timestamptz,
  end_date timestamptz,
  include_archived boolean default false
)
returns table (
  group_id uuid,
  group_name text,
  transaction_count bigint,
  total_thb numeric,
  total_usd numeric,
  percentage_of_total numeric
) as $$
begin
  return query
  with user_total as (
    select sum(amount_thb) as total from public.spends_with_conversions
    where user_id = auth.uid()
      and created_at between start_date and end_date
      and (include_archived or not archived)
  )
  select 
    s.group_id,
    s.group_name,
    count(*)::bigint as transaction_count,
    sum(s.amount_thb)::numeric as total_thb,
    sum(s.amount_usd)::numeric as total_usd,
    case 
      when ut.total > 0 then round((sum(s.amount_thb) / ut.total * 100)::numeric, 2)
      else 0::numeric
    end as percentage_of_total
  from public.spends_with_conversions s
  cross join user_total ut
  where s.user_id = auth.uid()
    and s.created_at between start_date and end_date
    and (include_archived or not s.archived)
  group by s.group_id, s.group_name, ut.total
  order by total_thb desc;
end;
$$ language plpgsql security definer;

-- Enable RLS on views (they inherit from base tables)
-- Views automatically respect RLS from underlying tables

-- Grant access to views for authenticated users
grant select on public.spends_with_conversions to authenticated;
grant select on public.daily_spending_summary to authenticated;
grant select on public.group_spending_summary to authenticated;