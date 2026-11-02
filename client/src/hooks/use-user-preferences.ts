import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { AlignmentPrefs } from "@/lib/bid-readiness";

/** The signed-in supplier's saved preferences (one shared, cached query for every card). */
export function useUserPreferences() {
  return useQuery<AlignmentPrefs | null>({
    queryKey: ["user-preferences-alignment"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase
        .from("user_preferences")
        .select("sectors, counties, keywords, budget_min, budget_max")
        .eq("user_id", user.id)
        .maybeSingle();
      return (data as AlignmentPrefs | null) ?? null;
    },
    staleTime: 60 * 1000,
  });
}
