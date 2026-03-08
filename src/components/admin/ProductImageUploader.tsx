import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { Upload, X, Loader2, GripVertical, ImagePlus } from "lucide-react";
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
  const inputRef = useRef<HTMLInputElement>(null);

  const resolveUrl = (path: string) => {
    if (path.startsWith("http")) return path;
    return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
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
        cacheControl: "3600",
        upsert: false,
      });

      if (error) {
        toast.error(`Upload failed: ${error.message}`);
      } else {
        newUrls.push(path);
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
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-foreground">Product Images ({images.length}/{maxImages})</label>
        {images.length < maxImages && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-[10px] px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-colors"
          >
            <ImagePlus className="w-3 h-3 inline mr-1" />Add
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
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
            dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
          }`}
        >
          {uploading ? (
            <Loader2 className="w-6 h-6 mx-auto animate-spin text-primary" />
          ) : (
            <>
              <Upload className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
              <p className="text-xs text-muted-foreground">Drag & drop images here, or click to browse</p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">JPG, PNG, WebP • Max 5MB each</p>
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
        <Reorder.Group axis="x" values={images} onReorder={onChange} className="flex gap-2 flex-wrap">
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
                <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-border group-hover:border-primary/50 transition-colors cursor-grab active:cursor-grabbing">
                  <img
                    src={resolveUrl(img)}
                    alt={`Product ${i + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                  />
                </div>
                {i === 0 && (
                  <span className="absolute -top-1.5 -left-1.5 text-[8px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-md font-bold">MAIN</span>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
                <GripVertical className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-3 h-3 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Reorder.Item>
            ))}
          </AnimatePresence>
        </Reorder.Group>
      )}
    </div>
  );
};
