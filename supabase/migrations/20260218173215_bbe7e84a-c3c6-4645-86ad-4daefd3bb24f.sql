
-- ============================================================
-- Add user_id to all main tables for multi-tenancy isolation
-- ============================================================

-- 1. Add user_id columns (nullable first to allow data migration)
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.budget_items ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Populate user_id for ALL existing records with the current user
UPDATE public.clients SET user_id = '5441ce67-0f3c-4907-8479-b6c09aeb99a2' WHERE user_id IS NULL;
UPDATE public.budgets SET user_id = '5441ce67-0f3c-4907-8479-b6c09aeb99a2' WHERE user_id IS NULL;
UPDATE public.materials SET user_id = '5441ce67-0f3c-4907-8479-b6c09aeb99a2' WHERE user_id IS NULL;
UPDATE public.suppliers SET user_id = '5441ce67-0f3c-4907-8479-b6c09aeb99a2' WHERE user_id IS NULL;
UPDATE public.expenses SET user_id = '5441ce67-0f3c-4907-8479-b6c09aeb99a2' WHERE user_id IS NULL;
UPDATE public.payments SET user_id = '5441ce67-0f3c-4907-8479-b6c09aeb99a2' WHERE user_id IS NULL;
UPDATE public.budget_items SET user_id = '5441ce67-0f3c-4907-8479-b6c09aeb99a2' WHERE user_id IS NULL;
UPDATE public.company_settings SET user_id = '5441ce67-0f3c-4907-8479-b6c09aeb99a2' WHERE user_id IS NULL;

-- 3. Make user_id NOT NULL after populating
ALTER TABLE public.clients ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.budgets ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.materials ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.suppliers ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.expenses ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.payments ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.budget_items ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.company_settings ALTER COLUMN user_id SET NOT NULL;

-- 4. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON public.budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_materials_user_id ON public.materials(user_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_user_id ON public.suppliers(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON public.expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_user_id ON public.budget_items(user_id);
CREATE INDEX IF NOT EXISTS idx_company_settings_user_id ON public.company_settings(user_id);

-- 5. Drop old permissive policies
DROP POLICY IF EXISTS "Authenticated users can manage clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can manage budgets" ON public.budgets;
DROP POLICY IF EXISTS "Authenticated users can manage materials" ON public.materials;
DROP POLICY IF EXISTS "Authenticated users can manage suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Authenticated users can manage expenses" ON public.expenses;
DROP POLICY IF EXISTS "Authenticated users can manage payments" ON public.payments;
DROP POLICY IF EXISTS "Authenticated users can manage budget_items" ON public.budget_items;
DROP POLICY IF EXISTS "Authenticated users can manage company_settings" ON public.company_settings;

-- 6. Create new user-scoped RLS policies

-- CLIENTS
CREATE POLICY "Users can view own clients" ON public.clients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own clients" ON public.clients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own clients" ON public.clients FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own clients" ON public.clients FOR DELETE USING (auth.uid() = user_id);

-- BUDGETS
CREATE POLICY "Users can view own budgets" ON public.budgets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own budgets" ON public.budgets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own budgets" ON public.budgets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own budgets" ON public.budgets FOR DELETE USING (auth.uid() = user_id);

-- MATERIALS
CREATE POLICY "Users can view own materials" ON public.materials FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own materials" ON public.materials FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own materials" ON public.materials FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own materials" ON public.materials FOR DELETE USING (auth.uid() = user_id);

-- SUPPLIERS
CREATE POLICY "Users can view own suppliers" ON public.suppliers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own suppliers" ON public.suppliers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own suppliers" ON public.suppliers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own suppliers" ON public.suppliers FOR DELETE USING (auth.uid() = user_id);

-- EXPENSES
CREATE POLICY "Users can view own expenses" ON public.expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own expenses" ON public.expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own expenses" ON public.expenses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own expenses" ON public.expenses FOR DELETE USING (auth.uid() = user_id);

-- PAYMENTS
CREATE POLICY "Users can view own payments" ON public.payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own payments" ON public.payments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own payments" ON public.payments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own payments" ON public.payments FOR DELETE USING (auth.uid() = user_id);

-- BUDGET_ITEMS
CREATE POLICY "Users can view own budget_items" ON public.budget_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own budget_items" ON public.budget_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own budget_items" ON public.budget_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own budget_items" ON public.budget_items FOR DELETE USING (auth.uid() = user_id);

-- COMPANY_SETTINGS
CREATE POLICY "Users can view own company_settings" ON public.company_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own company_settings" ON public.company_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own company_settings" ON public.company_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own company_settings" ON public.company_settings FOR DELETE USING (auth.uid() = user_id);

-- 7. Update enforce_quota to be user-scoped
CREATE OR REPLACE FUNCTION public.enforce_quota()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_count integer;
  max_limit integer;
  limit_column text;
BEGIN
  CASE TG_TABLE_NAME
    WHEN 'clients' THEN limit_column := 'max_clients';
    WHEN 'budgets' THEN limit_column := 'max_budgets';
    WHEN 'materials' THEN limit_column := 'max_materials';
    WHEN 'suppliers' THEN limit_column := 'max_suppliers';
    ELSE RETURN NEW;
  END CASE;

  -- Count only records belonging to this user
  EXECUTE format('SELECT count(*) FROM public.%I WHERE user_id = $1', TG_TABLE_NAME) INTO current_count USING NEW.user_id;

  EXECUTE format('SELECT %I FROM public.system_limits LIMIT 1', limit_column) INTO max_limit;

  IF max_limit IS NOT NULL AND current_count >= max_limit THEN
    RAISE EXCEPTION 'Limite de % atingido (%/%). Contate o administrador para aumentar o limite.', TG_TABLE_NAME, current_count, max_limit;
  END IF;

  RETURN NEW;
END;
$function$;
