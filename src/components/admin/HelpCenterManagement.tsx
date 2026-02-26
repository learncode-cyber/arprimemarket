import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const HelpCenterManagement = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [catForm, setCatForm] = useState({ name: "", slug: "", icon: "HelpCircle", description: "" });

  const { data: categories } = useQuery({
    queryKey: ["admin-help-cats"],
    queryFn: async () => { const { data } = await supabase.from("help_categories").select("*").order("sort_order"); return data ?? []; },
  });

  const { data: articles } = useQuery({
    queryKey: ["admin-help-articles"],
    queryFn: async () => { const { data } = await supabase.from("help_articles").select("*, help_categories(name)").order("created_at", { ascending: false }); return data ?? []; },
  });

  const [form, setForm] = useState({ title: "", slug: "", content: "", category_id: "", is_published: true, sort_order: 0 });

  const resetForm = () => { setForm({ title: "", slug: "", content: "", category_id: "", is_published: true, sort_order: 0 }); setEditItem(null); setShowForm(false); };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { ...form, category_id: form.category_id || null };
      if (editItem) { const { error } = await supabase.from("help_articles").update(payload).eq("id", editItem.id); if (error) throw error; }
      else { const { error } = await supabase.from("help_articles").insert(payload); if (error) throw error; }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-help-articles"] }); resetForm(); toast.success("Article saved!"); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("help_articles").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-help-articles"] }); toast.success("Deleted"); },
  });

  const saveCatMutation = useMutation({
    mutationFn: async () => { const { error } = await supabase.from("help_categories").insert(catForm); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-help-cats"] }); setCatForm({ name: "", slug: "", icon: "HelpCircle", description: "" }); toast.success("Category created!"); },
    onError: (e: any) => toast.error(e.message),
  });

  const startEdit = (a: any) => { setForm({ title: a.title, slug: a.slug, content: a.content, category_id: a.category_id || "", is_published: a.is_published, sort_order: a.sort_order }); setEditItem(a); setShowForm(true); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><h2 className="font-display text-xl font-bold text-foreground">Help Center</h2><Button size="sm" onClick={() => { resetForm(); setShowForm(true); }}><Plus className="w-4 h-4 mr-1" />New Article</Button></div>

      <Tabs defaultValue="articles">
        <TabsList><TabsTrigger value="articles">Articles ({articles?.length || 0})</TabsTrigger><TabsTrigger value="categories">Categories</TabsTrigger></TabsList>

        <TabsContent value="articles" className="mt-4">
          {showForm && (
            <div className="p-5 rounded-xl border border-border bg-card mb-6 space-y-4">
              <div className="flex items-center justify-between"><h3 className="font-semibold text-foreground">{editItem ? "Edit Article" : "New Article"}</h3><button onClick={resetForm}><X className="w-4 h-4 text-muted-foreground" /></button></div>
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Title" value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") }))} />
                <Select value={form.category_id} onValueChange={(v) => setForm(f => ({ ...f, category_id: v }))}><SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger><SelectContent>{categories?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select>
              </div>
              <Textarea placeholder="Content (HTML supported)" value={form.content} onChange={(e) => setForm(f => ({ ...f, content: e.target.value }))} rows={8} />
              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.title || !form.content}>{saveMutation.isPending ? "Saving..." : "Save Article"}</Button>
            </div>
          )}
          <div className="space-y-2">
            {articles?.map((a: any) => (
              <div key={a.id} className="flex items-center justify-between p-3 rounded-xl border border-border bg-card">
                <div><p className="text-sm font-medium text-foreground">{a.title}</p><p className="text-xs text-muted-foreground">{a.help_categories?.name || "No category"}</p></div>
                <div className="flex gap-1"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(a)}><Pencil className="w-3.5 h-3.5" /></Button><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(a.id)}><Trash2 className="w-3.5 h-3.5" /></Button></div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="categories" className="mt-4">
          <div className="flex gap-3 mb-4">
            <Input placeholder="Name" value={catForm.name} onChange={(e) => setCatForm(f => ({ ...f, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-") }))} className="flex-1" />
            <Input placeholder="Icon" value={catForm.icon} onChange={(e) => setCatForm(f => ({ ...f, icon: e.target.value }))} className="w-32" />
            <Button size="sm" onClick={() => saveCatMutation.mutate()} disabled={!catForm.name}>Add</Button>
          </div>
          <div className="space-y-2">
            {categories?.map(c => (
              <div key={c.id} className="p-3 rounded-xl border border-border bg-card">
                <p className="text-sm font-medium text-foreground">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.icon} • /{c.slug}</p>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HelpCenterManagement;
