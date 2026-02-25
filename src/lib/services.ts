import { supabase } from "@/integrations/supabase/client";

// ─── Security Service ───
export const securityService = {
  async checkRateLimit(endpoint: string, userId?: string): Promise<{ allowed: boolean; remaining: number }> {
    try {
      const { data, error } = await supabase.functions.invoke("security", {
        body: { action: "check-rate-limit", data: { endpoint, userId } },
      });
      if (error) return { allowed: true, remaining: 99 }; // fail open
      return data;
    } catch {
      return { allowed: true, remaining: 99 };
    }
  },

  async checkFraud(orderData: {
    total: number;
    itemCount: number;
    shippingName: string;
  }): Promise<{ score: number; action: "allow" | "review" | "block"; flags: string[] }> {
    try {
      const { data, error } = await supabase.functions.invoke("security", {
        body: { action: "check-fraud", data: orderData },
      });
      if (error) return { score: 0, action: "allow", flags: [] };
      return data;
    } catch {
      return { score: 0, action: "allow", flags: [] };
    }
  },

  async validateSession(): Promise<{ valid: boolean; userId: string | null }> {
    try {
      const { data, error } = await supabase.functions.invoke("security", {
        body: { action: "validate-session" },
      });
      if (error) return { valid: false, userId: null };
      return data;
    } catch {
      return { valid: false, userId: null };
    }
  },
};

// ─── Backup Service ───
export const backupService = {
  async exportData(tables?: string[]): Promise<Blob | null> {
    try {
      const { data, error } = await supabase.functions.invoke("backup", {
        body: { action: "export", tables },
      });
      if (error) throw error;
      return new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    } catch {
      return null;
    }
  },

  async getStatus(): Promise<{ status: string; tables: Record<string, number> } | null> {
    try {
      const { data, error } = await supabase.functions.invoke("backup", {
        body: { action: "status" },
      });
      if (error) throw error;
      return data;
    } catch {
      return null;
    }
  },

  downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  },
};

// ─── Performance Utilities ───
export const performanceUtils = {
  // Image URL optimizer - adds width/quality params for Unsplash
  optimizeImageUrl(url: string, width: number = 400, quality: number = 80): string {
    if (!url) return "/placeholder.svg";
    if (url.includes("unsplash.com")) {
      const base = url.split("?")[0];
      return `${base}?w=${width}&q=${quality}&auto=format&fit=crop`;
    }
    return url;
  },

  // Generate srcSet for responsive images
  generateSrcSet(url: string, sizes: number[] = [320, 640, 960, 1280]): string {
    if (!url || !url.includes("unsplash.com")) return "";
    const base = url.split("?")[0];
    return sizes.map(w => `${base}?w=${w}&q=80&auto=format&fit=crop ${w}w`).join(", ");
  },

  // Preload critical images
  preloadImage(url: string): void {
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = url;
    document.head.appendChild(link);
  },

  // Debounced search
  debounce<T extends (...args: unknown[]) => unknown>(fn: T, delay: number): T {
    let timer: ReturnType<typeof setTimeout>;
    return ((...args: unknown[]) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    }) as T;
  },
};
