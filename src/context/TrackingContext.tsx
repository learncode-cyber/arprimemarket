import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLocation } from "react-router-dom";

interface TrackingPixel {
  id: string;
  platform: string;
  pixel_id: string;
  is_active: boolean;
  config: Record<string, any>;
}

interface ProductData {
  id: string;
  title: string;
  price: number;
  category?: string;
  currency?: string;
  quantity?: number;
}

interface TrackingContextType {
  trackAddToCart: (product: ProductData) => void;
  trackInitiateCheckout: (value: number, items: ProductData[]) => void;
  trackPurchase: (orderId: string, value: number, items: ProductData[]) => void;
  trackViewContent: (product: ProductData) => void;
  trackSearch: (query: string) => void;
}

const TrackingContext = createContext<TrackingContextType>({
  trackAddToCart: () => {},
  trackInitiateCheckout: () => {},
  trackPurchase: () => {},
  trackViewContent: () => {},
  trackSearch: () => {},
});

declare global {
  interface Window {
    fbq: any;
    _fbq: any;
    gtag: any;
    dataLayer: any[];
  }
}

const injectedScripts = new Set<string>();

const injectScript = (id: string, src: string) => {
  if (injectedScripts.has(id) || document.getElementById(id)) return;
  const s = document.createElement("script");
  s.id = id; s.async = true; s.src = src;
  document.head.appendChild(s);
  injectedScripts.add(id);
};

const injectInline = (id: string, code: string) => {
  if (injectedScripts.has(id) || document.getElementById(id)) return;
  const s = document.createElement("script");
  s.id = id; s.innerHTML = code;
  document.head.appendChild(s);
  injectedScripts.add(id);
};

export const TrackingProvider = ({ children }: { children: ReactNode }) => {
  const [pixels, setPixels] = useState<TrackingPixel[]>([]);
  const [loaded, setLoaded] = useState(false);
  const location = useLocation();
  const initRef = useRef(false);

  useEffect(() => {
    supabase.from("tracking_pixels").select("*").eq("is_active", true)
      .then(({ data }) => { setPixels((data as TrackingPixel[]) || []); setLoaded(true); });
  }, []);

  const getPixel = useCallback((p: string) => pixels.find(x => x.platform === p && x.pixel_id), [pixels]);

  // Init scripts
  useEffect(() => {
    if (!loaded || initRef.current) return;
    initRef.current = true;

    const meta = getPixel("meta_pixel");
    if (meta) {
      injectInline("fb-pixel-init", `
        !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
        n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
        (window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
        fbq('init','${meta.pixel_id}');
      `);
    }

    const ga = getPixel("google_analytics");
    if (ga) {
      injectScript("ga4-script", `https://www.googletagmanager.com/gtag/js?id=${ga.pixel_id}`);
      injectInline("ga4-init", `
        window.dataLayer=window.dataLayer||[];
        function gtag(){dataLayer.push(arguments);}
        gtag('js',new Date());
        gtag('config','${ga.pixel_id}',{send_page_view:false});
      `);
    }

    const gads = getPixel("google_ads");
    if (gads) {
      if (!ga) {
        injectScript("gads-script", `https://www.googletagmanager.com/gtag/js?id=${gads.pixel_id}`);
        injectInline("gads-init", `
          window.dataLayer=window.dataLayer||[];
          function gtag(){dataLayer.push(arguments);}
          gtag('js',new Date());
          gtag('config','${gads.pixel_id}');
        `);
      } else {
        injectInline("gads-config", `gtag('config','${gads.pixel_id}');`);
      }
    }
  }, [loaded, getPixel]);

  // Page views on route change
  useEffect(() => {
    if (!loaded) return;
    if (getPixel("meta_pixel") && window.fbq) window.fbq("track", "PageView");
    if (getPixel("google_analytics") && window.gtag) {
      window.gtag("event", "page_view", { page_path: location.pathname, page_title: document.title });
    }
  }, [location.pathname, loaded, getPixel]);

  const trackAddToCart = useCallback((product: ProductData) => {
    if (getPixel("meta_pixel") && window.fbq) {
      window.fbq("track", "AddToCart", { content_ids: [product.id], content_name: product.title, content_type: "product", value: product.price, currency: product.currency || "BDT" });
    }
    if (window.gtag) {
      window.gtag("event", "add_to_cart", { currency: product.currency || "BDT", value: product.price, items: [{ item_id: product.id, item_name: product.title, item_category: product.category || "", price: product.price, quantity: product.quantity || 1 }] });
    }
  }, [getPixel]);

  const trackInitiateCheckout = useCallback((value: number, items: ProductData[]) => {
    if (getPixel("meta_pixel") && window.fbq) {
      window.fbq("track", "InitiateCheckout", { content_ids: items.map(i => i.id), num_items: items.length, value, currency: "BDT" });
    }
    if (window.gtag) {
      window.gtag("event", "begin_checkout", { currency: "BDT", value, items: items.map(i => ({ item_id: i.id, item_name: i.title, price: i.price, quantity: i.quantity || 1 })) });
    }
  }, [getPixel]);

  const trackPurchase = useCallback((orderId: string, value: number, items: ProductData[]) => {
    if (getPixel("meta_pixel") && window.fbq) {
      window.fbq("track", "Purchase", { content_ids: items.map(i => i.id), content_type: "product", num_items: items.length, value, currency: "BDT" });
    }
    if (window.gtag) {
      window.gtag("event", "purchase", { transaction_id: orderId, value, currency: "BDT", items: items.map(i => ({ item_id: i.id, item_name: i.title, price: i.price, quantity: i.quantity || 1 })) });
      const gads = getPixel("google_ads");
      if (gads?.config?.conversion_label) {
        window.gtag("event", "conversion", { send_to: `${gads.pixel_id}/${gads.config.conversion_label}`, value, currency: "BDT", transaction_id: orderId });
      }
    }
  }, [getPixel]);

  const trackViewContent = useCallback((product: ProductData) => {
    if (getPixel("meta_pixel") && window.fbq) {
      window.fbq("track", "ViewContent", { content_ids: [product.id], content_name: product.title, content_type: "product", value: product.price, currency: product.currency || "BDT" });
    }
    if (window.gtag) {
      window.gtag("event", "view_item", { currency: product.currency || "BDT", value: product.price, items: [{ item_id: product.id, item_name: product.title, item_category: product.category || "", price: product.price }] });
    }
  }, [getPixel]);

  const trackSearch = useCallback((query: string) => {
    if (getPixel("meta_pixel") && window.fbq) window.fbq("track", "Search", { search_string: query });
    if (window.gtag) window.gtag("event", "search", { search_term: query });
  }, [getPixel]);

  return (
    <TrackingContext.Provider value={{ trackAddToCart, trackInitiateCheckout, trackPurchase, trackViewContent, trackSearch }}>
      {children}
    </TrackingContext.Provider>
  );
};

export const useTracking = () => useContext(TrackingContext);
