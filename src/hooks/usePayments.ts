import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type DbPayment = Tables<"payments">;

export interface PaymentForm {
  budgetId: string;
  budgetNumber: string;
  clientName: string;
  amount: number;
  method: string;
  date: string;
  notes?: string;
}

export function usePayments() {
  return useQuery({
    queryKey: ["payments"],
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.from("payments").select("*").order("date", { ascending: false });
      if (error) throw error;
      return data as DbPayment[];
    },
  });
}

export function useCreatePayment() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (form: PaymentForm) => {
      if (!user) throw new Error("Usuário não autenticado");
      const { data, error } = await supabase.from("payments").insert({
        user_id: user.id,
        budget_id: form.budgetId,
        budget_number: form.budgetNumber,
        client_name: form.clientName,
        amount: form.amount,
        method: form.method,
        date: form.date,
        notes: form.notes || null,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["payments"] }); toast.success("Pagamento registrado!"); },
    onError: () => toast.error("Erro ao registrar pagamento"),
  });
}

export function useUpdatePayment() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ id, form }: { id: string; form: PaymentForm }) => {
      if (!user) throw new Error("Usuário não autenticado");
      const { error } = await supabase.from("payments").update({
        user_id: user.id,
        budget_id: form.budgetId,
        budget_number: form.budgetNumber,
        client_name: form.clientName,
        amount: form.amount,
        method: form.method,
        date: form.date,
        notes: form.notes || null,
      } as TablesUpdate<"payments">).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["payments"] }); toast.success("Pagamento atualizado!"); },
    onError: () => toast.error("Erro ao atualizar pagamento"),
  });
}

export function useDeletePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("payments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["payments"] }); toast.success("Pagamento removido!"); },
    onError: () => toast.error("Erro ao remover pagamento"),
  });
}
