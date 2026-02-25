import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SystemLimits {
  id: string;
  max_clients: number;
  max_budgets: number;
  max_materials: number;
  max_suppliers: number;
}

export function useSystemLimits() {
  return useQuery({
    queryKey: ["system_limits"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_limits")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as SystemLimits | null;
    },
  });
}

export function useUpdateSystemLimits() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Omit<SystemLimits, "id">> }) => {
      const { error } = await supabase
        .from("system_limits")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["system_limits"] });
      toast.success("Limites atualizados!");
    },
    onError: () => toast.error("Erro ao atualizar limites"),
  });
}

export function useUsageCounts() {
  return useQuery({
    queryKey: ["usage_counts"],
    queryFn: async () => {
      const [clients, budgets, materials, suppliers] = await Promise.all([
        supabase.from("clients").select("id", { count: "exact", head: true }),
        supabase.from("budgets").select("id", { count: "exact", head: true }),
        supabase.from("materials").select("id", { count: "exact", head: true }),
        supabase.from("suppliers").select("id", { count: "exact", head: true }),
      ]);
      return {
        clients: clients.count ?? 0,
        budgets: budgets.count ?? 0,
        materials: materials.count ?? 0,
        suppliers: suppliers.count ?? 0,
      };
    },
  });
}
