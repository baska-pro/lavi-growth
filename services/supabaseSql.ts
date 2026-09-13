// Secure Supabase schema for Lavi Growth v1.0.1+
// All browser access goes through SECURITY DEFINER RPC functions. The anon key
// never receives direct SELECT/INSERT/UPDATE/DELETE access to health data.
export const SUPABASE_SQL_SCHEMA = `-- ==============================================================================
-- LAVI GROWTH - SECURE SUPABASE SCHEMA v1.0.1
-- Jalankan seluruh skrip ini di Supabase SQL Editor.
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.lavi_family_store (
  family_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pin_hash TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{
    "profiles": [],
    "records": [],
    "vaccines": [],
    "milestones": [],
    "targets": [],
    "reminders": [],
    "menstrualCycles": []
  }'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.lavi_security_guard (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.lavi_security_guard (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.lavi_family_store ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lavi_security_guard ENABLE ROW LEVEL SECURITY;

-- No direct RLS policy is intentionally created. Browser roles can only use RPCs.
REVOKE ALL ON TABLE public.lavi_family_store FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.lavi_security_guard FROM PUBLIC, anon, authenticated;

-- Lock down legacy tables from versions <= 1.0.0 when they exist.
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'profiles','health_records','vaccines','milestones','targets',
    'reminders','menstrual_cycles','app_pins'
  ] LOOP
    IF to_regclass('public.' || tbl) IS NOT NULL THEN
      EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC, anon, authenticated', tbl);
    END IF;
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.lavi_merge_array(p_existing JSONB, p_incoming JSONB)
RETURNS JSONB
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  result JSONB := COALESCE(p_existing, '[]'::jsonb);
  item JSONB;
  item_id TEXT;
BEGIN
  IF p_incoming IS NULL OR jsonb_typeof(p_incoming) <> 'array' THEN
    RETURN result;
  END IF;

  FOR item IN SELECT value FROM jsonb_array_elements(p_incoming)
  LOOP
    item_id := item->>'id';
    IF item_id IS NULL OR item_id = '' THEN
      CONTINUE;
    END IF;
    SELECT COALESCE(jsonb_agg(value), '[]'::jsonb)
      INTO result
      FROM jsonb_array_elements(result)
      WHERE value->>'id' IS DISTINCT FROM item_id;
    result := result || jsonb_build_array(item);
  END LOOP;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.lavi_remove_by_id(p_existing JSONB, p_id TEXT)
RETURNS JSONB
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT COALESCE(jsonb_agg(value), '[]'::jsonb)
  FROM jsonb_array_elements(COALESCE(p_existing, '[]'::jsonb))
  WHERE value->>'id' IS DISTINCT FROM p_id;
$$;

CREATE OR REPLACE FUNCTION public.lavi_remove_by_profile(p_existing JSONB, p_profile_id TEXT)
RETURNS JSONB
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT COALESCE(jsonb_agg(value), '[]'::jsonb)
  FROM jsonb_array_elements(COALESCE(p_existing, '[]'::jsonb))
  WHERE COALESCE(value->>'profileId', '') <> p_profile_id;
$$;

CREATE OR REPLACE FUNCTION public.lavi_family_id(p_pin TEXT, p_allow_create BOOLEAN DEFAULT FALSE)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  family UUID;
  guard public.lavi_security_guard%ROWTYPE;
  total_families BIGINT;
  next_attempts INTEGER;
BEGIN
  IF p_pin IS NULL OR p_pin !~ '^[0-9]{4,12}$' THEN
    RETURN NULL;
  END IF;

  SELECT * INTO guard
  FROM public.lavi_security_guard
  WHERE id = 1
  FOR UPDATE;

  IF guard.locked_until IS NOT NULL AND guard.locked_until > NOW() THEN
    RETURN NULL;
  END IF;

  SELECT family_id INTO family
  FROM public.lavi_family_store
  WHERE pin_hash = crypt(p_pin, pin_hash)
  LIMIT 1;

  IF family IS NOT NULL THEN
    UPDATE public.lavi_security_guard
      SET failed_attempts = 0, locked_until = NULL, updated_at = NOW()
      WHERE id = 1;
    RETURN family;
  END IF;

  SELECT COUNT(*) INTO total_families FROM public.lavi_family_store;
  IF p_allow_create AND total_families = 0 AND p_pin ~ '^[0-9]{6,12}$' THEN
    INSERT INTO public.lavi_family_store (pin_hash)
    VALUES (crypt(p_pin, gen_salt('bf', 10)))
    RETURNING family_id INTO family;

    UPDATE public.lavi_security_guard
      SET failed_attempts = 0, locked_until = NULL, updated_at = NOW()
      WHERE id = 1;
    RETURN family;
  END IF;

  next_attempts := guard.failed_attempts + 1;
  UPDATE public.lavi_security_guard
    SET failed_attempts = CASE WHEN next_attempts >= 5 THEN 0 ELSE next_attempts END,
        locked_until = CASE WHEN next_attempts >= 5 THEN NOW() + INTERVAL '5 minutes' ELSE NULL END,
        updated_at = NOW()
    WHERE id = 1;

  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.lavi_healthcheck()
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object('status', 'ok', 'schema', '1.0.1');
$$;

CREATE OR REPLACE FUNCTION public.lavi_check_pin(p_pin TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN public.lavi_family_id(p_pin, TRUE) IS NOT NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.lavi_pull(p_pin TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  family UUID;
  payload JSONB;
BEGIN
  family := public.lavi_family_id(p_pin, FALSE);
  IF family IS NULL THEN RETURN NULL; END IF;

  SELECT data INTO payload
  FROM public.lavi_family_store
  WHERE family_id = family;
  RETURN payload;
END;
$$;

CREATE OR REPLACE FUNCTION public.lavi_push(p_pin TEXT, p_payload JSONB)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  family UUID;
  current_data JSONB;
  key_name TEXT;
BEGIN
  family := public.lavi_family_id(p_pin, TRUE);
  IF family IS NULL THEN RETURN FALSE; END IF;

  SELECT data INTO current_data
  FROM public.lavi_family_store
  WHERE family_id = family
  FOR UPDATE;

  FOREACH key_name IN ARRAY ARRAY[
    'profiles','records','vaccines','milestones','targets','reminders','menstrualCycles'
  ] LOOP
    IF p_payload ? key_name AND p_payload->key_name IS NOT NULL
       AND jsonb_typeof(p_payload->key_name) = 'array' THEN
      current_data := jsonb_set(
        current_data,
        ARRAY[key_name],
        public.lavi_merge_array(current_data->key_name, p_payload->key_name),
        TRUE
      );
    END IF;
  END LOOP;

  UPDATE public.lavi_family_store
    SET data = current_data, updated_at = NOW()
    WHERE family_id = family;
  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.lavi_delete(p_pin TEXT, p_type TEXT, p_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  family UUID;
  current_data JSONB;
  key_name TEXT;
BEGIN
  family := public.lavi_family_id(p_pin, FALSE);
  IF family IS NULL THEN RETURN FALSE; END IF;

  key_name := CASE p_type
    WHEN 'profile' THEN 'profiles'
    WHEN 'record' THEN 'records'
    WHEN 'vaccine' THEN 'vaccines'
    WHEN 'milestone' THEN 'milestones'
    WHEN 'target' THEN 'targets'
    WHEN 'reminder' THEN 'reminders'
    WHEN 'cycle' THEN 'menstrualCycles'
    ELSE NULL
  END;
  IF key_name IS NULL THEN RETURN FALSE; END IF;

  SELECT data INTO current_data
  FROM public.lavi_family_store
  WHERE family_id = family
  FOR UPDATE;

  current_data := jsonb_set(
    current_data,
    ARRAY[key_name],
    public.lavi_remove_by_id(current_data->key_name, p_id),
    TRUE
  );

  IF p_type = 'profile' THEN
    FOREACH key_name IN ARRAY ARRAY[
      'records','vaccines','milestones','targets','reminders','menstrualCycles'
    ] LOOP
      current_data := jsonb_set(
        current_data,
        ARRAY[key_name],
        public.lavi_remove_by_profile(current_data->key_name, p_id),
        TRUE
      );
    END LOOP;
  END IF;

  UPDATE public.lavi_family_store
    SET data = current_data, updated_at = NOW()
    WHERE family_id = family;
  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.lavi_update_pin(p_old_pin TEXT, p_new_pin TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  family UUID;
BEGIN
  IF p_new_pin IS NULL OR p_new_pin !~ '^[0-9]{6,12}$' THEN
    RETURN FALSE;
  END IF;

  family := public.lavi_family_id(p_old_pin, FALSE);
  IF family IS NULL THEN RETURN FALSE; END IF;

  UPDATE public.lavi_family_store
    SET pin_hash = crypt(p_new_pin, gen_salt('bf', 10)), updated_at = NOW()
    WHERE family_id = family;
  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.lavi_reset(p_pin TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  family UUID;
BEGIN
  family := public.lavi_family_id(p_pin, FALSE);
  IF family IS NULL THEN RETURN FALSE; END IF;
  DELETE FROM public.lavi_family_store WHERE family_id = family;
  RETURN TRUE;
END;
$$;

-- Helper functions are private implementation details.
REVOKE ALL ON FUNCTION public.lavi_merge_array(JSONB, JSONB) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.lavi_remove_by_id(JSONB, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.lavi_remove_by_profile(JSONB, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.lavi_family_id(TEXT, BOOLEAN) FROM PUBLIC, anon, authenticated;

-- Only the narrow RPC surface is callable from the browser.
GRANT EXECUTE ON FUNCTION public.lavi_healthcheck() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.lavi_check_pin(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.lavi_pull(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.lavi_push(TEXT, JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.lavi_delete(TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.lavi_update_pin(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.lavi_reset(TEXT) TO anon, authenticated;

COMMENT ON TABLE public.lavi_family_store IS
  'Encrypted-at-rest-by-provider JSON store. PIN is bcrypt-hashed; no direct anon table access.';
`;
