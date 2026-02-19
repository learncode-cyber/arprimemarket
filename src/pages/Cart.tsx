import { motion } from "framer-motion";
import { Minus, Plus, X, ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { Link } from "react-router-dom";

const Cart = () => {
  const { items, updateQuantity, removeFromCart, subtotal, totalItems } = useCart();

  return (
    <div className="container max-w-4xl mx-auto px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-4xl font-bold text-foreground mb-2">Shopping Cart</h1>
        <p className="text-muted-foreground mb-10">{totalItems} item{totalItems !== 1 ? "s" : ""} in your cart</p>
      </motion.div>

      {items.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20 glass rounded-2xl"
        >
          <ShoppingBag className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground mb-6">Your cart is empty</p>
          <Link to="/products" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm">
            Continue Shopping <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item, i) => (
              <motion.div
                key={item.product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                layout
                className="glass rounded-2xl p-4 flex gap-4"
              >
                <img src={item.product.image} alt={item.product.title} className="w-24 h-24 rounded-xl object-cover" />
                <div className="flex-1 min-w-0">
                  <Link to={`/products/${item.product.id}`} className="font-display font-semibold text-foreground hover:text-primary transition-colors">
                    {item.product.title}
                  </Link>
                  <p className="text-sm text-muted-foreground mt-1">{item.product.category}</p>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <motion.button whileTap={{ scale: 0.9 }} onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="p-1.5 rounded-lg bg-secondary hover:bg-border transition-colors">
                        <Minus className="w-3 h-3" />
                      </motion.button>
                      <span className="w-8 text-center font-medium text-sm">{item.quantity}</span>
                      <motion.button whileTap={{ scale: 0.9 }} onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="p-1.5 rounded-lg bg-secondary hover:bg-border transition-colors">
                        <Plus className="w-3 h-3" />
                      </motion.button>
                    </div>
                    <span className="font-display font-bold text-foreground">${(item.product.price * item.quantity).toFixed(2)}</span>
                  </div>
                </div>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => removeFromCart(item.product.id)} className="self-start p-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
                  <X className="w-4 h-4 text-muted-foreground" />
                </motion.button>
              </motion.div>
            ))}
          </div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass rounded-2xl p-6 h-fit space-y-4 float-shadow">
            <h3 className="font-display font-semibold text-foreground text-lg">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="text-foreground">${subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span className="text-foreground">Free</span></div>
            </div>
            <div className="border-t border-border pt-4 flex justify-between">
              <span className="font-display font-semibold text-foreground">Total</span>
              <span className="font-display font-bold text-xl text-foreground">${subtotal.toFixed(2)}</span>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm glow-primary"
            >
              Checkout
            </motion.button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Cart;
