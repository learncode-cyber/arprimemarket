import { SEOHead } from "@/components/SEOHead";
import { Link } from "react-router-dom";
import { ChevronRight, Mail, Phone, MapPin, MessageCircle, Send } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const Contact = () => {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      toast.success("Message sent! We'll respond within 24 hours.");
      setForm({ name: "", email: "", subject: "", message: "" });
      setSubmitting(false);
    }, 1000);
  };

  return (
    <>
      <SEOHead title="Contact Us" description="Get in touch with AR Prime Market. We're here to help via email, phone, or WhatsApp." url="/contact" />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-8">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground font-medium">Contact Us</span>
        </nav>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-3">Contact Us</h1>
          <p className="text-muted-foreground max-w-2xl mb-10">Have a question? We'd love to hear from you.</p>
        </motion.div>

        <div className="grid md:grid-cols-5 gap-10">
          <div className="md:col-span-3">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Input placeholder="Full Name *" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} required />
                <Input type="email" placeholder="Email Address *" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} required />
              </div>
              <Input placeholder="Subject" value={form.subject} onChange={(e) => setForm(f => ({ ...f, subject: e.target.value }))} />
              <Textarea placeholder="Your message *" value={form.message} onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))} rows={5} required />
              <Button type="submit" className="w-full sm:w-auto" disabled={submitting}>
                <Send className="w-4 h-4 mr-2" />{submitting ? "Sending..." : "Send Message"}
              </Button>
            </form>
          </div>

          <div className="md:col-span-2 space-y-4">
            {[
              { icon: Mail, label: "Email", value: "support@arprimemarket.com", href: "mailto:support@arprimemarket.com" },
              { icon: Phone, label: "Phone", value: "+880 1910-521565", href: "tel:+8801910521565" },
              { icon: MessageCircle, label: "WhatsApp", value: "Chat with us", href: "https://wa.me/8801910521565" },
              { icon: MapPin, label: "Location", value: "Dhaka, Bangladesh", href: "#" },
            ].map((item) => (
              <a key={item.label} href={item.href} target={item.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card hover:shadow-sm hover:border-primary/20 transition-all">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <item.icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                  <p className="text-sm font-medium text-foreground">{item.value}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Contact;
