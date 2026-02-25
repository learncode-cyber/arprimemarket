import { useState, useEffect } from "react";
import { Loader2, Users, Gift, Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface ReferralCode {
  id: string;
  user_id: string;
  code: string;
  reward_type: string;
  reward_value: number;
  referrer_reward_value: number;
  max_uses: number | null;
  used_count: number;
  is_active: boolean;
  created_at: string;
}

interface Referral {
  id: string;
  referral_code_id: string;
  referrer_id: string;
  referred_id: string;
  order_id: string | null;
  status: string;
  referrer_reward: number;
  referred_reward: number;
  created_at: string;
  completed_at: string | null;
}

const ReferralManagement = () => {
  const [codes, setCodes] = useState<ReferralCode[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const [codesRes, referralsRes] = await Promise.all([
      supabase.from("referral_codes").select("*").order("created_at", { ascending: false }),
      supabase.from("referrals").select("*").order("created_at", { ascending: false }).limit(50),
    ]);
    setCodes((codesRes.data as ReferralCode[]) || []);
    setReferrals((referralsRes.data as Referral[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleToggle = async (c: ReferralCode) => {
    await supabase.from("referral_codes").update({ is_active: !c.is_active }).eq("id", c.id);
    toast.success(c.is_active ? "Disabled" : "Enabled"); load();
  };

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success("Copied!");
  };

  const totalRewards = referrals.filter(r => r.status === "rewarded").reduce((s, r) => s + Number(r.referrer_reward) + Number(r.referred_reward), 0);
  const conversionRate = codes.length ? Math.round((referrals.filter(r => r.status !== "pending").length / Math.max(codes.reduce((s, c) => s + c.used_count, 0), 1)) * 100) : 0;

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-5">
      <h3 className="font-display font-semibold text-base text-foreground flex items-center gap-2">
        <Gift className="w-4 h-4 text-primary" /> Referral System
      </h3>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Codes", value: codes.length, color: "from-primary/20 to-primary/5" },
          { label: "Total Referrals", value: referrals.length, color: "from-blue-500/20 to-blue-500/5" },
          { label: "Rewards Paid", value: `৳${totalRewards.toLocaleString()}`, color: "from-green-500/20 to-green-500/5" },
          { label: "Conversion", value: `${conversionRate}%`, color: "from-amber-500/20 to-amber-500/5" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-card border border-border rounded-2xl p-4 relative overflow-hidden">
            <div className={`absolute inset-0 bg-gradient-to-br ${s.color} opacity-50`} />
            <div className="relative">
              <p className="font-display text-xl font-bold text-foreground">{s.value}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Referral Codes */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h4 className="text-sm font-semibold text-foreground">Referral Codes ({codes.length})</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Code</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Rewards</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Used</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Action</th>
            </tr></thead>
            <tbody>
              {codes.map(c => (
                <tr key={c.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-foreground text-xs">{c.code}</span>
                      <button onClick={() => copyCode(c.code, c.id)} className="p-1 rounded hover:bg-secondary">
                        {copiedId === c.id ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    Referrer: {c.referrer_reward_value}{c.reward_type === "percentage" ? "%" : "৳"} · New: {c.reward_value}{c.reward_type === "percentage" ? "%" : "৳"}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{c.used_count}/{c.max_uses || "∞"}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleToggle(c)} className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${c.is_active ? "bg-green-500/10 text-green-500" : "bg-muted text-muted-foreground"}`}>
                      {c.is_active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {codes.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground text-sm">No referral codes yet. Users create them from their dashboard.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Referrals */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h4 className="text-sm font-semibold text-foreground">Recent Referrals</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Rewards</th>
            </tr></thead>
            <tbody>
              {referrals.slice(0, 10).map(r => (
                <tr key={r.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      r.status === "rewarded" ? "bg-green-500/10 text-green-500" :
                      r.status === "completed" ? "bg-blue-500/10 text-blue-500" :
                      "bg-amber-500/10 text-amber-500"
                    }`}>{r.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">৳{(Number(r.referrer_reward) + Number(r.referred_reward)).toLocaleString()}</td>
                </tr>
              ))}
              {referrals.length === 0 && <tr><td colSpan={3} className="px-4 py-8 text-center text-muted-foreground text-sm">No referrals yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReferralManagement;
