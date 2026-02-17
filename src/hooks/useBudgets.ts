import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type DbBudget = Tables<"budgets">;
export type DbBudgetItem = Tables<"budget_items">;

export interface BudgetWithItems extends DbBudget {
  budget_items: DbBudgetItem[];
}

export function useBudgets() {
  return useQuery({
    queryKey: ["budgets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("budgets")
        .select("*, budget_items(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as BudgetWithItems[];
    },
  });
}

export function useBudgetCount() {
  return useQuery({
    queryKey: ["budgets", "count"],
    queryFn: async () => {
      const { count, error } = await supabase.from("budgets").select("*", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    },
  });
}

export interface BudgetFormData {
  clientId: string | null;
  clientName: string;
  validityDate: string;
  deliveryDate: string;
  serviceDescription: string;
  items: {
    materialId: string | null;
    materialName: string;
    unit: string;
    width: number;
    height: number;
    qty: number;
    unitPrice: number;
    notes: string;
    total: number;
  }[];
  discountType: string;
  discountValue: number;
  freight: number;
  otherCosts: number;
  paymentTerms: string;
  generalNotes: string;
  subtotal: number;
  totalDiscount: number;
  total: number;
  status: string;
}

export function useCreateBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ budgetNumber, form }: { budgetNumber: string; form: BudgetFormData }) => {
      const { data: budget, error: budgetError } = await supabase
        .from("budgets")
        .insert({
          number: budgetNumber,
          client_id: form.clientId,
          client_name: form.clientName,
          validity_date: form.validityDate || null,
          delivery_date: form.deliveryDate || null,
          service_description: form.serviceDescription || null,
          discount_type: form.discountType,
          discount_value: form.discountValue,
          freight: form.freight,
          other_costs: form.otherCosts,
          payment_terms: form.paymentTerms || null,
          general_notes: form.generalNotes || null,
          subtotal: form.subtotal,
          total_discount: form.totalDiscount,
          total: form.total,
          status: form.status,
        })
        .select()
        .single();
      if (budgetError) throw budgetError;

      if (form.items.length > 0) {
        const itemsInsert: TablesInsert<"budget_items">[] = form.items.map(item => ({
          budget_id: budget.id,
          material_id: item.materialId || null,
          material_name: item.materialName,
          unit: item.unit,
          width: item.width,
          height: item.height,
          qty: item.qty,
          unit_price: item.unitPrice,
          notes: item.notes || null,
          total: item.total,
        }));
        const { error: itemsError } = await supabase.from("budget_items").insert(itemsInsert);
        if (itemsError) throw itemsError;
      }
      return budget;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["budgets"] });
      toast.success("Orçamento salvo!");
    },
    onError: () => toast.error("Erro ao salvar orçamento"),
  });
}

export function useUpdateBudgetStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("budgets").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["budgets"] });
    },
    onError: () => toast.error("Erro ao alterar status"),
  });
}
