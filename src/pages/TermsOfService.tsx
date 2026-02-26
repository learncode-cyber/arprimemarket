import { SEOHead } from "@/components/SEOHead";

const TermsOfService = () => (
  <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
    <SEOHead title="Terms of Service" url="/terms" description="AR Prime Market terms of service. Read our terms and conditions for using our ecommerce platform." />
    <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-6">Terms of Service</h1>
    <p className="text-xs text-muted-foreground mb-8">Last updated: February 26, 2026</p>

    <div className="prose prose-sm max-w-none space-y-6 text-sm text-muted-foreground leading-relaxed">
      <section>
        <h2 className="font-display text-lg font-semibold text-foreground mb-2">1. Acceptance of Terms</h2>
        <p>By accessing and using AR Prime Market, you agree to be bound by these Terms of Service. If you do not agree, please do not use our platform.</p>
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold text-foreground mb-2">2. Account Registration</h2>
        <p>You must provide accurate information when creating an account. You are responsible for maintaining the security of your account credentials. You must be at least 18 years old to make purchases.</p>
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold text-foreground mb-2">3. Orders & Payments</h2>
        <p>All orders are subject to availability and confirmation. Prices are displayed in the selected currency and may vary with exchange rates. We reserve the right to cancel orders suspected of fraud.</p>
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold text-foreground mb-2">4. Shipping & Delivery</h2>
        <p>Shipping times are estimates and not guaranteed. We are not responsible for delays caused by customs, weather, or carrier issues. Risk of loss transfers to you upon delivery to the carrier.</p>
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold text-foreground mb-2">5. Intellectual Property</h2>
        <p>All content on AR Prime Market, including logos, images, and text, is our intellectual property. Unauthorized use is prohibited.</p>
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold text-foreground mb-2">6. Limitation of Liability</h2>
        <p>AR Prime Market is not liable for indirect, incidental, or consequential damages arising from your use of our platform or products purchased through it.</p>
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold text-foreground mb-2">7. Governing Law</h2>
        <p>These terms are governed by the laws of Bangladesh. Any disputes shall be resolved in the courts of Dhaka.</p>
      </section>
    </div>
  </div>
);

export default TermsOfService;
