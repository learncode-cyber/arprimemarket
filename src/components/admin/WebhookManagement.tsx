import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Webhook, Plus, Trash2, RefreshCw, Send, CheckCircle, XCircle, Clock } from "lucide-react";

const WEBHOOK_EVENTS = [
  "order.created", "order.status_changed", "order.cancelled",
  "blog.post_published", "blog.post_updated", "blog.comment_added",
  "product.low_stock", "product.out_of_stock", "review.submitted",
];

interface WebhookRecord {
  id: string;
  url: string;
  events: string[];
  secret: string;
  is_active: boolean;
  description: string | null;
  retry_count: number;
  created_at: string;
}

interface DeliveryLog {
  id: string;
  webhook_id: string;
  event: string;
  response_code: number | null;
  status: string;
  attempts: number;
  created_at: string;
}

const WebhookManagement = () => {
  const [webhooks, setWebhooks] = useState<WebhookRecord[]>([]);
  const [logs, setLogs] = useState<DeliveryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [testing, setTesting] = useState<string | null>(null);

  const fetchData = async () => {
    const [{ data: wh }, { data: dl }] = await Promise.all([
      supabase.from("webhooks").select("*").order("created_at", { ascending: false }),
      supabase.from("webhook_delivery_logs").select("*").order("created_at", { ascending: false }).limit(50),
    ]);
    setWebhooks((wh || []) as WebhookRecord[]);
    setLogs((dl || []) as DeliveryLog[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const createWebhook = async () => {
    if (!url.trim()) { toast.error("URL required"); return; }
    if (selectedEvents.length === 0) { toast.error("Select at least one event"); return; }

    const secret = crypto.randomUUID().replace(/-/g, "");
    const { error } = await supabase.from("webhooks").insert({
      url: url.trim(), events: selectedEvents, secret, description: description.trim() || null,
    });
    if (error) { toast.error(error.message); return; }

    toast.success("Webhook created! Secret: " + secret, { duration: 10000 });
    setUrl(""); setDescription(""); setSelectedEvents([]); setShowForm(false);
    fetchData();
  };

  const toggleWebhook = async (id: string, active: boolean) => {
    await supabase.from("webhooks").update({ is_active: active }).eq("id", id);
    fetchData();
  };

  const deleteWebhook = async (id: string) => {
    await supabase.from("webhooks").delete().eq("id", id);
    fetchData();
    toast.success("Webhook deleted");
  };

  const testWebhook = async (id: string) => {
    setTesting(id);
    try {
      const { error } = await supabase.functions.invoke("webhook-dispatcher", {
        body: {
          event: "test.ping",
          payload: { message: "Test ping from AR Prime", timestamp: new Date().toISOString() },
          test_webhook_id: id,
        },
      });
      if (error) throw error;
      toast.success("Test webhook sent!");
      setTimeout(fetchData, 2000);
    } catch (e) {
      toast.error("Test failed: " + (e instanceof Error ? e.message : "Unknown error"));
    }
    setTesting(null);
  };

  const retryDelivery = async (logId: string, webhookId: string, event: string) => {
    const log = logs.find(l => l.id === logId);
    if (!log) return;
    try {
      await supabase.functions.invoke("webhook-dispatcher", {
        body: { event, payload: { retry: true }, test_webhook_id: webhookId },
      });
      toast.success("Retry dispatched");
      setTimeout(fetchData, 2000);
    } catch { toast.error("Retry failed"); }
  };

  const statusIcon = (status: string) => {
    if (status === "delivered") return <CheckCircle className="w-3 h-3 text-green-500" />;
    if (status === "failed") return <XCircle className="w-3 h-3 text-destructive" />;
    return <Clock className="w-3 h-3 text-yellow-500" />;
  };

  if (loading) return <div className="animate-pulse text-muted-foreground text-sm p-8">Loading webhooks...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2"><Webhook className="w-5 h-5" /> Webhook Manager</h2>
          <p className="text-sm text-muted-foreground mt-1">Outgoing & incoming webhook configuration</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}><Plus className="w-4 h-4 mr-1" /> Add Webhook</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-foreground">{webhooks.filter(w => w.is_active).length}</div>
          <div className="text-xs text-muted-foreground">Active Webhooks</div>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-green-500">{logs.filter(l => l.status === "delivered").length}</div>
          <div className="text-xs text-muted-foreground">Delivered</div>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-destructive">{logs.filter(l => l.status === "failed").length}</div>
          <div className="text-xs text-muted-foreground">Failed</div>
        </CardContent></Card>
      </div>

      {/* Create Form */}
      {showForm && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Register New Webhook</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Input placeholder="https://your-n8n-instance.com/webhook/..." value={url} onChange={e => setUrl(e.target.value)} />
            <Input placeholder="Description (optional)" value={description} onChange={e => setDescription(e.target.value)} />
            <div>
              <p className="text-xs font-medium text-foreground mb-2">Events:</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {WEBHOOK_EVENTS.map(ev => (
                  <label key={ev} className="flex items-center gap-2 text-xs cursor-pointer">
                    <Checkbox
                      checked={selectedEvents.includes(ev)}
                      onCheckedChange={checked => {
                        setSelectedEvents(prev => checked ? [...prev, ev] : prev.filter(e => e !== ev));
                      }}
                    />
                    {ev}
                  </label>
                ))}
              </div>
            </div>
            <Button onClick={createWebhook}>Create Webhook</Button>
          </CardContent>
        </Card>
      )}

      {/* Webhooks Table */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Registered Webhooks</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>URL</TableHead>
                <TableHead>Events</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {webhooks.map(wh => (
                <TableRow key={wh.id}>
                  <TableCell>
                    <div className="text-xs font-mono truncate max-w-[200px]">{wh.url}</div>
                    {wh.description && <div className="text-[10px] text-muted-foreground">{wh.description}</div>}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {wh.events.slice(0, 3).map(e => <Badge key={e} variant="secondary" className="text-[9px]">{e}</Badge>)}
                      {wh.events.length > 3 && <Badge variant="outline" className="text-[9px]">+{wh.events.length - 3}</Badge>}
                    </div>
                  </TableCell>
                  <TableCell><Switch checked={wh.is_active} onCheckedChange={v => toggleWebhook(wh.id, v)} /></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => testWebhook(wh.id)} disabled={testing === wh.id}>
                        <Send className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteWebhook(wh.id)}>
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {webhooks.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground text-sm py-8">No webhooks registered</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delivery Logs */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Delivery Logs</CardTitle></CardHeader>
        <CardContent>
          <div className="max-h-64 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Attempts</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map(l => (
                  <TableRow key={l.id}>
                    <TableCell className="text-xs font-mono">{l.event}</TableCell>
                    <TableCell><div className="flex items-center gap-1">{statusIcon(l.status)}<span className="text-xs">{l.status}</span></div></TableCell>
                    <TableCell className="text-xs">{l.response_code || "—"}</TableCell>
                    <TableCell className="text-xs">{l.attempts}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(l.created_at).toLocaleString()}</TableCell>
                    <TableCell>
                      {l.status === "failed" && (
                        <Button size="sm" variant="ghost" onClick={() => retryDelivery(l.id, l.webhook_id, l.event)}>
                          <RefreshCw className="w-3 h-3" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {logs.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground text-sm py-8">No deliveries yet</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* API Documentation */}
      <Card>
        <CardHeader><CardTitle className="text-sm">📋 API Documentation</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-xs text-muted-foreground">
          <div>
            <p className="font-semibold text-foreground mb-1">AI Bridge Endpoint</p>
            <code className="block bg-muted p-2 rounded text-[10px]">POST /functions/v1/ai-bridge</code>
            <pre className="bg-muted p-2 rounded mt-1 text-[10px] overflow-x-auto">{`Headers: { "Authorization": "Bearer YOUR_API_KEY" }
Body: { "message": "Hello", "context": "order support", "source": "n8n" }
Response: { "reply": "...", "tokens_used": 42, "engine": "lovable-gemini" }`}</pre>
          </div>
          <div>
            <p className="font-semibold text-foreground mb-1">Incoming Webhook</p>
            <code className="block bg-muted p-2 rounded text-[10px]">POST /functions/v1/webhook-receiver</code>
            <pre className="bg-muted p-2 rounded mt-1 text-[10px] overflow-x-auto">{`Headers: { "X-Webhook-Signature": "hmac_sha256_hex" }
Body: { "action": "update_order_status", "data": { "order_id": "...", "status": "shipped" } }
Actions: update_order_status | add_blog_post | update_stock | send_notification`}</pre>
          </div>
          <div>
            <p className="font-semibold text-foreground mb-1">n8n Integration</p>
            <p>1. Generate an API key above</p>
            <p>2. In n8n, use HTTP Request node with the AI Bridge URL</p>
            <p>3. Set Authorization header with your API key</p>
            <p>4. Register webhook URLs for outgoing event notifications</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WebhookManagement;
