import { useState, useEffect } from "react";
import { Bell, BellRing, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface StockAlertButtonProps {
  productId: string;
  stockQuantity: number;
}

export const StockAlertButton = ({ productId, stockQuantity }: StockAlertButtonProps) => {
  const { user } = useAuth();
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("stock_alerts" as any)
      .select("id")
      .eq("user_id", user.id)
      .eq("product_id", productId)
      .eq("is_notified", false)
      .maybeSingle()
      .then(({ data }) => setSubscribed(!!data));
  }, [user, productId]);

  if (stockQuantity > 0) return null;

  const handleToggle = async () => {
    if (!user) {
      toast.error("Please login to get stock alerts");
      return;
    }
    setLoading(true);
    if (subscribed) {
      await supabase
        .from("stock_alerts" as any)
        .delete()
        .eq("user_id", user.id)
        .eq("product_id", productId);
      setSubscribed(false);
      toast.success("Stock alert removed");
    } else {
      const { error } = await supabase
        .from("stock_alerts" as any)
        .insert({ user_id: user.id, product_id: productId, email: user.email } as any);
      if (error) {
        toast.error("Failed to set alert");
      } else {
        setSubscribed(true);
        toast.success("We'll notify you when this item is back in stock! 🔔");
      }
    }
    setLoading(false);
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all touch-manipulation ${
        subscribed
          ? "bg-primary/10 text-primary border border-primary/30"
          : "bg-secondary text-foreground border border-border hover:border-primary/30"
      }`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : subscribed ? (
        <BellRing className="w-4 h-4" />
      ) : (
        <Bell className="w-4 h-4" />
      )}
      {subscribed ? "Alert Set" : "Notify When Available"}
    </button>
  );
};
