-- Update analytics views to include group icons and colors
-- Migration: 20241101000006_update_views.sql

-- Update spends_with_conversions view to include group icon and color
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
  g.icon as group_icon,
  g.color as group_color,
  t.name as tag_name,
  fx.thb_per_usd,
  fx.usd_per_thb
from public.spends s
left join public.groups g on s.group_id = g.id
left join public.tags t on s.tag_id = t.id
left join public.fx_rates fx on s.fx_rate_date = fx.rate_date;
