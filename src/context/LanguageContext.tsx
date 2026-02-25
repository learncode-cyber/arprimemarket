import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type LangCode = "en" | "bn" | "ar" | "hi" | "es" | "fr" | "de" | "zh" | "ja" | "pt";

export interface LangConfig {
  code: LangCode;
  name: string;
  nativeName: string;
  dir: "ltr" | "rtl";
}

export const languages: LangConfig[] = [
  { code: "ar", name: "Arabic", nativeName: "العربية", dir: "rtl" },
  { code: "en", name: "English", nativeName: "English", dir: "ltr" },
  { code: "bn", name: "Bangla", nativeName: "বাংলা", dir: "ltr" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", dir: "ltr" },
  { code: "es", name: "Spanish", nativeName: "Español", dir: "ltr" },
  { code: "fr", name: "French", nativeName: "Français", dir: "ltr" },
  { code: "de", name: "German", nativeName: "Deutsch", dir: "ltr" },
  { code: "zh", name: "Chinese", nativeName: "中文", dir: "ltr" },
  { code: "ja", name: "Japanese", nativeName: "日本語", dir: "ltr" },
  { code: "pt", name: "Portuguese", nativeName: "Português", dir: "ltr" },
];

type TranslationKey =
  | "home" | "products" | "cart" | "login" | "search" | "addToCart" | "viewCart"
  | "shopNow" | "viewAll" | "featured" | "bestSelling" | "newArrivals" | "trending"
  | "shopByCategory" | "findWhatYouNeed" | "megaSale" | "megaSaleDesc" | "shopTheSale"
  | "secureCheckout" | "freeShipping" | "easyReturns" | "support247"
  | "sslEncrypted" | "ordersOver999" | "returnPolicy30" | "hereToHelp"
  | "customerReviews" | "realReviews" | "orderSummary" | "subtotal" | "shipping" | "free" | "total" | "checkout"
  | "emptyCart" | "continueShopping" | "itemsInCart" | "backToProducts"
  | "searchProducts" | "noProductsFound" | "browseCollection"
  | "getExclusiveDeals" | "subscribeDesc" | "enterEmail" | "subscribe" | "subscribed"
  | "about" | "supportNav" | "policies" | "ourStory" | "careers" | "press" | "blog"
  | "helpCenter" | "returnsRefunds" | "shippingInfo" | "trackOrder" | "contactUs"
  | "privacyPolicy" | "termsOfService" | "cookiePolicy" | "disclaimer"
  | "weAccept" | "allRightsReserved" | "brandDesc"
  | "newSeasonCollection" | "upTo40Off" | "heroDesc1" | "premiumElectronics" | "latestGadgets" | "heroDesc2"
  | "homeLiving" | "transformSpace" | "heroDesc3" | "exploreElectronics" | "shopHome"
  | "dashboard" | "signOut" | "adminPanel" | "rating";

const translations: Record<LangCode, Record<TranslationKey, string>> = {
  en: {
    home: "Home", products: "Products", cart: "Cart", login: "Login",
    search: "Search", addToCart: "Add to Cart", viewCart: "View Cart",
    shopNow: "Shop Now", viewAll: "View All", featured: "Featured Products",
    bestSelling: "Best Selling", newArrivals: "New Arrivals", trending: "Trending Now",
    shopByCategory: "Shop by Category", findWhatYouNeed: "Find what you need",
    megaSale: "Mega Sale — Up to 40% Off",
    megaSaleDesc: "Limited time offer on premium electronics, fashion & accessories.",
    shopTheSale: "Shop the Sale",
    secureCheckout: "Secure Checkout", freeShipping: "Free Shipping",
    easyReturns: "Easy Returns", support247: "24/7 Support",
    sslEncrypted: "SSL encrypted payments", ordersOver999: "On orders over ৳999",
    returnPolicy30: "30-day return policy", hereToHelp: "We're here to help",
    customerReviews: "What Our Customers Say", realReviews: "Real reviews from real customers",
    orderSummary: "Order Summary", subtotal: "Subtotal", shipping: "Shipping", free: "Free",
    total: "Total", checkout: "Checkout", emptyCart: "Your cart is empty",
    continueShopping: "Continue Shopping", itemsInCart: "items in your cart",
    backToProducts: "Back to Products", searchProducts: "Search products...",
    noProductsFound: "No products found", browseCollection: "Browse our curated collection",
    getExclusiveDeals: "Get Exclusive Deals", subscribeDesc: "Subscribe for early access & special offers.",
    enterEmail: "Enter your email", subscribe: "Subscribe", subscribed: "Subscribed ✓",
    about: "About", supportNav: "Support", policies: "Policies",
    ourStory: "Our Story", careers: "Careers", press: "Press", blog: "Blog",
    helpCenter: "Help Center", returnsRefunds: "Returns & Refunds", shippingInfo: "Shipping Info",
    trackOrder: "Track Order", contactUs: "Contact Us",
    privacyPolicy: "Privacy Policy", termsOfService: "Terms of Service",
    cookiePolicy: "Cookie Policy", disclaimer: "Disclaimer",
    weAccept: "We accept:", allRightsReserved: "© 2026 AR Prime Market. All rights reserved.",
    brandDesc: "Premium products curated for the modern lifestyle. Quality, style, and value — delivered to your doorstep.",
    newSeasonCollection: "New Season Collection", upTo40Off: "Up to 40% Off",
    heroDesc1: "Discover premium fashion, electronics & accessories curated just for you.",
    premiumElectronics: "Premium Electronics", latestGadgets: "Latest Gadgets",
    heroDesc2: "Top-rated headphones, smart watches & accessories at the best prices.",
    homeLiving: "Home & Living", transformSpace: "Transform Your Space",
    heroDesc3: "Beautiful home décor, candles, and organizers to elevate your lifestyle.",
    exploreElectronics: "Explore Electronics", shopHome: "Shop Home",
    dashboard: "Dashboard", signOut: "Sign Out", adminPanel: "Admin Panel", rating: "rating",
  },
  bn: {
    home: "হোম", products: "পণ্য", cart: "কার্ট", login: "লগইন",
    search: "সার্চ", addToCart: "কার্টে যোগ করুন", viewCart: "কার্ট দেখুন",
    shopNow: "কিনুন", viewAll: "সব দেখুন", featured: "বিশেষ পণ্য",
    bestSelling: "সর্বাধিক বিক্রিত", newArrivals: "নতুন আগমন", trending: "ট্রেন্ডিং",
    shopByCategory: "ক্যাটাগরি অনুযায়ী কিনুন", findWhatYouNeed: "আপনার প্রয়োজনীয় পণ্য খুঁজুন",
    megaSale: "মেগা সেল — ৪০% পর্যন্ত ছাড়",
    megaSaleDesc: "প্রিমিয়াম ইলেকট্রনিক্স, ফ্যাশন ও এক্সেসরিজে সীমিত সময়ের অফার।",
    shopTheSale: "সেল দেখুন",
    secureCheckout: "নিরাপদ চেকআউট", freeShipping: "ফ্রি শিপিং",
    easyReturns: "সহজ রিটার্ন", support247: "২৪/৭ সাপোর্ট",
    sslEncrypted: "SSL এনক্রিপ্টেড পেমেন্ট", ordersOver999: "৳৯৯৯+ অর্ডারে",
    returnPolicy30: "৩০ দিনের রিটার্ন পলিসি", hereToHelp: "আমরা সাহায্যে আছি",
    customerReviews: "গ্রাহকদের মতামত", realReviews: "আসল গ্রাহকদের আসল রিভিউ",
    orderSummary: "অর্ডার সারাংশ", subtotal: "সাবটোটাল", shipping: "শিপিং", free: "ফ্রি",
    total: "মোট", checkout: "চেকআউট", emptyCart: "আপনার কার্ট খালি",
    continueShopping: "শপিং চালিয়ে যান", itemsInCart: "টি পণ্য কার্টে আছে",
    backToProducts: "পণ্যে ফিরে যান", searchProducts: "পণ্য খুঁজুন...",
    noProductsFound: "কোনো পণ্য পাওয়া যায়নি", browseCollection: "আমাদের কালেকশন দেখুন",
    getExclusiveDeals: "এক্সক্লুসিভ ডিল পান", subscribeDesc: "বিশেষ অফার ও আপডেটের জন্য সাবস্ক্রাইব করুন।",
    enterEmail: "আপনার ইমেইল দিন", subscribe: "সাবস্ক্রাইব", subscribed: "সাবস্ক্রাইব হয়েছে ✓",
    about: "আমাদের সম্পর্কে", supportNav: "সাপোর্ট", policies: "নীতিমালা",
    ourStory: "আমাদের গল্প", careers: "ক্যারিয়ার", press: "প্রেস", blog: "ব্লগ",
    helpCenter: "হেল্প সেন্টার", returnsRefunds: "রিটার্ন ও রিফান্ড", shippingInfo: "শিপিং তথ্য",
    trackOrder: "অর্ডার ট্র্যাক", contactUs: "যোগাযোগ করুন",
    privacyPolicy: "গোপনীয়তা নীতি", termsOfService: "সেবার শর্তাবলী",
    cookiePolicy: "কুকি নীতি", disclaimer: "দাবিত্যাগ",
    weAccept: "আমরা গ্রহণ করি:", allRightsReserved: "© ২০২৬ AR Prime Market. সর্বস্বত্ব সংরক্ষিত।",
    brandDesc: "আধুনিক জীবনধারার জন্য প্রিমিয়াম পণ্য। গুণমান, স্টাইল ও মূল্য — আপনার দরজায়।",
    newSeasonCollection: "নতুন সিজন কালেকশন", upTo40Off: "৪০% পর্যন্ত ছাড়",
    heroDesc1: "আপনার জন্য বিশেষভাবে বাছাই করা প্রিমিয়াম ফ্যাশন, ইলেকট্রনিক্স ও এক্সেসরিজ।",
    premiumElectronics: "প্রিমিয়াম ইলেকট্রনিক্স", latestGadgets: "সর্বশেষ গ্যাজেট",
    heroDesc2: "সেরা দামে টপ-রেটেড হেডফোন, স্মার্ট ওয়াচ ও এক্সেসরিজ।",
    homeLiving: "হোম ও লিভিং", transformSpace: "আপনার স্থান সাজান",
    heroDesc3: "আপনার জীবনধারা উন্নত করতে সুন্দর হোম ডেকর, ক্যান্ডেল ও অর্গানাইজার।",
    exploreElectronics: "ইলেকট্রনিক্স দেখুন", shopHome: "হোম শপ করুন",
    dashboard: "ড্যাশবোর্ড", signOut: "সাইন আউট", adminPanel: "অ্যাডমিন প্যানেল", rating: "রেটিং",
  },
  ar: {
    home: "الرئيسية", products: "المنتجات", cart: "السلة", login: "تسجيل الدخول",
    search: "بحث", addToCart: "أضف للسلة", viewCart: "عرض السلة",
    shopNow: "تسوق الآن", viewAll: "عرض الكل", featured: "منتجات مميزة",
    bestSelling: "الأكثر مبيعاً", newArrivals: "وصل حديثاً", trending: "الأكثر رواجاً",
    shopByCategory: "تسوق حسب الفئة", findWhatYouNeed: "اعثر على ما تحتاجه",
    megaSale: "تخفيضات كبرى — خصم يصل إلى ٤٠٪",
    megaSaleDesc: "عرض لفترة محدودة على الإلكترونيات والأزياء والإكسسوارات.",
    shopTheSale: "تسوق العروض",
    secureCheckout: "دفع آمن", freeShipping: "شحن مجاني",
    easyReturns: "إرجاع سهل", support247: "دعم ٢٤/٧",
    sslEncrypted: "مدفوعات مشفرة SSL", ordersOver999: "للطلبات فوق ৳٩٩٩",
    returnPolicy30: "سياسة إرجاع ٣٠ يوماً", hereToHelp: "نحن هنا لمساعدتك",
    customerReviews: "آراء عملائنا", realReviews: "تقييمات حقيقية من عملاء حقيقيين",
    orderSummary: "ملخص الطلب", subtotal: "المجموع الفرعي", shipping: "الشحن", free: "مجاني",
    total: "الإجمالي", checkout: "إتمام الشراء", emptyCart: "سلتك فارغة",
    continueShopping: "متابعة التسوق", itemsInCart: "منتجات في سلتك",
    backToProducts: "العودة للمنتجات", searchProducts: "ابحث عن المنتجات...",
    noProductsFound: "لا توجد منتجات", browseCollection: "تصفح مجموعتنا المختارة",
    getExclusiveDeals: "احصل على عروض حصرية", subscribeDesc: "اشترك للحصول على عروض مبكرة وخاصة.",
    enterEmail: "أدخل بريدك الإلكتروني", subscribe: "اشترك", subscribed: "تم الاشتراك ✓",
    about: "عنّا", supportNav: "الدعم", policies: "السياسات",
    ourStory: "قصتنا", careers: "الوظائف", press: "الإعلام", blog: "المدونة",
    helpCenter: "مركز المساعدة", returnsRefunds: "الإرجاع والاسترداد", shippingInfo: "معلومات الشحن",
    trackOrder: "تتبع الطلب", contactUs: "اتصل بنا",
    privacyPolicy: "سياسة الخصوصية", termsOfService: "شروط الخدمة",
    cookiePolicy: "سياسة ملفات تعريف الارتباط", disclaimer: "إخلاء المسؤولية",
    weAccept: "نقبل:", allRightsReserved: "© ٢٠٢٦ AR Prime Market. جميع الحقوق محفوظة.",
    brandDesc: "منتجات فاخرة مختارة لأسلوب الحياة العصري. الجودة والأناقة والقيمة — إلى باب منزلك.",
    newSeasonCollection: "مجموعة الموسم الجديد", upTo40Off: "خصم يصل إلى ٤٠٪",
    heroDesc1: "اكتشف أزياء وإلكترونيات وإكسسوارات فاخرة مختارة خصيصاً لك.",
    premiumElectronics: "إلكترونيات فاخرة", latestGadgets: "أحدث الأجهزة",
    heroDesc2: "سماعات وساعات ذكية وإكسسوارات بأفضل الأسعار.",
    homeLiving: "المنزل والمعيشة", transformSpace: "حوّل مساحتك",
    heroDesc3: "ديكور منزلي جميل وشموع ومنظمات لتحسين نمط حياتك.",
    exploreElectronics: "استكشف الإلكترونيات", shopHome: "تسوق المنزل",
    dashboard: "لوحة التحكم", signOut: "تسجيل الخروج", adminPanel: "لوحة الإدارة", rating: "تقييم",
  },
  // Fallback languages — use English translations as base
  hi: {} as any,
  es: {} as any,
  fr: {} as any,
  de: {} as any,
  zh: {} as any,
  ja: {} as any,
  pt: {} as any,
};

// Fill missing languages with English fallback
const enKeys = Object.keys(translations.en) as TranslationKey[];
(["hi", "es", "fr", "de", "zh", "ja", "pt"] as LangCode[]).forEach(code => {
  const partial: Record<string, string> = {};
  enKeys.forEach(k => { partial[k] = translations.en[k]; });
  translations[code] = partial as Record<TranslationKey, string>;
});

// Add key translations for popular languages
Object.assign(translations.hi, {
  home: "होम", products: "उत्पाद", cart: "कार्ट", login: "लॉगिन",
  shopNow: "अभी खरीदें", addToCart: "कार्ट में जोड़ें", checkout: "चेकआउट",
  featured: "विशेष उत्पाद", search: "खोजें", continueShopping: "खरीदारी जारी रखें",
});
Object.assign(translations.es, {
  home: "Inicio", products: "Productos", cart: "Carrito", login: "Iniciar sesión",
  shopNow: "Comprar ahora", addToCart: "Añadir al carrito", checkout: "Finalizar compra",
  featured: "Productos destacados", search: "Buscar", continueShopping: "Seguir comprando",
});
Object.assign(translations.fr, {
  home: "Accueil", products: "Produits", cart: "Panier", login: "Connexion",
  shopNow: "Acheter maintenant", addToCart: "Ajouter au panier", checkout: "Commander",
  featured: "Produits vedettes", search: "Rechercher", continueShopping: "Continuer vos achats",
});
Object.assign(translations.de, {
  home: "Startseite", products: "Produkte", cart: "Warenkorb", login: "Anmelden",
  shopNow: "Jetzt kaufen", addToCart: "In den Warenkorb", checkout: "Zur Kasse",
  featured: "Empfohlene Produkte", search: "Suchen", continueShopping: "Weiter einkaufen",
});
Object.assign(translations.zh, {
  home: "首页", products: "产品", cart: "购物车", login: "登录",
  shopNow: "立即购买", addToCart: "加入购物车", checkout: "结账",
  featured: "精选产品", search: "搜索", continueShopping: "继续购物",
});
Object.assign(translations.ja, {
  home: "ホーム", products: "製品", cart: "カート", login: "ログイン",
  shopNow: "今すぐ購入", addToCart: "カートに追加", checkout: "チェックアウト",
  featured: "注目の製品", search: "検索", continueShopping: "買い物を続ける",
});
Object.assign(translations.pt, {
  home: "Início", products: "Produtos", cart: "Carrinho", login: "Entrar",
  shopNow: "Comprar agora", addToCart: "Adicionar ao carrinho", checkout: "Finalizar",
  featured: "Produtos em destaque", search: "Pesquisar", continueShopping: "Continuar comprando",
});

interface LanguageContextType {
  lang: LangConfig;
  setLang: (code: LangCode) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = "ar-pm-lang";

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<LangConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as LangCode | null;
    if (saved) {
      const found = languages.find(l => l.code === saved);
      if (found) return found;
    }
    return languages[0];
  });

  const setLang = useCallback((code: LangCode) => {
    const found = languages.find(l => l.code === code);
    if (found) {
      setLangState(found);
      localStorage.setItem(STORAGE_KEY, code);
      document.documentElement.dir = found.dir;
      document.documentElement.lang = code;
    }
  }, []);

  useState(() => {
    document.documentElement.dir = lang.dir;
    document.documentElement.lang = lang.code;
  });

  const t = useCallback((key: TranslationKey): string => {
    return translations[lang.code]?.[key] || translations.en[key] || key;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
};
