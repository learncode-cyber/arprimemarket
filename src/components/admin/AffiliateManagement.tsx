import { useState, useEffect } from "react";
import { Loader2, Users, DollarSign, TrendingUp, Ban, CheckCircle, CreditCard, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";

interface Affiliate {
  id: string;
  user_id: string;
  affiliate_code: string;
  commission_rate: number;
  commission_type: string;
  total_earnings: number;
  pending_earnings: number;
  paid_earnings: number;
  total_orders: number;
  total_sales: number;
  status: string;
  last_sale_at: string | null;
  created_at: string;
}

interface Commission {
  id: string;
  affiliate_id: string;
  order_id: string;
  order_total: number;
  commission_rate: number;
  commission_amount: number;
  status: string;
  paid_at: string | null;
  created_at: string;
}

const AffiliateManagement = () => {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"affiliates" | "commissions">("affiliates");
  const [payingId, setPayingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const [{ data: affs }, { data: comms }] = await Promise.all([
      supabase.from("affiliates").select("*").order("created_at", { ascending: false }),
      supabase.from("affiliate_commissions").select("*").order("created_at", { ascending: false }).limit(100),
    ]);
    setAffiliates((affs as unknown as Affiliate[]) || []);
    setCommissions((comms as unknown as Commission[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateRate = async (id: string, rate: number) => {
    const { error } = await supabase.from("affiliates").update({ commission_rate: rate }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Commission rate updated");
    load();
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    const { error } = await supabase.from("affiliates").update({ status: newStatus }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Affiliate ${newStatus}`);
    load();
  };

  const approveCommission = async (commission: Commission) => {
    setPayingId(commission.id);
    // Mark commission as paid
    const { error: commError } = await supabase
      .from("affiliate_commissions")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("id", commission.id);
    if (commError) { toast.error(commError.message); setPayingId(null); return; }

    // Update affiliate: move from pending to paid
    const { error: affError } = await supabase
      .from("affiliates")
      .update({
        pending_earnings: Math.max(0, (affiliates.find(a => a.id === commission.affiliate_id)?.pending_earnings || 0) - commission.commission_amount),
        paid_earnings: (affiliates.find(a => a.id === commission.affiliate_id)?.paid_earnings || 0) + commission.commission_amount,
      })
      .eq("id", commission.affiliate_id);
    if (affError) console.warn("Affiliate balance update failed:", affError.message);

    toast.success(`৳${commission.commission_amount.toFixed(0)} commission marked as paid`);
    setPayingId(null);
    load();
  };

  const bulkApprove = async () => {
    const pending = commissions.filter(c => c.status === "pending");
    if (pending.length === 0) { toast.info("No pending commissions"); return; }
    for (const c of pending) {
      await approveCommission(c);
    }
    toast.success(`${pending.length} commissions approved`);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  const totalEarnings = affiliates.reduce((s, a) => s + a.total_earnings, 0);
  const totalPending = affiliates.reduce((s, a) => s + a.pending_earnings, 0);
  const totalSales = affiliates.reduce((s, a) => s + a.total_sales, 0);
  const activeCount = affiliates.filter(a => a.status === "active").length;
  const pendingCommissions = commissions.filter(c => c.status === "pending");
  const affiliateMap = Object.fromEntries(affiliates.map(a => [a.id, a]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-display font-bold text-foreground flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" /> Affiliate Management
        </h2>
        <span className="text-xs text-muted-foreground">{affiliates.length} affiliates</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Active Affiliates", value: activeCount, icon: Users, action: () => setTab("affiliates") },
          { label: "Total Commissions", value: `৳${totalEarnings.toFixed(0)}`, icon: DollarSign, action: () => setTab("commissions") },
          { label: "Pending Payouts", value: `৳${totalPending.toFixed(0)}`, icon: CreditCard, action: () => setTab("commissions") },
          { label: "Affiliate Sales", value: `৳${totalSales.toFixed(0)}`, icon: TrendingUp, action: () => setTab("affiliates") },
        ].map((s, i) => (
          <button key={i} onClick={s.action} className="bg-muted/30 rounded-xl p-3 space-y-1 text-left transition-all duration-200 hover:scale-105 hover:bg-accent/50 hover:shadow-md cursor-pointer">
            <div className="flex items-center gap-1.5">
              <s.icon className="w-3.5 h-3.5 text-primary" />
              <span className="text-[11px] text-muted-foreground">{s.label}</span>
            </div>
            <p className="text-base font-bold text-foreground">{s.value}</p>
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/50 rounded-xl p-1 w-fit">
        {(["affiliates", "commissions"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              tab === t ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "affiliates" ? "Affiliates" : `Commissions${pendingCommissions.length > 0 ? ` (${pendingCommissions.length})` : ""}`}
          </button>
        ))}
      </div>

      {tab === "affiliates" ? (
        /* Affiliates Table */
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="py-2 text-muted-foreground font-medium">Code</th>
                <th className="py-2 text-muted-foreground font-medium">Rate</th>
                <th className="py-2 text-right text-muted-foreground font-medium">Orders</th>
                <th className="py-2 text-right text-muted-foreground font-medium">Sales</th>
                <th className="py-2 text-right text-muted-foreground font-medium">Earnings</th>
                <th className="py-2 text-right text-muted-foreground font-medium">Pending</th>
                <th className="py-2 text-muted-foreground font-medium">Status</th>
                <th className="py-2 text-muted-foreground font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {affiliates.map(a => (
                <motion.tr key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-b border-border/50">
                  <td className="py-2.5 font-mono text-foreground">{a.affiliate_code}</td>
                  <td className="py-2.5">
                    <input
                      type="number"
                      value={a.commission_rate}
                      onChange={e => {
                        const newRate = parseFloat(e.target.value);
                        if (!isNaN(newRate) && newRate >= 0 && newRate <= 50) {
                          setAffiliates(prev => prev.map(x => x.id === a.id ? { ...x, commission_rate: newRate } : x));
                        }
                      }}
                      onBlur={e => updateRate(a.id, parseFloat(e.target.value) || 5)}
                      className="w-16 px-2 py-1 rounded border border-border bg-background text-foreground text-xs"
                      min="0" max="50" step="0.5"
                    />
                    <span className="text-muted-foreground ml-0.5">%</span>
                  </td>
                  <td className="py-2.5 text-right text-foreground">{a.total_orders}</td>
                  <td className="py-2.5 text-right text-foreground">৳{a.total_sales.toFixed(0)}</td>
                  <td className="py-2.5 text-right font-semibold text-emerald-500">৳{a.total_earnings.toFixed(0)}</td>
                  <td className="py-2.5 text-right text-amber-500 font-medium">৳{a.pending_earnings.toFixed(0)}</td>
                  <td className="py-2.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      a.status === "active" ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/10 text-destructive"
                    }`}>{a.status}</span>
                  </td>
                  <td className="py-2.5">
                    <button
                      onClick={() => toggleStatus(a.id, a.status)}
                      className={`p-1.5 rounded-lg transition-colors ${a.status === "active" ? "hover:bg-destructive/10 text-destructive" : "hover:bg-emerald-500/10 text-emerald-500"}`}
                      title={a.status === "active" ? "Deactivate" : "Activate"}
                    >
                      {a.status === "active" ? <Ban className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {affiliates.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">No affiliates yet.</p>
          )}
        </div>
      ) : (
        /* Commissions Table */
        <div className="space-y-3">
          {pendingCommissions.length > 0 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-amber-500 font-medium">{pendingCommissions.length} pending commission(s)</p>
              <button
                onClick={bulkApprove}
                className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-medium hover:bg-emerald-600 transition-colors flex items-center gap-1.5"
              >
                <CheckCircle className="w-3 h-3" /> Approve All
              </button>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="py-2 text-muted-foreground font-medium">Date</th>
                  <th className="py-2 text-muted-foreground font-medium">Affiliate</th>
                  <th className="py-2 text-right text-muted-foreground font-medium">Order Total</th>
                  <th className="py-2 text-right text-muted-foreground font-medium">Rate</th>
                  <th className="py-2 text-right text-muted-foreground font-medium">Commission</th>
                  <th className="py-2 text-muted-foreground font-medium">Status</th>
                  <th className="py-2 text-muted-foreground font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {commissions.map(c => (
                  <motion.tr key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-b border-border/50">
                    <td className="py-2.5 text-foreground">{new Date(c.created_at).toLocaleDateString()}</td>
                    <td className="py-2.5 font-mono text-foreground text-[11px]">
                      {affiliateMap[c.affiliate_id]?.affiliate_code || c.affiliate_id.slice(0, 8)}
                    </td>
                    <td className="py-2.5 text-right text-foreground">৳{c.order_total.toFixed(0)}</td>
                    <td className="py-2.5 text-right text-muted-foreground">{c.commission_rate}%</td>
                    <td className="py-2.5 text-right font-semibold text-emerald-500">৳{c.commission_amount.toFixed(0)}</td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        c.status === "paid" ? "bg-emerald-500/10 text-emerald-500" :
                        c.status === "pending" ? "bg-amber-500/10 text-amber-500" :
                        "bg-muted text-muted-foreground"
                      }`}>{c.status}</span>
                    </td>
                    <td className="py-2.5">
                      {c.status === "pending" ? (
                        <button
                          onClick={() => approveCommission(c)}
                          disabled={payingId === c.id}
                          className="px-2.5 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg text-[11px] font-medium hover:bg-emerald-500/20 transition-colors disabled:opacity-50 flex items-center gap-1"
                        >
                          {payingId === c.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                          Pay
                        </button>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">
                          {c.paid_at ? new Date(c.paid_at).toLocaleDateString() : "—"}
                        </span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            {commissions.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">No commissions yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AffiliateManagement;
