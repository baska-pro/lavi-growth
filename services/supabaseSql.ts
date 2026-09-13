// Skrip SQL Lengkap untuk Setup Database Supabase pada Lavi Growth Tracker Pro v2
export const SUPABASE_SQL_SCHEMA = `-- ==============================================================================
-- SKRIP SETUP DATABASE SUPABASE (POSTGRESQL) - LAVI GROWTH PRO V2
-- Jalankan skrip ini pada menu 'SQL Editor' di dashboard Supabase Anda.
-- ==============================================================================

-- 1. TABEL PROFIL KELUARGA (profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    dob TEXT NOT NULL,
    gender TEXT NOT NULL,
    avatar TEXT,
    theme_color TEXT,
    is_pregnant BOOLEAN DEFAULT FALSE,
    pin TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 2. TABEL CATATAN KESEHATAN & FISIK (health_records)
CREATE TABLE IF NOT EXISTS public.health_records (
    id TEXT PRIMARY KEY,
    profile_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    timestamp BIGINT NOT NULL,
    time TEXT,
    weight NUMERIC,
    height NUMERIC,
    temperature NUMERIC,
    heart_rate NUMERIC,
    systolic_bp NUMERIC,
    diastolic_bp NUMERIC,
    blood_sugar NUMERIC,
    head_circumference NUMERIC,
    chest_circumference NUMERIC,
    chest_width NUMERIC,
    foot_length NUMERIC,
    gestational_age NUMERIC,
    belly_circumference NUMERIC,
    fetal_movement NUMERIC,
    usg_bpd NUMERIC,
    usg_ac NUMERIC,
    usg_fl NUMERIC,
    usg_efw NUMERIC,
    sleep_hours NUMERIC,
    symptoms JSONB DEFAULT '[]'::jsonb,
    photos JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    pin TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 3. TABEL VAKSINASI (vaccines)
CREATE TABLE IF NOT EXISTS public.vaccines (
    id TEXT PRIMARY KEY,
    profile_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    vaccine_name TEXT NOT NULL,
    date_given TEXT NOT NULL,
    notes TEXT,
    pin TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 4. TABEL MILESTONE TUMBUH KEMBANG (milestones)
CREATE TABLE IF NOT EXISTS public.milestones (
    id TEXT PRIMARY KEY,
    profile_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    milestone_id INTEGER NOT NULL,
    date_achieved TEXT NOT NULL,
    notes TEXT,
    pin TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 5. TABEL TARGET KESEHATAN (targets)
CREATE TABLE IF NOT EXISTS public.targets (
    id TEXT PRIMARY KEY,
    profile_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    field TEXT NOT NULL,
    target_value NUMERIC NOT NULL,
    pin TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 6. TABEL PENGINGAT (reminders)
CREATE TABLE IF NOT EXISTS public.reminders (
    id TEXT PRIMARY KEY,
    profile_id TEXT,
    title TEXT NOT NULL,
    time TEXT NOT NULL,
    days JSONB DEFAULT '[]'::jsonb,
    specific_date TEXT,
    active BOOLEAN DEFAULT TRUE,
    type TEXT NOT NULL,
    pin TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 7. TABEL SIKLUS MENSTRUASI (menstrual_cycles)
CREATE TABLE IF NOT EXISTS public.menstrual_cycles (
    id TEXT PRIMARY KEY,
    profile_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    start_date TEXT NOT NULL,
    end_date TEXT,
    flow TEXT,
    symptoms JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    pin TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 8. TABEL VERIFIKASI PIN KELUARGA (app_pins)
CREATE TABLE IF NOT EXISTS public.app_pins (
    pin TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW())
);

-- INDEXING UNTUK PERFORMA QUERY CEPAT
CREATE INDEX IF NOT EXISTS idx_records_profile_pin ON public.health_records (profile_id, pin);
CREATE INDEX IF NOT EXISTS idx_records_timestamp ON public.health_records (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_vaccines_profile_pin ON public.vaccines (profile_id, pin);
CREATE INDEX IF NOT EXISTS idx_milestones_profile_pin ON public.milestones (profile_id, pin);
CREATE INDEX IF NOT EXISTS idx_targets_profile_pin ON public.targets (profile_id, pin);
CREATE INDEX IF NOT EXISTS idx_reminders_pin ON public.reminders (pin);
CREATE INDEX IF NOT EXISTS idx_menstrual_profile_pin ON public.menstrual_cycles (profile_id, pin);

-- ROW LEVEL SECURITY (RLS) & KEBIJAKAN AKSES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vaccines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menstrual_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_pins ENABLE ROW LEVEL SECURITY;

-- Kebijakan Akses Publik Anonim (Diisolasi dengan verifikasi PIN di sisi aplikasi)
DO $$
BEGIN
    DROP POLICY IF EXISTS "Anon Full Access Profiles" ON public.profiles;
    CREATE POLICY "Anon Full Access Profiles" ON public.profiles FOR ALL TO anon USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Anon Full Access Health Records" ON public.health_records;
    CREATE POLICY "Anon Full Access Health Records" ON public.health_records FOR ALL TO anon USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Anon Full Access Vaccines" ON public.vaccines;
    CREATE POLICY "Anon Full Access Vaccines" ON public.vaccines FOR ALL TO anon USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Anon Full Access Milestones" ON public.milestones;
    CREATE POLICY "Anon Full Access Milestones" ON public.milestones FOR ALL TO anon USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Anon Full Access Targets" ON public.targets;
    CREATE POLICY "Anon Full Access Targets" ON public.targets FOR ALL TO anon USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Anon Full Access Reminders" ON public.reminders;
    CREATE POLICY "Anon Full Access Reminders" ON public.reminders FOR ALL TO anon USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Anon Full Access Menstrual Cycles" ON public.menstrual_cycles;
    CREATE POLICY "Anon Full Access Menstrual Cycles" ON public.menstrual_cycles FOR ALL TO anon USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Anon Full Access App Pins" ON public.app_pins;
    CREATE POLICY "Anon Full Access App Pins" ON public.app_pins FOR ALL TO anon USING (true) WITH CHECK (true);
END $$;
`;
