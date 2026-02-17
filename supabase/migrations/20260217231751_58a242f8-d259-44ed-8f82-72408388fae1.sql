
-- Table for global system usage limits
CREATE TABLE public.system_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  max_clients integer NOT NULL DEFAULT 50,
  max_budgets integer NOT NULL DEFAULT 200,
  max_materials integer NOT NULL DEFAULT 100,
  max_suppliers integer NOT NULL DEFAULT 50,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.system_limits ENABLE ROW LEVEL SECURITY;

-- Only admins can read/manage limits
CREATE POLICY "Admins can manage system_limits"
ON public.system_limits FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Authenticated users can read limits (to show warnings)
CREATE POLICY "Authenticated users can read system_limits"
ON public.system_limits FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL);

-- Insert default row
INSERT INTO public.system_limits (max_clients, max_budgets, max_materials, max_suppliers)
VALUES (50, 200, 100, 50);

-- Trigger for updated_at
CREATE TRIGGER update_system_limits_updated_at
BEFORE UPDATE ON public.system_limits
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
