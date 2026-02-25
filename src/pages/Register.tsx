import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, User, ArrowRight, Loader2, Shield, Check, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { registerSchema, clientRateLimit } from "@/lib/validation";

const passwordRules = [
  { label: "8+ characters", test: (p: string) => p.length >= 8 },
  { label: "Uppercase", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Lowercase", test: (p: string) => /[a-z]/.test(p) },
  { label: "Number", test: (p: string) => /[0-9]/.test(p) },
];

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientRateLimit("register", 3, 60 * 60 * 1000)) {
      toast.error("Too many registration attempts. Please try again later.");
      return;
    }

    const result = registerSchema.safeParse({ name, email, password });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(e => {
        const key = e.path[0] as string;
        if (!fieldErrors[key]) fieldErrors[key] = e.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});

    setSubmitting(true);
    const { error } = await signUp(result.data.email, result.data.password, result.data.name);
    setSubmitting(false);

    if (error) {
      toast.error(error);
    } else {
      toast.success("Account created! Please check your email to verify.");
      navigate("/login");
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass rounded-2xl p-8 float-shadow"
      >
        <h1 className="font-display text-3xl font-bold text-foreground text-center mb-2">Create Account</h1>
        <p className="text-muted-foreground text-center text-sm mb-8">Join AR Prime Market today</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" maxLength={100} className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            {errors.name && <p className="text-destructive text-xs mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" maxLength={255} className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            {errors.email && <p className="text-destructive text-xs mt-1">{errors.email}</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" maxLength={128} className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            {errors.password && <p className="text-destructive text-xs mt-1">{errors.password}</p>}
            {/* Password strength indicator */}
            {password && (
              <div className="flex flex-wrap gap-2 mt-2">
                {passwordRules.map(rule => (
                  <span key={rule.label} className={`flex items-center gap-1 text-[10px] font-medium ${rule.test(password) ? "text-green-500" : "text-muted-foreground"}`}>
                    {rule.test(password) ? <Check className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />}
                    {rule.label}
                  </span>
                ))}
              </div>
            )}
          </div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={submitting} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm glow-primary disabled:opacity-50">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Create Account <ArrowRight className="w-4 h-4" /></>}
          </motion.button>
        </form>

        <div className="flex items-center justify-center gap-1.5 mt-4 text-[10px] text-muted-foreground">
          <Shield className="w-3 h-3" /> Your data is encrypted & secure
        </div>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Already have an account? <Link to="/login" className="text-primary font-medium hover:underline">Sign In</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Register;
