-- Add icon and color fields to groups table
-- Migration: 20241101000005_add_group_icons_colors.sql

-- Add icon and color columns to groups table
alter table public.groups 
add column icon text,
add column color text;

-- Update existing groups with default icons and colors
-- Based on common expense categories
update public.groups set 
  icon = case 
    when lower(name) like '%food%' or lower(name) like '%dining%' or lower(name) like '%restaurant%' then 'utensils'
    when lower(name) like '%transport%' or lower(name) like '%taxi%' or lower(name) like '%grab%' or lower(name) like '%fuel%' then 'car'
    when lower(name) like '%shop%' or lower(name) like '%clothes%' or lower(name) like '%electronics%' then 'shopping-bag'
    when lower(name) like '%bill%' or lower(name) like '%utilities%' or lower(name) like '%rent%' or lower(name) like '%electric%' then 'receipt'
    when lower(name) like '%entertainment%' or lower(name) like '%movie%' or lower(name) like '%game%' then 'film'
    when lower(name) like '%health%' or lower(name) like '%fitness%' or lower(name) like '%gym%' or lower(name) like '%medical%' then 'heart'
    when lower(name) like '%education%' or lower(name) like '%course%' or lower(name) like '%book%' or lower(name) like '%training%' then 'book-open'
    when lower(name) like '%travel%' or lower(name) like '%hotel%' or lower(name) like '%flight%' then 'plane'
    else 'tag'
  end,
  color = case 
    when lower(name) like '%food%' or lower(name) like '%dining%' or lower(name) like '%restaurant%' then 'emerald'
    when lower(name) like '%transport%' or lower(name) like '%taxi%' or lower(name) like '%grab%' or lower(name) like '%fuel%' then 'blue'
    when lower(name) like '%shop%' or lower(name) like '%clothes%' or lower(name) like '%electronics%' then 'purple'
    when lower(name) like '%bill%' or lower(name) like '%utilities%' or lower(name) like '%rent%' or lower(name) like '%electric%' then 'orange'
    when lower(name) like '%entertainment%' or lower(name) like '%movie%' or lower(name) like '%game%' then 'pink'
    when lower(name) like '%health%' or lower(name) like '%fitness%' or lower(name) like '%gym%' or lower(name) like '%medical%' then 'red'
    when lower(name) like '%education%' or lower(name) like '%course%' or lower(name) like '%book%' or lower(name) like '%training%' then 'indigo'
    when lower(name) like '%travel%' or lower(name) like '%hotel%' or lower(name) like '%flight%' then 'cyan'
    else 'gray'
  end
where icon is null and color is null;

-- Add default icon and color for new groups
alter table public.groups 
alter column icon set default 'tag',
alter column color set default 'gray';
