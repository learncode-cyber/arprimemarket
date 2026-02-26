import { SEOHead } from "@/components/SEOHead";

const PrivacyPolicy = () => (
  <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
    <SEOHead title="Privacy Policy" url="/privacy-policy" description="AR Prime Market privacy policy. Learn how we collect, use, and protect your personal information." />
    <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-6">Privacy Policy</h1>
    <p className="text-xs text-muted-foreground mb-8">Last updated: February 26, 2026</p>

    <div className="prose prose-sm max-w-none space-y-6 text-sm text-muted-foreground leading-relaxed">
      <section>
        <h2 className="font-display text-lg font-semibold text-foreground mb-2">1. Information We Collect</h2>
        <p>We collect information you provide directly: name, email, phone number, shipping address, and payment details when you place an order. We also collect browsing data, device information, and cookies automatically.</p>
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold text-foreground mb-2">2. How We Use Your Information</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Process and fulfill your orders</li>
          <li>Send order confirmations, shipping updates, and delivery notifications</li>
          <li>Improve our products, services, and user experience</li>
          <li>Prevent fraud and maintain security</li>
          <li>Send promotional emails (with your consent)</li>
        </ul>
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold text-foreground mb-2">3. Information Sharing</h2>
        <p>We do not sell your personal information. We share data only with shipping carriers, payment processors, and service providers necessary to fulfill your orders.</p>
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold text-foreground mb-2">4. Data Security</h2>
        <p>We use industry-standard encryption (SSL/TLS) to protect your data in transit and at rest. Access to personal data is restricted to authorized personnel only.</p>
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold text-foreground mb-2">5. Cookies</h2>
        <p>We use essential cookies for site functionality, analytics cookies to understand usage patterns, and marketing cookies for targeted advertising. You can manage cookie preferences through your browser settings.</p>
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold text-foreground mb-2">6. Your Rights</h2>
        <p>You have the right to access, correct, or delete your personal data. Contact us at support@arprimemarket.com for any data-related requests.</p>
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold text-foreground mb-2">7. Contact</h2>
        <p>For privacy concerns, email us at <a href="mailto:support@arprimemarket.com" className="text-primary hover:underline">support@arprimemarket.com</a></p>
      </section>
    </div>
  </div>
);

export default PrivacyPolicy;
