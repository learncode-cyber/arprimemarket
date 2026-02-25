import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
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
];

const langToCurrency: Record<LangCode, string> = {
  ar: "AED",
  sa: "SAR",
  en: "USD",
  bn: "BDT",
  hi: "INR",
  es: "MXN",
  fr: "EUR",
  de: "CHF",
  zh: "CNY",
  ja: "JPY",
  pt: "BRL",
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

  const [currency, setCurrency] = useState<CurrencyConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const found = currencies.find(c => c.code === saved);
      if (found) return found;
    }
    return currencies.find(c => c.code === "USD") || currencies[0];
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
        const { data, error } = await supabase.functions.invoke("exchange-rates");
        if (error) throw error;

        const rates = data.rates as Record<string, number>;
        const updated = defaultCurrencies.map(c => ({ ...c, rate: rates[c.code] ?? c.rate }));
        setCurrencies(updated);
        setRatesSource(data.source === "live" ? "live" : "fallback");

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
    const converted = convertPrice(bdtPrice);
    return `${currency.symbol}${converted.toLocaleString(undefined, { minimumFractionDigits: currency.code === "BDT" ? 0 : 2, maximumFractionDigits: 2 })}`;
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
