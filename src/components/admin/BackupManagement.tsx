import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Database, Download, Loader2, Shield, CheckCircle, AlertTriangle, RefreshCw } from "lucide-react";
import { backupService } from "@/lib/services";
import { toast } from "sonner";

const BackupManagement = () => {
  const [status, setStatus] = useState<{ status: string; tables: Record<string, number> } | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const loadStatus = async () => {
    setLoading(true);
    const data = await backupService.getStatus();
    setStatus(data);
    setLoading(false);
  };

  useEffect(() => { loadStatus(); }, []);

  const handleExport = async () => {
    setExporting(true);
    const blob = await backupService.exportData();
    if (blob) {
      backupService.downloadBlob(blob, `arprimemarket-backup-${new Date().toISOString().slice(0, 10)}.json`);
      toast.success("Backup downloaded successfully");
    } else {
      toast.error("Backup failed");
    }
    setExporting(false);
  };

  const totalRows = status ? Object.values(status.tables).reduce((s, n) => s + n, 0) : 0;

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-base text-foreground flex items-center gap-2">
          <Database className="w-4 h-4 text-primary" /> System & Backup
        </h3>
        <button onClick={loadStatus} className="p-2 rounded-xl hover:bg-secondary transition-colors">
          <RefreshCw className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl p-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-green-500/5 opacity-50" />
          <div className="relative flex items-center gap-3">
            {status?.status === "healthy" ? (
              <CheckCircle className="w-8 h-8 text-green-500" />
            ) : (
              <AlertTriangle className="w-8 h-8 text-amber-500" />
            )}
            <div>
              <p className="font-display text-lg font-bold text-foreground capitalize">{status?.status || "Unknown"}</p>
              <p className="text-[11px] text-muted-foreground">System Status</p>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="bg-card border border-border rounded-2xl p-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 opacity-50" />
          <div className="relative">
            <p className="font-display text-lg font-bold text-foreground">{status ? Object.keys(status.tables).length : 0}</p>
            <p className="text-[11px] text-muted-foreground">Active Tables</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-2xl p-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-blue-500/5 opacity-50" />
          <div className="relative">
            <p className="font-display text-lg font-bold text-foreground">{totalRows.toLocaleString()}</p>
            <p className="text-[11px] text-muted-foreground">Total Records</p>
          </div>
        </motion.div>
      </div>

      {/* Table Details */}
      {status && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h4 className="text-sm font-semibold text-foreground">Table Records</h4>
          </div>
          <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.entries(status.tables).map(([table, count]) => (
              <div key={table} className="bg-secondary/50 rounded-xl p-3 flex items-center justify-between">
                <span className="text-xs text-foreground font-medium capitalize">{table.replace(/_/g, " ")}</span>
                <span className="text-xs font-bold text-primary">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Backup Actions */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" /> Backup & Recovery
        </h4>
        <p className="text-xs text-muted-foreground">
          Export your entire database as a JSON file for backup or migration purposes.
        </p>
        <div className="flex flex-wrap gap-3">
          <button onClick={handleExport} disabled={exporting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-medium disabled:opacity-50">
            {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            {exporting ? "Exporting..." : "Export Full Backup"}
          </button>
        </div>
        <div className="text-[10px] text-muted-foreground space-y-1">
          <p>• Backups include all tables: products, orders, customers, coupons, etc.</p>
          <p>• JSON format — compatible with data migration tools</p>
          <p>• Recommended: Export before major changes</p>
        </div>
      </div>

      {/* Security Info */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" /> Security Features Active
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            { label: "Rate Limiting", desc: "Login: 5/15min · Register: 3/hr · Orders: 10/hr" },
            { label: "Input Validation", desc: "Zod schemas on all forms" },
            { label: "Fraud Detection", desc: "Automated scoring on every order" },
            { label: "Session Security", desc: "JWT validation with auto-refresh" },
            { label: "Row Level Security", desc: "Database-level access control" },
            { label: "Image Optimization", desc: "Lazy loading, srcSet, WebP auto-format" },
          ].map(f => (
            <div key={f.label} className="bg-secondary/50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-0.5">
                <CheckCircle className="w-3 h-3 text-green-500 shrink-0" />
                <span className="text-xs font-semibold text-foreground">{f.label}</span>
              </div>
              <p className="text-[10px] text-muted-foreground ml-5">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BackupManagement;
