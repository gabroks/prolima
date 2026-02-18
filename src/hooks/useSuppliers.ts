import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type DbSupplier = Tables<"suppliers">;

export interface SupplierForm {
  name: string;
  personType: "fisica" | "juridica";
  document?: string;
  phone?: string;
  email?: string;
  address?: string;
  neighborhood?: string;
  city?: string;
  notes?: string;
  active?: boolean;
}

function toInsert(form: SupplierForm, userId: string): TablesInsert<"suppliers"> {
  return {
    user_id: userId,
    name: form.name,
    person_type: form.personType,
    document: form.document || null,
    phone: form.phone || null,
    email: form.email || null,
    address: form.address || null,
    neighborhood: form.neighborhood || null,
    city: form.city || null,
    notes: form.notes || null,
    active: form.active ?? true,
  };
}

export function useSuppliers() {
  return useQuery({
    queryKey: ["suppliers"],
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.from("suppliers").select("*").order("name");
      if (error) throw error;
      return data as DbSupplier[];
    },
  });
}

export function useCreateSupplier() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (form: SupplierForm) => {
      if (!user) throw new Error("Usuário não autenticado");
      const [{ count }, { data: limits }] = await Promise.all([
        supabase.from("suppliers").select("id", { count: "exact", head: true }),
        supabase.from("system_limits").select("max_suppliers").limit(1).single(),
      ]);
      if (limits && count !== null && count >= limits.max_suppliers) {
        throw new Error(`Limite de fornecedores atingido (${count}/${limits.max_suppliers}). Contate o administrador.`);
      }

      const { data, error } = await supabase.from("suppliers").insert(toInsert(form, user.id)).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["suppliers"] });
      qc.invalidateQueries({ queryKey: ["usage_counts"] });
      toast.success("Fornecedor cadastrado!");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Erro ao cadastrar fornecedor"),
  });
}

export function useUpdateSupplier() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ id, form }: { id: string; form: SupplierForm }) => {
      if (!user) throw new Error("Usuário não autenticado");
      const { error } = await supabase.from("suppliers").update(toInsert(form, user.id) as TablesUpdate<"suppliers">).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["suppliers"] }); toast.success("Fornecedor atualizado!"); },
    onError: () => toast.error("Erro ao atualizar fornecedor"),
  });
}

export function useDeleteSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("suppliers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["suppliers"] }); toast.success("Fornecedor removido!"); },
    onError: () => toast.error("Erro ao remover fornecedor"),
  });
}

export function useToggleSupplierActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, currentActive }: { id: string; currentActive: boolean }) => {
      const newActive = !currentActive;
      const { error } = await supabase.from("suppliers").update({ active: newActive }).eq("id", id);
      if (error) throw error;
      return newActive;
    },
    onSuccess: (newActive) => {
      qc.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success(`Fornecedor ${newActive ? "ativado" : "desativado"}`);
    },
    onError: () => toast.error("Erro ao alterar status"),
  });
}
