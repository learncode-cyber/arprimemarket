import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from "react";
import { useLanguage, LangCode } from "@/context/LanguageContext";

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  rate: number;
}

const defaultCurrencies: CurrencyConfig[] = [
  { code: "AED", symbol: "د.إ", name: "UAE Dirham", rate: 0.031 },
  { code: "SAR", symbol: "﷼", name: "Saudi Riyal", rate: 0.031 },
  { code: "USD", symbol: "$", name: "US Dollar", rate: 0.0083 },
  { code: "BDT", symbol: "৳", name: "Bangladeshi Taka", rate: 1 },
  { code: "INR", symbol: "₹", name: "Indian Rupee", rate: 0.70 },
  { code: "MXN", symbol: "MX$", name: "Mexican Peso", rate: 0.14 },
  { code: "EUR", symbol: "€", name: "Euro", rate: 0.0077 },
  { code: "CHF", symbol: "Fr", name: "Swiss Franc", rate: 0.0074 },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan", rate: 0.060 },
  { code: "JPY", symbol: "¥", name: "Japanese Yen", rate: 1.24 },
  { code: "BRL", symbol: "R$", name: "Brazilian Real", rate: 0.048 },
  { code: "GBP", symbol: "£", name: "British Pound", rate: 0.0066 },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar", rate: 0.011 },
  { code: "AUD", symbol: "A$", name: "Australian Dollar", rate: 0.013 },
  { code: "NZD", symbol: "NZ$", name: "New Zealand Dollar", rate: 0.014 },
  { code: "KRW", symbol: "₩", name: "South Korean Won", rate: 11.0 },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar", rate: 0.011 },
  { code: "HKD", symbol: "HK$", name: "Hong Kong Dollar", rate: 0.065 },
  { code: "TWD", symbol: "NT$", name: "Taiwan Dollar", rate: 0.27 },
  { code: "THB", symbol: "฿", name: "Thai Baht", rate: 0.29 },
  { code: "MYR", symbol: "RM", name: "Malaysian Ringgit", rate: 0.037 },
  { code: "PHP", symbol: "₱", name: "Philippine Peso", rate: 0.47 },
  { code: "IDR", symbol: "Rp", name: "Indonesian Rupiah", rate: 131.0 },
  { code: "VND", symbol: "₫", name: "Vietnamese Dong", rate: 210.0 },
  { code: "PKR", symbol: "₨", name: "Pakistani Rupee", rate: 2.32 },
  { code: "LKR", symbol: "Rs", name: "Sri Lankan Rupee", rate: 2.47 },
  { code: "NPR", symbol: "रू", name: "Nepalese Rupee", rate: 1.12 },
  { code: "MMK", symbol: "K", name: "Myanmar Kyat", rate: 17.5 },
  { code: "KWD", symbol: "د.ك", name: "Kuwaiti Dinar", rate: 0.0026 },
  { code: "BHD", symbol: "BD", name: "Bahraini Dinar", rate: 0.0031 },
  { code: "OMR", symbol: "ر.ع", name: "Omani Rial", rate: 0.0032 },
  { code: "QAR", symbol: "ر.ق", name: "Qatari Riyal", rate: 0.030 },
  { code: "EGP", symbol: "E£", name: "Egyptian Pound", rate: 0.41 },
  { code: "TRY", symbol: "₺", name: "Turkish Lira", rate: 0.27 },
  { code: "ZAR", symbol: "R", name: "South African Rand", rate: 0.15 },
  { code: "NGN", symbol: "₦", name: "Nigerian Naira", rate: 12.5 },
  { code: "KES", symbol: "KSh", name: "Kenyan Shilling", rate: 1.07 },
  { code: "GHS", symbol: "₵", name: "Ghanaian Cedi", rate: 0.13 },
  { code: "RUB", symbol: "₽", name: "Russian Ruble", rate: 0.76 },
  { code: "UAH", symbol: "₴", name: "Ukrainian Hryvnia", rate: 0.34 },
  { code: "PLN", symbol: "zł", name: "Polish Zloty", rate: 0.033 },
  { code: "CZK", symbol: "Kč", name: "Czech Koruna", rate: 0.19 },
  { code: "SEK", symbol: "kr", name: "Swedish Krona", rate: 0.087 },
  { code: "NOK", symbol: "kr", name: "Norwegian Krone", rate: 0.089 },
  { code: "DKK", symbol: "kr", name: "Danish Krone", rate: 0.057 },
  { code: "HUF", symbol: "Ft", name: "Hungarian Forint", rate: 3.07 },
  { code: "RON", symbol: "lei", name: "Romanian Leu", rate: 0.038 },
  { code: "BGN", symbol: "лв", name: "Bulgarian Lev", rate: 0.015 },
  { code: "HRK", symbol: "kn", name: "Croatian Kuna", rate: 0.058 },
  { code: "ISK", symbol: "kr", name: "Icelandic Krona", rate: 1.14 },
  { code: "ARS", symbol: "AR$", name: "Argentine Peso", rate: 7.4 },
  { code: "CLP", symbol: "CL$", name: "Chilean Peso", rate: 7.8 },
  { code: "COP", symbol: "CO$", name: "Colombian Peso", rate: 34.0 },
  { code: "PEN", symbol: "S/", name: "Peruvian Sol", rate: 0.031 },
  { code: "UYU", symbol: "$U", name: "Uruguayan Peso", rate: 0.34 },
  { code: "JMD", symbol: "J$", name: "Jamaican Dollar", rate: 1.30 },
  { code: "TTD", symbol: "TT$", name: "Trinidad Dollar", rate: 0.056 },
  { code: "MAD", symbol: "MAD", name: "Moroccan Dirham", rate: 0.082 },
  { code: "TND", symbol: "DT", name: "Tunisian Dinar", rate: 0.026 },
  { code: "DZD", symbol: "DA", name: "Algerian Dinar", rate: 1.12 },
  { code: "IQD", symbol: "ع.د", name: "Iraqi Dinar", rate: 10.9 },
  { code: "JOD", symbol: "JD", name: "Jordanian Dinar", rate: 0.0059 },
  { code: "LBP", symbol: "L£", name: "Lebanese Pound", rate: 744.0 },
  { code: "ETB", symbol: "Br", name: "Ethiopian Birr", rate: 0.47 },
  { code: "TZS", symbol: "TSh", name: "Tanzanian Shilling", rate: 22.0 },
  { code: "UGX", symbol: "USh", name: "Ugandan Shilling", rate: 31.0 },
  { code: "RWF", symbol: "RF", name: "Rwandan Franc", rate: 11.0 },
  { code: "XOF", symbol: "CFA", name: "West African CFA", rate: 5.06 },
  { code: "XAF", symbol: "FCFA", name: "Central African CFA", rate: 5.06 },
];

const langToCurrency: Record<LangCode, string> = {
  ar: "AED", sa: "SAR", en: "USD", bn: "BDT", hi: "INR", es: "MXN",
  fr: "EUR", de: "CHF", zh: "CNY", ja: "JPY", pt: "BRL",
  ko: "KRW", ru: "RUB", tr: "TRY", th: "THB", vi: "VND",
  id: "IDR", ms: "MYR", sw: "KES", tl: "PHP", ur: "PKR",
  fa: "AED", it: "EUR", nl: "EUR", pl: "PLN", uk: "UAH",
  ro: "RON", sv: "SEK", da: "DKK", no: "NOK", fi: "EUR",
  el: "EUR", hu: "HUF", cs: "CZK", he: "USD",
};

interface CurrencyContextType {
  currency: CurrencyConfig;
  currencies: CurrencyConfig[];
  setCurrencyByCode: (code: string) => void;
  formatPrice: (bdtPrice: number) => string;
  convertPrice: (bdtPrice: number) => number;
  ratesSource: "live" | "fallback" | "loading";
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const STORAGE_KEY = "ar-pm-currency";
const RATES_CACHE_KEY = "ar-pm-rates";
const RATES_TTL = 60 * 60 * 1000;

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const { lang } = useLanguage();

  const [currencies, setCurrencies] = useState<CurrencyConfig[]>(() => {
    try {
      const cached = localStorage.getItem(RATES_CACHE_KEY);
      if (cached) {
        const { rates, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < RATES_TTL) {
          return defaultCurrencies.map(c => ({ ...c, rate: rates[c.code] ?? c.rate }));
        }
      }
    } catch {}
    return defaultCurrencies;
  });

  const [ratesSource, setRatesSource] = useState<"live" | "fallback" | "loading">("loading");
  const fetchedRef = useRef(false);
  const manuallySetRef = useRef(false);

  const defaultCurrency = currencies.find(c => c.code === "USD") || currencies[0];
  const [currency, setCurrency] = useState<CurrencyConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const found = currencies.find(c => c.code === saved);
      if (found) return found;
    }
    return defaultCurrency;
  });

  // Auto-switch currency when language changes
  useEffect(() => {
    const targetCode = langToCurrency[lang.code];
    if (targetCode) {
      const found = currencies.find(c => c.code === targetCode);
      if (found) {
        setCurrency(found);
        localStorage.setItem(STORAGE_KEY, targetCode);
      }
    }
  }, [lang.code, currencies]);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const fetchRates = async () => {
      try {
        // Fetch live rates from free API directly (no edge function)
        const res = await fetch("https://open.er-api.com/v6/latest/BDT", {
          signal: AbortSignal.timeout(5000),
        });
        if (!res.ok) throw new Error("Rate API error");
        const json = await res.json();
        if (json.result !== "success" || !json.rates) throw new Error("Invalid rate data");

        const rates = json.rates as Record<string, number>;
        const updated = defaultCurrencies.map(c => ({ ...c, rate: rates[c.code] ?? c.rate }));
        setCurrencies(updated);
        setRatesSource("live");

        setCurrency(prev => {
          const found = updated.find(c => c.code === prev.code);
          return found || prev;
        });

        localStorage.setItem(RATES_CACHE_KEY, JSON.stringify({ rates, timestamp: Date.now() }));
      } catch {
        setRatesSource("fallback");
      }
    };

    fetchRates();
  }, []);

  const setCurrencyByCode = useCallback((code: string) => {
    const found = currencies.find(c => c.code === code);
    if (found) {
      setCurrency(found);
      localStorage.setItem(STORAGE_KEY, code);
    }
  }, [currencies]);

  const convertPrice = useCallback((bdtPrice: number) => {
    return Math.round(bdtPrice * currency.rate * 100) / 100;
  }, [currency]);

  const formatPrice = useCallback((bdtPrice: number) => {
    let converted = convertPrice(bdtPrice);
    // Auto-round BDT to whole numbers (discount poisha)
    if (currency.code === "BDT") {
      converted = Math.floor(converted);
    }
    return `${currency.symbol}${converted.toLocaleString(undefined, { minimumFractionDigits: currency.code === "BDT" ? 0 : 2, maximumFractionDigits: currency.code === "BDT" ? 0 : 2 })}`;
  }, [currency, convertPrice]);

  return (
    <CurrencyContext.Provider value={{ currency, currencies, setCurrencyByCode, formatPrice, convertPrice, ratesSource }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
};
