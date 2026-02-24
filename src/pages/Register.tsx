import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, User, ArrowRight, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

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
    const errs: typeof errors = {};
    if (!name) errs.name = "Name is required";
    if (!email) errs.email = "Email is required";
    if (!password) errs.password = "Password is required";
    else if (password.length < 6) errs.password = "Must be at least 6 characters";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSubmitting(true);
    const { error } = await signUp(email, password, name);
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
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            {errors.name && <p className="text-destructive text-xs mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            {errors.email && <p className="text-destructive text-xs mt-1">{errors.email}</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            {errors.password && <p className="text-destructive text-xs mt-1">{errors.password}</p>}
          </div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={submitting} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm glow-primary disabled:opacity-50">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Create Account <ArrowRight className="w-4 h-4" /></>}
          </motion.button>
        </form>
        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account? <Link to="/login" className="text-primary font-medium hover:underline">Sign In</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Register;
