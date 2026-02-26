import { SEOHead } from "@/components/SEOHead";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

const CookiePolicy = () => (
  <>
    <SEOHead title="Cookie Policy" description="Learn how AR Prime Market uses cookies to improve your browsing experience." url="/cookie-policy" />
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-8">
        <Link to="/" className="hover:text-primary transition-colors">Home</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground font-medium">Cookie Policy</span>
      </nav>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-3">Cookie Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: February 26, 2026</p>
      </motion.div>

      <div className="prose prose-sm max-w-none text-muted-foreground space-y-6">
        <section>
          <h2 className="text-lg font-semibold text-foreground">What Are Cookies?</h2>
          <p>Cookies are small text files placed on your device when you visit our website. They help us recognize your browser and capture certain information to improve your experience.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">How We Use Cookies</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Essential Cookies:</strong> Required for the website to function (e.g., session management, cart functionality).</li>
            <li><strong>Analytics Cookies:</strong> Help us understand how visitors interact with our website.</li>
            <li><strong>Marketing Cookies:</strong> Used to deliver relevant advertisements and track campaign performance.</li>
            <li><strong>Preference Cookies:</strong> Remember your settings like language and currency preferences.</li>
          </ul>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">Managing Cookies</h2>
          <p>You can manage cookies through your browser settings. Disabling certain cookies may affect the functionality of our website.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">Third-Party Cookies</h2>
          <p>We may use third-party services (such as analytics and advertising platforms) that set their own cookies. We have no direct control over these cookies.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">Contact Us</h2>
          <p>If you have questions about our cookie policy, please contact us at <a href="mailto:support@arprimemarket.com" className="text-primary hover:underline">support@arprimemarket.com</a>.</p>
        </section>
      </div>
    </div>
  </>
);

export default CookiePolicy;
