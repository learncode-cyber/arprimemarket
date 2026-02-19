import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Zap, Shield } from "lucide-react";

const floatingCards = [
  { icon: Sparkles, label: "Curated", delay: 0 },
  { icon: Zap, label: "Fast Delivery", delay: 0.2 },
  { icon: Shield, label: "Secure", delay: 0.4 },
];

const Index = () => {
  return (
    <div className="relative overflow-hidden">
      {/* Background glow orbs */}
      <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full bg-primary/10 blur-3xl animate-glow-pulse pointer-events-none" />
      <div className="absolute top-40 right-1/4 w-80 h-80 rounded-full bg-accent/10 blur-3xl animate-glow-pulse pointer-events-none" style={{ animationDelay: "1.5s" }} />

      {/* Hero */}
      <section className="container max-w-6xl mx-auto px-6 py-24 md:py-36 relative">
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs font-medium text-muted-foreground mb-8">
              <Sparkles className="w-3 h-3 text-primary" />
              Welcome to the future of shopping
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display text-5xl md:text-7xl font-bold leading-tight tracking-tight"
          >
            Shop the
            <span className="text-gradient-primary"> Extraordinary</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 text-lg text-muted-foreground max-w-lg leading-relaxed"
          >
            Discover premium products curated for those who demand excellence.
            AR Prime Market — where quality meets innovation.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row gap-4"
          >
            <motion.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm flex items-center gap-2 glow-primary transition-shadow"
            >
              Explore Store
              <ArrowRight className="w-4 h-4" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="px-8 py-3.5 rounded-xl glass font-medium text-sm text-foreground transition-shadow hover:float-shadow"
            >
              Learn More
            </motion.button>
          </motion.div>
        </div>

        {/* Floating feature cards */}
        <div className="mt-24 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
          {floatingCards.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 + card.delay }}
              className="animate-float"
              style={{ animationDelay: `${i * 0.5}s` }}
            >
              <div className="glass rounded-2xl p-6 text-center float-shadow">
                <card.icon className="w-6 h-6 text-primary mx-auto mb-3" />
                <span className="text-sm font-medium text-foreground">{card.label}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Index;
