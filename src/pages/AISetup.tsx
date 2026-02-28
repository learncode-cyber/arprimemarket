import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Copy, Globe, Bot, Scan, Settings, Code, Loader2, CheckCircle, ExternalLink } from "lucide-react";
import { Navigate } from "react-router-dom";

interface WidgetConfig {
  id: string;
  site_name: string;
  site_url: string;
  widget_color: string;
  widget_position: string;
  welcome_message: string;
  ai_persona: string;
  is_active: boolean;
  scraped_data: any;
  last_scraped_at: string | null;
  created_at: string;
}

const AISetup = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [scraping, setScraping] = useState(false);

  // Form state
  const [siteName, setSiteName] = useState("");
  const [siteUrl, setSiteUrl] = useState("");
  const [widgetColor, setWidgetColor] = useState("#6366f1");
  const [welcomeMessage, setWelcomeMessage] = useState("Hi! How can I help you today? 😊");
  const [aiPersona, setAiPersona] = useState("helpful sales assistant that increases revenue");
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchWidgets();
  }, [user]);

  const fetchWidgets = async () => {
    const { data } = await supabase
      .from("widget_configs" as any)
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });
    setWidgets((data as any[]) || []);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!siteName || !siteUrl) {
      toast({ title: "Error", description: "Site name and URL are required", variant: "destructive" });
      return;
    }
    setSaving(true);

    const payload = {
      user_id: user!.id,
      site_name: siteName,
      site_url: siteUrl,
      widget_color: widgetColor,
      welcome_message: welcomeMessage,
      ai_persona: aiPersona,
      updated_at: new Date().toISOString(),
    };

    if (editingId) {
      await supabase.from("widget_configs" as any).update(payload as any).eq("id", editingId);
      toast({ title: "Updated!", description: "Widget configuration saved." });
    } else {
      await supabase.from("widget_configs" as any).insert(payload as any);
      toast({ title: "Created!", description: "New widget created. Copy the embed code!" });
    }

    resetForm();
    fetchWidgets();
    setSaving(false);
  };

  const resetForm = () => {
    setSiteName("");
    setSiteUrl("");
    setWidgetColor("#6366f1");
    setWelcomeMessage("Hi! How can I help you today? 😊");
    setAiPersona("helpful sales assistant that increases revenue");
    setEditingId(null);
  };

  const editWidget = (w: WidgetConfig) => {
    setSiteName(w.site_name);
    setSiteUrl(w.site_url);
    setWidgetColor(w.widget_color);
    setWelcomeMessage(w.welcome_message);
    setAiPersona(w.ai_persona);
    setEditingId(w.id);
  };

  const handleScrape = async (widgetId: string, url: string) => {
    setScraping(true);
    try {
      const { data, error } = await supabase.functions.invoke("widget-scraper", {
        body: { widget_id: widgetId, url },
      });
      if (error) throw error;
      toast({ title: "✅ Scraping Complete!", description: `Learned about ${data?.pages_scraped || 0} pages from the website.` });
      fetchWidgets();
    } catch (err: any) {
      toast({ title: "Scraping Failed", description: err.message || "Could not scrape the website.", variant: "destructive" });
    }
    setScraping(false);
  };

  const getEmbedCode = (widgetId: string) => {
    const baseUrl = import.meta.env.VITE_SUPABASE_URL;
    const projectUrl = window.location.origin;
    return `<!-- AR Prime AI Chatbot Widget -->
<script>
(function(){
  var d=document,s=d.createElement('script');
  s.src='${projectUrl}/widget/chat?id=${widgetId}';
  s.async=true;
  s.onload=function(){
    var iframe=d.createElement('iframe');
    iframe.src='${projectUrl}/widget/chat?id=${widgetId}';
    iframe.style.cssText='position:fixed;bottom:20px;right:20px;width:380px;height:520px;border:none;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.15);z-index:99999;display:none;';
    iframe.id='ar-ai-widget';
    d.body.appendChild(iframe);
    var btn=d.createElement('button');
    btn.innerHTML='💬';
    btn.style.cssText='position:fixed;bottom:20px;right:20px;width:56px;height:56px;border-radius:50%;border:none;background:#6366f1;color:white;font-size:24px;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,0.2);z-index:100000;';
    btn.onclick=function(){
      var w=d.getElementById('ar-ai-widget');
      w.style.display=w.style.display==='none'?'block':'none';
      btn.style.display=w.style.display==='none'?'block':'none';
    };
    d.body.appendChild(btn);
  };
  d.head.appendChild(s);
})();
</script>`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Embed code copied to clipboard." });
  };

  if (authLoading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Bot className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">AI Chatbot Widget Setup</h1>
            <p className="text-muted-foreground text-sm">Create portable AI chatbot widgets for any website</p>
          </div>
        </div>

        <Tabs defaultValue="widgets">
          <TabsList className="mb-6">
            <TabsTrigger value="widgets"><Globe className="w-4 h-4 mr-1" />My Widgets</TabsTrigger>
            <TabsTrigger value="create"><Settings className="w-4 h-4 mr-1" />{editingId ? "Edit" : "Create"} Widget</TabsTrigger>
            <TabsTrigger value="guide"><Code className="w-4 h-4 mr-1" />Integration Guide</TabsTrigger>
          </TabsList>

          {/* Widgets List */}
          <TabsContent value="widgets">
            {loading ? (
              <div className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
            ) : widgets.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Bot className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Widgets Yet</h3>
                  <p className="text-muted-foreground mb-4">Create your first AI chatbot widget to embed on any website.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {widgets.map((w) => (
                  <Card key={w.id}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{w.site_name || "Unnamed Widget"}</h3>
                            <Badge variant={w.is_active ? "default" : "secondary"}>
                              {w.is_active ? "Active" : "Inactive"}
                            </Badge>
                            {w.last_scraped_at && (
                              <Badge variant="outline" className="text-xs">
                                <CheckCircle className="w-3 h-3 mr-1" />Trained
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <ExternalLink className="w-3 h-3" />{w.site_url}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: w.widget_color }} />
                            <span className="text-xs text-muted-foreground">Created {new Date(w.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => editWidget(w)}>Edit</Button>
                          <Button size="sm" variant="outline" onClick={() => handleScrape(w.id, w.site_url)} disabled={scraping}>
                            {scraping ? <Loader2 className="w-3 h-3 animate-spin" /> : <Scan className="w-3 h-3" />}
                            <span className="ml-1">Train AI</span>
                          </Button>
                          <Button size="sm" onClick={() => copyToClipboard(getEmbedCode(w.id))}>
                            <Copy className="w-3 h-3 mr-1" />Embed Code
                          </Button>
                        </div>
                      </div>

                      {/* Scraped data summary */}
                      {w.scraped_data && Object.keys(w.scraped_data).length > 0 && (
                        <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                          <p className="text-xs font-medium mb-1">🧠 AI Knowledge Base:</p>
                          <div className="flex gap-3 text-xs text-muted-foreground">
                            {w.scraped_data.products_count && <span>📦 {w.scraped_data.products_count} products</span>}
                            {w.scraped_data.pages_count && <span>📄 {w.scraped_data.pages_count} pages</span>}
                            {w.scraped_data.faqs_count && <span>❓ {w.scraped_data.faqs_count} FAQs</span>}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Create/Edit Widget */}
          <TabsContent value="create">
            <Card>
              <CardHeader>
                <CardTitle>{editingId ? "Edit Widget" : "Create New Widget"}</CardTitle>
                <CardDescription>Configure your AI chatbot widget settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Site Name</Label>
                    <Input value={siteName} onChange={e => setSiteName(e.target.value)} placeholder="My Online Store" />
                  </div>
                  <div>
                    <Label>Site URL</Label>
                    <Input value={siteUrl} onChange={e => setSiteUrl(e.target.value)} placeholder="https://mystore.com" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Widget Color</Label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={widgetColor} onChange={e => setWidgetColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer" />
                      <Input value={widgetColor} onChange={e => setWidgetColor(e.target.value)} className="flex-1" />
                    </div>
                  </div>
                  <div>
                    <Label>Welcome Message</Label>
                    <Input value={welcomeMessage} onChange={e => setWelcomeMessage(e.target.value)} placeholder="Hi! How can I help?" />
                  </div>
                </div>

                <div>
                  <Label>AI Persona / Instructions</Label>
                  <textarea
                    value={aiPersona}
                    onChange={e => setAiPersona(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px]"
                    placeholder="Describe how the AI should behave..."
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                    {editingId ? "Update Widget" : "Create Widget"}
                  </Button>
                  {editingId && <Button variant="outline" onClick={resetForm}>Cancel</Button>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integration Guide */}
          <TabsContent value="guide">
            <Card>
              <CardHeader>
                <CardTitle>🚀 Integration Guide</CardTitle>
                <CardDescription>How to add the AI chatbot to any website</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Step 1: Create a Widget</h3>
                  <p className="text-sm text-muted-foreground">Go to "Create Widget" tab, fill in your site details, and click Create.</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Step 2: Train the AI</h3>
                  <p className="text-sm text-muted-foreground">Click "Train AI" button to let the AI learn about your website's products, FAQs, and content automatically.</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Step 3: Copy Embed Code</h3>
                  <p className="text-sm text-muted-foreground">Click "Embed Code" to copy the widget script. Paste it before the closing <code className="bg-muted px-1 rounded">&lt;/body&gt;</code> tag of your website.</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Step 4: Done! 🎉</h3>
                  <p className="text-sm text-muted-foreground">The AI chatbot will appear on your website. It acts as a sales expert to increase conversions and provide 24/7 support.</p>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium text-sm mb-2">📋 Example Embed Code:</h4>
                  <pre className="text-xs overflow-x-auto bg-background p-3 rounded border">
{`<!-- Paste before </body> -->
<script>
  // Widget embed code will be generated 
  // after you create a widget
</script>`}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AISetup;
