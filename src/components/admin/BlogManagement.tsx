import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Eye, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const BlogManagement = () => {
  const queryClient = useQueryClient();
  const [editPost, setEditPost] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [catForm, setCatForm] = useState({ name: "", slug: "", description: "" });

  const { data: posts } = useQuery({
    queryKey: ["admin-blog-posts"],
    queryFn: async () => {
      const { data } = await supabase.from("blog_posts").select("*, blog_categories(name)").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["admin-blog-categories"],
    queryFn: async () => {
      const { data } = await supabase.from("blog_categories").select("*").order("name");
      return data ?? [];
    },
  });

  const { data: comments } = useQuery({
    queryKey: ["admin-blog-comments"],
    queryFn: async () => {
      const { data } = await supabase.from("blog_comments").select("*, blog_posts(title), profiles(full_name)").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const [form, setForm] = useState({
    title: "", slug: "", excerpt: "", content: "", image_url: "", category_id: "",
    author_name: "AR Prime Team", meta_title: "", meta_description: "", is_published: false, read_time: "5 min",
  });

  const resetForm = () => {
    setForm({ title: "", slug: "", excerpt: "", content: "", image_url: "", category_id: "", author_name: "AR Prime Team", meta_title: "", meta_description: "", is_published: false, read_time: "5 min" });
    setEditPost(null);
    setShowForm(false);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { ...form, category_id: form.category_id || null, published_at: form.is_published ? new Date().toISOString() : null };
      if (editPost) {
        const { error } = await supabase.from("blog_posts").update(payload).eq("id", editPost.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("blog_posts").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] }); resetForm(); toast.success("Post saved!"); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blog_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] }); toast.success("Post deleted"); },
  });

  const saveCatMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("blog_categories").insert(catForm);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-blog-categories"] }); setCatForm({ name: "", slug: "", description: "" }); toast.success("Category created!"); },
    onError: (e: any) => toast.error(e.message),
  });

  const approveComment = useMutation({
    mutationFn: async ({ id, approved }: { id: string; approved: boolean }) => {
      const { error } = await supabase.from("blog_comments").update({ is_approved: approved }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-blog-comments"] }); toast.success("Comment updated"); },
  });

  const deleteComment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blog_comments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-blog-comments"] }); toast.success("Comment deleted"); },
  });

  const startEdit = (post: any) => {
    setForm({ title: post.title, slug: post.slug, excerpt: post.excerpt || "", content: post.content, image_url: post.image_url || "", category_id: post.category_id || "", author_name: post.author_name, meta_title: post.meta_title || "", meta_description: post.meta_description || "", is_published: post.is_published, read_time: post.read_time || "5 min" });
    setEditPost(post);
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-foreground">Blog Management</h2>
        <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }}><Plus className="w-4 h-4 mr-1" />New Post</Button>
      </div>

      <Tabs defaultValue="posts">
        <TabsList><TabsTrigger value="posts">Posts ({posts?.length || 0})</TabsTrigger><TabsTrigger value="categories">Categories</TabsTrigger><TabsTrigger value="comments">Comments ({comments?.filter((c: any) => !c.is_approved).length || 0} pending)</TabsTrigger></TabsList>

        <TabsContent value="posts" className="mt-4">
          {showForm && (
            <div className="p-5 rounded-xl border border-border bg-card mb-6 space-y-4">
              <div className="flex items-center justify-between"><h3 className="font-semibold text-foreground">{editPost ? "Edit Post" : "New Post"}</h3><button onClick={resetForm}><X className="w-4 h-4 text-muted-foreground" /></button></div>
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Title" value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") }))} />
                <Input placeholder="Slug" value={form.slug} onChange={(e) => setForm(f => ({ ...f, slug: e.target.value }))} />
              </div>
              <Input placeholder="Image URL" value={form.image_url} onChange={(e) => setForm(f => ({ ...f, image_url: e.target.value }))} />
              <Input placeholder="Excerpt" value={form.excerpt} onChange={(e) => setForm(f => ({ ...f, excerpt: e.target.value }))} />
              <Textarea placeholder="Content (HTML supported)" value={form.content} onChange={(e) => setForm(f => ({ ...f, content: e.target.value }))} rows={8} />
              <div className="grid grid-cols-3 gap-3">
                <Select value={form.category_id} onValueChange={(v) => setForm(f => ({ ...f, category_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                  <SelectContent>{categories?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
                <Input placeholder="Author" value={form.author_name} onChange={(e) => setForm(f => ({ ...f, author_name: e.target.value }))} />
                <Input placeholder="Read time" value={form.read_time} onChange={(e) => setForm(f => ({ ...f, read_time: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Meta Title" value={form.meta_title} onChange={(e) => setForm(f => ({ ...f, meta_title: e.target.value }))} />
                <Input placeholder="Meta Description" value={form.meta_description} onChange={(e) => setForm(f => ({ ...f, meta_description: e.target.value }))} />
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={form.is_published} onCheckedChange={(v) => setForm(f => ({ ...f, is_published: v }))} /><span className="text-sm text-foreground">Published</span>
              </div>
              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.title || !form.content}>{saveMutation.isPending ? "Saving..." : "Save Post"}</Button>
            </div>
          )}

          <div className="space-y-2">
            {posts?.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-xl border border-border bg-card">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2"><h4 className="text-sm font-medium text-foreground truncate">{p.title}</h4>{p.is_published ? <Badge variant="secondary" className="text-[10px] bg-green-500/10 text-green-600">Published</Badge> : <Badge variant="secondary" className="text-[10px]">Draft</Badge>}</div>
                  <p className="text-xs text-muted-foreground mt-0.5">{p.blog_categories?.name || "No category"} • {new Date(p.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-1"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(p)}><Pencil className="w-3.5 h-3.5" /></Button><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(p.id)}><Trash2 className="w-3.5 h-3.5" /></Button></div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="categories" className="mt-4">
          <div className="flex gap-3 mb-4">
            <Input placeholder="Category name" value={catForm.name} onChange={(e) => setCatForm(f => ({ ...f, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-") }))} className="flex-1" />
            <Input placeholder="Slug" value={catForm.slug} onChange={(e) => setCatForm(f => ({ ...f, slug: e.target.value }))} className="flex-1" />
            <Button size="sm" onClick={() => saveCatMutation.mutate()} disabled={!catForm.name}>Add</Button>
          </div>
          <div className="space-y-2">
            {categories?.map((c) => (
              <div key={c.id} className="flex items-center justify-between p-3 rounded-xl border border-border bg-card">
                <div><p className="text-sm font-medium text-foreground">{c.name}</p><p className="text-xs text-muted-foreground">/{c.slug}</p></div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="comments" className="mt-4">
          <div className="space-y-2">
            {comments?.map((c: any) => (
              <div key={c.id} className="p-3 rounded-xl border border-border bg-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-foreground">{c.profiles?.full_name || "User"}</span>
                      <span className="text-xs text-muted-foreground">on {c.blog_posts?.title}</span>
                      {c.is_approved ? <Badge variant="secondary" className="text-[10px] bg-green-500/10 text-green-600">Approved</Badge> : <Badge variant="secondary" className="text-[10px] bg-yellow-500/10 text-yellow-600">Pending</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{c.content}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => approveComment.mutate({ id: c.id, approved: !c.is_approved })}><Eye className="w-3 h-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteComment.mutate(c.id)}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BlogManagement;
