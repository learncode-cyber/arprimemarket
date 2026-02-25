import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PaymentMethod {
  id: string;
  method_type: string;
  method_key: string;
  display_name: string;
  display_name_bn: string | null;
  display_name_ar: string | null;
  icon_name: string | null;
  is_active: boolean;
  wallet_address: string | null;
  deposit_link: string | null;
  instructions: string | null;
  instructions_bn: string | null;
  instructions_ar: string | null;
  network: string | null;
  sort_order: number;
}

export const usePaymentMethods = (activeOnly = true) => {
  return useQuery({
    queryKey: ["payment-methods", activeOnly],
    queryFn: async () => {
      // For admin (activeOnly=false), we need to use a different approach
      // since the RLS policy only allows reading active ones for non-admins
      const query = supabase
        .from("payment_methods")
        .select("*")
        .order("sort_order", { ascending: true });

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as PaymentMethod[];
    },
  });
};

export const useUpdatePaymentMethod = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<PaymentMethod> }) => {
      const { error } = await supabase
        .from("payment_methods")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
    },
  });
};
