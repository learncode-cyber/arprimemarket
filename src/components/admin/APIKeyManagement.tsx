import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Key, Plus, Copy, Trash2, Activity, Shield } from "lucide-react";

interface ApiKey {
  id: string;
  key_prefix: string;
  label: string;
  owner: string;
  permissions: string[];
  rate_limit_per_minute: number;
  rate_limit_per_day: number;
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
}

interface CallLog {
  endpoint: string;
  source: string;
  tokens_used: number;
  status_code: number;
  created_at: string;
}

async function sha256(text: string): Promise<string> {
  const encoded = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

const APIKeyManagement = () => {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [logs, setLogs] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [newLabel, setNewLabel] = useState("");
  const [generatedKey, setGeneratedKey] = useState("");
  const [stats, setStats] = useState({ totalCalls: 0, totalTokens: 0, activeKeys: 0 });

  const fetchData = async () => {
    const [{ data: keysData }, { data: logsData }] = await Promise.all([
      supabase.from("api_keys").select("*").order("created_at", { ascending: false }),
      supabase.from("api_call_logs").select("*").order("created_at", { ascending: false }).limit(50),
    ]);
    const k = (keysData || []) as ApiKey[];
    setKeys(k);
    setLogs((logsData || []) as CallLog[]);
    setStats({
      totalCalls: logsData?.length || 0,
      totalTokens: logsData?.reduce((sum: number, l: any) => sum + (l.tokens_used || 0), 0) || 0,
      activeKeys: k.filter(k => k.is_active).length,
    });
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const generateKey = async () => {
    if (!newLabel.trim()) { toast.error("Label required"); return; }
    const rawKey = `arp_${crypto.randomUUID().replace(/-/g, "")}`;
    const keyHash = await sha256(rawKey);
    const keyPrefix = rawKey.substring(0, 12);

    const { error } = await supabase.from("api_keys").insert({
      key_hash: keyHash, key_prefix: keyPrefix, label: newLabel.trim(),
    });
    if (error) { toast.error(error.message); return; }

    setGeneratedKey(rawKey);
    setNewLabel("");
    toast.success("API key generated! Copy it now — it won't be shown again.");
    fetchData();
  };

  const toggleKey = async (id: string, active: boolean) => {
    await supabase.from("api_keys").update({ is_active: active, updated_at: new Date().toISOString() }).eq("id", id);
    fetchData();
    toast.success(active ? "Key activated" : "Key deactivated");
  };

  const deleteKey = async (id: string) => {
    await supabase.from("api_keys").delete().eq("id", id);
    fetchData();
    toast.success("Key deleted");
  };

  if (loading) return <div className="animate-pulse text-muted-foreground text-sm p-8">Loading API keys...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2"><Key className="w-5 h-5" /> API Key Management</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage external API access to AR Prime</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-4 text-center">
          <Shield className="w-5 h-5 mx-auto mb-1 text-primary" />
          <div className="text-2xl font-bold text-foreground">{stats.activeKeys}</div>
          <div className="text-xs text-muted-foreground">Active Keys</div>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <Activity className="w-5 h-5 mx-auto mb-1 text-primary" />
          <div className="text-2xl font-bold text-foreground">{stats.totalCalls}</div>
          <div className="text-xs text-muted-foreground">Recent API Calls</div>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-foreground">{stats.totalTokens.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">Tokens Used</div>
        </CardContent></Card>
      </div>

      {/* Generate Key */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Generate New API Key</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input placeholder="Key label (e.g., n8n-production)" value={newLabel} onChange={e => setNewLabel(e.target.value)} />
            <Button onClick={generateKey}><Plus className="w-4 h-4 mr-1" /> Generate</Button>
          </div>
          {generatedKey && (
            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
              <p className="text-xs font-semibold text-destructive mb-1">⚠️ Copy this key now — it will NOT be shown again!</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-background p-2 rounded font-mono break-all">{generatedKey}</code>
                <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(generatedKey); toast.success("Copied!"); }}>
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Keys Table */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Active Keys</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Label</TableHead>
                <TableHead>Prefix</TableHead>
                <TableHead>Rate Limit</TableHead>
                <TableHead>Last Used</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {keys.map(k => (
                <TableRow key={k.id}>
                  <TableCell className="font-medium">{k.label || "Unnamed"}</TableCell>
                  <TableCell><code className="text-xs">{k.key_prefix}...</code></TableCell>
                  <TableCell className="text-xs">{k.rate_limit_per_minute}/min · {k.rate_limit_per_day}/day</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : "Never"}
                  </TableCell>
                  <TableCell>
                    <Switch checked={k.is_active} onCheckedChange={v => toggleKey(k.id, v)} />
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost" onClick={() => deleteKey(k.id)}>
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {keys.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground text-sm py-8">No API keys yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Logs */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Recent API Calls</CardTitle></CardHeader>
        <CardContent>
          <div className="max-h-64 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Endpoint</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Tokens</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((l, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-xs font-mono">{l.endpoint}</TableCell>
                    <TableCell><Badge variant="secondary" className="text-[10px]">{l.source}</Badge></TableCell>
                    <TableCell className="text-xs">{l.tokens_used}</TableCell>
                    <TableCell><Badge variant={l.status_code === 200 ? "default" : "destructive"} className="text-[10px]">{l.status_code}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(l.created_at).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
                {logs.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground text-sm py-8">No API calls yet</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default APIKeyManagement;
