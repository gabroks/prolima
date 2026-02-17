import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useIsAdmin() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["user_role", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc("has_role", { _user_id: user!.id, _role: "admin" });
      if (error) throw error;
      return data as boolean;
    },
    staleTime: 5 * 60 * 1000, // cache for 5 min
  });
}
