import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
}

export function useWishlist() {
  const { user } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchWishlist = useCallback(async () => {
    if (!user) { setItems([]); return; }
    setLoading(true);
    const { data } = await supabase.from("wishlists").select("*").eq("user_id", user.id);
    setItems((data as WishlistItem[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchWishlist(); }, [fetchWishlist]);

  const isInWishlist = useCallback((productId: string) => {
    return items.some(i => i.product_id === productId);
  }, [items]);

  const toggleWishlist = useCallback(async (productId: string) => {
    if (!user) { toast.error("Please login first"); return; }
    const existing = items.find(i => i.product_id === productId);
    if (existing) {
      await supabase.from("wishlists").delete().eq("id", existing.id);
      setItems(prev => prev.filter(i => i.id !== existing.id));
    } else {
      const { data, error } = await supabase.from("wishlists").insert({ user_id: user.id, product_id: productId } as any).select("*").single();
      if (!error && data) setItems(prev => [...prev, data as WishlistItem]);
    }
  }, [user, items]);

  return { items, loading, isInWishlist, toggleWishlist, fetchWishlist };
}

export interface Address {
  id: string;
  user_id: string;
  label: string;
  full_name: string;
  phone: string;
  address: string;
  city: string;
  postal_code: string | null;
  country: string;
  is_default: boolean;
}

export function useAddresses() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAddresses = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.from("addresses").select("*").eq("user_id", user.id).order("is_default", { ascending: false });
    setAddresses((data as Address[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchAddresses(); }, [fetchAddresses]);

  const addAddress = async (addr: Omit<Address, "id" | "user_id">) => {
    if (!user) return;
    const { error } = await supabase.from("addresses").insert({ ...addr, user_id: user.id } as any);
    if (error) throw error;
    fetchAddresses();
  };

  const updateAddress = async (id: string, updates: Partial<Address>) => {
    await supabase.from("addresses").update(updates as any).eq("id", id);
    fetchAddresses();
  };

  const deleteAddress = async (id: string) => {
    await supabase.from("addresses").delete().eq("id", id);
    fetchAddresses();
  };

  const setDefault = async (id: string) => {
    if (!user) return;
    await supabase.from("addresses").update({ is_default: false } as any).eq("user_id", user.id);
    await supabase.from("addresses").update({ is_default: true } as any).eq("id", id);
    fetchAddresses();
  };

  return { addresses, loading, addAddress, updateAddress, deleteAddress, setDefault };
}
