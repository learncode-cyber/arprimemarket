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
  trackCompleteRegistration: () => void;
}

const TrackingContext = createContext<TrackingContextType>({
  trackAddToCart: () => {},
  trackInitiateCheckout: () => {},
  trackPurchase: () => {},
  trackViewContent: () => {},
  trackSearch: () => {},
  trackCompleteRegistration: () => {},
});

declare global {
  interface Window {
    fbq: any;
    _fbq: any;
    gtag: any;
    dataLayer: any[];
    ttq: any;
    snaptr: any;
    pintrk: any;
  }
}

const injectedScripts = new Set<string>();

const sanitizePixelId = (id: string): string => {
  return id.replace(/[^a-zA-Z0-9_\-.:]/g, "");
};

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
  s.id = id; s.textContent = code;
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
      .then(({ data }) => {
        const validPixels = ((data as TrackingPixel[]) || []).filter(p => p.pixel_id && p.pixel_id !== "placeholder");
        setPixels(validPixels);
        setLoaded(true);
      });
  }, []);

  const getPixel = useCallback((p: string) => pixels.find(x => x.platform === p && x.pixel_id), [pixels]);

  // Init scripts
  useEffect(() => {
    if (!loaded || initRef.current) return;
    initRef.current = true;

    // ── Meta Pixel ──
    const meta = getPixel("meta_pixel");
    if (meta) {
      injectInline("fb-pixel-init", `
        !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
        n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
        (window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
        fbq('init','${sanitizePixelId(meta.pixel_id)}');
      `);
    }

    // ── Google Analytics 4 ──
    const ga = getPixel("google_analytics");
    if (ga) {
      injectScript("ga4-script", `https://www.googletagmanager.com/gtag/js?id=${sanitizePixelId(ga.pixel_id)}`);
      injectInline("ga4-init", `
        window.dataLayer=window.dataLayer||[];
        function gtag(){dataLayer.push(arguments);}
        gtag('js',new Date());
        gtag('config','${sanitizePixelId(ga.pixel_id)}',{send_page_view:false});
      `);
    }

    // ── Google Ads ──
    const gads = getPixel("google_ads");
    if (gads) {
      if (!ga) {
        injectScript("gads-script", `https://www.googletagmanager.com/gtag/js?id=${sanitizePixelId(gads.pixel_id)}`);
        injectInline("gads-init", `
          window.dataLayer=window.dataLayer||[];
          function gtag(){dataLayer.push(arguments);}
          gtag('js',new Date());
          gtag('config','${sanitizePixelId(gads.pixel_id)}');
        `);
      } else {
        injectInline("gads-config", `gtag('config','${sanitizePixelId(gads.pixel_id)}');`);
      }
    }

    // ── TikTok Pixel ──
    const tiktok = getPixel("tiktok_pixel");
    if (tiktok) {
      injectInline("tiktok-pixel-init", `
        !function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var i=d.createElement("script");i.type="text/javascript",i.async=!0,i.src=r+"?sdkid="+e+"&lib="+t;var a=d.getElementsByTagName("script")[0];a.parentNode.insertBefore(i,a)};
        ttq.load('${sanitizePixelId(tiktok.pixel_id)}');
        ttq.page();
        }(window,document,'ttq');
      `);
    }

    // ── Snapchat Pixel ──
    const snap = getPixel("snapchat_pixel");
    if (snap) {
      injectInline("snap-pixel-init", `
        (function(e,t,n){if(e.snaptr)return;var a=e.snaptr=function(){a.handleRequest?a.handleRequest.apply(a,arguments):a.queue.push(arguments)};a.queue=[];var s='script';var r=t.createElement(s);r.async=!0;r.src=n;var u=t.getElementsByTagName(s)[0];u.parentNode.insertBefore(r,u)})(window,document,'https://sc-static.net/scevent.min.js');
        snaptr('init','${sanitizePixelId(snap.pixel_id)}');
        snaptr('track','PAGE_VIEW');
      `);
    }

    // ── Pinterest Tag ──
    const pin = getPixel("pinterest_tag");
    if (pin) {
      injectInline("pinterest-tag-init", `
        !function(e){if(!window.pintrk){window.pintrk=function(){window.pintrk.queue.push(Array.prototype.slice.call(arguments))};var n=window.pintrk;n.queue=[],n.version="3.0";var t=document.createElement("script");t.async=!0,t.src=e;var r=document.getElementsByTagName("script")[0];r.parentNode.insertBefore(t,r)}}("https://s.pinimg.com/ct/core.js");
        pintrk('load','${sanitizePixelId(pin.pixel_id)}');
        pintrk('page');
      `);
    }
  }, [loaded, getPixel]);

  // Page views on route change
  useEffect(() => {
    if (!loaded) return;
    if (getPixel("meta_pixel") && window.fbq) window.fbq("track", "PageView");
    if (getPixel("google_analytics") && window.gtag) {
      window.gtag("event", "page_view", { page_path: location.pathname, page_title: document.title });
    }
    if (getPixel("tiktok_pixel") && window.ttq) window.ttq.page();
    if (getPixel("snapchat_pixel") && window.snaptr) window.snaptr("track", "PAGE_VIEW");
    if (getPixel("pinterest_tag") && window.pintrk) window.pintrk("page");
  }, [location.pathname, loaded, getPixel]);

  const trackAddToCart = useCallback((product: ProductData) => {
    const currency = product.currency || "BDT";
    // Meta
    if (getPixel("meta_pixel") && window.fbq) {
      window.fbq("track", "AddToCart", { content_ids: [product.id], content_name: product.title, content_type: "product", value: product.price, currency });
    }
    // Google
    if (window.gtag) {
      window.gtag("event", "add_to_cart", { currency, value: product.price, items: [{ item_id: product.id, item_name: product.title, item_category: product.category || "", price: product.price, quantity: product.quantity || 1 }] });
      const gads = getPixel("google_ads");
      if (gads?.config?.add_to_cart_label) {
        window.gtag("event", "conversion", { send_to: `${sanitizePixelId(gads.pixel_id)}/${sanitizePixelId(String(gads.config.add_to_cart_label))}`, value: product.price, currency });
      }
    }
    // TikTok
    if (getPixel("tiktok_pixel") && window.ttq) {
      window.ttq.track("AddToCart", { content_id: product.id, content_name: product.title, content_type: "product", value: product.price, currency, quantity: product.quantity || 1 });
    }
    // Snapchat
    if (getPixel("snapchat_pixel") && window.snaptr) {
      window.snaptr("track", "ADD_CART", { item_ids: [product.id], price: product.price, currency });
    }
    // Pinterest
    if (getPixel("pinterest_tag") && window.pintrk) {
      window.pintrk("track", "addtocart", { product_id: product.id, product_name: product.title, value: product.price, currency, order_quantity: product.quantity || 1 });
    }
  }, [getPixel]);

  const trackInitiateCheckout = useCallback((value: number, items: ProductData[]) => {
    // Meta
    if (getPixel("meta_pixel") && window.fbq) {
      window.fbq("track", "InitiateCheckout", { content_ids: items.map(i => i.id), num_items: items.length, value, currency: "BDT" });
    }
    // Google
    if (window.gtag) {
      window.gtag("event", "begin_checkout", { currency: "BDT", value, items: items.map(i => ({ item_id: i.id, item_name: i.title, price: i.price, quantity: i.quantity || 1 })) });
      const gads = getPixel("google_ads");
      if (gads?.config?.checkout_label) {
        window.gtag("event", "conversion", { send_to: `${sanitizePixelId(gads.pixel_id)}/${sanitizePixelId(String(gads.config.checkout_label))}`, value, currency: "BDT" });
      }
    }
    // TikTok
    if (getPixel("tiktok_pixel") && window.ttq) {
      window.ttq.track("InitiateCheckout", { content_ids: items.map(i => i.id), value, currency: "BDT", quantity: items.length });
    }
    // Snapchat
    if (getPixel("snapchat_pixel") && window.snaptr) {
      window.snaptr("track", "START_CHECKOUT", { item_ids: items.map(i => i.id), price: value, currency: "BDT" });
    }
    // Pinterest
    if (getPixel("pinterest_tag") && window.pintrk) {
      window.pintrk("track", "checkout", { value, currency: "BDT", order_quantity: items.length });
    }
  }, [getPixel]);

  const trackPurchase = useCallback((orderId: string, value: number, items: ProductData[]) => {
    // Meta
    if (getPixel("meta_pixel") && window.fbq) {
      window.fbq("track", "Purchase", { content_ids: items.map(i => i.id), content_type: "product", num_items: items.length, value, currency: "BDT" });
    }
    // Google
    if (window.gtag) {
      window.gtag("event", "purchase", { transaction_id: orderId, value, currency: "BDT", items: items.map(i => ({ item_id: i.id, item_name: i.title, price: i.price, quantity: i.quantity || 1 })) });
      const gads = getPixel("google_ads");
      if (gads?.config?.conversion_label) {
        window.gtag("event", "conversion", { send_to: `${sanitizePixelId(gads.pixel_id)}/${sanitizePixelId(String(gads.config.conversion_label))}`, value, currency: "BDT", transaction_id: orderId });
      }
    }
    // TikTok
    if (getPixel("tiktok_pixel") && window.ttq) {
      window.ttq.track("CompletePayment", { content_ids: items.map(i => i.id), content_type: "product", value, currency: "BDT", quantity: items.length });
    }
    // Snapchat
    if (getPixel("snapchat_pixel") && window.snaptr) {
      window.snaptr("track", "PURCHASE", { item_ids: items.map(i => i.id), price: value, currency: "BDT", transaction_id: orderId });
    }
    // Pinterest
    if (getPixel("pinterest_tag") && window.pintrk) {
      window.pintrk("track", "checkout", { value, currency: "BDT", order_quantity: items.length, order_id: orderId });
    }
  }, [getPixel]);

  const trackViewContent = useCallback((product: ProductData) => {
    const currency = product.currency || "BDT";
    if (getPixel("meta_pixel") && window.fbq) {
      window.fbq("track", "ViewContent", { content_ids: [product.id], content_name: product.title, content_type: "product", value: product.price, currency });
    }
    if (window.gtag) {
      window.gtag("event", "view_item", { currency, value: product.price, items: [{ item_id: product.id, item_name: product.title, item_category: product.category || "", price: product.price }] });
    }
    if (getPixel("tiktok_pixel") && window.ttq) {
      window.ttq.track("ViewContent", { content_id: product.id, content_name: product.title, content_type: "product", value: product.price, currency });
    }
    if (getPixel("snapchat_pixel") && window.snaptr) {
      window.snaptr("track", "VIEW_CONTENT", { item_ids: [product.id], price: product.price, currency });
    }
    if (getPixel("pinterest_tag") && window.pintrk) {
      window.pintrk("track", "pagevisit", { product_id: product.id, product_name: product.title });
    }
  }, [getPixel]);

  const trackSearch = useCallback((query: string) => {
    if (getPixel("meta_pixel") && window.fbq) window.fbq("track", "Search", { search_string: query });
    if (window.gtag) window.gtag("event", "search", { search_term: query });
    if (getPixel("tiktok_pixel") && window.ttq) window.ttq.track("Search", { query });
    if (getPixel("snapchat_pixel") && window.snaptr) window.snaptr("track", "SEARCH", { search_string: query });
    if (getPixel("pinterest_tag") && window.pintrk) window.pintrk("track", "search", { search_query: query });
  }, [getPixel]);

  const trackCompleteRegistration = useCallback(() => {
    if (getPixel("meta_pixel") && window.fbq) window.fbq("track", "CompleteRegistration");
    if (window.gtag) window.gtag("event", "sign_up");
    if (getPixel("tiktok_pixel") && window.ttq) window.ttq.track("CompleteRegistration");
    if (getPixel("snapchat_pixel") && window.snaptr) window.snaptr("track", "SIGN_UP");
    if (getPixel("pinterest_tag") && window.pintrk) window.pintrk("track", "signup");
  }, [getPixel]);

  return (
    <TrackingContext.Provider value={{ trackAddToCart, trackInitiateCheckout, trackPurchase, trackViewContent, trackSearch, trackCompleteRegistration }}>
      {children}
    </TrackingContext.Provider>
  );
};

export const useTracking = () => useContext(TrackingContext);
