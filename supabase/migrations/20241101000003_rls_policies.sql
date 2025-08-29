-- Row Level Security (RLS) policies
-- This migration creates security policies to ensure users can only access their own data

-- User settings policies
create policy "Users can view own settings" on public.user_settings
  for select using (auth.uid() = user_id);

create policy "Users can update own settings" on public.user_settings
  for update using (auth.uid() = user_id);

create policy "Users can insert own settings" on public.user_settings
  for insert with check (auth.uid() = user_id);

-- Groups policies
create policy "Users can view own groups" on public.groups
  for select using (auth.uid() = user_id);

create policy "Users can insert own groups" on public.groups
  for insert with check (auth.uid() = user_id);

create policy "Users can update own groups" on public.groups
  for update using (auth.uid() = user_id);

create policy "Users can delete own groups" on public.groups
  for delete using (auth.uid() = user_id);

-- Tags policies
create policy "Users can view own tags" on public.tags
  for select using (auth.uid() = user_id);

create policy "Users can insert own tags" on public.tags
  for insert with check (auth.uid() = user_id);

create policy "Users can update own tags" on public.tags
  for update using (auth.uid() = user_id);

create policy "Users can delete own tags" on public.tags
  for delete using (auth.uid() = user_id);

-- Spends policies
create policy "Users can view own spends" on public.spends
  for select using (auth.uid() = user_id);

create policy "Users can insert own spends" on public.spends
  for insert with check (auth.uid() = user_id);

create policy "Users can update own spends" on public.spends
  for update using (auth.uid() = user_id);

create policy "Users can delete own spends" on public.spends
  for delete using (auth.uid() = user_id);

-- Model runs policies
create policy "Users can view own model runs" on public.model_runs
  for select using (auth.uid() = user_id);

create policy "Users can insert own model runs" on public.model_runs
  for insert with check (auth.uid() = user_id);

-- FX rates policies (read-only for all authenticated users)
create policy "Authenticated users can view fx rates" on public.fx_rates
  for select using (auth.role() = 'authenticated');

-- Service role can manage FX rates
create policy "Service role can manage fx rates" on public.fx_rates
  for all using (auth.role() = 'service_role');

-- Create helper functions for data validation

-- Function to validate group belongs to user
create or replace function public.user_owns_group(group_uuid uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.groups 
    where id = group_uuid and user_id = auth.uid()
  );
end;
$$ language plpgsql security definer;

-- Function to validate tag belongs to user
create or replace function public.user_owns_tag(tag_uuid uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.tags 
    where id = tag_uuid and user_id = auth.uid()
  );
end;
$$ language plpgsql security definer;

-- Additional constraints to ensure foreign key integrity with RLS
alter table public.spends add constraint spends_valid_group_owner 
  check (group_id is null or public.user_owns_group(group_id));

alter table public.spends add constraint spends_valid_tag_owner 
  check (tag_id is null or public.user_owns_tag(tag_id));
