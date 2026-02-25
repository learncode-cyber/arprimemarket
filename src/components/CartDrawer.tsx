import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Minus, ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { Link } from "react-router-dom";

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

export const CartDrawer = ({ open, onClose }: CartDrawerProps) => {
  const { items, updateQuantity, removeFromCart, subtotal, totalItems } = useCart();

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full sm:max-w-md z-50 glass-strong sm:rounded-l-2xl flex flex-col"
          >
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border">
              <h2 className="font-display font-semibold text-base sm:text-lg text-foreground flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" />
                Cart ({totalItems})
              </h2>
              <button
                onClick={onClose}
                className="p-2.5 rounded-xl hover:bg-secondary transition-colors touch-manipulation"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 sm:space-y-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <ShoppingBag className="w-14 h-14 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground text-sm">Your cart is empty</p>
                </div>
              ) : (
                items.map((item) => (
                  <motion.div
                    key={item.product.id}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex gap-3 p-3 rounded-xl bg-secondary/50"
                  >
                    <img
                      src={item.product.image}
                      alt={item.product.title}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-xs sm:text-sm text-foreground truncate">
                        {item.product.title}
                      </h4>
                      <p className="text-sm text-primary font-semibold mt-0.5">
                        ৳{item.product.price.toLocaleString()}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="p-1.5 rounded-lg bg-secondary hover:bg-border transition-colors touch-manipulation active:scale-90"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs sm:text-sm font-medium w-6 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="p-1.5 rounded-lg bg-secondary hover:bg-border transition-colors touch-manipulation active:scale-90"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="self-start p-1.5 rounded-lg hover:bg-destructive/10 transition-colors touch-manipulation"
                    >
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </motion.div>
                ))
              )}
            </div>

            {items.length > 0 && (
              <div className="p-4 sm:p-6 border-t border-border space-y-3 sm:space-y-4 pb-safe">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-display font-bold text-foreground text-base sm:text-lg">
                    ৳{subtotal.toLocaleString()}
                  </span>
                </div>
                <Link
                  to="/cart"
                  onClick={onClose}
                  className="block w-full text-center px-6 py-3.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm glow-primary transition-shadow touch-manipulation active:scale-[0.98]"
                >
                  View Cart
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
