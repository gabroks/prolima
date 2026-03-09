ALTER TABLE public.company_settings 
  ADD COLUMN IF NOT EXISTS brand_name text NOT NULL DEFAULT 'Pro Orçamento',
  ADD COLUMN IF NOT EXISTS brand_subtitle text NOT NULL DEFAULT 'Gestão inteligente';