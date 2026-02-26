import { SEOHead } from "@/components/SEOHead";
import { Link } from "react-router-dom";
import { ChevronRight, Target, Eye, Heart, ShieldCheck, Truck, Headphones } from "lucide-react";
import { motion } from "framer-motion";

const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5 } };

const About = () => (
  <>
    <SEOHead title="Our Story" description="Learn about AR Prime Market — our mission, vision, and commitment to premium ecommerce in Bangladesh." url="/about" />

    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-8">
        <Link to="/" className="hover:text-primary transition-colors">Home</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground font-medium">Our Story</span>
      </nav>

      <motion.div {...fadeUp}>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">Our Story</h1>
        <p className="text-muted-foreground text-lg leading-relaxed max-w-3xl mb-12">
          AR Prime Market was founded with a simple belief — everyone deserves access to premium, curated products at fair prices. Based in Dhaka, Bangladesh, we bring the world's best electronics, fashion, and lifestyle products to your doorstep.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6 mb-16">
        {[
          { icon: Target, title: "Our Mission", desc: "To deliver a world-class shopping experience with curated quality products, transparent pricing, and exceptional customer service." },
          { icon: Eye, title: "Our Vision", desc: "To become Bangladesh's most trusted online marketplace — where quality meets convenience and every customer feels valued." },
          { icon: Heart, title: "Our Values", desc: "Integrity, customer-first thinking, continuous improvement, and a passion for excellence in everything we do." },
        ].map((item) => (
          <motion.div key={item.title} {...fadeUp} className="p-6 rounded-2xl border border-border bg-card hover:shadow-lg transition-shadow">
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
              <item.icon className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-display font-bold text-foreground mb-2">{item.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        {[
          { icon: ShieldCheck, title: "100% Authentic", desc: "Every product is sourced from verified suppliers." },
          { icon: Truck, title: "Fast Delivery", desc: "Nationwide shipping across Bangladesh." },
          { icon: Headphones, title: "24/7 Support", desc: "Always here to help via WhatsApp, email, or phone." },
        ].map((item) => (
          <div key={item.title} className="flex items-start gap-3 p-4 rounded-xl bg-secondary/50">
            <item.icon className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <div>
              <h4 className="font-semibold text-sm text-foreground">{item.title}</h4>
              <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </>
);

export default About;
