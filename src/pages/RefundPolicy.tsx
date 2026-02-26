import { SEOHead } from "@/components/SEOHead";

const RefundPolicy = () => (
  <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
    <SEOHead title="Refund Policy" url="/refund-policy" description="AR Prime Market refund and return policy. Learn about our hassle-free return process." />
    <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-6">Refund & Return Policy</h1>
    <p className="text-xs text-muted-foreground mb-8">Last updated: February 26, 2026</p>

    <div className="prose prose-sm max-w-none space-y-6 text-sm text-muted-foreground leading-relaxed">
      <section>
        <h2 className="font-display text-lg font-semibold text-foreground mb-2">1. Return Eligibility</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Items can be returned within 7 days of delivery</li>
          <li>Products must be unused, in original packaging, with all tags attached</li>
          <li>Electronics must include all accessories and warranty cards</li>
          <li>Perishable goods and intimate items are non-returnable</li>
        </ul>
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold text-foreground mb-2">2. Return Process</h2>
        <p>Contact our support team at support@arprimemarket.com with your order number. We will provide a return authorization and shipping instructions within 24 hours.</p>
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold text-foreground mb-2">3. Refund Processing</h2>
        <p>Refunds are processed within 5-10 business days after we receive and inspect the returned item. Refunds are issued to the original payment method.</p>
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold text-foreground mb-2">4. Damaged or Defective Items</h2>
        <p>If you receive a damaged or defective product, contact us within 48 hours with photos. We will arrange a free replacement or full refund including shipping costs.</p>
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold text-foreground mb-2">5. Shipping Costs</h2>
        <p>Return shipping costs are the buyer's responsibility unless the item is defective or we made an error. Original shipping fees are non-refundable.</p>
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold text-foreground mb-2">6. Contact</h2>
        <p>For return requests, email <a href="mailto:support@arprimemarket.com" className="text-primary hover:underline">support@arprimemarket.com</a> or reach us via WhatsApp.</p>
      </section>
    </div>
  </div>
);

export default RefundPolicy;
