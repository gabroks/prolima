import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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

function toInsert(form: MaterialForm): TablesInsert<"materials"> {
  return {
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
  return useMutation({
    mutationFn: async (form: MaterialForm) => {
      const { data, error } = await supabase
        .from("materials")
        .insert(toInsert(form))
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["materials"] });
      toast.success("Material cadastrado!");
    },
    onError: () => toast.error("Erro ao cadastrar material"),
  });
}

export function useUpdateMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, form }: { id: string; form: MaterialForm }) => {
      const { error } = await supabase
        .from("materials")
        .update(toInsert(form) as TablesUpdate<"materials">)
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
