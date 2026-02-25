import { useState } from "react";
import { useShippingAdmin, ShippingZone, ShippingRate } from "@/hooks/useShipping";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Globe, Truck } from "lucide-react";

const ShippingManagement = () => {
  const { zones, rates, loading, updateZone, updateRate, addZone, addRate, deleteRate } = useShippingAdmin();
  const [newZone, setNewZone] = useState({ country_code: "", country_name: "", free_shipping_threshold: "" });
  const [newRate, setNewRate] = useState({ zone_id: "", shipping_type: "standard", base_cost: "", per_kg_cost: "", min_days: "3", max_days: "7" });
  const [editingRate, setEditingRate] = useState<string | null>(null);

  const handleAddZone = async () => {
    if (!newZone.country_code || !newZone.country_name) { toast.error("Country code and name required"); return; }
    await addZone({
      country_code: newZone.country_code.toUpperCase(),
      country_name: newZone.country_name,
      free_shipping_threshold: newZone.free_shipping_threshold ? parseFloat(newZone.free_shipping_threshold) : null,
    });
    toast.success("Zone added");
    setNewZone({ country_code: "", country_name: "", free_shipping_threshold: "" });
  };

  const handleAddRate = async () => {
    if (!newRate.zone_id || !newRate.base_cost) { toast.error("Zone and base cost required"); return; }
    await addRate({
      zone_id: newRate.zone_id,
      shipping_type: newRate.shipping_type,
      base_cost: parseFloat(newRate.base_cost),
      per_kg_cost: parseFloat(newRate.per_kg_cost || "0"),
      min_days: parseInt(newRate.min_days),
      max_days: parseInt(newRate.max_days),
    });
    toast.success("Rate added");
    setNewRate({ zone_id: "", shipping_type: "standard", base_cost: "", per_kg_cost: "", min_days: "3", max_days: "7" });
  };

  const handleToggleZone = async (zone: ShippingZone) => {
    await updateZone(zone.id, { is_active: !zone.is_active } as any);
    toast.success(`${zone.country_name} ${zone.is_active ? "disabled" : "enabled"}`);
  };

  const handleUpdateThreshold = async (zone: ShippingZone, value: string) => {
    await updateZone(zone.id, { free_shipping_threshold: value ? parseFloat(value) : null } as any);
    toast.success("Threshold updated");
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      {/* Shipping Zones */}
      <div>
        <h3 className="font-display font-semibold text-base text-foreground flex items-center gap-2 mb-4">
          <Globe className="w-4 h-4 text-primary" /> Shipping Zones
        </h3>
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Country</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Code</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Free Shipping Min</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {zones.map(z => (
                <tr key={z.id} className="border-b border-border/50 hover:bg-secondary/30">
                  <td className="px-4 py-3 font-medium text-foreground">{z.country_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{z.country_code}</td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      defaultValue={z.free_shipping_threshold ?? ""}
                      onBlur={e => handleUpdateThreshold(z, e.target.value)}
                      placeholder="No free shipping"
                      className="w-28 px-2 py-1.5 rounded-lg bg-secondary text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleZone(z)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${z.is_active ? "bg-green-500/10 text-green-500" : "bg-muted text-muted-foreground"}`}
                    >
                      {z.is_active ? "Active" : "Inactive"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add Zone */}
        <div className="mt-3 flex flex-wrap gap-2 items-end">
          <input value={newZone.country_code} onChange={e => setNewZone(p => ({ ...p, country_code: e.target.value }))} placeholder="Code (US)" className="w-20 px-3 py-2 rounded-xl bg-secondary text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
          <input value={newZone.country_name} onChange={e => setNewZone(p => ({ ...p, country_name: e.target.value }))} placeholder="Country name" className="flex-1 min-w-[120px] px-3 py-2 rounded-xl bg-secondary text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
          <input value={newZone.free_shipping_threshold} onChange={e => setNewZone(p => ({ ...p, free_shipping_threshold: e.target.value }))} placeholder="Free threshold" type="number" className="w-28 px-3 py-2 rounded-xl bg-secondary text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
          <button onClick={handleAddZone} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium flex items-center gap-1"><Plus className="w-3 h-3" /> Add</button>
        </div>
      </div>

      {/* Shipping Rates */}
      <div>
        <h3 className="font-display font-semibold text-base text-foreground flex items-center gap-2 mb-4">
          <Truck className="w-4 h-4 text-primary" /> Shipping Rates
        </h3>
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Zone</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Base ৳</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Per KG ৳</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Days</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {rates.map(r => {
                  const z = zones.find(z => z.id === r.zone_id);
                  return (
                    <tr key={r.id} className="border-b border-border/50 hover:bg-secondary/30">
                      <td className="px-4 py-3 text-foreground">{z?.country_name || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.shipping_type === "express" ? "bg-accent/10 text-accent" : "bg-primary/10 text-primary"}`}>
                          {r.shipping_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-foreground">৳{Number(r.base_cost).toLocaleString()}</td>
                      <td className="px-4 py-3 text-muted-foreground">৳{Number(r.per_kg_cost)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{r.min_days}-{r.max_days}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => deleteRate(r.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
                          <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Rate */}
        <div className="mt-3 flex flex-wrap gap-2 items-end">
          <select value={newRate.zone_id} onChange={e => setNewRate(p => ({ ...p, zone_id: e.target.value }))} className="px-3 py-2 rounded-xl bg-secondary text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50">
            <option value="">Select zone</option>
            {zones.map(z => <option key={z.id} value={z.id}>{z.country_name}</option>)}
          </select>
          <select value={newRate.shipping_type} onChange={e => setNewRate(p => ({ ...p, shipping_type: e.target.value }))} className="px-3 py-2 rounded-xl bg-secondary text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50">
            <option value="standard">Standard</option>
            <option value="express">Express</option>
          </select>
          <input value={newRate.base_cost} onChange={e => setNewRate(p => ({ ...p, base_cost: e.target.value }))} placeholder="Base ৳" type="number" className="w-20 px-3 py-2 rounded-xl bg-secondary text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
          <input value={newRate.per_kg_cost} onChange={e => setNewRate(p => ({ ...p, per_kg_cost: e.target.value }))} placeholder="Per KG" type="number" className="w-20 px-3 py-2 rounded-xl bg-secondary text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
          <input value={newRate.min_days} onChange={e => setNewRate(p => ({ ...p, min_days: e.target.value }))} placeholder="Min" type="number" className="w-16 px-3 py-2 rounded-xl bg-secondary text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
          <input value={newRate.max_days} onChange={e => setNewRate(p => ({ ...p, max_days: e.target.value }))} placeholder="Max" type="number" className="w-16 px-3 py-2 rounded-xl bg-secondary text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
          <button onClick={handleAddRate} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium flex items-center gap-1"><Plus className="w-3 h-3" /> Add</button>
        </div>
      </div>
    </div>
  );
};

export default ShippingManagement;
