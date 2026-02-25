import { motion } from "framer-motion";
import { Minus, Plus, X, ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { Link } from "react-router-dom";

const Cart = () => {
  const { items, updateQuantity, removeFromCart, subtotal, totalItems } = useCart();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-1">Shopping Cart</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mb-6 sm:mb-8">{totalItems} item{totalItems !== 1 ? "s" : ""} in your cart</p>
      </motion.div>

      {items.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 bg-card border border-border rounded-2xl">
          <ShoppingBag className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-5">Your cart is empty</p>
          <Link to="/products" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm touch-manipulation">
            Continue Shopping <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 space-y-3">
            {items.map((item, i) => (
              <motion.div
                key={item.product.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                layout
                className="bg-card border border-border rounded-2xl p-3 sm:p-4 flex gap-3 sm:gap-4"
              >
                <img src={item.product.image} alt={item.product.title} className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover" />
                <div className="flex-1 min-w-0">
                  <Link to={`/products/${item.product.id}`} className="font-display font-semibold text-sm text-foreground hover:text-primary transition-colors">
                    {item.product.title}
                  </Link>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.product.category}</p>
                  <div className="flex items-center justify-between mt-2.5">
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="p-1.5 rounded-md bg-secondary hover:bg-border transition-colors touch-manipulation active:scale-90">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center font-medium text-xs">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="p-1.5 rounded-md bg-secondary hover:bg-border transition-colors touch-manipulation active:scale-90">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="font-display font-bold text-sm text-foreground">৳{(item.product.price * item.quantity).toLocaleString()}</span>
                  </div>
                </div>
                <button onClick={() => removeFromCart(item.product.id)} className="self-start p-1.5 rounded-md hover:bg-destructive/10 transition-colors touch-manipulation">
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </motion.div>
            ))}
          </div>

          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} className="bg-card border border-border rounded-2xl p-5 sm:p-6 h-fit space-y-3">
            <h3 className="font-display font-semibold text-foreground text-base">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="text-foreground">৳{subtotal.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span className="text-foreground">Free</span></div>
            </div>
            <div className="border-t border-border pt-3 flex justify-between">
              <span className="font-display font-semibold text-foreground">Total</span>
              <span className="font-display font-bold text-lg text-foreground">৳{subtotal.toLocaleString()}</span>
            </div>
            <button className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm transition-all hover:brightness-105 active:scale-[0.98] touch-manipulation">
              Checkout
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Cart;
