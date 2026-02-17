
ALTER TABLE public.company_settings
  ADD COLUMN doc_show_logo boolean NOT NULL DEFAULT true,
  ADD COLUMN doc_show_phone boolean NOT NULL DEFAULT true,
  ADD COLUMN doc_show_address boolean NOT NULL DEFAULT true,
  ADD COLUMN doc_footer_text text NOT NULL DEFAULT 'Orçamento válido por 15 dias. Valores sujeitos a alteração sem aviso prévio.',
  ADD COLUMN doc_validity_days integer NOT NULL DEFAULT 15,
  ADD COLUMN notif_budget_approved boolean NOT NULL DEFAULT true,
  ADD COLUMN notif_payment_received boolean NOT NULL DEFAULT true,
  ADD COLUMN notif_budget_expiring boolean NOT NULL DEFAULT true,
  ADD COLUMN notif_weekly_report boolean NOT NULL DEFAULT false;
