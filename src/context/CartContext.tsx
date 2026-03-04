import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from "react";
import { Product } from "@/hooks/useProductData";
import { useTracking } from "@/context/TrackingContext";
import { supabase } from "@/integrations/supabase/client";

export interface CartItem {
  product: Product;
  quantity: number;
  variantId?: string;
  variantLabel?: string;
  priceDelta?: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, variant?: { id: string; label: string; priceDelta: number }) => void;
  removeFromCart: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_KEY = "ar-pm-cart";
const SESSION_KEY = "ar-pm-session";

function getSessionId(): string {
  let sid = localStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const { trackAddToCart } = useTracking();
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items]);

  // Debounced DB persistence (2s after last cart change)
  useEffect(() => {
    if (persistTimer.current) clearTimeout(persistTimer.current);
    if (items.length === 0) return;

    persistTimer.current = setTimeout(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const cartPayload = items.map(i => ({
          id: i.product.id,
          title: i.product.title,
          image: i.product.image,
          price: i.product.price,
          quantity: i.quantity,
          variantId: i.variantId,
          variantLabel: i.variantLabel,
          priceDelta: i.priceDelta || 0,
        }));

        const subtotalVal = items.reduce((sum, i) => sum + (i.product.price + (i.priceDelta || 0)) * i.quantity, 0);

        await supabase.functions.invoke("cart-recovery", {
          body: {
            action: "persist_cart",
            user_id: session?.user?.id || null,
            session_id: getSessionId(),
            email: session?.user?.email || null,
            cart_items: cartPayload,
            subtotal: subtotalVal,
            currency: "BDT",
          },
        });
      } catch (err) {
        // Silent fail - cart persistence is non-blocking
        console.debug("[CartPersist] failed:", err);
      }
    }, 2000);

    return () => { if (persistTimer.current) clearTimeout(persistTimer.current); };
  }, [items]);

  // Handle cart recovery from URL token
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("recovery");
    if (!token) return;

    (async () => {
      try {
        const { createClient } = await import("@supabase/supabase-js");
        // Use anon client to read via RPC or direct — but we need the edge function
        const res = await supabase.functions.invoke("cart-recovery", {
          body: { action: "recover_cart", recovery_token: token },
        });
        // Recovery handled server-side — items loaded from response if available
      } catch {
        // silent
      }
      // Clean URL
      const url = new URL(window.location.href);
      url.searchParams.delete("recovery");
      window.history.replaceState({}, "", url.pathname + url.search);
    })();
  }, []);

  const cartKey = (productId: string, variantId?: string) => `${productId}::${variantId || "base"}`;

  const addToCart = (product: Product, variant?: { id: string; label: string; priceDelta: number }) => {
    trackAddToCart({
      id: product.id,
      title: product.title,
      price: product.price + (variant?.priceDelta || 0),
      category: product.category,
      currency: product.currency,
      quantity: 1,
    });
    setItems((prev) => {
      const key = cartKey(product.id, variant?.id);
      const existing = prev.find((i) => cartKey(i.product.id, i.variantId) === key);
      if (existing) {
        return prev.map((i) =>
          cartKey(i.product.id, i.variantId) === key ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { product, quantity: 1, variantId: variant?.id, variantLabel: variant?.label, priceDelta: variant?.priceDelta || 0 }];
    });
  };

  const removeFromCart = (productId: string, variantId?: string) => {
    const key = cartKey(productId, variantId);
    setItems((prev) => prev.filter((i) => cartKey(i.product.id, i.variantId) !== key));
  };

  const updateQuantity = (productId: string, quantity: number, variantId?: string) => {
    if (quantity <= 0) {
      removeFromCart(productId, variantId);
      return;
    }
    const key = cartKey(productId, variantId);
    setItems((prev) =>
      prev.map((i) => (cartKey(i.product.id, i.variantId) === key ? { ...i, quantity } : i))
    );
  };

  const clearCart = useCallback(async () => {
    setItems([]);
    // Mark cart as recovered
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await supabase.functions.invoke("cart-recovery", {
        body: {
          action: "mark_recovered",
          user_id: session?.user?.id || null,
          session_id: getSessionId(),
        },
      });
    } catch {
      // silent
    }
  }, []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + (i.product.price + (i.priceDelta || 0)) * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, subtotal }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
