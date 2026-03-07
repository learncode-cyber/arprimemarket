import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Eye, X, Bold, Italic, List, ListOrdered, Link as LinkIcon, Image, Heading1, Heading2, Quote, Code, Upload, Loader2, Calendar, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Simple Rich Text Editor using contentEditable
const RichTextEditor = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isSourceMode, setIsSourceMode] = useState(false);

  const execCmd = useCallback((cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  }, [onChange]);

  const insertLink = () => {
    const url = prompt("Enter URL:");
    if (url) execCmd("createLink", url);
  };

  const insertImage = () => {
    const url = prompt("Enter image URL:");
    if (url) execCmd("insertImage", url);
  };

  const toolbarButtons = [
    { icon: Bold, cmd: "bold", title: "Bold" },
    { icon: Italic, cmd: "italic", title: "Italic" },
    { icon: Heading1, cmd: "formatBlock", val: "h2", title: "Heading" },
    { icon: Heading2, cmd: "formatBlock", val: "h3", title: "Subheading" },
    { icon: List, cmd: "insertUnorderedList", title: "Bullet List" },
    { icon: ListOrdered, cmd: "insertOrderedList", title: "Numbered List" },
    { icon: Quote, cmd: "formatBlock", val: "blockquote", title: "Quote" },
    { icon: Code, cmd: "formatBlock", val: "pre", title: "Code Block" },
  ];

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-background">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 bg-muted/30 border-b border-border flex-wrap">
        {toolbarButtons.map(btn => (
          <button
            key={btn.cmd + (btn.val || "")}
            type="button"
            onClick={() => btn.val ? execCmd(btn.cmd, btn.val) : execCmd(btn.cmd)}
            title={btn.title}
            className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
          >
            <btn.icon className="w-3.5 h-3.5" />
          </button>
        ))}
        <div className="w-px h-5 bg-border mx-1" />
        <button type="button" onClick={insertLink} title="Insert Link" className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
          <LinkIcon className="w-3.5 h-3.5" />
        </button>
        <button type="button" onClick={insertImage} title="Insert Image" className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
          <Image className="w-3.5 h-3.5" />
        </button>
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => setIsSourceMode(!isSourceMode)}
          className={`text-[10px] px-2 py-1 rounded-lg transition-colors ${isSourceMode ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}
        >
          {isSourceMode ? "Visual" : "HTML"}
        </button>
      </div>

      {/* Editor */}
      {isSourceMode ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full min-h-[250px] p-4 bg-background text-foreground text-sm font-mono resize-y focus:outline-none"
          placeholder="<p>Write your content here...</p>"
        />
      ) : (
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={() => {
            if (editorRef.current) onChange(editorRef.current.innerHTML);
          }}
          onPaste={(e) => {
            // Allow rich paste from word processors
            const html = e.clipboardData.getData("text/html");
            if (html) {
              e.preventDefault();
              document.execCommand("insertHTML", false, html);
              if (editorRef.current) onChange(editorRef.current.innerHTML);
            }
          }}
          dangerouslySetInnerHTML={{ __html: value }}
          className="min-h-[250px] p-4 text-sm text-foreground focus:outline-none prose prose-sm dark:prose-invert max-w-none [&_img]:rounded-lg [&_img]:max-w-full [&_a]:text-primary [&_blockquote]:border-l-2 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic"
        />
      )}
    </div>
  );
};

const BlogManagement = () => {
  const queryClient = useQueryClient();
  const [editPost, setEditPost] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [catForm, setCatForm] = useState({ name: "", slug: "", description: "" });
  const [imageUploading, setImageUploading] = useState(false);
  const [aiProductUrl, setAiProductUrl] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

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
    scheduled_at: "",
  });

  const resetForm = () => {
    setForm({ title: "", slug: "", excerpt: "", content: "", image_url: "", category_id: "", author_name: "AR Prime Team", meta_title: "", meta_description: "", is_published: false, read_time: "5 min", scheduled_at: "" });
    setEditPost(null);
    setShowForm(false);
  };

  const generateFromProduct = async () => {
    if (!aiProductUrl.trim()) { toast.error("Enter a product link or title"); return; }
    setAiGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-content", {
        body: { action: "blog_from_product", product_url: aiProductUrl, product_title: aiProductUrl },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const c = data.content;
      setForm(f => ({
        ...f,
        title: c.title || f.title,
        slug: c.slug || f.slug,
        excerpt: c.excerpt || f.excerpt,
        content: c.content || f.content,
        meta_title: c.meta_title || f.meta_title,
        meta_description: c.meta_description || f.meta_description,
        read_time: c.read_time || f.read_time,
      }));
      setShowForm(true);
      toast.success("AI draft generated! Review and edit before publishing.");
    } catch (e: any) {
      toast.error(e.message || "AI generation failed");
    }
    setAiGenerating(false);
  };

  const uploadImage = async (file: File) => {
    setImageUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `blog/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("blog-images").upload(path, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("blog-images").getPublicUrl(path);
      setForm(f => ({ ...f, image_url: publicUrl }));
      toast.success("Image uploaded!");
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    }
    setImageUploading(false);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const isScheduled = form.scheduled_at && !form.is_published;
      const payload: any = {
        ...form,
        category_id: form.category_id || null,
        published_at: form.is_published ? new Date().toISOString() : null,
        scheduled_at: isScheduled ? new Date(form.scheduled_at).toISOString() : null,
      };
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
    setForm({
      title: post.title, slug: post.slug, excerpt: post.excerpt || "", content: post.content,
      image_url: post.image_url || "", category_id: post.category_id || "", author_name: post.author_name,
      meta_title: post.meta_title || "", meta_description: post.meta_description || "",
      is_published: post.is_published, read_time: post.read_time || "5 min",
      scheduled_at: post.scheduled_at ? new Date(post.scheduled_at).toISOString().slice(0, 16) : "",
    });
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
        <TabsList>
          <TabsTrigger value="posts">Posts ({posts?.length || 0})</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="comments">Comments ({comments?.filter((c: any) => !c.is_approved).length || 0} pending)</TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-4">
          {showForm && (
            <div className="p-5 rounded-xl border border-border bg-card mb-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">{editPost ? "Edit Post" : "New Post"}</h3>
                <button onClick={resetForm}><X className="w-4 h-4 text-muted-foreground" /></button>
              </div>

              {/* Title & Slug */}
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Title" value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value, slug: f.slug || e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") }))} />
                <Input placeholder="Slug" value={form.slug} onChange={(e) => setForm(f => ({ ...f, slug: e.target.value }))} />
              </div>

              {/* Featured Image */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Featured Image</label>
                <div className="flex gap-3 items-start">
                  <div className="flex-1">
                    <Input placeholder="Image URL" value={form.image_url} onChange={(e) => setForm(f => ({ ...f, image_url: e.target.value }))} />
                  </div>
                  <input
                    type="file"
                    ref={imageInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={e => { if (e.target.files?.[0]) uploadImage(e.target.files[0]); e.target.value = ""; }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={imageUploading}
                    className="shrink-0"
                  >
                    {imageUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4 mr-1" />}
                    Upload
                  </Button>
                </div>
                {form.image_url && (
                  <img src={form.image_url} alt="Preview" className="w-full max-h-40 object-cover rounded-lg border border-border" />
                )}
              </div>

              <Input placeholder="Excerpt (short summary)" value={form.excerpt} onChange={(e) => setForm(f => ({ ...f, excerpt: e.target.value }))} />

              {/* Rich Text Editor */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Content</label>
                <RichTextEditor value={form.content} onChange={v => setForm(f => ({ ...f, content: v }))} />
              </div>

              {/* Meta & Settings */}
              <div className="grid grid-cols-3 gap-3">
                <Select value={form.category_id} onValueChange={(v) => setForm(f => ({ ...f, category_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                  <SelectContent>{categories?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
                <Input placeholder="Author" value={form.author_name} onChange={(e) => setForm(f => ({ ...f, author_name: e.target.value }))} />
                <Input placeholder="Read time" value={form.read_time} onChange={(e) => setForm(f => ({ ...f, read_time: e.target.value }))} />
              </div>

              {/* SEO Fields */}
              <div className="space-y-2 p-3 bg-muted/30 rounded-xl">
                <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">🔍 SEO Settings</h4>
                <div className="grid grid-cols-1 gap-2">
                  <div>
                    <Input
                      placeholder="Meta Title (50-60 chars recommended)"
                      value={form.meta_title}
                      onChange={(e) => setForm(f => ({ ...f, meta_title: e.target.value }))}
                    />
                    <p className="text-[10px] text-muted-foreground mt-0.5">{form.meta_title.length}/60 characters</p>
                  </div>
                  <div>
                    <Input
                      placeholder="Meta Description (150-160 chars recommended)"
                      value={form.meta_description}
                      onChange={(e) => setForm(f => ({ ...f, meta_description: e.target.value }))}
                    />
                    <p className="text-[10px] text-muted-foreground mt-0.5">{form.meta_description.length}/160 characters</p>
                  </div>
                </div>
              </div>

              {/* Publishing Options */}
              <div className="flex items-center gap-6 flex-wrap">
                <div className="flex items-center gap-2">
                  <Switch checked={form.is_published} onCheckedChange={(v) => setForm(f => ({ ...f, is_published: v, scheduled_at: v ? "" : f.scheduled_at }))} />
                  <span className="text-sm text-foreground">Publish Now</span>
                </div>
                {!form.is_published && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <Input
                      type="datetime-local"
                      value={form.scheduled_at}
                      onChange={(e) => setForm(f => ({ ...f, scheduled_at: e.target.value }))}
                      className="w-auto text-xs"
                      placeholder="Schedule publish"
                    />
                    {form.scheduled_at && <span className="text-[10px] text-primary font-medium">Scheduled</span>}
                  </div>
                )}
              </div>

              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.title || !form.content}>
                {saveMutation.isPending ? "Saving..." : editPost ? "Update Post" : "Save Post"}
              </Button>
            </div>
          )}

          <div className="space-y-2">
            {posts?.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-xl border border-border bg-card">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {p.image_url && <img src={p.image_url} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium text-foreground truncate">{p.title}</h4>
                      {p.is_published ? (
                        <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-600">Published</Badge>
                      ) : p.scheduled_at ? (
                        <Badge variant="secondary" className="text-[10px] bg-blue-500/10 text-blue-600">Scheduled</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">Draft</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {p.blog_categories?.name || "No category"} • {new Date(p.created_at).toLocaleDateString()}
                      {p.scheduled_at && !p.is_published && ` • Scheduled: ${new Date(p.scheduled_at).toLocaleString()}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(p)}><Pencil className="w-3.5 h-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(p.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
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
                      {c.is_approved ? <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-600">Approved</Badge> : <Badge variant="secondary" className="text-[10px] bg-amber-500/10 text-amber-600">Pending</Badge>}
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
