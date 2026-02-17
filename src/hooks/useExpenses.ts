import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type DbExpense = Tables<"expenses">;

export interface ExpenseForm {
  budgetId?: string;
  budgetNumber?: string;
  description: string;
  supplierId?: string;
  supplierName?: string;
  category: string;
  amount: number;
  date: string;
  notes?: string;
}

export function useExpenses() {
  return useQuery({
    queryKey: ["expenses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("expenses").select("*").order("date", { ascending: false });
      if (error) throw error;
      return data as DbExpense[];
    },
  });
}

export function useCreateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (form: ExpenseForm) => {
      const { data, error } = await supabase.from("expenses").insert({
        budget_id: form.budgetId || null,
        budget_number: form.budgetNumber || null,
        description: form.description,
        supplier_id: form.supplierId || null,
        supplier_name: form.supplierName || null,
        category: form.category,
        amount: form.amount,
        date: form.date,
        notes: form.notes || null,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["expenses"] }); toast.success("Despesa registrada!"); },
    onError: () => toast.error("Erro ao registrar despesa"),
  });
}

export function useUpdateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, form }: { id: string; form: ExpenseForm }) => {
      const { error } = await supabase.from("expenses").update({
        budget_id: form.budgetId || null,
        budget_number: form.budgetNumber || null,
        description: form.description,
        supplier_id: form.supplierId || null,
        supplier_name: form.supplierName || null,
        category: form.category,
        amount: form.amount,
        date: form.date,
        notes: form.notes || null,
      } as TablesUpdate<"expenses">).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["expenses"] }); toast.success("Despesa atualizada!"); },
    onError: () => toast.error("Erro ao atualizar despesa"),
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("expenses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["expenses"] }); toast.success("Despesa removida!"); },
    onError: () => toast.error("Erro ao remover despesa"),
  });
}
