import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type DbClient = Tables<"clients">;

export interface ClientForm {
  name: string;
  phone: string;
  personType: "fisica" | "juridica";
  document: string;
  razaoSocial?: string;
  nomeFantasia?: string;
  contact?: string;
  email?: string;
  neighborhood?: string;
  city?: string;
  address?: string;
  status?: "active" | "inactive";
}

function toInsert(form: ClientForm): TablesInsert<"clients"> {
  return {
    name: form.name,
    phone: form.phone,
    person_type: form.personType,
    document: form.document,
    razao_social: form.razaoSocial || null,
    nome_fantasia: form.nomeFantasia || null,
    contact: form.contact || null,
    email: form.email || null,
    neighborhood: form.neighborhood || null,
    city: form.city || null,
    address: form.address || null,
    status: form.status || "active",
  };
}

export function useClients() {
  return useQuery({
    queryKey: ["clients"],
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as DbClient[];
    },
  });
}

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (form: ClientForm) => {
      // Quota enforcement
      const [{ count }, { data: limits }] = await Promise.all([
        supabase.from("clients").select("id", { count: "exact", head: true }),
        supabase.from("system_limits").select("max_clients").limit(1).single(),
      ]);
      if (limits && count !== null && count >= limits.max_clients) {
        throw new Error(`Limite de clientes atingido (${count}/${limits.max_clients}). Contate o administrador.`);
      }

      const { data, error } = await supabase
        .from("clients")
        .insert(toInsert(form))
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients"] });
      qc.invalidateQueries({ queryKey: ["usage_counts"] });
      toast.success("Cliente cadastrado!");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Erro ao cadastrar cliente"),
  });
}

export function useUpdateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, form }: { id: string; form: ClientForm }) => {
      const { error } = await supabase
        .from("clients")
        .update(toInsert(form) as TablesUpdate<"clients">)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Cliente atualizado!");
    },
    onError: () => toast.error("Erro ao atualizar cliente"),
  });
}

export function useDeleteClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Cliente removido!");
    },
    onError: () => toast.error("Erro ao remover cliente"),
  });
}

export function useToggleClientStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, currentStatus }: { id: string; currentStatus: string }) => {
      const newStatus = currentStatus === "active" ? "inactive" : "active";
      const { error } = await supabase
        .from("clients")
        .update({ status: newStatus })
        .eq("id", id);
      if (error) throw error;
      return newStatus;
    },
    onSuccess: (newStatus) => {
      qc.invalidateQueries({ queryKey: ["clients"] });
      toast.success(`Cliente ${newStatus === "active" ? "ativado" : "desativado"}`);
    },
    onError: () => toast.error("Erro ao alterar status"),
  });
}
