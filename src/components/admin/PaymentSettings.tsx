import { useState } from "react";
import { motion } from "framer-motion";
import { CreditCard, Coins, Smartphone, Banknote, Save, Loader2, ChevronDown, ChevronUp, QrCode } from "lucide-react";
import { usePaymentMethods, useUpdatePaymentMethod, PaymentMethod } from "@/hooks/usePaymentMethods";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";

const iconMap: Record<string, any> = {
  Banknote, Smartphone, CreditCard, Coins,
};

const typeLabels: Record<string, string> = {
  cod: "Cash on Delivery",
  mobile: "Mobile Payment",
  card: "Card Payment",
  crypto: "Cryptocurrency",
};

const PaymentSettings = () => {
  const { data: methods = [], isLoading } = usePaymentMethods(false);
  const updateMethod = useUpdatePaymentMethod();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Record<string, Partial<PaymentMethod>>>({});

  const getEdit = (id: string) => editData[id] || {};
  const setEdit = (id: string, updates: Partial<PaymentMethod>) => {
    setEditData(prev => ({ ...prev, [id]: { ...prev[id], ...updates } }));
  };

  const handleToggle = async (method: PaymentMethod) => {
    try {
      await updateMethod.mutateAsync({ id: method.id, updates: { is_active: !method.is_active } });
      toast.success(`${method.display_name} ${!method.is_active ? "enabled" : "disabled"}`);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleSave = async (method: PaymentMethod) => {
    const updates = getEdit(method.id);
    if (Object.keys(updates).length === 0) return;
    try {
      await updateMethod.mutateAsync({ id: method.id, updates });
      setEditData(prev => { const next = { ...prev }; delete next[method.id]; return next; });
      toast.success(`${method.display_name} updated`);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const getValue = (method: PaymentMethod, field: keyof PaymentMethod) => {
    const edit = getEdit(method.id);
    return (edit[field] !== undefined ? edit[field] : method[field]) as string || "";
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  // Group by type
  const grouped = methods.reduce((acc, m) => {
    if (!acc[m.method_type]) acc[m.method_type] = [];
    acc[m.method_type].push(m);
    return acc;
  }, {} as Record<string, PaymentMethod[]>);

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl font-semibold text-foreground">Payment Methods</h2>
      <p className="text-sm text-muted-foreground">Enable/disable payment methods and configure wallet addresses for crypto payments.</p>

      {Object.entries(grouped).map(([type, typeMethods]) => (
        <div key={type} className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{typeLabels[type] || type}</h3>
          {typeMethods.map(method => {
            const Icon = iconMap[method.icon_name || ""] || Coins;
            const isExpanded = expandedId === method.id;
            const walletAddr = getValue(method, "wallet_address");
            const hasEdits = Object.keys(getEdit(method.id)).length > 0;

            return (
              <motion.div
                key={method.id}
                layout
                className="bg-card border border-border rounded-xl overflow-hidden"
              >
                {/* Header row */}
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${method.is_active ? "bg-primary/10" : "bg-muted"}`}>
                      <Icon className={`w-4 h-4 ${method.is_active ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-foreground">{method.display_name}</span>
                      {method.network && <span className="text-[10px] text-muted-foreground ml-2 bg-muted px-1.5 py-0.5 rounded">{method.network}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Toggle */}
                    <button
                      onClick={() => handleToggle(method)}
                      className={`relative w-10 h-5 rounded-full transition-colors ${method.is_active ? "bg-primary" : "bg-muted-foreground/30"}`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-primary-foreground transition-transform ${method.is_active ? "left-[22px]" : "left-0.5"}`} />
                    </button>
                    {/* Expand */}
                    <button onClick={() => setExpandedId(isExpanded ? null : method.id)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </button>
                  </div>
                </div>

                {/* Expanded settings */}
                {isExpanded && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="border-t border-border p-4 space-y-4">
                    {(method.method_type === "crypto" || method.method_type === "mobile") && (
                      <>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Wallet Address / Number</label>
                          <input
                            value={walletAddr}
                            onChange={e => setEdit(method.id, { wallet_address: e.target.value })}
                            placeholder={method.method_type === "crypto" ? "0x... or wallet address" : "01XXXXXXXXX"}
                            className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                          />
                        </div>

                        {/* QR Code Preview */}
                        {walletAddr && (
                          <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
                            <div className="bg-white p-2 rounded-lg">
                              <QRCodeSVG value={walletAddr} size={80} />
                            </div>
                            <div>
                              <p className="text-xs font-medium text-foreground flex items-center gap-1"><QrCode className="w-3 h-3" /> Auto-generated QR Code</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">This QR code will be shown to customers during checkout.</p>
                            </div>
                          </div>
                        )}

                        {method.method_type === "crypto" && (
                          <div>
                            <label className="text-xs font-medium text-muted-foreground">Network</label>
                            <input
                              value={getValue(method, "network")}
                              onChange={e => setEdit(method.id, { network: e.target.value })}
                              placeholder="e.g. ERC-20, BEP-20, TRC-20"
                              className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                          </div>
                        )}

                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Deposit Link (optional)</label>
                          <input
                            value={getValue(method, "deposit_link")}
                            onChange={e => setEdit(method.id, { deposit_link: e.target.value })}
                            placeholder="https://..."
                            className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                          />
                        </div>
                      </>
                    )}

                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Instructions (EN)</label>
                      <textarea
                        rows={2}
                        value={getValue(method, "instructions")}
                        onChange={e => setEdit(method.id, { instructions: e.target.value })}
                        className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Instructions (বাংলা)</label>
                        <textarea
                          rows={2}
                          value={getValue(method, "instructions_bn")}
                          onChange={e => setEdit(method.id, { instructions_bn: e.target.value })}
                          className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Instructions (العربية)</label>
                        <textarea
                          rows={2}
                          value={getValue(method, "instructions_ar")}
                          onChange={e => setEdit(method.id, { instructions_ar: e.target.value })}
                          className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                        />
                      </div>
                    </div>

                    {hasEdits && (
                      <button
                        onClick={() => handleSave(method)}
                        disabled={updateMethod.isPending}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:brightness-105 transition-all disabled:opacity-60"
                      >
                        {updateMethod.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        Save Changes
                      </button>
                    )}
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default PaymentSettings;
