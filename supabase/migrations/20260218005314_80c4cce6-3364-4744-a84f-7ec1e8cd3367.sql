
-- Add new fields to profiles for company, plan and validity management
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS company_name text DEFAULT '',
  ADD COLUMN IF NOT EXISTS company_phone text DEFAULT '',
  ADD COLUMN IF NOT EXISTS username text DEFAULT '',
  ADD COLUMN IF NOT EXISTS plan_type text NOT NULL DEFAULT 'trial',
  ADD COLUMN IF NOT EXISTS valid_until date DEFAULT (CURRENT_DATE + INTERVAL '30 days');
