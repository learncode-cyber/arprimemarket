import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { Upload, X, Loader2, GripVertical, ImagePlus, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProductImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

const BUCKET = "product-images";
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";

export const ProductImageUploader = ({ images, onChange, maxImages = 5 }: ProductImageUploaderProps) => {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [optimizing, setOptimizing] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const resolveUrl = (path: string) => {
    if (path.startsWith("http")) return path;
    return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
  };

  const triggerOptimize = async (filePath: string) => {
    try {
      setOptimizing(filePath);
      await supabase.functions.invoke("image-optimize", {
        body: { action: "optimize_on_upload", bucket: BUCKET, file_path: filePath },
      });
    } catch {
      // Non-blocking - optimization is best-effort
    } finally {
      setOptimizing(null);
    }
  };

  const uploadFiles = useCallback(async (files: FileList | File[]) => {
    const fileArr = Array.from(files).slice(0, maxImages - images.length);
    if (!fileArr.length) {
      toast.error(`Maximum ${maxImages} images allowed`);
      return;
    }

    setUploading(true);
    const newUrls: string[] = [];

    for (const file of fileArr) {
      if (!file.type.startsWith("image/")) continue;
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 5MB limit`);
        continue;
      }

      const ext = file.name.split(".").pop() || "jpg";
      const path = `products/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
        cacheControl: "31536000",
        upsert: false,
      });

      if (error) {
        toast.error(`Upload failed: ${error.message}`);
      } else {
        newUrls.push(path);
        // Auto-optimize in background (non-blocking)
        triggerOptimize(path);
      }
    }

    if (newUrls.length) {
      onChange([...images, ...newUrls]);
      toast.success(`${newUrls.length} image(s) uploaded`);
    }
    setUploading(false);
  }, [images, maxImages, onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
  }, [uploadFiles]);

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-xs font-semibold text-foreground">Product Images</label>
          <p className="text-[10px] text-muted-foreground">{images.length}/{maxImages} • Auto-optimized to WebP</p>
        </div>
        {images.length < maxImages && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-[10px] px-3 py-1.5 rounded-lg bg-primary/10 text-primary font-semibold hover:bg-primary/20 transition-colors flex items-center gap-1.5"
          >
            <ImagePlus className="w-3 h-3" /> Add Images
          </button>
        )}
      </div>

      {/* Drop Zone */}
      {images.length < maxImages && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
            dragOver ? "border-primary bg-primary/5 scale-[1.01]" : "border-border hover:border-primary/40 hover:bg-secondary/30"
          }`}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">Uploading & optimizing...</p>
            </div>
          ) : (
            <>
              <Upload className="w-8 h-8 mx-auto text-muted-foreground/60 mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">Drop images here</p>
              <p className="text-[10px] text-muted-foreground">or click to browse • JPG, PNG, WebP • Max 5MB each</p>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && uploadFiles(e.target.files)}
      />

      {/* Image Gallery */}
      {images.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] text-muted-foreground font-medium">Drag to reorder • First image is the main product photo</p>
          <Reorder.Group axis="x" values={images} onReorder={onChange} className="flex gap-3 flex-wrap">
            <AnimatePresence>
              {images.map((img, i) => (
                <Reorder.Item
                  key={img}
                  value={img}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="relative group"
                >
                  <div className={`w-24 h-24 rounded-xl overflow-hidden border-2 transition-all cursor-grab active:cursor-grabbing ${
                    i === 0 ? "border-primary shadow-md shadow-primary/20" : "border-border group-hover:border-primary/40"
                  }`}>
                    <img
                      src={resolveUrl(img)}
                      alt={`Product ${i + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                    />
                    {optimizing === img && (
                      <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                      </div>
                    )}
                  </div>
                  {i === 0 && (
                    <span className="absolute -top-2 -left-2 text-[8px] bg-primary text-primary-foreground px-2 py-0.5 rounded-md font-bold shadow-sm">
                      MAIN
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <GripVertical className="absolute bottom-1 left-1/2 -translate-x-1/2 w-3.5 h-3.5 text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Reorder.Item>
              ))}
            </AnimatePresence>
          </Reorder.Group>
        </div>
      )}
    </div>
  );
};
