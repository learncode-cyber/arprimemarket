import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, Scan, Shield, AlertTriangle, CheckCircle, Info, Clock,
  ChevronDown, ChevronUp, Loader2, Send, Package, ShoppingBag,
  Globe, CreditCard, Truck, MessageCircle, Activity, Zap,
  ThumbsUp, X, BarChart3, Bot, History
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ScanFinding {
  category: string;
  severity: string;
  title: string;
  description: string;
  suggestion: string;
  auto_fix_available: boolean;
  auto_fix_query?: string;
  metadata?: Record<string, unknown>;
}

interface ScanStats {
  total: number;
  critical: number;
  warning: number;
  info: number;
  fixable: number;
}

interface ScanResult {
  id: string;
  category: string;
  severity: string;
  title: string;
  description: string;
  suggestion: string;
  auto_fix_available: boolean;
  auto_fix_query: string | null;
  status: string;
  created_at: string;
}

interface ActivityLog {
  id: string;
  action: string;
  details: string;
  created_at: string;
}

const severityConfig = {
  critical: { color: "text-destructive", bg: "bg-destructive/10", icon: AlertTriangle, label: "Critical" },
  warning: { color: "text-accent-foreground", bg: "bg-accent/30", icon: AlertTriangle, label: "Warning" },
  info: { color: "text-primary", bg: "bg-primary/10", icon: Info, label: "Info" },
};

const categoryIcons: Record<string, typeof Package> = {
  products: Package,
  orders: ShoppingBag,
  seo: Globe,
  inventory: BarChart3,
  payments: CreditCard,
  shipping: Truck,
  support: MessageCircle,
  security: Shield,
  content: Info,
};

const AIAssistantDashboard = () => {
  const [scanning, setScanning] = useState(false);
  const [findings, setFindings] = useState<ScanFinding[]>([]);
  const [aiSummary, setAiSummary] = useState("");
  const [stats, setStats] = useState<ScanStats | null>(null);
  const [dbResults, setDbResults] = useState<ScanResult[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [expandedFinding, setExpandedFinding] = useState<number | null>(null);
  const [applyingFix, setApplyingFix] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<"scan" | "chat" | "history">("scan");
  const [chatMessages, setChatMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [lastScanTime, setLastScanTime] = useState<string | null>(null);

  const loadStoredResults = useCallback(async () => {
    const { data: results } = await supabase
      .from("ai_scan_results" as any)
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (results) setDbResults(results as any);

    const { data: logs } = await supabase
      .from("ai_activity_log" as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    if (logs) setActivityLog(logs as any);
  }, []);

  useEffect(() => { loadStoredResults(); }, [loadStoredResults]);

  const runScan = async () => {
    setScanning(true);
    setAiSummary("");
    try {
      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: { action: "scan" },
      });

      if (error) throw error;

      setFindings(data.findings || []);
      setAiSummary(data.summary || "");
      setStats(data.stats || null);
      setLastScanTime(new Date().toLocaleString());
      await loadStoredResults();
      toast.success(`Scan complete: ${data.stats?.total || 0} issues found`);
    } catch (err: any) {
      toast.error(err.message || "Scan failed");
    } finally {
      setScanning(false);
    }
  };

  const applyFix = async (result: ScanResult) => {
    if (!result.auto_fix_query) return;
    setApplyingFix(result.id);
    try {
      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: { action: "apply_fix", scanResultId: result.id, fixQuery: result.auto_fix_query },
      });

      if (error) throw error;
      toast.success("Fix applied successfully!");
      await loadStoredResults();
    } catch (err: any) {
      toast.error(err.message || "Fix failed");
    } finally {
      setApplyingFix(null);
    }
  };

  const dismissFinding = async (id: string) => {
    try {
      await supabase.functions.invoke("ai-assistant", {
        body: { action: "dismiss", scanResultId: id },
      });
      await loadStoredResults();
      toast.success("Finding dismissed");
    } catch {
      toast.error("Failed to dismiss");
    }
  };

  const sendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg = chatInput.trim();
    setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setChatLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: { action: "admin_chat", message: userMsg },
      });

      if (error) throw error;
      setChatMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
    } catch (err: any) {
      setChatMessages(prev => [...prev, { role: "assistant", content: `Error: ${err.message}` }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" /> AI Assistant
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Autonomous monitoring, analysis & fix suggestions
          </p>
        </div>
        <button
          onClick={runScan}
          disabled={scanning}
          className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 disabled:opacity-50 touch-manipulation"
        >
          {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scan className="w-4 h-4" />}
          {scanning ? "Scanning..." : "Run Full Scan"}
        </button>
      </div>

      {/* View Tabs */}
      <div className="flex gap-1 bg-secondary/50 rounded-xl p-1">
        {[
          { id: "scan" as const, label: "Health Monitor", icon: Activity },
          { id: "chat" as const, label: "AI Chat", icon: Bot },
          { id: "history" as const, label: "Activity Log", icon: History },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeView === tab.id
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* SCAN VIEW */}
      {activeView === "scan" && (
        <div className="space-y-4">
          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { label: "Total Issues", value: stats.total, color: "text-foreground", icon: Activity },
                { label: "Critical", value: stats.critical, color: "text-destructive", icon: AlertTriangle },
                { label: "Warnings", value: stats.warning, color: "text-accent-foreground", icon: AlertTriangle },
                { label: "Info", value: stats.info, color: "text-primary", icon: Info },
                { label: "Auto-Fixable", value: stats.fixable, color: "text-primary", icon: Zap },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-card border border-border rounded-xl p-3 text-center"
                >
                  <stat.icon className={`w-4 h-4 mx-auto ${stat.color}`} />
                  <p className={`text-xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                  <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          )}

          {/* AI Summary */}
          {aiSummary && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-primary/5 border border-primary/20 rounded-xl p-4"
            >
              <div className="flex items-start gap-2">
                <Brain className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-xs font-semibold text-foreground mb-1">AI Analysis Summary</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{aiSummary}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Pending Findings from DB */}
          {dbResults.length > 0 && (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-accent-foreground" />
                  Pending Issues ({dbResults.length})
                </h4>
                {lastScanTime && (
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {lastScanTime}
                  </span>
                )}
              </div>
              <div className="divide-y divide-border/50">
                {dbResults.map((result, i) => {
                  const sev = severityConfig[result.severity as keyof typeof severityConfig] || severityConfig.info;
                  const CatIcon = categoryIcons[result.category] || Info;
                  const isExpanded = expandedFinding === i;

                  return (
                    <motion.div
                      key={result.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <div
                        className="px-4 py-3 cursor-pointer hover:bg-secondary/30 transition-colors"
                        onClick={() => setExpandedFinding(isExpanded ? null : i)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg ${sev.bg} flex items-center justify-center shrink-0`}>
                            <CatIcon className={`w-4 h-4 ${sev.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${sev.bg} ${sev.color}`}>
                                {sev.label}
                              </span>
                              <span className="text-[10px] text-muted-foreground capitalize">{result.category}</span>
                            </div>
                            <p className="text-sm font-medium text-foreground mt-0.5 truncate">{result.title}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {result.auto_fix_available && (
                              <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">
                                Auto-fix
                              </span>
                            )}
                            {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                          </div>
                        </div>
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-4 space-y-3">
                              <p className="text-xs text-muted-foreground">{result.description}</p>
                              {result.suggestion && (
                                <div className="bg-secondary/50 rounded-lg p-3">
                                  <p className="text-[10px] font-semibold text-foreground mb-1 flex items-center gap-1">
                                    <Zap className="w-3 h-3 text-primary" /> AI Suggestion
                                  </p>
                                  <p className="text-xs text-muted-foreground">{result.suggestion}</p>
                                </div>
                              )}
                              {result.auto_fix_available && result.auto_fix_query && (
                                <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3">
                                  <p className="text-[10px] font-semibold text-foreground mb-1">Fix Preview</p>
                                  <code className="text-[10px] text-muted-foreground block mb-2 font-mono">{result.auto_fix_query}</code>
                                  <p className="text-[10px] text-destructive mb-2">⚠️ This will modify your database. Review carefully before approving.</p>
                                </div>
                              )}
                              <div className="flex gap-2">
                                {result.auto_fix_available && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); applyFix(result); }}
                                    disabled={applyingFix === result.id}
                                    className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium flex items-center gap-1 disabled:opacity-50"
                                  >
                                    {applyingFix === result.id ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <ThumbsUp className="w-3 h-3" />
                                    )}
                                    Approve & Apply Fix
                                  </button>
                                )}
                                <button
                                  onClick={(e) => { e.stopPropagation(); dismissFinding(result.id); }}
                                  className="px-3 py-1.5 rounded-lg bg-secondary text-foreground text-xs font-medium flex items-center gap-1 hover:bg-border transition-colors"
                                >
                                  <X className="w-3 h-3" /> Dismiss
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!scanning && !stats && dbResults.length === 0 && (
            <div className="bg-card border border-border rounded-xl p-8 text-center">
              <Brain className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-foreground mb-1">AI Assistant Ready</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Click "Run Full Scan" to analyze your website for issues, performance problems, and improvement opportunities.
              </p>
            </div>
          )}

          {/* Scanning animation */}
          {scanning && (
            <div className="bg-card border border-border rounded-xl p-8 text-center">
              <Loader2 className="w-8 h-8 text-primary mx-auto mb-3 animate-spin" />
              <h3 className="text-sm font-semibold text-foreground mb-1">Scanning Your Website...</h3>
              <p className="text-xs text-muted-foreground">
                Analyzing products, orders, SEO, security, payments, shipping, and content...
              </p>
            </div>
          )}
        </div>
      )}

      {/* CHAT VIEW */}
      {activeView === "chat" && (
        <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col" style={{ height: "500px" }}>
          <div className="px-4 py-3 border-b border-border">
            <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5 text-primary" /> Ask Your AI Developer Assistant
            </h4>
            <p className="text-[10px] text-muted-foreground">Ask about your store's health, get optimization tips, or troubleshoot issues</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatMessages.length === 0 && (
              <div className="text-center py-12">
                <Bot className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-xs text-muted-foreground">Ask me anything about your store</p>
                <div className="flex flex-wrap justify-center gap-2 mt-3">
                  {[
                    "How's my store performing?",
                    "What SEO improvements can I make?",
                    "Any security concerns?",
                    "How to increase conversions?",
                  ].map(q => (
                    <button
                      key={q}
                      onClick={() => { setChatInput(q); }}
                      className="text-[10px] px-2.5 py-1.5 rounded-lg bg-secondary text-foreground hover:bg-border transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {chatMessages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[80%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-foreground"
                }`}>
                  {msg.content}
                </div>
              </motion.div>
            ))}

            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-secondary rounded-xl px-3 py-2 flex items-center gap-1.5">
                  <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Thinking...</span>
                </div>
              </div>
            )}
          </div>

          <div className="px-4 py-3 border-t border-border flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendChat()}
              placeholder="Ask your AI assistant..."
              className="flex-1 px-3 py-2 rounded-lg bg-secondary text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              onClick={sendChat}
              disabled={chatLoading || !chatInput.trim()}
              className="px-3 py-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* HISTORY VIEW */}
      {activeView === "history" && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-primary" /> Activity Log
            </h4>
          </div>
          {activityLog.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-xs text-muted-foreground">No activity recorded yet. Run a scan to get started.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50 max-h-[500px] overflow-y-auto">
              {activityLog.map((log, i) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="px-4 py-3 flex items-start gap-3"
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                    log.action === "fix_applied" ? "bg-primary/10" :
                    log.action === "scan_completed" ? "bg-primary/10" :
                    "bg-secondary"
                  }`}>
                    {log.action === "fix_applied" ? <CheckCircle className="w-3 h-3 text-primary" /> :
                     log.action === "scan_completed" ? <Scan className="w-3 h-3 text-primary" /> :
                     <X className="w-3 h-3 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground capitalize">{log.action.replace(/_/g, " ")}</p>
                    {log.details && <p className="text-[10px] text-muted-foreground mt-0.5">{log.details}</p>}
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIAssistantDashboard;
