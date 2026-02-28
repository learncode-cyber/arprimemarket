import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from "react";

export type LangCode = "en" | "bn" | "ar" | "sa" | "hi" | "es" | "fr" | "de" | "zh" | "ja" | "pt" | "ko" | "ru" | "tr" | "th" | "vi" | "id" | "ms" | "sw" | "tl" | "ur" | "fa" | "it" | "nl" | "pl" | "uk" | "ro" | "sv" | "da" | "no" | "fi" | "el" | "hu" | "cs" | "he";

export interface LangConfig {
  code: LangCode;
  name: string;
  nativeName: string;
  dir: "ltr" | "rtl";
}

export const languages: LangConfig[] = [
  { code: "en", name: "English", nativeName: "English", dir: "ltr" },
  { code: "bn", name: "Bangla", nativeName: "বাংলা", dir: "ltr" },
  { code: "ar", name: "Arabic (UAE)", nativeName: "العربية (الإمارات)", dir: "rtl" },
  { code: "sa", name: "Arabic (Saudi)", nativeName: "العربية (السعودية)", dir: "rtl" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", dir: "ltr" },
  { code: "ur", name: "Urdu", nativeName: "اردو", dir: "rtl" },
  { code: "es", name: "Spanish", nativeName: "Español", dir: "ltr" },
  { code: "fr", name: "French", nativeName: "Français", dir: "ltr" },
  { code: "de", name: "German", nativeName: "Deutsch", dir: "ltr" },
  { code: "it", name: "Italian", nativeName: "Italiano", dir: "ltr" },
  { code: "nl", name: "Dutch", nativeName: "Nederlands", dir: "ltr" },
  { code: "pt", name: "Portuguese", nativeName: "Português", dir: "ltr" },
  { code: "ru", name: "Russian", nativeName: "Русский", dir: "ltr" },
  { code: "uk", name: "Ukrainian", nativeName: "Українська", dir: "ltr" },
  { code: "pl", name: "Polish", nativeName: "Polski", dir: "ltr" },
  { code: "ro", name: "Romanian", nativeName: "Română", dir: "ltr" },
  { code: "hu", name: "Hungarian", nativeName: "Magyar", dir: "ltr" },
  { code: "cs", name: "Czech", nativeName: "Čeština", dir: "ltr" },
  { code: "sv", name: "Swedish", nativeName: "Svenska", dir: "ltr" },
  { code: "da", name: "Danish", nativeName: "Dansk", dir: "ltr" },
  { code: "no", name: "Norwegian", nativeName: "Norsk", dir: "ltr" },
  { code: "fi", name: "Finnish", nativeName: "Suomi", dir: "ltr" },
  { code: "el", name: "Greek", nativeName: "Ελληνικά", dir: "ltr" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe", dir: "ltr" },
  { code: "he", name: "Hebrew", nativeName: "עברית", dir: "rtl" },
  { code: "fa", name: "Persian", nativeName: "فارسی", dir: "rtl" },
  { code: "zh", name: "Chinese", nativeName: "中文", dir: "ltr" },
  { code: "ja", name: "Japanese", nativeName: "日本語", dir: "ltr" },
  { code: "ko", name: "Korean", nativeName: "한국어", dir: "ltr" },
  { code: "th", name: "Thai", nativeName: "ไทย", dir: "ltr" },
  { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt", dir: "ltr" },
  { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia", dir: "ltr" },
  { code: "ms", name: "Malay", nativeName: "Bahasa Melayu", dir: "ltr" },
  { code: "tl", name: "Filipino", nativeName: "Filipino", dir: "ltr" },
  { code: "sw", name: "Swahili", nativeName: "Kiswahili", dir: "ltr" },
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
  sa: {} as any, hi: {} as any, es: {} as any, fr: {} as any, de: {} as any,
  zh: {} as any, ja: {} as any, pt: {} as any, ko: {} as any, ru: {} as any,
  tr: {} as any, th: {} as any, vi: {} as any, id: {} as any, ms: {} as any,
  sw: {} as any, tl: {} as any, ur: {} as any, fa: {} as any, it: {} as any,
  nl: {} as any, pl: {} as any, uk: {} as any, ro: {} as any, sv: {} as any,
  da: {} as any, no: {} as any, fi: {} as any, el: {} as any, hu: {} as any,
  cs: {} as any, he: {} as any,
};

// Fill missing languages with English fallback
const enKeys = Object.keys(translations.en) as TranslationKey[];
const fallbackCodes: LangCode[] = ["sa", "hi", "es", "fr", "de", "zh", "ja", "pt", "ko", "ru", "tr", "th", "vi", "id", "ms", "sw", "tl", "ur", "fa", "it", "nl", "pl", "uk", "ro", "sv", "da", "no", "fi", "el", "hu", "cs", "he"];
fallbackCodes.forEach(code => {
  const partial: Record<string, string> = {};
  enKeys.forEach(k => { partial[k] = translations.en[k]; });
  translations[code] = partial as Record<TranslationKey, string>;
});

// Saudi Arabic uses same translations as UAE Arabic
Object.assign(translations.sa, translations.ar);

// Complete translations for all major languages
Object.assign(translations.hi, {
  home: "होम", products: "उत्पाद", cart: "कार्ट", login: "लॉगिन",
  search: "खोजें", addToCart: "कार्ट में जोड़ें", viewCart: "कार्ट देखें",
  shopNow: "अभी खरीदें", viewAll: "सब देखें", featured: "विशेष उत्पाद",
  bestSelling: "सबसे ज़्यादा बिकने वाले", newArrivals: "नए उत्पाद", trending: "ट्रेंडिंग",
  shopByCategory: "श्रेणी के अनुसार खरीदें", findWhatYouNeed: "जो चाहिए वो ढूंढें",
  megaSale: "मेगा सेल — 40% तक की छूट", megaSaleDesc: "इलेक्ट्रॉनिक्स, फैशन और एक्सेसरीज़ पर सीमित समय का ऑफर।",
  shopTheSale: "सेल देखें", secureCheckout: "सुरक्षित चेकआउट", freeShipping: "मुफ़्त शिपिंग",
  easyReturns: "आसान रिटर्न", support247: "24/7 सहायता", sslEncrypted: "SSL एन्क्रिप्टेड भुगतान",
  ordersOver999: "৳999+ ऑर्डर पर", returnPolicy30: "30 दिन की रिटर्न नीति", hereToHelp: "हम मदद के लिए हैं",
  customerReviews: "ग्राहकों की राय", realReviews: "असली ग्राहकों की असली समीक्षा",
  orderSummary: "ऑर्डर सारांश", subtotal: "उप-कुल", shipping: "शिपिंग", free: "मुफ़्त",
  total: "कुल", checkout: "चेकआउट", emptyCart: "आपका कार्ट खाली है",
  continueShopping: "खरीदारी जारी रखें", itemsInCart: "आइटम कार्ट में",
  backToProducts: "उत्पादों पर वापस", searchProducts: "उत्पाद खोजें...",
  noProductsFound: "कोई उत्पाद नहीं मिला", browseCollection: "हमारा संग्रह देखें",
  about: "हमारे बारे में", supportNav: "सहायता", policies: "नीतियां",
  ourStory: "हमारी कहानी", careers: "करियर", press: "प्रेस", blog: "ब्लॉग",
  helpCenter: "सहायता केंद्र", returnsRefunds: "रिटर्न और रिफंड", shippingInfo: "शिपिंग जानकारी",
  trackOrder: "ऑर्डर ट्रैक करें", contactUs: "संपर्क करें",
  privacyPolicy: "गोपनीयता नीति", termsOfService: "सेवा की शर्तें",
  cookiePolicy: "कुकी नीति", disclaimer: "अस्वीकरण",
  dashboard: "डैशबोर्ड", signOut: "साइन आउट", adminPanel: "एडमिन पैनल", rating: "रेटिंग",
});
Object.assign(translations.es, {
  home: "Inicio", products: "Productos", cart: "Carrito", login: "Iniciar sesión",
  search: "Buscar", addToCart: "Añadir al carrito", viewCart: "Ver carrito",
  shopNow: "Comprar ahora", viewAll: "Ver todo", featured: "Productos destacados",
  bestSelling: "Más vendidos", newArrivals: "Novedades", trending: "Tendencias",
  shopByCategory: "Comprar por categoría", findWhatYouNeed: "Encuentra lo que necesitas",
  megaSale: "Mega Oferta — Hasta 40% de descuento", megaSaleDesc: "Oferta limitada en electrónica, moda y accesorios premium.",
  shopTheSale: "Ver ofertas", secureCheckout: "Pago seguro", freeShipping: "Envío gratis",
  easyReturns: "Devoluciones fáciles", support247: "Soporte 24/7", sslEncrypted: "Pagos encriptados SSL",
  ordersOver999: "Pedidos superiores a ৳999", returnPolicy30: "Política de devolución de 30 días", hereToHelp: "Estamos para ayudarte",
  customerReviews: "Opiniones de clientes", realReviews: "Reseñas reales de clientes reales",
  orderSummary: "Resumen del pedido", subtotal: "Subtotal", shipping: "Envío", free: "Gratis",
  total: "Total", checkout: "Finalizar compra", emptyCart: "Tu carrito está vacío",
  continueShopping: "Seguir comprando", itemsInCart: "artículos en tu carrito",
  backToProducts: "Volver a productos", searchProducts: "Buscar productos...",
  noProductsFound: "No se encontraron productos", browseCollection: "Explora nuestra colección",
  about: "Acerca de", supportNav: "Soporte", policies: "Políticas",
  ourStory: "Nuestra historia", careers: "Empleos", press: "Prensa", blog: "Blog",
  helpCenter: "Centro de ayuda", returnsRefunds: "Devoluciones y reembolsos", shippingInfo: "Info de envío",
  trackOrder: "Rastrear pedido", contactUs: "Contáctanos",
  privacyPolicy: "Política de privacidad", termsOfService: "Términos de servicio",
  cookiePolicy: "Política de cookies", disclaimer: "Aviso legal",
  dashboard: "Panel", signOut: "Cerrar sesión", adminPanel: "Panel de admin", rating: "valoración",
});
Object.assign(translations.fr, {
  home: "Accueil", products: "Produits", cart: "Panier", login: "Connexion",
  search: "Rechercher", addToCart: "Ajouter au panier", viewCart: "Voir le panier",
  shopNow: "Acheter maintenant", viewAll: "Tout voir", featured: "Produits vedettes",
  bestSelling: "Meilleures ventes", newArrivals: "Nouveautés", trending: "Tendances",
  shopByCategory: "Acheter par catégorie", findWhatYouNeed: "Trouvez ce qu'il vous faut",
  megaSale: "Méga Promo — Jusqu'à 40% de réduction", megaSaleDesc: "Offre limitée sur l'électronique, la mode et les accessoires premium.",
  shopTheSale: "Voir les promos", secureCheckout: "Paiement sécurisé", freeShipping: "Livraison gratuite",
  easyReturns: "Retours faciles", support247: "Support 24/7", sslEncrypted: "Paiements cryptés SSL",
  ordersOver999: "Commandes de plus de ৳999", returnPolicy30: "Politique de retour 30 jours", hereToHelp: "Nous sommes là pour vous aider",
  customerReviews: "Avis clients", realReviews: "De vrais avis de vrais clients",
  orderSummary: "Résumé de la commande", subtotal: "Sous-total", shipping: "Livraison", free: "Gratuit",
  total: "Total", checkout: "Commander", emptyCart: "Votre panier est vide",
  continueShopping: "Continuer vos achats", itemsInCart: "articles dans votre panier",
  backToProducts: "Retour aux produits", searchProducts: "Rechercher des produits...",
  noProductsFound: "Aucun produit trouvé", browseCollection: "Parcourez notre collection",
  about: "À propos", supportNav: "Support", policies: "Politiques",
  ourStory: "Notre histoire", careers: "Carrières", press: "Presse", blog: "Blog",
  helpCenter: "Centre d'aide", returnsRefunds: "Retours et remboursements", shippingInfo: "Info livraison",
  trackOrder: "Suivre la commande", contactUs: "Contactez-nous",
  privacyPolicy: "Politique de confidentialité", termsOfService: "Conditions de service",
  cookiePolicy: "Politique de cookies", disclaimer: "Avertissement",
  dashboard: "Tableau de bord", signOut: "Se déconnecter", adminPanel: "Panneau admin", rating: "évaluation",
});
Object.assign(translations.de, {
  home: "Startseite", products: "Produkte", cart: "Warenkorb", login: "Anmelden",
  search: "Suchen", addToCart: "In den Warenkorb", viewCart: "Warenkorb anzeigen",
  shopNow: "Jetzt kaufen", viewAll: "Alle anzeigen", featured: "Empfohlene Produkte",
  bestSelling: "Bestseller", newArrivals: "Neuheiten", trending: "Im Trend",
  shopByCategory: "Nach Kategorie kaufen", findWhatYouNeed: "Finden Sie was Sie brauchen",
  megaSale: "Mega Sale — Bis zu 40% Rabatt", megaSaleDesc: "Zeitlich begrenztes Angebot für Premium-Elektronik, Mode und Zubehör.",
  shopTheSale: "Sale ansehen", secureCheckout: "Sichere Kasse", freeShipping: "Kostenloser Versand",
  easyReturns: "Einfache Rückgabe", support247: "24/7 Support", sslEncrypted: "SSL-verschlüsselte Zahlungen",
  orderSummary: "Bestellübersicht", subtotal: "Zwischensumme", shipping: "Versand", free: "Kostenlos",
  total: "Gesamt", checkout: "Zur Kasse", emptyCart: "Ihr Warenkorb ist leer",
  continueShopping: "Weiter einkaufen", itemsInCart: "Artikel im Warenkorb",
  dashboard: "Dashboard", signOut: "Abmelden", adminPanel: "Admin-Bereich", rating: "Bewertung",
});
Object.assign(translations.it, {
  home: "Home", products: "Prodotti", cart: "Carrello", login: "Accedi",
  search: "Cerca", addToCart: "Aggiungi al carrello", viewCart: "Vedi carrello",
  shopNow: "Acquista ora", viewAll: "Vedi tutto", featured: "Prodotti in evidenza",
  bestSelling: "Più venduti", newArrivals: "Novità", trending: "Di tendenza",
  shopByCategory: "Acquista per categoria", findWhatYouNeed: "Trova ciò che cerchi",
  megaSale: "Mega Saldi — Fino al 40% di sconto", megaSaleDesc: "Offerta limitata su elettronica, moda e accessori premium.",
  shopTheSale: "Vedi i saldi", secureCheckout: "Pagamento sicuro", freeShipping: "Spedizione gratuita",
  easyReturns: "Resi facili", support247: "Supporto 24/7",
  orderSummary: "Riepilogo ordine", subtotal: "Subtotale", shipping: "Spedizione", free: "Gratis",
  total: "Totale", checkout: "Acquista", emptyCart: "Il carrello è vuoto",
  continueShopping: "Continua lo shopping", dashboard: "Dashboard", signOut: "Esci", adminPanel: "Pannello admin", rating: "valutazione",
});
Object.assign(translations.zh, {
  home: "首页", products: "产品", cart: "购物车", login: "登录",
  search: "搜索", addToCart: "加入购物车", viewCart: "查看购物车",
  shopNow: "立即购买", viewAll: "查看全部", featured: "精选产品",
  bestSelling: "畅销品", newArrivals: "新品上架", trending: "热门商品",
  shopByCategory: "按类别购物", findWhatYouNeed: "找到你需要的",
  megaSale: "超级特卖 — 低至4折", megaSaleDesc: "电子产品、时尚和配件限时优惠。",
  shopTheSale: "查看特卖", secureCheckout: "安全结账", freeShipping: "免费配送",
  easyReturns: "轻松退货", support247: "全天候客服",
  orderSummary: "订单摘要", subtotal: "小计", shipping: "运费", free: "免费",
  total: "总计", checkout: "结账", emptyCart: "购物车是空的",
  continueShopping: "继续购物", dashboard: "仪表板", signOut: "退出", adminPanel: "管理面板", rating: "评分",
});
Object.assign(translations.ja, {
  home: "ホーム", products: "製品", cart: "カート", login: "ログイン",
  search: "検索", addToCart: "カートに追加", viewCart: "カートを見る",
  shopNow: "今すぐ購入", viewAll: "すべて見る", featured: "注目の製品",
  bestSelling: "ベストセラー", newArrivals: "新着商品", trending: "トレンド",
  shopByCategory: "カテゴリーで探す", findWhatYouNeed: "欲しいものを見つけよう",
  megaSale: "メガセール — 最大40%オフ", megaSaleDesc: "電子機器、ファッション、アクセサリーの期間限定セール。",
  shopTheSale: "セールを見る", secureCheckout: "安全な決済", freeShipping: "送料無料",
  easyReturns: "簡単返品", support247: "24時間サポート",
  orderSummary: "注文概要", subtotal: "小計", shipping: "配送", free: "無料",
  total: "合計", checkout: "チェックアウト", emptyCart: "カートは空です",
  continueShopping: "買い物を続ける", dashboard: "ダッシュボード", signOut: "ログアウト", adminPanel: "管理画面", rating: "評価",
});
Object.assign(translations.pt, {
  home: "Início", products: "Produtos", cart: "Carrinho", login: "Entrar",
  search: "Pesquisar", addToCart: "Adicionar ao carrinho", viewCart: "Ver carrinho",
  shopNow: "Comprar agora", viewAll: "Ver tudo", featured: "Produtos em destaque",
  bestSelling: "Mais vendidos", newArrivals: "Novidades", trending: "Em alta",
  shopByCategory: "Comprar por categoria", findWhatYouNeed: "Encontre o que precisa",
  megaSale: "Mega Promoção — Até 40% de desconto", megaSaleDesc: "Oferta limitada em eletrônicos, moda e acessórios premium.",
  shopTheSale: "Ver promoções", secureCheckout: "Pagamento seguro", freeShipping: "Frete grátis",
  easyReturns: "Devoluções fáceis", support247: "Suporte 24/7",
  orderSummary: "Resumo do pedido", subtotal: "Subtotal", shipping: "Frete", free: "Grátis",
  total: "Total", checkout: "Finalizar", emptyCart: "Seu carrinho está vazio",
  continueShopping: "Continuar comprando", dashboard: "Painel", signOut: "Sair", adminPanel: "Painel admin", rating: "avaliação",
});
Object.assign(translations.ko, {
  home: "홈", products: "제품", cart: "장바구니", login: "로그인",
  search: "검색", addToCart: "장바구니 담기", viewCart: "장바구니 보기",
  shopNow: "지금 구매", viewAll: "전체 보기", featured: "추천 제품",
  bestSelling: "베스트셀러", newArrivals: "신상품", trending: "인기 상품",
  shopByCategory: "카테고리별 쇼핑", findWhatYouNeed: "원하는 제품을 찾으세요",
  megaSale: "메가 세일 — 최대 40% 할인", megaSaleDesc: "전자제품, 패션, 액세서리 한정 할인.",
  shopTheSale: "세일 보기", secureCheckout: "안전 결제", freeShipping: "무료 배송",
  easyReturns: "간편 반품", support247: "24시간 지원",
  orderSummary: "주문 요약", subtotal: "소계", shipping: "배송", free: "무료",
  total: "합계", checkout: "결제하기", emptyCart: "장바구니가 비어있습니다",
  continueShopping: "쇼핑 계속하기", dashboard: "대시보드", signOut: "로그아웃", adminPanel: "관리자", rating: "평점",
});
Object.assign(translations.ru, {
  home: "Главная", products: "Товары", cart: "Корзина", login: "Войти",
  search: "Поиск", addToCart: "В корзину", viewCart: "Корзина",
  shopNow: "Купить", viewAll: "Все товары", featured: "Рекомендуемые",
  bestSelling: "Бестселлеры", newArrivals: "Новинки", trending: "В тренде",
  shopByCategory: "По категориям", findWhatYouNeed: "Найдите что нужно",
  megaSale: "Мега распродажа — скидки до 40%", megaSaleDesc: "Ограниченное предложение на электронику, моду и аксессуары.",
  shopTheSale: "Распродажа", secureCheckout: "Безопасная оплата", freeShipping: "Бесплатная доставка",
  easyReturns: "Простой возврат", support247: "Поддержка 24/7",
  orderSummary: "Итого заказа", subtotal: "Подитог", shipping: "Доставка", free: "Бесплатно",
  total: "Итого", checkout: "Оформить", emptyCart: "Корзина пуста",
  continueShopping: "Продолжить покупки", dashboard: "Панель", signOut: "Выйти", adminPanel: "Админ", rating: "рейтинг",
});
Object.assign(translations.tr, {
  home: "Ana Sayfa", products: "Ürünler", cart: "Sepet", login: "Giriş",
  search: "Ara", addToCart: "Sepete Ekle", viewCart: "Sepeti Gör",
  shopNow: "Hemen Al", viewAll: "Tümünü Gör", featured: "Öne Çıkan Ürünler",
  bestSelling: "Çok Satanlar", newArrivals: "Yeni Gelenler", trending: "Trend",
  shopByCategory: "Kategoriye Göre", findWhatYouNeed: "İhtiyacınızı bulun",
  megaSale: "Mega İndirim — %40'a Varan İndirim", megaSaleDesc: "Elektronik, moda ve aksesuarlarda sınırlı süre.",
  shopTheSale: "İndirimi Gör", secureCheckout: "Güvenli Ödeme", freeShipping: "Ücretsiz Kargo",
  easyReturns: "Kolay İade", support247: "7/24 Destek",
  orderSummary: "Sipariş Özeti", subtotal: "Ara Toplam", shipping: "Kargo", free: "Ücretsiz",
  total: "Toplam", checkout: "Ödeme", emptyCart: "Sepetiniz boş",
  continueShopping: "Alışverişe Devam", dashboard: "Panel", signOut: "Çıkış", adminPanel: "Yönetici", rating: "puan",
});
Object.assign(translations.th, {
  home: "หน้าแรก", products: "สินค้า", cart: "ตะกร้า", login: "เข้าสู่ระบบ",
  search: "ค้นหา", addToCart: "เพิ่มลงตะกร้า", shopNow: "ซื้อเลย", featured: "สินค้าแนะนำ",
  bestSelling: "ขายดี", newArrivals: "สินค้าใหม่", trending: "กำลังฮิต",
  checkout: "ชำระเงิน", emptyCart: "ตะกร้าว่างเปล่า", continueShopping: "ช้อปต่อ",
  dashboard: "แดชบอร์ด", signOut: "ออกจากระบบ", rating: "คะแนน",
});
Object.assign(translations.vi, {
  home: "Trang chủ", products: "Sản phẩm", cart: "Giỏ hàng", login: "Đăng nhập",
  search: "Tìm kiếm", addToCart: "Thêm vào giỏ", shopNow: "Mua ngay", featured: "Sản phẩm nổi bật",
  bestSelling: "Bán chạy", newArrivals: "Hàng mới", trending: "Xu hướng",
  checkout: "Thanh toán", emptyCart: "Giỏ hàng trống", continueShopping: "Tiếp tục mua",
  dashboard: "Bảng điều khiển", signOut: "Đăng xuất", rating: "đánh giá",
});
Object.assign(translations.id, {
  home: "Beranda", products: "Produk", cart: "Keranjang", login: "Masuk",
  search: "Cari", addToCart: "Tambah ke keranjang", shopNow: "Beli sekarang", featured: "Produk unggulan",
  bestSelling: "Terlaris", newArrivals: "Produk baru", trending: "Tren",
  checkout: "Checkout", emptyCart: "Keranjang kosong", continueShopping: "Lanjut belanja",
  dashboard: "Dasbor", signOut: "Keluar", rating: "penilaian",
});
Object.assign(translations.ur, {
  home: "ہوم", products: "مصنوعات", cart: "کارٹ", login: "لاگ ان",
  search: "تلاش", addToCart: "کارٹ میں ڈالیں", shopNow: "ابھی خریدیں", featured: "نمایاں مصنوعات",
  bestSelling: "سب سے زیادہ فروخت", newArrivals: "نئی آمد", trending: "ٹرینڈنگ",
  checkout: "چیک آؤٹ", emptyCart: "کارٹ خالی ہے", continueShopping: "خریداری جاری رکھیں",
  dashboard: "ڈیش بورڈ", signOut: "سائن آؤٹ", rating: "ریٹنگ",
});
Object.assign(translations.fa, {
  home: "خانه", products: "محصولات", cart: "سبد خرید", login: "ورود",
  search: "جستجو", addToCart: "افزودن به سبد", shopNow: "خرید کنید", featured: "محصولات ویژه",
  bestSelling: "پرفروش‌ترین", newArrivals: "تازه‌رسیده", trending: "پرطرفدار",
  checkout: "پرداخت", emptyCart: "سبد خرید خالی است", continueShopping: "ادامه خرید",
  dashboard: "داشبورد", signOut: "خروج", rating: "امتیاز",
});
Object.assign(translations.nl, {
  home: "Home", products: "Producten", cart: "Winkelwagen", login: "Inloggen",
  search: "Zoeken", addToCart: "In winkelwagen", shopNow: "Nu kopen", featured: "Uitgelicht",
  bestSelling: "Bestverkocht", newArrivals: "Nieuw binnen", trending: "Trending",
  checkout: "Afrekenen", emptyCart: "Winkelwagen is leeg", continueShopping: "Verder winkelen",
  dashboard: "Dashboard", signOut: "Uitloggen", rating: "beoordeling",
});
Object.assign(translations.pl, {
  home: "Strona główna", products: "Produkty", cart: "Koszyk", login: "Zaloguj się",
  search: "Szukaj", addToCart: "Dodaj do koszyka", shopNow: "Kup teraz", featured: "Polecane",
  bestSelling: "Bestsellery", newArrivals: "Nowości", trending: "Na topie",
  checkout: "Zamów", emptyCart: "Koszyk jest pusty", continueShopping: "Kontynuuj zakupy",
  dashboard: "Panel", signOut: "Wyloguj", rating: "ocena",
});
Object.assign(translations.uk, {
  home: "Головна", products: "Товари", cart: "Кошик", login: "Увійти",
  search: "Пошук", addToCart: "Додати в кошик", shopNow: "Купити", featured: "Рекомендовані",
  bestSelling: "Найпопулярніші", newArrivals: "Новинки", trending: "У тренді",
  checkout: "Оформити", emptyCart: "Кошик порожній", continueShopping: "Продовжити покупки",
  dashboard: "Панель", signOut: "Вийти", rating: "рейтинг",
});
Object.assign(translations.sv, {
  home: "Hem", products: "Produkter", cart: "Varukorg", login: "Logga in",
  search: "Sök", addToCart: "Lägg i varukorgen", shopNow: "Köp nu", featured: "Utvalda",
  bestSelling: "Bästsäljare", newArrivals: "Nyheter", trending: "Trendande",
  checkout: "Kassa", emptyCart: "Varukorgen är tom", continueShopping: "Fortsätt handla",
  dashboard: "Instrumentpanel", signOut: "Logga ut", rating: "betyg",
});
Object.assign(translations.he, {
  home: "בית", products: "מוצרים", cart: "עגלה", login: "התחברות",
  search: "חיפוש", addToCart: "הוסף לעגלה", shopNow: "קנה עכשיו", featured: "מוצרים מומלצים",
  bestSelling: "הנמכרים ביותר", newArrivals: "חדשים", trending: "טרנדי",
  checkout: "לתשלום", emptyCart: "העגלה ריקה", continueShopping: "המשך בקניות",
  dashboard: "לוח בקרה", signOut: "התנתק", rating: "דירוג",
});

interface LanguageContextType {
  lang: LangConfig;
  setLang: (code: LangCode) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = "ar-pm-lang";
const GEO_DETECTED_KEY = "ar-pm-geo-detected";

const countryToLang: Record<string, LangCode> = {
  // Arabic-speaking
  AE: "ar", BH: "ar", KW: "ar", OM: "ar", QA: "ar", EG: "ar", IQ: "ar", JO: "ar", LB: "ar", LY: "ar", MA: "ar", TN: "ar", DZ: "ar", SD: "ar", YE: "ar", PS: "ar", SY: "ar",
  SA: "sa",
  // South Asian
  BD: "bn", IN: "hi", PK: "ur", NP: "hi", LK: "en", MM: "en",
  // Spanish-speaking
  ES: "es", MX: "es", AR: "es", CO: "es", CL: "es", PE: "es", VE: "es", EC: "es", GT: "es", CU: "es", BO: "es", DO: "es", HN: "es", PY: "es", SV: "es", NI: "es", CR: "es", PA: "es", UY: "es",
  // French-speaking
  FR: "fr", BE: "fr", SN: "fr", CI: "fr", ML: "fr", BF: "fr", NE: "fr", TD: "fr", GN: "fr", RW: "fr", BI: "fr", BJ: "fr", TG: "fr", CF: "fr", CG: "fr", CD: "fr", CM: "fr", GA: "fr", MG: "fr", HT: "fr",
  // German-speaking
  DE: "de", AT: "de", LI: "de", CH: "de",
  // Italian
  IT: "it",
  // Dutch
  NL: "nl",
  // Portuguese-speaking
  BR: "pt", PT: "pt", AO: "pt", MZ: "pt",
  // Russian-speaking
  RU: "ru", BY: "ru", KZ: "ru", KG: "ru",
  // Ukrainian
  UA: "uk",
  // Polish
  PL: "pl",
  // Romanian
  RO: "ro", MD: "ro",
  // Hungarian
  HU: "hu",
  // Czech
  CZ: "cs",
  // Scandinavian
  SE: "sv", DK: "da", NO: "no", FI: "fi", IS: "en",
  // Greek
  GR: "el", CY: "el",
  // Turkish
  TR: "tr",
  // Hebrew
  IL: "he",
  // Persian
  IR: "fa", AF: "fa",
  // Chinese-speaking
  CN: "zh", TW: "zh", HK: "zh", MO: "zh",
  // Japanese
  JP: "ja",
  // Korean
  KR: "ko",
  // Southeast Asia
  TH: "th", VN: "vi", ID: "id", MY: "ms", SG: "en", PH: "tl",
  // East Africa
  KE: "sw", TZ: "sw", UG: "sw",
  // English-speaking
  US: "en", GB: "en", AU: "en", NZ: "en", IE: "en", ZA: "en", NG: "en", GH: "en", CA: "en",
};

const countryToCurrency: Record<string, string> = {
  // Middle East
  AE: "AED", SA: "SAR", BH: "BHD", KW: "KWD", OM: "OMR", QA: "QAR", EG: "EGP", IQ: "IQD", JO: "JOD", LB: "LBP",
  // South Asia
  BD: "BDT", IN: "INR", PK: "PKR", NP: "NPR", LK: "LKR", MM: "MMK",
  // Americas
  US: "USD", CA: "CAD", MX: "MXN", AR: "ARS", CO: "COP", CL: "CLP", PE: "PEN", BR: "BRL", UY: "UYU", JM: "JMD", TT: "TTD",
  // Europe
  FR: "EUR", DE: "EUR", ES: "EUR", IT: "EUR", NL: "EUR", BE: "EUR", AT: "EUR", PT: "EUR", IE: "EUR", FI: "EUR", GR: "EUR", CY: "EUR",
  CH: "CHF", LI: "CHF",
  GB: "GBP",
  SE: "SEK", DK: "DKK", NO: "NOK", IS: "ISK",
  PL: "PLN", CZ: "CZK", HU: "HUF", RO: "RON", BG: "BGN", HR: "HRK",
  RU: "RUB", UA: "UAH",
  TR: "TRY", IL: "USD",
  // Asia Pacific
  CN: "CNY", TW: "TWD", HK: "HKD", JP: "JPY", KR: "KRW",
  SG: "SGD", AU: "AUD", NZ: "NZD", MY: "MYR", PH: "PHP", TH: "THB", VN: "VND", ID: "IDR",
  // Africa
  ZA: "ZAR", KE: "KES", NG: "NGN", GH: "GHS", TZ: "TZS", UG: "UGX", RW: "RWF", ET: "ETB",
  MA: "MAD", TN: "TND", DZ: "DZD",
};

const CURRENCY_STORAGE_KEY = "ar-pm-currency";

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const geoFetched = useRef(false);
  const defaultLang = languages.find(l => l.code === "en") || languages[0];
  const [lang, setLangState] = useState<LangConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as LangCode | null;
    if (saved) {
      const found = languages.find(l => l.code === saved);
      if (found) return found;
    }
    return defaultLang;
  });

  const setLang = useCallback((code: LangCode) => {
    const found = languages.find(l => l.code === code);
    if (found) {
      setLangState(found);
      localStorage.setItem(STORAGE_KEY, code);
      localStorage.setItem(GEO_DETECTED_KEY, "manual");
      document.documentElement.dir = found.dir;
      document.documentElement.lang = code;
    }
  }, []);

  // Geo-detection with strict fallback override — respects manual selections
  useEffect(() => {
    if (geoFetched.current) return;
    geoFetched.current = true;

    // If user manually chose a language, don't override
    const previousDetection = localStorage.getItem(GEO_DETECTED_KEY);
    if (previousDetection === "manual") return;

    const applyGeoDefaults = (countryCode?: string) => {
      const normalizedCode = countryCode?.toUpperCase();
      const langCode: LangCode = normalizedCode && countryToLang[normalizedCode]
        ? countryToLang[normalizedCode]
        : "en";
      const currencyCode = normalizedCode && countryToCurrency[normalizedCode]
        ? countryToCurrency[normalizedCode]
        : "USD";

      const found = languages.find(l => l.code === langCode);
      if (!found) return;

      setLangState(found);
      localStorage.setItem(STORAGE_KEY, langCode);
      localStorage.setItem(CURRENCY_STORAGE_KEY, currencyCode);
      localStorage.setItem(GEO_DETECTED_KEY, "auto");
      document.documentElement.dir = found.dir;
      document.documentElement.lang = langCode;
    };

    // Immediate strict fallback for first-time visitors
    if (!previousDetection) {
      applyGeoDefaults();
    }

    const detectGeo = async () => {
      try {
        const res = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(3000) });
        const data = await res.json();
        applyGeoDefaults(data?.country_code);
      } catch {
        // Keep strict default (English/USD) on failure
      }
    };

    detectGeo();
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
