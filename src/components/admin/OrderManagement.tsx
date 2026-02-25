import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronDown, ChevronUp, Package, Truck, CheckCircle, Clock, X, Eye, Save, Loader2, MapPin, CreditCard, Hash } from "lucide-react";
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
}

interface OrderItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
  total: number;
  image_url: string | null;
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

const OrderManagement = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<Record<string, OrderItem[]>>({});
  const [editState, setEditState] = useState<Record<string, { status: string; paymentStatus: string; tracking: string; notes: string }>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setOrders(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const toggleExpand = async (orderId: string) => {
    if (expandedId === orderId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(orderId);
    const order = orders.find(o => o.id === orderId);
    if (order && !editState[orderId]) {
      setEditState(prev => ({
        ...prev,
        [orderId]: {
          status: order.status,
          paymentStatus: order.payment_status,
          tracking: order.tracking_number || "",
          notes: order.notes || "",
        }
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
    const { error } = await supabase.from("orders").update({
      status: edit.status,
      payment_status: edit.paymentStatus,
      tracking_number: edit.tracking || null,
      notes: edit.notes || null,
    }).eq("id", orderId);

    if (error) toast.error(error.message);
    else {
      toast.success("Order updated");
      setOrders(prev => prev.map(o => o.id === orderId ? {
        ...o,
        status: edit.status,
        payment_status: edit.paymentStatus,
        tracking_number: edit.tracking || null,
        notes: edit.notes || null,
      } : o));
    }
    setSaving(null);
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

  return (
    <div className="space-y-5">
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
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by order #, name, phone..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
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

            return (
              <div key={order.id} className="bg-card border border-border rounded-2xl overflow-hidden">
                {/* Order Row */}
                <button
                  onClick={() => toggleExpand(order.id)}
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-secondary/30 transition-colors touch-manipulation"
                >
                  <StatusIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-foreground">{order.order_number}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColors[order.status] || ""}`}>{order.status}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColors[order.payment_status] || ""}`}>{order.payment_status}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {order.shipping_name || "—"} · {new Date(order.created_at).toLocaleDateString()} · ৳{Number(order.total).toLocaleString()}
                    </p>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </button>

                {/* Expanded Detail */}
                <AnimatePresence>
                  {isExpanded && edit && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
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
                            <select
                              value={edit.status}
                              onChange={e => setEditState(prev => ({ ...prev, [order.id]: { ...prev[order.id], status: e.target.value } }))}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                            >
                              {statusOptions.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Payment Status</label>
                            <select
                              value={edit.paymentStatus}
                              onChange={e => setEditState(prev => ({ ...prev, [order.id]: { ...prev[order.id], paymentStatus: e.target.value } }))}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                            >
                              {paymentStatusOptions.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block flex items-center gap-1"><Hash className="w-3 h-3" /> Tracking Number</label>
                            <input
                              value={edit.tracking}
                              onChange={e => setEditState(prev => ({ ...prev, [order.id]: { ...prev[order.id], tracking: e.target.value } }))}
                              placeholder="Enter tracking number"
                              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Admin Notes</label>
                            <input
                              value={edit.notes}
                              onChange={e => setEditState(prev => ({ ...prev, [order.id]: { ...prev[order.id], notes: e.target.value } }))}
                              placeholder="Internal notes..."
                              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                          </div>
                        </div>

                        <button
                          onClick={() => handleSave(order.id)}
                          disabled={saving === order.id}
                          className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:brightness-105 active:scale-[0.98] transition-all touch-manipulation disabled:opacity-60 flex items-center gap-2"
                        >
                          {saving === order.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                          Save Changes
                        </button>
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