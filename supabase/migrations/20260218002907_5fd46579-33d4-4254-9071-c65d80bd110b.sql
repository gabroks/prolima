
-- Server-side quota enforcement via validation triggers
CREATE OR REPLACE FUNCTION public.enforce_quota()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_count integer;
  max_limit integer;
  limit_column text;
BEGIN
  -- Determine limit column based on table
  CASE TG_TABLE_NAME
    WHEN 'clients' THEN limit_column := 'max_clients';
    WHEN 'budgets' THEN limit_column := 'max_budgets';
    WHEN 'materials' THEN limit_column := 'max_materials';
    WHEN 'suppliers' THEN limit_column := 'max_suppliers';
    ELSE RETURN NEW;
  END CASE;

  -- Get current count
  EXECUTE format('SELECT count(*) FROM public.%I', TG_TABLE_NAME) INTO current_count;

  -- Get limit
  EXECUTE format('SELECT %I FROM public.system_limits LIMIT 1', limit_column) INTO max_limit;

  IF max_limit IS NOT NULL AND current_count >= max_limit THEN
    RAISE EXCEPTION 'Limite de % atingido (%/%). Contate o administrador para aumentar o limite.', TG_TABLE_NAME, current_count, max_limit;
  END IF;

  RETURN NEW;
END;
$$;

-- Apply triggers to all 4 tables
CREATE TRIGGER enforce_clients_quota
  BEFORE INSERT ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.enforce_quota();

CREATE TRIGGER enforce_budgets_quota
  BEFORE INSERT ON public.budgets
  FOR EACH ROW EXECUTE FUNCTION public.enforce_quota();

CREATE TRIGGER enforce_materials_quota
  BEFORE INSERT ON public.materials
  FOR EACH ROW EXECUTE FUNCTION public.enforce_quota();

CREATE TRIGGER enforce_suppliers_quota
  BEFORE INSERT ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.enforce_quota();
