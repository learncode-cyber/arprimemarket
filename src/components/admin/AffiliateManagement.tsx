import { useState, useEffect } from "react";
import { Loader2, Users, DollarSign, TrendingUp, Settings, Ban, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";

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

const AffiliateManagement = () => {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("affiliates").select("*").order("created_at", { ascending: false });
    setAffiliates((data as unknown as Affiliate[]) || []);
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

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  const totalEarnings = affiliates.reduce((s, a) => s + a.total_earnings, 0);
  const totalSales = affiliates.reduce((s, a) => s + a.total_sales, 0);
  const activeCount = affiliates.filter(a => a.status === "active").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-display font-bold text-foreground flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" /> Affiliate Management
        </h2>
        <span className="text-xs text-muted-foreground">{affiliates.length} affiliates</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Active Affiliates", value: activeCount, icon: Users },
          { label: "Total Commissions", value: `৳${totalEarnings.toFixed(0)}`, icon: DollarSign },
          { label: "Affiliate Sales", value: `৳${totalSales.toFixed(0)}`, icon: TrendingUp },
        ].map((s, i) => (
          <div key={i} className="bg-muted/30 rounded-xl p-3 space-y-1">
            <div className="flex items-center gap-1.5">
              <s.icon className="w-3.5 h-3.5 text-primary" />
              <span className="text-[11px] text-muted-foreground">{s.label}</span>
            </div>
            <p className="text-base font-bold text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="py-2 text-muted-foreground font-medium">Code</th>
              <th className="py-2 text-muted-foreground font-medium">Rate</th>
              <th className="py-2 text-right text-muted-foreground font-medium">Orders</th>
              <th className="py-2 text-right text-muted-foreground font-medium">Sales</th>
              <th className="py-2 text-right text-muted-foreground font-medium">Earnings</th>
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
      </div>

      {affiliates.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-8">No affiliates yet.</p>
      )}
    </div>
  );
};

export default AffiliateManagement;
