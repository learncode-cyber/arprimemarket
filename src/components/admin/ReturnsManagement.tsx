import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RotateCcw, Check, X, Eye, Package, RefreshCw, Loader2 } from "lucide-react";

interface ReturnRequest {
  id: string;
  return_number: string;
  order_id: string;
  user_id: string;
  status: string;
  reason: string;
  details: string | null;
  product_items: any[];
  refund_type: string;
  refund_amount: number;
  admin_notes: string | null;
  restock_items: boolean;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
}

const statusColors: Record<string, { bg: string; text: string }> = {
  pending: { bg: "bg-amber-500/10", text: "text-amber-500" },
  approved: { bg: "bg-blue-500/10", text: "text-blue-500" },
  rejected: { bg: "bg-destructive/10", text: "text-destructive" },
  refunded: { bg: "bg-green-500/10", text: "text-green-500" },
};

const ReturnsManagement = () => {
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<ReturnRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [restockItems, setRestockItems] = useState(false);
  const [processing, setProcessing] = useState(false);

  const fetchReturns = async () => {
    setLoading(true);
    let query = supabase.from("return_requests").select("*").order("created_at", { ascending: false });
    if (filter !== "all") query = query.eq("status", filter);
    const { data, error } = await query;
    if (error) toast.error(error.message);
    else setReturns((data as any[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchReturns(); }, [filter]);

  const handleAction = async (action: "approved" | "rejected" | "refunded") => {
    if (!selected) return;
    setProcessing(true);
    const update: any = {
      status: action,
      admin_notes: adminNotes || null,
      resolved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    if (action === "approved" || action === "refunded") {
      update.refund_amount = parseFloat(refundAmount) || selected.refund_amount;
      update.restock_items = restockItems;
    }

    const { error } = await supabase.from("return_requests").update(update).eq("id", selected.id);
    if (error) { toast.error(error.message); setProcessing(false); return; }

    // If restock, increase product stock
    if (restockItems && (action === "approved" || action === "refunded") && selected.product_items?.length) {
      for (const item of selected.product_items) {
        if (item.product_id) {
          const { data: prod } = await supabase.from("products").select("stock_quantity").eq("id", item.product_id).maybeSingle();
          if (prod) {
            await supabase.from("products").update({ stock_quantity: prod.stock_quantity + (item.quantity || 1) }).eq("id", item.product_id);
          }
        }
      }
    }

    toast.success(`Return ${action} successfully`);
    setSelected(null);
    setAdminNotes("");
    setRefundAmount("");
    setRestockItems(false);
    setProcessing(false);
    fetchReturns();
  };

  const stats = {
    pending: returns.filter(r => r.status === "pending").length,
    approved: returns.filter(r => r.status === "approved").length,
    refunded: returns.filter(r => r.status === "refunded").length,
    rejected: returns.filter(r => r.status === "rejected").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground">Returns Management</h2>
          <p className="text-sm text-muted-foreground mt-1">Handle return requests and refunds</p>
        </div>
        <button onClick={fetchReturns} className="p-2 rounded-xl hover:bg-secondary transition-colors">
          <RefreshCw className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Object.entries(stats).map(([key, val]) => {
          const c = statusColors[key];
          return (
            <div key={key} className="bg-card border border-border rounded-xl p-4 text-center">
              <p className={`font-display text-2xl font-bold ${c.text}`}>{val}</p>
              <p className="text-xs text-muted-foreground capitalize mt-1">{key}</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {["all", "pending", "approved", "rejected", "refunded"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${filter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
            {f}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : returns.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">No return requests found.</div>
      ) : (
        <div className="space-y-2">
          {returns.map(r => {
            const c = statusColors[r.status] || statusColors.pending;
            return (
              <button key={r.id} onClick={() => { setSelected(r); setRefundAmount(String(r.refund_amount)); setAdminNotes(r.admin_notes || ""); setRestockItems(r.restock_items); }}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors text-left">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-xl ${c.bg} flex items-center justify-center shrink-0`}>
                    <RotateCcw className={`w-4 h-4 ${c.text}`} />
                  </div>
                  <div className="min-w-0">
                    <span className="font-medium text-sm text-foreground block">{r.return_number}</span>
                    <p className="text-[11px] text-muted-foreground truncate">{r.reason} · {new Date(r.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${c.bg} ${c.text} capitalize`}>{r.status}</span>
                  <Eye className="w-4 h-4 text-muted-foreground" />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div onClick={e => e.stopPropagation()} className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-foreground">{selected.return_number}</h3>
              <button onClick={() => setSelected(null)} className="p-1 rounded-lg hover:bg-secondary"><X className="w-4 h-4" /></button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-xs text-muted-foreground">Status</span><p className="font-medium text-foreground capitalize">{selected.status}</p></div>
                <div><span className="text-xs text-muted-foreground">Type</span><p className="font-medium text-foreground capitalize">{selected.refund_type}</p></div>
                <div><span className="text-xs text-muted-foreground">Date</span><p className="font-medium text-foreground">{new Date(selected.created_at).toLocaleString()}</p></div>
                <div><span className="text-xs text-muted-foreground">Order ID</span><p className="font-medium text-foreground font-mono text-xs">{selected.order_id.slice(0, 8)}...</p></div>
              </div>

              <div>
                <span className="text-xs text-muted-foreground">Reason</span>
                <p className="text-foreground">{selected.reason}</p>
                {selected.details && <p className="text-muted-foreground text-xs mt-1">{selected.details}</p>}
              </div>

              {selected.product_items?.length > 0 && (
                <div>
                  <span className="text-xs text-muted-foreground">Items</span>
                  <div className="space-y-1 mt-1">
                    {selected.product_items.map((item: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                        <Package className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-xs text-foreground">{item.title} × {item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {selected.status === "pending" && (
              <div className="space-y-4 pt-3 border-t border-border">
                <div>
                  <label className="text-xs text-muted-foreground">Refund Amount</label>
                  <input type="number" value={refundAmount} onChange={e => setRefundAmount(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-secondary text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Admin Notes</label>
                  <textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} rows={2}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-secondary text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={restockItems} onChange={e => setRestockItems(e.target.checked)} className="rounded" />
                  <span className="text-sm text-foreground">Auto-restock returned items</span>
                </label>
                <div className="flex gap-2">
                  <button onClick={() => handleAction("approved")} disabled={processing}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:brightness-105 disabled:opacity-60">
                    {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Approve
                  </button>
                  <button onClick={() => handleAction("rejected")} disabled={processing}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-destructive text-destructive-foreground text-sm font-medium hover:brightness-105 disabled:opacity-60">
                    {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />} Reject
                  </button>
                </div>
                <button onClick={() => handleAction("refunded")} disabled={processing}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:brightness-105 disabled:opacity-60">
                  {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />} Approve & Refund
                </button>
              </div>
            )}

            {selected.status !== "pending" && selected.admin_notes && (
              <div className="pt-3 border-t border-border">
                <span className="text-xs text-muted-foreground">Admin Notes</span>
                <p className="text-sm text-foreground mt-1">{selected.admin_notes}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReturnsManagement;
