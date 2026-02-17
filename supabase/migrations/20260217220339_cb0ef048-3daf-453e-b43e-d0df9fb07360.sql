
-- Drop all existing permissive "allow all" policies and replace with auth-required policies

-- budget_items
DROP POLICY IF EXISTS "Allow all access to budget_items" ON public.budget_items;
CREATE POLICY "Authenticated users can manage budget_items" ON public.budget_items FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- budgets
DROP POLICY IF EXISTS "Allow all access to budgets" ON public.budgets;
CREATE POLICY "Authenticated users can manage budgets" ON public.budgets FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- clients
DROP POLICY IF EXISTS "Allow all access to clients" ON public.clients;
CREATE POLICY "Authenticated users can manage clients" ON public.clients FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- company_settings
DROP POLICY IF EXISTS "Allow all access to company_settings" ON public.company_settings;
CREATE POLICY "Authenticated users can manage company_settings" ON public.company_settings FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- expenses
DROP POLICY IF EXISTS "Allow all access to expenses" ON public.expenses;
CREATE POLICY "Authenticated users can manage expenses" ON public.expenses FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- materials
DROP POLICY IF EXISTS "Allow all access to materials" ON public.materials;
CREATE POLICY "Authenticated users can manage materials" ON public.materials FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- notifications
DROP POLICY IF EXISTS "Allow all access to notifications" ON public.notifications;
CREATE POLICY "Authenticated users can manage notifications" ON public.notifications FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- payments
DROP POLICY IF EXISTS "Allow all access to payments" ON public.payments;
CREATE POLICY "Authenticated users can manage payments" ON public.payments FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- suppliers
DROP POLICY IF EXISTS "Allow all access to suppliers" ON public.suppliers;
CREATE POLICY "Authenticated users can manage suppliers" ON public.suppliers FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
