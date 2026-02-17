import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  name: string;
  phone: string;
  active: boolean;
  created_at: string;
}

export function useProfiles() {
  return useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as UserProfile[];
    },
  });
}

export function useToggleProfileStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, currentActive }: { id: string; currentActive: boolean }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ active: !currentActive })
        .eq("id", id);
      if (error) throw error;
      return !currentActive;
    },
    onSuccess: (newActive) => {
      qc.invalidateQueries({ queryKey: ["profiles"] });
      toast.success(`Usuário ${newActive ? "ativado" : "desativado"}`);
    },
    onError: () => toast.error("Erro ao alterar status do usuário"),
  });
}
