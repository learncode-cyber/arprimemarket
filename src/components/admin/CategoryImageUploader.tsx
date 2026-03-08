import { useState, useRef, useCallback } from "react";
import { Upload, X, Loader2, ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CategoryImageUploaderProps {
  imageUrl: string;
  onChange: (url: string) => void;
}

const BUCKET = "category-images";
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";

const resolveUrl = (path: string) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
};

export const CategoryImageUploader = ({ imageUrl, onChange }: CategoryImageUploaderProps) => {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files allowed");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File exceeds 5MB limit");
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `categories/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      cacheControl: "31536000",
      upsert: false,
    });

    if (error) {
      toast.error(`Upload failed: ${error.message}`);
    } else {
      onChange(path);
      toast.success("Image uploaded!");
    }
    setUploading(false);
  }, [onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }, [uploadFile]);

  const removeImage = () => onChange("");

  const displayUrl = resolveUrl(imageUrl);

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-muted-foreground block">Category Image</label>
      
      {imageUrl ? (
        <div className="relative group inline-block">
          <img
            src={displayUrl}
            alt="Category"
            className="w-24 h-24 rounded-xl object-cover border-2 border-border"
            onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
          />
          <button
            type="button"
            onClick={removeImage}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`w-full border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
            dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 hover:bg-secondary/30"
          }`}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-1.5">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <p className="text-[10px] text-muted-foreground">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5">
              <Upload className="w-6 h-6 text-muted-foreground/60" />
              <p className="text-xs font-medium text-foreground">Drop image or click</p>
              <p className="text-[10px] text-muted-foreground">JPG, PNG, WebP • Max 5MB</p>
            </div>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) uploadFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
};
