import { SEOHead } from "@/components/SEOHead";
import { Link } from "react-router-dom";
import { ChevronRight, Briefcase, MapPin, Clock, Send } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const jobs = [
  { title: "Digital Marketing Specialist", location: "Dhaka, BD", type: "Full-time", desc: "Drive growth through social media, SEO, and paid ads." },
  { title: "Customer Support Executive", location: "Remote", type: "Full-time", desc: "Deliver exceptional customer experiences across channels." },
  { title: "Product Photographer", location: "Dhaka, BD", type: "Part-time", desc: "Create stunning product visuals for our online store." },
  { title: "Web Developer (React)", location: "Remote", type: "Full-time", desc: "Build and maintain our ecommerce platform." },
];

const Careers = () => {
  const [form, setForm] = useState({ name: "", email: "", role: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.role.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      toast.success("Application submitted! We'll get back to you soon.");
      setForm({ name: "", email: "", role: "", message: "" });
      setSubmitting(false);
    }, 1000);
  };

  return (
    <>
      <SEOHead title="Careers" description="Join the AR Prime Market team. Explore open positions and build your career with us." url="/careers" />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-8">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground font-medium">Careers</span>
        </nav>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-3">Join Our Team</h1>
          <p className="text-muted-foreground max-w-2xl mb-10">We're building Bangladesh's premier ecommerce platform. If you're passionate about technology and customer experience, we'd love to hear from you.</p>
        </motion.div>

        <div className="grid gap-4 mb-16">
          {jobs.map((job) => (
            <motion.div key={job.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-5 rounded-xl border border-border bg-card hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-foreground flex items-center gap-2"><Briefcase className="w-4 h-4 text-primary" />{job.title}</h3>
                  <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{job.type}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{job.desc}</p>
                </div>
                <a href="#apply" className="shrink-0 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:brightness-110 transition-all">Apply Now</a>
              </div>
            </motion.div>
          ))}
        </div>

        <div id="apply" className="max-w-lg mx-auto">
          <h2 className="font-display text-2xl font-bold text-foreground mb-6 text-center">Apply Now</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input placeholder="Full Name *" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} required />
            <Input type="email" placeholder="Email Address *" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} required />
            <Input placeholder="Position Applying For *" value={form.role} onChange={(e) => setForm(f => ({ ...f, role: e.target.value }))} required />
            <Textarea placeholder="Tell us about yourself..." value={form.message} onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))} rows={4} />
            <Button type="submit" className="w-full" disabled={submitting}>
              <Send className="w-4 h-4 mr-2" />{submitting ? "Submitting..." : "Submit Application"}
            </Button>
          </form>
        </div>
      </div>
    </>
  );
};

export default Careers;
