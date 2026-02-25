import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type DbBudget = Tables<"budgets">;
export type DbBudgetItem = Tables<"budget_items">;

export interface BudgetWithItems extends DbBudget {
  budget_items: DbBudgetItem[];
}

export function useBudgets() {
  return useQuery({
    queryKey: ["budgets"],
    staleTime: 2 * 60 * 1000,
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
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ budgetNumber, form }: { budgetNumber: string; form: BudgetFormData }) => {
      if (!user) throw new Error("Usuário não autenticado");
      const [{ count }, { data: limits }] = await Promise.all([
        supabase.from("budgets").select("id", { count: "exact", head: true }),
        supabase.from("system_limits").select("max_budgets").limit(1).maybeSingle(),
      ]);
      if (limits && count !== null && count >= limits.max_budgets) {
        throw new Error(`Limite de orçamentos atingido (${count}/${limits.max_budgets}). Contate o administrador.`);
      }

      const { data: budget, error: budgetError } = await supabase
        .from("budgets")
        .insert({
          user_id: user.id,
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
          user_id: user.id,
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
      qc.invalidateQueries({ queryKey: ["usage_counts"] });
      toast.success("Orçamento salvo!");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Erro ao salvar orçamento"),
  });
}

export function useUpdateBudget() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ id, form }: { id: string; form: BudgetFormData }) => {
      if (!user) throw new Error("Usuário não autenticado");
      const { error: budgetError } = await supabase
        .from("budgets")
        .update({
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
        .eq("id", id);
      if (budgetError) throw budgetError;

      const { error: delErr } = await supabase.from("budget_items").delete().eq("budget_id", id);
      if (delErr) throw delErr;

      if (form.items.length > 0) {
        const itemsInsert: TablesInsert<"budget_items">[] = form.items.map(item => ({
          user_id: user.id,
          budget_id: id,
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
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["budgets"] });
      toast.success("Orçamento atualizado!");
    },
    onError: () => toast.error("Erro ao atualizar orçamento"),
  });
}

export function useBudgetById(id: string | undefined) {
  return useQuery({
    queryKey: ["budgets", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("budgets")
        .select("*, budget_items(*)")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data as BudgetWithItems;
    },
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

export function useDeleteBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error: itemsErr } = await supabase.from("budget_items").delete().eq("budget_id", id);
      if (itemsErr) throw itemsErr;
      const { error } = await supabase.from("budgets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["budgets"] });
      toast.success("Orçamento excluído!");
    },
    onError: () => toast.error("Erro ao excluir orçamento"),
  });
}

export function useDuplicateBudget() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ budget, newNumber }: { budget: BudgetWithItems; newNumber: string }) => {
      if (!user) throw new Error("Usuário não autenticado");
      const { data: newBudget, error: budgetError } = await supabase
        .from("budgets")
        .insert({
          user_id: user.id,
          number: newNumber,
          client_id: budget.client_id,
          client_name: budget.client_name,
          validity_date: budget.validity_date,
          delivery_date: budget.delivery_date,
          service_description: budget.service_description,
          discount_type: budget.discount_type,
          discount_value: budget.discount_value,
          freight: budget.freight,
          other_costs: budget.other_costs,
          payment_terms: budget.payment_terms,
          general_notes: budget.general_notes,
          subtotal: budget.subtotal,
          total_discount: budget.total_discount,
          total: budget.total,
          status: "draft",
        })
        .select()
        .single();
      if (budgetError) throw budgetError;

      if (budget.budget_items && budget.budget_items.length > 0) {
        const items: TablesInsert<"budget_items">[] = budget.budget_items.map(item => ({
          user_id: user.id,
          budget_id: newBudget.id,
          material_id: item.material_id,
          material_name: item.material_name,
          unit: item.unit,
          width: item.width,
          height: item.height,
          qty: item.qty,
          unit_price: item.unit_price,
          notes: item.notes,
          total: item.total,
        }));
        const { error: itemsError } = await supabase.from("budget_items").insert(items);
        if (itemsError) throw itemsError;
      }
      return newBudget;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["budgets"] });
      toast.success("Orçamento duplicado como rascunho!");
    },
    onError: () => toast.error("Erro ao duplicar orçamento"),
  });
}
