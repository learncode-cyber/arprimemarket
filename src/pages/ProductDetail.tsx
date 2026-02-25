import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, Heart, ShoppingCart, ArrowLeft, Minus, Plus, Loader2 } from "lucide-react";
import { useState } from "react";
import { useProduct } from "@/hooks/useProductData";
import { useCart } from "@/context/CartContext";

const ProductDetail = () => {
  const { id } = useParams();
  const { data: product, isLoading } = useProduct(id || "");
  const { addToCart } = useCart();
  const [qty, setQty] = useState(1);

  if (isLoading) {
    return (
      <div className="container max-w-6xl mx-auto px-6 py-20 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container max-w-6xl mx-auto px-6 py-20 text-center">
        <p className="text-muted-foreground">Product not found</p>
        <Link to="/products" className="text-primary mt-4 inline-block">← Back to Products</Link>
      </div>
    );
  }

  const handleAdd = () => {
    for (let i = 0; i < qty; i++) addToCart(product);
  };

  return (
    <div className="container max-w-6xl mx-auto px-6 py-12">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Link to="/products" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Products
        </Link>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="glass rounded-2xl overflow-hidden aspect-square float-shadow">
          <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="flex flex-col justify-center space-y-6">
          <span className="inline-flex self-start px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
            {product.category}
          </span>

          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">{product.title}</h1>

          <div className="flex items-center gap-2">
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`w-5 h-5 ${i < Math.floor(product.rating) ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"}`} />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">{product.rating} rating</span>
          </div>

          <p className="text-muted-foreground leading-relaxed">{product.description}</p>

          <div className="font-display text-4xl font-bold text-foreground">
            ${product.price.toFixed(2)}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 glass rounded-xl px-3 py-2">
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => setQty(Math.max(1, qty - 1))} className="p-1 hover:bg-secondary rounded-lg transition-colors">
                <Minus className="w-4 h-4" />
              </motion.button>
              <span className="font-medium w-8 text-center">{qty}</span>
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => setQty(qty + 1)} className="p-1 hover:bg-secondary rounded-lg transition-colors">
                <Plus className="w-4 h-4" />
              </motion.button>
            </div>
          </div>

          <div className="flex gap-3">
            <motion.button whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }} onClick={handleAdd} className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm glow-primary">
              <ShoppingCart className="w-4 h-4" /> Add to Cart
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="p-3.5 rounded-xl glass hover:bg-destructive/10 transition-colors">
              <Heart className="w-5 h-5 text-muted-foreground" />
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProductDetail;
