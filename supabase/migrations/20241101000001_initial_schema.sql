-- Initial database schema for spends.ai
-- This migration creates all core tables and relationships

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- User settings table
create table public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  main_currency text not null default 'THB' check (main_currency in ('THB', 'USD')),
  include_archived_analytics boolean not null default false,
  updated_at timestamptz not null default now()
);

-- FX rates table for currency conversion
create table public.fx_rates (
  rate_date date primary key,
  usd_per_thb numeric not null check (usd_per_thb > 0),
  thb_per_usd numeric not null check (thb_per_usd > 0),
  manual boolean not null default false,
  fetched_at timestamptz not null default now()
);

-- Expense groups table
create table public.groups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  archived boolean not null default false,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Expense tags table
create table public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Main expenses/spends table
create table public.spends (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item text not null,
  amount integer not null check (amount > 0), -- stored as integers (cents/satang)
  currency text not null check (currency in ('THB', 'USD')),
  merchant text,
  group_id uuid references public.groups(id) on delete set null,
  tag_id uuid references public.tags(id) on delete set null,
  created_at timestamptz not null default now(),
  user_local_datetime timestamptz not null default now(),
  fx_rate_date date not null references public.fx_rates(rate_date),
  archived boolean not null default false,
  archived_at timestamptz
);

-- AI model tracking table for cost and performance monitoring
create table public.model_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  model text not null,
  input jsonb not null,
  output jsonb not null,
  cost numeric,
  created_at timestamptz not null default now()
);

-- Create indexes for performance
create index idx_spends_user_id on public.spends(user_id);
create index idx_spends_created_at on public.spends(created_at desc);
create index idx_spends_user_created on public.spends(user_id, created_at desc);
create index idx_spends_group_id on public.spends(group_id);
create index idx_spends_tag_id on public.spends(tag_id);
create index idx_spends_archived on public.spends(archived);
create index idx_groups_user_id on public.groups(user_id);
create index idx_tags_user_id on public.tags(user_id);
create index idx_model_runs_user_id on public.model_runs(user_id);
create index idx_model_runs_created_at on public.model_runs(created_at desc);

-- Create unique indexes for case-insensitive unique names per user
create unique index idx_groups_user_name_unique on public.groups(user_id, lower(name));
create unique index idx_tags_user_name_unique on public.tags(user_id, lower(name));

-- Create functions for automatic timestamp updates
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create triggers for updated_at columns
create trigger handle_user_settings_updated_at
  before update on public.user_settings
  for each row execute function public.handle_updated_at();

create trigger handle_groups_updated_at
  before update on public.groups
  for each row execute function public.handle_updated_at();

create trigger handle_tags_updated_at
  before update on public.tags
  for each row execute function public.handle_updated_at();

-- Archive triggers
create or replace function public.handle_archive_timestamp()
returns trigger as $$
begin
  if new.archived = true and old.archived = false then
    new.archived_at = now();
  elsif new.archived = false and old.archived = true then
    new.archived_at = null;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger handle_groups_archive_timestamp
  before update on public.groups
  for each row execute function public.handle_archive_timestamp();

create trigger handle_spends_archive_timestamp
  before update on public.spends
  for each row execute function public.handle_archive_timestamp();