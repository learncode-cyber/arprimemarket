import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Bold, Italic, List, ListOrdered, Link as LinkIcon, Image, Heading1, Heading2, Quote, Code } from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  minHeight?: string;
  storageBucket?: string;
}

export const RichTextEditor = ({ 
  value, 
  onChange, 
  placeholder = "Start writing or paste formatted text here...",
  minHeight = "250px",
  storageBucket = "blog-images",
}: RichTextEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isSourceMode, setIsSourceMode] = useState(false);
  const lastValueRef = useRef(value);
  const editorImageRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editorRef.current && !isSourceMode) {
      if (lastValueRef.current !== value && editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || "";
      }
      lastValueRef.current = value;
    }
  }, [value, isSourceMode]);

  const execCmd = useCallback((cmd: string, val?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      lastValueRef.current = html;
      onChange(html);
    }
  }, [onChange]);

  const insertLink = () => {
    const url = prompt("Enter URL:");
    if (url) execCmd("createLink", url);
  };

  const handleEditorImageUpload = async (file: File) => {
    try {
      const ext = file.name.split(".").pop();
      const path = `inline-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from(storageBucket).upload(path, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from(storageBucket).getPublicUrl(path);
      execCmd("insertImage", publicUrl);
    } catch {
      const url = prompt("Upload failed. Enter image URL manually:");
      if (url) execCmd("insertImage", url);
    }
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
      <input
        type="file"
        ref={editorImageRef}
        className="hidden"
        accept="image/*"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) handleEditorImageUpload(file);
          e.target.value = "";
        }}
      />
      <div className="flex items-center gap-0.5 px-2 py-1.5 bg-muted/30 border-b border-border flex-wrap">
        {toolbarButtons.map(btn => (
          <button
            key={btn.cmd + (btn.val || "")}
            type="button"
            onMouseDown={e => e.preventDefault()}
            onClick={() => btn.val ? execCmd(btn.cmd, btn.val) : execCmd(btn.cmd)}
            title={btn.title}
            className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
          >
            <btn.icon className="w-3.5 h-3.5" />
          </button>
        ))}
        <div className="w-px h-5 bg-border mx-1" />
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={insertLink} title="Insert Link" className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
          <LinkIcon className="w-3.5 h-3.5" />
        </button>
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => editorImageRef.current?.click()} title="Upload Image" className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
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

      {isSourceMode ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full p-4 bg-background text-foreground text-sm font-mono resize-y focus:outline-none"
          style={{ minHeight }}
          placeholder="<p>Write your content here...</p>"
        />
      ) : (
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={() => {
            if (editorRef.current) {
              const html = editorRef.current.innerHTML;
              lastValueRef.current = html;
              onChange(html);
            }
          }}
          onPaste={(e) => {
            const html = e.clipboardData.getData("text/html");
            if (html) {
              e.preventDefault();
              document.execCommand("insertHTML", false, html);
              if (editorRef.current) {
                const newHtml = editorRef.current.innerHTML;
                lastValueRef.current = newHtml;
                onChange(newHtml);
              }
            }
          }}
          className="p-4 text-sm text-foreground focus:outline-none prose prose-sm dark:prose-invert max-w-none [&_img]:rounded-lg [&_img]:max-w-full [&_a]:text-primary [&_blockquote]:border-l-2 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground"
          style={{ minHeight }}
          data-placeholder={placeholder}
        />
      )}
    </div>
  );
};
