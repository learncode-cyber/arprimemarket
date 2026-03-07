import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "arp_recently_viewed";
const MAX_ITEMS = 12;

export interface RecentProduct {
  id: string;
  title: string;
  slug: string;
  price: number;
  image_url: string | null;
  viewedAt: number;
}

export const useRecentlyViewed = () => {
  const [items, setItems] = useState<RecentProduct[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setItems(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  const addProduct = useCallback((product: Omit<RecentProduct, "viewedAt">) => {
    setItems(prev => {
      const filtered = prev.filter(p => p.id !== product.id);
      const updated = [{ ...product, viewedAt: Date.now() }, ...filtered].slice(0, MAX_ITEMS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearAll = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setItems([]);
  }, []);

  return { recentlyViewed: items, addProduct, clearAll };
};
