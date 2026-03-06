import { useState } from "react";
import { KeyRound, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AdminPasswordChange = () => {
  const [passwordForm, setPasswordForm] = useState({ password: "", confirm: "" });
  const [changing, setChanging] = useState(false);

  const handleChange = async () => {
    if (passwordForm.password.length < 6) { toast.error("Min 6 characters"); return; }
    if (passwordForm.password !== passwordForm.confirm) { toast.error("Passwords don't match"); return; }
    setChanging(true);
    const { error } = await supabase.auth.updateUser({ password: passwordForm.password });
    setChanging(false);
    if (error) toast.error(error.message);
    else { toast.success("Password changed!"); setPasswordForm({ password: "", confirm: "" }); }
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 space-y-4">
      <h2 className="font-display text-base font-semibold text-foreground flex items-center gap-2">
        <KeyRound className="w-4 h-4 text-primary" />
        Change Admin Password
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground">New Password</label>
          <input type="password" value={passwordForm.password} onChange={e => setPasswordForm(p => ({ ...p, password: e.target.value }))}
            className="w-full mt-1 px-3 py-2.5 rounded-xl bg-secondary text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Confirm Password</label>
          <input type="password" value={passwordForm.confirm} onChange={e => setPasswordForm(p => ({ ...p, confirm: e.target.value }))}
            className="w-full mt-1 px-3 py-2.5 rounded-xl bg-secondary text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
      </div>
      <button onClick={handleChange} disabled={changing}
        className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-medium text-xs hover:brightness-105 active:scale-[0.98] transition-all touch-manipulation disabled:opacity-60 flex items-center gap-2">
        {changing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        Update Password
      </button>
    </div>
  );
};

export default AdminPasswordChange;
