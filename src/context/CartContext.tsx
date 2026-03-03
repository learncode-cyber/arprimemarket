import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { Product } from "@/hooks/useProductData";
import { useTracking } from "@/context/TrackingContext";

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

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const { trackAddToCart } = useTracking();

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items]);

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

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + (i.product.price + (i.priceDelta || 0)) * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addToCart, removeFromCart, updateQuantity, clearCart: () => setItems([]), totalItems, subtotal }}
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
