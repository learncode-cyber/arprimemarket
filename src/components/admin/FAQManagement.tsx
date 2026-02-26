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

const FAQManagement = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [catForm, setCatForm] = useState({ name: "", slug: "" });
  const [form, setForm] = useState({ question: "", answer: "", category_id: "", sort_order: 0, is_active: true });

  const { data: categories } = useQuery({ queryKey: ["admin-faq-cats"], queryFn: async () => { const { data } = await supabase.from("faq_categories").select("*").order("sort_order"); return data ?? []; } });
  const { data: items } = useQuery({ queryKey: ["admin-faq-items"], queryFn: async () => { const { data } = await supabase.from("faq_items").select("*, faq_categories(name)").order("sort_order"); return data ?? []; } });

  const resetForm = () => { setForm({ question: "", answer: "", category_id: "", sort_order: 0, is_active: true }); setEditItem(null); setShowForm(false); };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { ...form, category_id: form.category_id || null };
      if (editItem) { const { error } = await supabase.from("faq_items").update(payload).eq("id", editItem.id); if (error) throw error; }
      else { const { error } = await supabase.from("faq_items").insert(payload); if (error) throw error; }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-faq-items"] }); resetForm(); toast.success("FAQ saved!"); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("faq_items").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-faq-items"] }); toast.success("Deleted"); },
  });

  const saveCatMutation = useMutation({
    mutationFn: async () => { const { error } = await supabase.from("faq_categories").insert(catForm); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-faq-cats"] }); setCatForm({ name: "", slug: "" }); toast.success("Category created!"); },
    onError: (e: any) => toast.error(e.message),
  });

  const startEdit = (item: any) => { setForm({ question: item.question, answer: item.answer, category_id: item.category_id || "", sort_order: item.sort_order, is_active: item.is_active }); setEditItem(item); setShowForm(true); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><h2 className="font-display text-xl font-bold text-foreground">FAQ Management</h2><Button size="sm" onClick={() => { resetForm(); setShowForm(true); }}><Plus className="w-4 h-4 mr-1" />New FAQ</Button></div>

      <Tabs defaultValue="items">
        <TabsList><TabsTrigger value="items">Questions ({items?.length || 0})</TabsTrigger><TabsTrigger value="categories">Categories</TabsTrigger></TabsList>

        <TabsContent value="items" className="mt-4">
          {showForm && (
            <div className="p-5 rounded-xl border border-border bg-card mb-6 space-y-4">
              <div className="flex items-center justify-between"><h3 className="font-semibold text-foreground">{editItem ? "Edit FAQ" : "New FAQ"}</h3><button onClick={resetForm}><X className="w-4 h-4 text-muted-foreground" /></button></div>
              <Input placeholder="Question" value={form.question} onChange={(e) => setForm(f => ({ ...f, question: e.target.value }))} />
              <Textarea placeholder="Answer" value={form.answer} onChange={(e) => setForm(f => ({ ...f, answer: e.target.value }))} rows={4} />
              <Select value={form.category_id} onValueChange={(v) => setForm(f => ({ ...f, category_id: v }))}><SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger><SelectContent>{categories?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select>
              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.question || !form.answer}>{saveMutation.isPending ? "Saving..." : "Save FAQ"}</Button>
            </div>
          )}
          <div className="space-y-2">
            {items?.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between p-3 rounded-xl border border-border bg-card">
                <div className="flex-1 min-w-0"><p className="text-sm font-medium text-foreground truncate">{item.question}</p><p className="text-xs text-muted-foreground">{item.faq_categories?.name || "No category"}</p></div>
                <div className="flex gap-1"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(item)}><Pencil className="w-3.5 h-3.5" /></Button><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(item.id)}><Trash2 className="w-3.5 h-3.5" /></Button></div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="categories" className="mt-4">
          <div className="flex gap-3 mb-4">
            <Input placeholder="Category name" value={catForm.name} onChange={(e) => setCatForm(f => ({ ...f, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-") }))} className="flex-1" />
            <Button size="sm" onClick={() => saveCatMutation.mutate()} disabled={!catForm.name}>Add</Button>
          </div>
          <div className="space-y-2">
            {categories?.map(c => (
              <div key={c.id} className="p-3 rounded-xl border border-border bg-card"><p className="text-sm font-medium text-foreground">{c.name}</p></div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FAQManagement;
