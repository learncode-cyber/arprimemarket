import { useState } from "react";
import { motion } from "framer-motion";
import { Home, ShoppingBag, Search, Package, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const NotFound = () => {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/products?search=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/8 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <motion.div
          animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[15%] right-[10%] opacity-10"
        >
          <Package className="w-24 h-24 text-primary" />
        </motion.div>
        <motion.div
          animate={{ y: [0, 15, 0], rotate: [0, -8, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-[20%] left-[8%] opacity-10"
        >
          <ShoppingBag className="w-20 h-20 text-primary" />
        </motion.div>
        <motion.div
          animate={{ y: [0, -12, 0], x: [0, 8, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute top-[30%] left-[20%] opacity-[0.07]"
        >
          <Sparkles className="w-16 h-16 text-primary" />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-lg relative z-10"
      >
        {/* 3D-ish floating illustration */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 180 }}
          className="relative mx-auto mb-6 w-32 h-32"
        >
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 rotate-6 scale-105" />
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-primary/15 to-transparent -rotate-3 scale-110" />
          <div className="relative w-full h-full rounded-3xl bg-card border border-border shadow-xl flex items-center justify-center">
            <Package className="w-14 h-14 text-primary" />
          </div>
        </motion.div>

        {/* Gradient 404 text */}
        <h1 className="font-display text-8xl sm:text-9xl font-black bg-gradient-to-br from-primary via-primary/70 to-primary/40 bg-clip-text text-transparent mb-3 leading-none select-none">
          404
        </h1>

        <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground mb-2">
          Oops! Page Not Found
        </h2>
        <p className="text-sm text-muted-foreground mb-8 leading-relaxed max-w-sm mx-auto">
          Looks like this page went on a shopping spree and hasn't come back yet. 
          Let's help you find what you're looking for!
        </p>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="mb-8 max-w-sm mx-auto">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for products..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-card text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 shadow-sm transition-all"
            />
          </div>
        </form>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm transition-all hover:brightness-110 hover:shadow-lg hover:shadow-primary/20 active:scale-[0.97] touch-manipulation w-full sm:w-auto justify-center"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </Link>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-7 py-3 rounded-xl border border-border bg-card text-foreground font-semibold text-sm transition-all hover:bg-accent active:scale-[0.97] touch-manipulation w-full sm:w-auto justify-center"
          >
            <ShoppingBag className="w-4 h-4" />
            Explore Products
          </Link>
        </div>

        <p className="text-xs text-muted-foreground mt-8">
          Need help?{" "}
          <Link to="/contact" className="text-primary hover:underline font-medium">
            Contact Support
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default NotFound;
