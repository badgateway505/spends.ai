-- Authentication setup and user management
-- This migration configures auth settings and creates user-related functions

-- Enable auth schema if not already enabled
-- This is handled by Supabase automatically, but we document the requirements

-- Create function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  -- Create user settings with defaults
  insert into public.user_settings (user_id, main_currency, include_archived_analytics)
  values (new.id, 'THB', false);
  
  -- Create default expense groups for new user
  insert into public.groups (user_id, name, description, archived, created_at, updated_at)
  values 
    (new.id, 'Food & Dining', 'Restaurants, cafes, groceries, and food delivery', false, now(), now()),
    (new.id, 'Transportation', 'Taxi, Grab, public transport, fuel, and parking', false, now(), now()),
    (new.id, 'Shopping', 'Clothes, electronics, books, and general purchases', false, now(), now()),
    (new.id, 'Bills & Utilities', 'Electricity, water, internet, phone, and rent', false, now(), now()),
    (new.id, 'Entertainment', 'Movies, concerts, games, and recreational activities', false, now(), now()),
    (new.id, 'Health & Fitness', 'Healthcare, gym, sports, and wellness', false, now(), now()),
    (new.id, 'Education', 'Courses, books, training, and educational materials', false, now(), now()),
    (new.id, 'Travel', 'Hotels, flights, and travel-related expenses', false, now(), now());
  
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create user settings on signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Function to get current user's settings
create or replace function public.get_user_settings()
returns public.user_settings as $$
declare
  user_settings_record public.user_settings;
begin
  -- Try to get existing settings
  select * into user_settings_record 
  from public.user_settings 
  where user_id = auth.uid();
  
  -- If no settings exist, create default ones
  if user_settings_record.user_id is null then
    insert into public.user_settings (user_id, main_currency, include_archived_analytics)
    values (auth.uid(), 'THB', false)
    returning * into user_settings_record;
  end if;
  
  return user_settings_record;
end;
$$ language plpgsql security definer;

-- Function to update user settings
create or replace function public.update_user_settings(
  new_main_currency text default null,
  new_include_archived boolean default null
)
returns public.user_settings as $$
declare
  updated_settings public.user_settings;
begin
  update public.user_settings
  set 
    main_currency = coalesce(new_main_currency, main_currency),
    include_archived_analytics = coalesce(new_include_archived, include_archived_analytics),
    updated_at = now()
  where user_id = auth.uid()
  returning * into updated_settings;
  
  return updated_settings;
end;
$$ language plpgsql security definer;

-- Function to ensure user has default groups (for existing users)
create or replace function public.ensure_default_groups()
returns void as $$
declare
  group_count integer;
begin
  -- Check if user already has groups
  select count(*) into group_count
  from public.groups
  where user_id = auth.uid() and archived = false;
  
  -- If no groups exist, create default ones
  if group_count = 0 then
    insert into public.groups (user_id, name, description, archived, created_at, updated_at)
    values 
      (auth.uid(), 'Food & Dining', 'Restaurants, cafes, groceries, and food delivery', false, now(), now()),
      (auth.uid(), 'Transportation', 'Taxi, Grab, public transport, fuel, and parking', false, now(), now()),
      (auth.uid(), 'Shopping', 'Clothes, electronics, books, and general purchases', false, now(), now()),
      (auth.uid(), 'Bills & Utilities', 'Electricity, water, internet, phone, and rent', false, now(), now()),
      (auth.uid(), 'Entertainment', 'Movies, concerts, games, and recreational activities', false, now(), now()),
      (auth.uid(), 'Health & Fitness', 'Healthcare, gym, sports, and wellness', false, now(), now()),
      (auth.uid(), 'Education', 'Courses, books, training, and educational materials', false, now(), now()),
      (auth.uid(), 'Travel', 'Hotels, flights, and travel-related expenses', false, now(), now());
  end if;
end;
$$ language plpgsql security definer;

-- Grant permissions for authenticated users
grant usage on schema public to authenticated;
grant all on all tables in schema public to authenticated;
grant all on all sequences in schema public to authenticated;
grant execute on all functions in schema public to authenticated;

-- Ensure RLS is enabled on all tables
alter table public.user_settings enable row level security;
alter table public.groups enable row level security;
alter table public.tags enable row level security;
alter table public.spends enable row level security;
alter table public.model_runs enable row level security;

-- FX rates table should be readable by all authenticated users
alter table public.fx_rates enable row level security;
