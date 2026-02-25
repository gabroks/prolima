import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type DbMaterial = Tables<"materials">;

export interface MaterialForm {
  name: string;
  category: string;
  chargeUnit: string;
  measureUnit: string;
  basePrice: number;
  notes?: string;
}

function toInsert(form: MaterialForm, userId: string): TablesInsert<"materials"> {
  return {
    user_id: userId,
    name: form.name,
    category: form.category || "Outros",
    charge_unit: form.chargeUnit || "m²",
    measure_unit: form.measureUnit || "centímetro",
    base_price: form.basePrice,
    notes: form.notes || null,
  };
}

export function useMaterials() {
  return useQuery({
    queryKey: ["materials"],
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("materials")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as DbMaterial[];
    },
  });
}

export function useCreateMaterial() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (form: MaterialForm) => {
      if (!user) throw new Error("Usuário não autenticado");
      const [{ count }, { data: limits }] = await Promise.all([
        supabase.from("materials").select("id", { count: "exact", head: true }),
        supabase.from("system_limits").select("max_materials").limit(1).maybeSingle(),
      ]);
      if (limits && count !== null && count >= limits.max_materials) {
        throw new Error(`Limite de materiais atingido (${count}/${limits.max_materials}). Contate o administrador.`);
      }

      const { data, error } = await supabase
        .from("materials")
        .insert(toInsert(form, user.id))
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["materials"] });
      qc.invalidateQueries({ queryKey: ["usage_counts"] });
      toast.success("Material cadastrado!");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Erro ao cadastrar material"),
  });
}

export function useUpdateMaterial() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ id, form }: { id: string; form: MaterialForm }) => {
      if (!user) throw new Error("Usuário não autenticado");
      const { error } = await supabase
        .from("materials")
        .update(toInsert(form, user.id) as TablesUpdate<"materials">)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["materials"] });
      toast.success("Material atualizado!");
    },
    onError: () => toast.error("Erro ao atualizar material"),
  });
}

export function useDeleteMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("materials").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["materials"] });
      toast.success("Material removido!");
    },
    onError: () => toast.error("Erro ao remover material"),
  });
}
