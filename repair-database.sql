-- Database Repair Script for spends.ai
-- Run this script to fix the corrupted database schema

-- First, drop the invalid table that was created by mistake
DROP TABLE IF EXISTS public."20241101000001_initial_schema.sql";

-- Enable RLS on all tables (in case it was disabled)
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fx_rates ENABLE ROW LEVEL SECURITY;

-- Recreate the user_owns functions (in case they're missing)
CREATE OR REPLACE FUNCTION public.user_owns_group(group_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.groups 
    WHERE id = group_uuid AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.user_owns_tag(tag_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.tags 
    WHERE id = tag_uuid AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the get_user_settings function with proper syntax
CREATE OR REPLACE FUNCTION public.get_user_settings()
RETURNS public.user_settings AS $$
DECLARE
  user_settings_record public.user_settings;
BEGIN
  -- Try to get existing settings
  SELECT * INTO user_settings_record 
  FROM public.user_settings 
  WHERE user_id = auth.uid();
  
  -- If no settings exist, create default ones
  IF user_settings_record.user_id IS NULL THEN
    INSERT INTO public.user_settings (user_id, main_currency, include_archived_analytics)
    VALUES (auth.uid(), 'THB', false)
    RETURNING * INTO user_settings_record;
  END IF;
  
  RETURN user_settings_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate other essential functions
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.handle_archive_timestamp()
RETURNS trigger AS $$
BEGIN
  IF new.archived = true AND old.archived = false THEN
    new.archived_at = now();
  ELSIF new.archived = false AND old.archived = true THEN
    new.archived_at = null;
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql;

-- Ensure all RLS policies exist
DO $$ 
BEGIN
  -- User settings policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_settings' AND policyname = 'Users can view own settings') THEN
    EXECUTE 'CREATE POLICY "Users can view own settings" ON public.user_settings FOR SELECT USING (auth.uid() = user_id)';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_settings' AND policyname = 'Users can update own settings') THEN
    EXECUTE 'CREATE POLICY "Users can update own settings" ON public.user_settings FOR UPDATE USING (auth.uid() = user_id)';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_settings' AND policyname = 'Users can insert own settings') THEN
    EXECUTE 'CREATE POLICY "Users can insert own settings" ON public.user_settings FOR INSERT WITH CHECK (auth.uid() = user_id)';
  END IF;

  -- Groups policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'groups' AND policyname = 'Users can view own groups') THEN
    EXECUTE 'CREATE POLICY "Users can view own groups" ON public.groups FOR SELECT USING (auth.uid() = user_id)';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'groups' AND policyname = 'Users can insert own groups') THEN
    EXECUTE 'CREATE POLICY "Users can insert own groups" ON public.groups FOR INSERT WITH CHECK (auth.uid() = user_id)';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'groups' AND policyname = 'Users can update own groups') THEN
    EXECUTE 'CREATE POLICY "Users can update own groups" ON public.groups FOR UPDATE USING (auth.uid() = user_id)';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'groups' AND policyname = 'Users can delete own groups') THEN
    EXECUTE 'CREATE POLICY "Users can delete own groups" ON public.groups FOR DELETE USING (auth.uid() = user_id)';
  END IF;

  -- Tags policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tags' AND policyname = 'Users can view own tags') THEN
    EXECUTE 'CREATE POLICY "Users can view own tags" ON public.tags FOR SELECT USING (auth.uid() = user_id)';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tags' AND policyname = 'Users can insert own tags') THEN
    EXECUTE 'CREATE POLICY "Users can insert own tags" ON public.tags FOR INSERT WITH CHECK (auth.uid() = user_id)';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tags' AND policyname = 'Users can update own tags') THEN
    EXECUTE 'CREATE POLICY "Users can update own tags" ON public.tags FOR UPDATE USING (auth.uid() = user_id)';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tags' AND policyname = 'Users can delete own tags') THEN
    EXECUTE 'CREATE POLICY "Users can delete own tags" ON public.tags FOR DELETE USING (auth.uid() = user_id)';
  END IF;

  -- Spends policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'spends' AND policyname = 'Users can view own spends') THEN
    EXECUTE 'CREATE POLICY "Users can view own spends" ON public.spends FOR SELECT USING (auth.uid() = user_id)';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'spends' AND policyname = 'Users can insert own spends') THEN
    EXECUTE 'CREATE POLICY "Users can insert own spends" ON public.spends FOR INSERT WITH CHECK (auth.uid() = user_id)';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'spends' AND policyname = 'Users can update own spends') THEN
    EXECUTE 'CREATE POLICY "Users can update own spends" ON public.spends FOR UPDATE USING (auth.uid() = user_id)';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'spends' AND policyname = 'Users can delete own spends') THEN
    EXECUTE 'CREATE POLICY "Users can delete own spends" ON public.spends FOR DELETE USING (auth.uid() = user_id)';
  END IF;

  -- FX rates policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'fx_rates' AND policyname = 'Authenticated users can view fx rates') THEN
    EXECUTE 'CREATE POLICY "Authenticated users can view fx rates" ON public.fx_rates FOR SELECT USING (auth.role() = ''authenticated'')';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'fx_rates' AND policyname = 'Service role can manage fx rates') THEN
    EXECUTE 'CREATE POLICY "Service role can manage fx rates" ON public.fx_rates FOR ALL USING (auth.role() = ''service_role'')';
  END IF;

END $$;

-- Insert today's FX rate if it doesn't exist
INSERT INTO public.fx_rates (rate_date, usd_per_thb, thb_per_usd, manual, fetched_at)
VALUES (CURRENT_DATE, 0.027, 37.0, true, NOW())
ON CONFLICT (rate_date) DO NOTHING;

-- Insert yesterday's FX rate if it doesn't exist (fallback)
INSERT INTO public.fx_rates (rate_date, usd_per_thb, thb_per_usd, manual, fetched_at)
VALUES (CURRENT_DATE - INTERVAL '1 day', 0.027, 37.0, true, NOW())
ON CONFLICT (rate_date) DO NOTHING;

-- Ensure triggers exist
DROP TRIGGER IF EXISTS handle_user_settings_updated_at ON public.user_settings;
CREATE TRIGGER handle_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_groups_updated_at ON public.groups;
CREATE TRIGGER handle_groups_updated_at
  BEFORE UPDATE ON public.groups
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_tags_updated_at ON public.tags;
CREATE TRIGGER handle_tags_updated_at
  BEFORE UPDATE ON public.tags
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_groups_archive_timestamp ON public.groups;
CREATE TRIGGER handle_groups_archive_timestamp
  BEFORE UPDATE ON public.groups
  FOR EACH ROW EXECUTE FUNCTION public.handle_archive_timestamp();

DROP TRIGGER IF EXISTS handle_spends_archive_timestamp ON public.spends;
CREATE TRIGGER handle_spends_archive_timestamp
  BEFORE UPDATE ON public.spends
  FOR EACH ROW EXECUTE FUNCTION public.handle_archive_timestamp();

-- Success message
SELECT 'Database repair completed successfully!' as result;
