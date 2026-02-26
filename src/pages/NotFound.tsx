import { motion } from "framer-motion";
import { Home, SearchX } from "lucide-react";
import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
          className="w-24 h-24 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6"
        >
          <SearchX className="w-10 h-10 text-primary" />
        </motion.div>

        <h1 className="font-display text-7xl font-black text-primary mb-2">404</h1>
        <h2 className="font-display text-xl font-bold text-foreground mb-2">Page Not Found</h2>
        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
          The page you're looking for doesn't exist or has been moved. Let's get you back on track.
        </p>

        <Link
          to="/"
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm transition-all hover:brightness-110 hover:shadow-lg hover:shadow-primary/20 active:scale-[0.97] touch-manipulation"
        >
          <Home className="w-4 h-4" />
          Back to Home
        </Link>

        <p className="text-xs text-muted-foreground mt-6">
          Need help? <Link to="/contact" className="text-primary hover:underline font-medium">Contact Support</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default NotFound;
