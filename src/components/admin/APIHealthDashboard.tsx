import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Activity, Server, Database, Clock, RefreshCw, Loader2, CheckCircle, AlertTriangle, Wifi, Play, Pause } from "lucide-react";
import { api } from "@/lib/api";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface HealthData {
  status: string;
  version: string;
  cache_size: number;
  timestamp?: string;
}

interface PingResult {
  route: string;
  latencyMs: number;
  status: "ok" | "error";
  error?: string;
}

interface HistoryPoint {
  time: string;
  health: number;
  "products.list": number;
  "categories.list": number;
  "products.detail": number;
}

const MAX_HISTORY = 20;

const APIHealthDashboard = () => {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [pings, setPings] = useState<PingResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [countdown, setCountdown] = useState(30);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const runHealthCheck = useCallback(async () => {
    setRefreshing(true);
    const results: PingResult[] = [];

    const t0 = performance.now();
    const hRes = await api.health();
    results.push({
      route: "health",
      latencyMs: Math.round(performance.now() - t0),
      status: hRes.data ? "ok" : "error",
      error: hRes.error || undefined,
    });
    if (hRes.data) setHealth(hRes.data);

    const t1 = performance.now();
    const pRes = await api.products.list({ limit: 1 });
    results.push({
      route: "products.list",
      latencyMs: Math.round(performance.now() - t1),
      status: pRes.data ? "ok" : "error",
      error: pRes.error || undefined,
    });

    const t2 = performance.now();
    const cRes = await api.categories.list();
    results.push({
      route: "categories.list",
      latencyMs: Math.round(performance.now() - t2),
      status: cRes.data ? "ok" : "error",
      error: cRes.error || undefined,
    });

    const t3 = performance.now();
    const dRes = await api.products.detail("premium-cotton-tshirt");
    results.push({
      route: "products.detail",
      latencyMs: Math.round(performance.now() - t3),
      status: dRes.data ? "ok" : "error",
      error: dRes.error || undefined,
    });

    setPings(results);
    setLoading(false);
    setRefreshing(false);

    // Add to history
    const now = new Date();
    const timeLabel = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const point: HistoryPoint = {
      time: timeLabel,
      health: results.find(r => r.route === "health")?.latencyMs ?? 0,
      "products.list": results.find(r => r.route === "products.list")?.latencyMs ?? 0,
      "categories.list": results.find(r => r.route === "categories.list")?.latencyMs ?? 0,
      "products.detail": results.find(r => r.route === "products.detail")?.latencyMs ?? 0,
    };
    setHistory(prev => [...prev.slice(-MAX_HISTORY + 1), point]);
    setCountdown(30);
  }, []);

  useEffect(() => { runHealthCheck(); }, [runHealthCheck]);

  // Auto-refresh logic
  useEffect(() => {
    if (autoRefresh) {
      setCountdown(30);
      intervalRef.current = setInterval(() => {
        runHealthCheck();
      }, 30_000);
      countdownRef.current = setInterval(() => {
        setCountdown(prev => (prev <= 1 ? 30 : prev - 1));
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [autoRefresh, runHealthCheck]);

  const handleClearCache = async () => {
    const res = await api.cache.invalidate();
    if (res.data) {
      runHealthCheck();
    }
  };

  const avgLatency = pings.length > 0 ? Math.round(pings.reduce((s, p) => s + p.latencyMs, 0) / pings.length) : 0;
  const allOk = pings.every(p => p.status === "ok");

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-base text-foreground flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" /> API Gateway Health
        </h3>
        <div className="flex gap-2 items-center">
          {/* Auto-refresh toggle */}
          <button onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium touch-manipulation flex items-center gap-1 transition-colors ${
              autoRefresh ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground hover:bg-border"
            }`}>
            {autoRefresh ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            {autoRefresh ? `Auto (${countdown}s)` : "Auto"}
          </button>
          <button onClick={handleClearCache}
            className="px-3 py-1.5 rounded-xl bg-secondary text-xs font-medium text-foreground hover:bg-border transition-colors touch-manipulation flex items-center gap-1">
            <Database className="w-3 h-3" /> Clear Cache
          </button>
          <button onClick={runHealthCheck} disabled={refreshing}
            className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-medium touch-manipulation flex items-center gap-1 disabled:opacity-50">
            {refreshing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />} Refresh
          </button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl p-4 text-center">
          <div className={`w-10 h-10 rounded-full mx-auto flex items-center justify-center ${allOk ? "bg-primary/10" : "bg-destructive/10"}`}>
            {allOk ? <CheckCircle className="w-5 h-5 text-primary" /> : <AlertTriangle className="w-5 h-5 text-destructive" />}
          </div>
          <p className="text-lg font-bold text-foreground mt-2">{allOk ? "Healthy" : "Issues"}</p>
          <p className="text-[10px] text-muted-foreground">Gateway Status</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="bg-card border border-border rounded-2xl p-4 text-center">
          <div className="w-10 h-10 rounded-full mx-auto flex items-center justify-center bg-accent/10">
            <Clock className="w-5 h-5 text-accent" />
          </div>
          <p className="text-lg font-bold text-foreground mt-2">{avgLatency}ms</p>
          <p className="text-[10px] text-muted-foreground">Avg Latency</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-2xl p-4 text-center">
          <div className="w-10 h-10 rounded-full mx-auto flex items-center justify-center bg-secondary">
            <Database className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-lg font-bold text-foreground mt-2">{health?.cache_size ?? 0}</p>
          <p className="text-[10px] text-muted-foreground">Cache Entries</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-card border border-border rounded-2xl p-4 text-center">
          <div className="w-10 h-10 rounded-full mx-auto flex items-center justify-center bg-secondary">
            <Server className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-lg font-bold text-foreground mt-2">{health?.version ?? "—"}</p>
          <p className="text-[10px] text-muted-foreground">API Version</p>
        </motion.div>
      </div>

      {/* Historical Latency Chart */}
      {history.length > 1 && (
        <div className="bg-card border border-border rounded-2xl p-4">
          <h4 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-primary" /> Latency History (last {history.length} checks)
          </h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} unit="ms" />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                    fontSize: "11px",
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
                />
                <Legend wrapperStyle={{ fontSize: "10px" }} />
                <Line type="monotone" dataKey="health" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="health" />
                <Line type="monotone" dataKey="products.list" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} name="products.list" />
                <Line type="monotone" dataKey="categories.list" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} name="categories.list" />
                <Line type="monotone" dataKey="products.detail" stroke="hsl(var(--muted-foreground))" strokeWidth={1.5} dot={false} name="products.detail" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Endpoint Pings */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Wifi className="w-3.5 h-3.5 text-primary" /> Endpoint Response Times
          </h4>
        </div>
        <div className="divide-y divide-border/50">
          {pings.map((ping, i) => (
            <motion.div key={ping.route} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
              className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${ping.status === "ok" ? "bg-primary" : "bg-destructive"}`} />
                <span className="text-sm font-medium text-foreground font-mono">{ping.route}</span>
              </div>
              <div className="flex items-center gap-3">
                {ping.error && <span className="text-[10px] text-destructive">{ping.error}</span>}
                <div className="flex items-center gap-1.5">
                  <div className="w-24 h-1.5 rounded-full bg-secondary overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((ping.latencyMs / 2000) * 100, 100)}%` }}
                      transition={{ delay: i * 0.05 + 0.2, duration: 0.5 }}
                      className={`h-full rounded-full ${
                        ping.latencyMs < 500 ? "bg-primary" :
                        ping.latencyMs < 1500 ? "bg-accent" : "bg-destructive"
                      }`}
                    />
                  </div>
                  <span className={`text-xs font-mono font-medium min-w-[50px] text-right ${
                    ping.latencyMs < 500 ? "text-primary" :
                    ping.latencyMs < 1500 ? "text-accent" : "text-destructive"
                  }`}>
                    {ping.latencyMs}ms
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Last Check */}
      {health?.timestamp && (
        <p className="text-[10px] text-muted-foreground text-center">
          Last checked: {new Date(health.timestamp).toLocaleString()} {autoRefresh && "• Auto-refresh enabled"}
        </p>
      )}
    </div>
  );
};

export default APIHealthDashboard;
