import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronDown, ChevronUp, Package, Truck, CheckCircle, Clock, X, Eye, Save, Loader2, MapPin, CreditCard, Hash, AlertTriangle, RefreshCw, Zap, Bell, Send, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  payment_method: string | null;
  total: number;
  subtotal: number;
  shipping_cost: number;
  discount_amount: number;
  shipping_name: string | null;
  shipping_phone: string | null;
  shipping_email: string | null;
  shipping_address: string | null;
  shipping_city: string | null;
  shipping_country: string | null;
  tracking_number: string | null;
  notes: string | null;
  created_at: string;
  currency: string;
  auto_forwarded?: boolean;
  forwarded_at?: string;
  delivered_at?: string;
  is_dropship?: boolean;
}

interface OrderItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
  total: number;
  image_url: string | null;
}

interface OrderAlert {
  id: string;
  order_id: string;
  alert_type: string;
  title: string;
  message: string | null;
  is_resolved: boolean;
  created_at: string;
}

const statusOptions = ["pending", "processing", "shipped", "out_for_delivery", "delivered", "cancelled"];
const paymentStatusOptions = ["unpaid", "pending", "paid", "refunded"];

const statusColors: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  processing: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  shipped: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  out_for_delivery: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  delivered: "bg-green-500/10 text-green-600 dark:text-green-400",
  cancelled: "bg-destructive/10 text-destructive",
  unpaid: "bg-muted text-muted-foreground",
  paid: "bg-green-500/10 text-green-600 dark:text-green-400",
  refunded: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

const statusIcons: Record<string, any> = {
  pending: Clock,
  processing: Package,
  shipped: Truck,
  out_for_delivery: MapPin,
  delivered: CheckCircle,
};

const alertTypeColors: Record<string, string> = {
  error: "bg-destructive/10 text-destructive border-destructive/20",
  warning: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  info: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  success: "bg-green-500/10 text-green-600 border-green-500/20",
};

const OrderManagement = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<Record<string, OrderItem[]>>({});
  const [editState, setEditState] = useState<Record<string, { status: string; paymentStatus: string; tracking: string; notes: string }>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<OrderAlert[]>([]);
  const [showAlerts, setShowAlerts] = useState(false);
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setOrders((data as Order[]) || []);
    setLoading(false);
  }, []);

  const fetchAlerts = useCallback(async () => {
    const { data } = await supabase.functions.invoke("order-processor", {
      body: { action: "get_alerts", unresolved_only: true },
    });
    if (data && !data.error) setAlerts(data);
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchAlerts();
  }, [fetchOrders, fetchAlerts]);

  // Realtime subscription for order updates
  useEffect(() => {
    const channel = supabase
      .channel("orders-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, (payload) => {
        if (payload.eventType === "INSERT") {
          setOrders(prev => [payload.new as Order, ...prev]);
          toast.info(`New order: ${(payload.new as Order).order_number}`);
        } else if (payload.eventType === "UPDATE") {
          setOrders(prev => prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } as Order : o));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const toggleExpand = async (orderId: string) => {
    if (expandedId === orderId) { setExpandedId(null); return; }
    setExpandedId(orderId);
    const order = orders.find(o => o.id === orderId);
    if (order && !editState[orderId]) {
      setEditState(prev => ({
        ...prev,
        [orderId]: { status: order.status, paymentStatus: order.payment_status, tracking: order.tracking_number || "", notes: order.notes || "" },
      }));
    }
    if (!orderItems[orderId]) {
      const { data } = await supabase.from("order_items").select("*").eq("order_id", orderId);
      setOrderItems(prev => ({ ...prev, [orderId]: data || [] }));
    }
  };

  const handleSave = async (orderId: string) => {
    const edit = editState[orderId];
    if (!edit) return;
    setSaving(orderId);

    // Use admin_override via order-processor for proper alerting
    const { data, error } = await supabase.functions.invoke("order-processor", {
      body: {
        action: "admin_override",
        order_id: orderId,
        updates: {
          status: edit.status,
          payment_status: edit.paymentStatus,
          tracking_number: edit.tracking || null,
          notes: edit.notes || null,
        },
      },
    });

    if (error) toast.error(error.message);
    else {
      toast.success("Order updated (with audit log)");
      setOrders(prev => prev.map(o => o.id === orderId ? {
        ...o, status: edit.status, payment_status: edit.paymentStatus,
        tracking_number: edit.tracking || null, notes: edit.notes || null,
      } : o));
    }
    setSaving(null);
  };

  const handleProcessPending = async () => {
    setProcessingAction("process_pending");
    try {
      const { data, error } = await supabase.functions.invoke("order-processor", {
        body: { action: "process_pending" },
      });
      if (error) throw error;
      toast.success(`Processed ${data?.processed || 0} orders`);
      fetchOrders();
      fetchAlerts();
    } catch (err: any) {
      toast.error(err.message || "Processing failed");
    }
    setProcessingAction(null);
  };

  const handleSyncTracking = async () => {
    setProcessingAction("sync_tracking");
    try {
      const { data, error } = await supabase.functions.invoke("order-processor", {
        body: { action: "sync_tracking" },
      });
      if (error) throw error;
      toast.success(`Synced ${data?.synced || 0} tracking updates`);
      fetchOrders();
    } catch (err: any) {
      toast.error(err.message || "Sync failed");
    }
    setProcessingAction(null);
  };

  const handleSyncPayments = async () => {
    setProcessingAction("sync_payments");
    try {
      const { data, error } = await supabase.functions.invoke("order-processor", {
        body: { action: "sync_payments" },
      });
      if (error) throw error;
      toast.success(`Verified ${data?.updated || 0} payments`);
      fetchOrders();
    } catch (err: any) {
      toast.error(err.message || "Sync failed");
    }
    setProcessingAction(null);
  };

  const handleForwardOrder = async (orderId: string) => {
    setSaving(orderId);
    try {
      const { data, error } = await supabase.functions.invoke("order-processor", {
        body: { action: "process_order", order_id: orderId },
      });
      if (error) throw error;
      toast.success(`Order forwarded: ${data?.status}`);
      fetchOrders();
      fetchAlerts();
    } catch (err: any) {
      toast.error(err.message || "Forward failed");
    }
    setSaving(null);
  };

  const handleResolveAlert = async (alertId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.functions.invoke("order-processor", {
      body: { action: "resolve_alert", alert_id: alertId, user_id: user.id },
    });
    setAlerts(prev => prev.filter(a => a.id !== alertId));
    toast.success("Alert resolved");
  };

  const filtered = orders.filter(o => {
    const matchSearch = !search ||
      o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      (o.shipping_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (o.shipping_phone || "").includes(search);
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === "pending").length,
    processing: orders.filter(o => o.status === "processing").length,
    shipped: orders.filter(o => o.status === "shipped").length,
    delivered: orders.filter(o => o.status === "delivered").length,
  };

  const unresolvedAlerts = alerts.filter(a => !a.is_resolved);

  return (
    <div className="space-y-5">
      {/* Automation Controls */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-primary" /> Order Automation
          </h3>
          <button
            onClick={() => setShowAlerts(!showAlerts)}
            className="relative px-3 py-1.5 rounded-xl bg-secondary text-xs font-medium text-foreground hover:bg-border transition-colors flex items-center gap-1"
          >
            <Bell className="w-3 h-3" /> Alerts
            {unresolvedAlerts.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-[9px] text-white flex items-center justify-center font-bold">
                {unresolvedAlerts.length}
              </span>
            )}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleProcessPending} disabled={!!processingAction}
            className="px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium flex items-center gap-1.5 disabled:opacity-50 touch-manipulation">
            {processingAction === "process_pending" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
            Auto-Forward Pending
          </button>
          <button onClick={handleSyncTracking} disabled={!!processingAction}
            className="px-3 py-2 rounded-xl bg-secondary text-foreground text-xs font-medium flex items-center gap-1.5 disabled:opacity-50 hover:bg-border transition-colors touch-manipulation">
            {processingAction === "sync_tracking" ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            Sync Tracking
          </button>
          <button onClick={handleSyncPayments} disabled={!!processingAction}
            className="px-3 py-2 rounded-xl bg-secondary text-foreground text-xs font-medium flex items-center gap-1.5 disabled:opacity-50 hover:bg-border transition-colors touch-manipulation">
            {processingAction === "sync_payments" ? <Loader2 className="w-3 h-3 animate-spin" /> : <CreditCard className="w-3 h-3" />}
            Verify Payments
          </button>
        </div>
      </div>

      {/* Alerts Panel */}
      <AnimatePresence>
        {showAlerts && unresolvedAlerts.length > 0 && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="space-y-2 overflow-hidden">
            {unresolvedAlerts.map(alert => (
              <div key={alert.id} className={`flex items-start gap-3 p-3 rounded-xl border ${alertTypeColors[alert.alert_type] || alertTypeColors.info}`}>
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold">{alert.title}</p>
                  {alert.message && <p className="text-[10px] mt-0.5 opacity-80">{alert.message}</p>}
                  <p className="text-[9px] opacity-60 mt-1">{new Date(alert.created_at).toLocaleString()}</p>
                </div>
                <button onClick={() => handleResolveAlert(alert.id)}
                  className="px-2 py-1 rounded-lg bg-background/50 text-[10px] font-medium hover:bg-background transition-colors shrink-0">
                  Resolve
                </button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        {[
          { label: "Total", value: stats.total, color: "text-foreground" },
          { label: "Pending", value: stats.pending, color: "text-amber-500" },
          { label: "Processing", value: stats.processing, color: "text-blue-500" },
          { label: "Shipped", value: stats.shipped, color: "text-primary" },
          { label: "Delivered", value: stats.delivered, color: "text-green-500" },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-3 text-center">
            <p className={`font-display text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by order #, name, phone..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
          <option value="all">All Status</option>
          {statusOptions.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>

      {/* Orders */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">No orders found</div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map(order => {
            const isExpanded = expandedId === order.id;
            const edit = editState[order.id];
            const StatusIcon = statusIcons[order.status] || Clock;
            const orderAlerts = unresolvedAlerts.filter(a => a.order_id === order.id);

            return (
              <div key={order.id} className="bg-card border border-border rounded-2xl overflow-hidden">
                <button onClick={() => toggleExpand(order.id)}
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-secondary/30 transition-colors touch-manipulation">
                  <StatusIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-foreground">{order.order_number}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColors[order.status] || ""}`}>{order.status}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColors[order.payment_status] || ""}`}>{order.payment_status}</span>
                      {order.auto_forwarded && <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary">Auto</span>}
                      {order.is_dropship && <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-accent/10 text-accent">Dropship</span>}
                      {orderAlerts.length > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-destructive/10 text-destructive flex items-center gap-0.5">
                          <AlertTriangle className="w-2.5 h-2.5" /> {orderAlerts.length}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {order.shipping_name || "—"} · {new Date(order.created_at).toLocaleDateString()} · ৳{Number(order.total).toLocaleString()}
                    </p>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </button>

                <AnimatePresence>
                  {isExpanded && edit && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }} className="overflow-hidden">
                      <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
                        {/* Customer Info */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"><MapPin className="w-3 h-3" /> Shipping</h4>
                            <p className="text-sm text-foreground">{order.shipping_name}</p>
                            <p className="text-xs text-muted-foreground">{order.shipping_phone}</p>
                            <p className="text-xs text-muted-foreground">{order.shipping_email}</p>
                            <p className="text-xs text-muted-foreground">{order.shipping_address}, {order.shipping_city}</p>
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"><CreditCard className="w-3 h-3" /> Payment</h4>
                            <p className="text-sm text-foreground">{order.payment_method || "—"}</p>
                            <div className="text-xs text-muted-foreground space-y-0.5">
                              <p>Subtotal: ৳{Number(order.subtotal).toLocaleString()}</p>
                              {Number(order.discount_amount) > 0 && <p>Discount: -৳{Number(order.discount_amount).toLocaleString()}</p>}
                              {Number(order.shipping_cost) > 0 && <p>Shipping: ৳{Number(order.shipping_cost).toLocaleString()}</p>}
                              <p className="font-semibold text-foreground">Total: ৳{Number(order.total).toLocaleString()}</p>
                            </div>
                            {order.forwarded_at && (
                              <p className="text-[10px] text-primary mt-1">
                                Forwarded: {new Date(order.forwarded_at).toLocaleString()}
                              </p>
                            )}
                            {order.delivered_at && (
                              <p className="text-[10px] text-green-500 mt-1">
                                Delivered: {new Date(order.delivered_at).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Order Items */}
                        {orderItems[order.id] && (
                          <div className="space-y-1.5">
                            <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"><Package className="w-3 h-3" /> Items</h4>
                            {orderItems[order.id].map(item => (
                              <div key={item.id} className="flex items-center gap-2.5 bg-muted/30 rounded-xl p-2.5">
                                {item.image_url && <img src={item.image_url} alt="" className="w-10 h-10 rounded-lg object-cover" />}
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-foreground truncate">{item.title}</p>
                                  <p className="text-[10px] text-muted-foreground">{item.quantity}x ৳{Number(item.price).toLocaleString()}</p>
                                </div>
                                <span className="text-xs font-semibold text-foreground">৳{Number(item.total).toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Edit Controls */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Order Status</label>
                            <select value={edit.status}
                              onChange={e => setEditState(prev => ({ ...prev, [order.id]: { ...prev[order.id], status: e.target.value } }))}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
                              {statusOptions.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Payment Status</label>
                            <select value={edit.paymentStatus}
                              onChange={e => setEditState(prev => ({ ...prev, [order.id]: { ...prev[order.id], paymentStatus: e.target.value } }))}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
                              {paymentStatusOptions.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block flex items-center gap-1"><Hash className="w-3 h-3" /> Tracking Number</label>
                            <input value={edit.tracking}
                              onChange={e => setEditState(prev => ({ ...prev, [order.id]: { ...prev[order.id], tracking: e.target.value } }))}
                              placeholder="Enter tracking number"
                              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Admin Notes</label>
                            <input value={edit.notes}
                              onChange={e => setEditState(prev => ({ ...prev, [order.id]: { ...prev[order.id], notes: e.target.value } }))}
                              placeholder="Internal notes..."
                              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                          </div>
                        </div>

                        <div className="flex gap-2 flex-wrap">
                          <button onClick={() => handleSave(order.id)} disabled={saving === order.id}
                            className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:brightness-105 active:scale-[0.98] transition-all touch-manipulation disabled:opacity-60 flex items-center gap-2">
                            {saving === order.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Save (Admin Override)
                          </button>
                          {order.status === "pending" && !order.auto_forwarded && (
                            <button onClick={() => handleForwardOrder(order.id)} disabled={saving === order.id}
                              className="px-6 py-2.5 rounded-xl bg-secondary text-foreground font-semibold text-sm hover:bg-border active:scale-[0.98] transition-all touch-manipulation disabled:opacity-60 flex items-center gap-2">
                              {saving === order.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                              Forward to Supplier
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OrderManagement;
