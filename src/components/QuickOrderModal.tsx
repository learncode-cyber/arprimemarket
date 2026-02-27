import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, Loader2, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrency } from "@/context/CurrencyContext";
import { toast } from "sonner";

interface QuickOrderProduct {
  id: string;
  title: string;
  price: number;
  image: string;
}

interface QuickOrderModalProps {
  open: boolean;
  onClose: () => void;
  product: QuickOrderProduct;
}

export const QuickOrderModal = ({ open, onClose, product }: QuickOrderModalProps) => {
  const { formatPrice } = useCurrency();
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "" });
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.email.trim()) {
      toast.error("Name, Phone and Email are required");
      return;
    }
    setSending(true);
    try {
      const orderNumber = "ARP-" + new Date().toISOString().slice(0, 10).replace(/-/g, "") + "-" + Math.floor(Math.random() * 1000000).toString().padStart(6, "0");

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          order_number: orderNumber,
          status: "pending",
          payment_status: "unpaid",
          subtotal: product.price,
          total: product.price,
          shipping_name: form.name.trim(),
          shipping_phone: form.phone.trim(),
          shipping_email: form.email.trim() || null,
          shipping_address: form.address.trim() || null,
          notes: "1-Click Quick Order (Guest)",
        })
        .select("id")
        .single();

      if (orderError) throw orderError;

      await supabase.from("order_items").insert({
        order_id: order.id,
        product_id: product.id,
        title: product.title,
        price: product.price,
        quantity: 1,
        total: product.price,
        image_url: product.image,
      });

      setDone(true);
      toast.success("Order placed successfully!");
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to place order. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setDone(false);
    setForm({ name: "", phone: "", email: "", address: "" });
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            className="relative w-full max-w-md rounded-2xl bg-card border border-border shadow-2xl z-10 overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                <span className="font-display font-bold text-sm">Order in 1-Click</span>
              </div>
              <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {done ? (
              <div className="p-8 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <h3 className="font-display font-bold text-lg text-foreground mb-1">Order Placed!</h3>
                <p className="text-sm text-muted-foreground mb-4">We'll contact you shortly to confirm.</p>
                <button onClick={handleClose} className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm">
                  Close
                </button>
              </div>
            ) : (
              <>
                <div className="px-5 py-3 flex items-center gap-3 bg-secondary/50">
                  <img src={product.image} alt={product.title} className="w-12 h-12 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{product.title}</p>
                    <p className="text-sm font-bold text-primary">{formatPrice(product.price)}</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-3">
                  <input
                    type="text"
                    placeholder="Your Name *"
                    value={form.name}
                    onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                    maxLength={100}
                  />
                  <input
                    type="tel"
                    placeholder="Phone Number *"
                    value={form.phone}
                    onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                    maxLength={20}
                  />
                  <input
                    type="email"
                    placeholder="Email *"
                    value={form.email}
                    onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                    maxLength={255}
                  />
                  <textarea
                    placeholder="Delivery Address"
                    value={form.address}
                    onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))}
                    className="w-full h-20 rounded-xl border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    maxLength={500}
                  />
                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm transition-all hover:brightness-105 active:scale-[0.98] disabled:opacity-60"
                  >
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                    {sending ? "Placing Order..." : "Place Order"}
                  </button>
                </form>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
