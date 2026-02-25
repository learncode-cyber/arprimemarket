import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  rate: number;
}

const defaultCurrencies: CurrencyConfig[] = [
  { code: "BDT", symbol: "৳", name: "Bangladeshi Taka", rate: 1 },
  { code: "USD", symbol: "$", name: "US Dollar", rate: 0.0083 },
  { code: "EUR", symbol: "€", name: "Euro", rate: 0.0077 },
  { code: "GBP", symbol: "£", name: "British Pound", rate: 0.0066 },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar", rate: 0.012 },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham", rate: 0.031 },
  { code: "SAR", symbol: "﷼", name: "Saudi Riyal", rate: 0.031 },
  { code: "INR", symbol: "₹", name: "Indian Rupee", rate: 0.70 },
  { code: "MYR", symbol: "RM", name: "Malaysian Ringgit", rate: 0.037 },
  { code: "AUD", symbol: "A$", name: "Australian Dollar", rate: 0.013 },
];

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

  const [currency, setCurrency] = useState<CurrencyConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const found = currencies.find(c => c.code === saved);
      if (found) return found;
    }
    return currencies[0];
  });

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

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return;
    const detect = async () => {
      try {
        const res = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(3000) });
        const data = await res.json();
        const countryMap: Record<string, string> = {
          US: "USD", CA: "CAD", AE: "AED", BD: "BDT", GB: "GBP",
          SA: "SAR", IN: "INR", MY: "MYR", AU: "AUD",
          DE: "EUR", FR: "EUR", IT: "EUR", ES: "EUR", NL: "EUR",
        };
        const code = countryMap[data.country_code];
        if (code) {
          const found = currencies.find(c => c.code === code);
          if (found) {
            setCurrency(found);
            localStorage.setItem(STORAGE_KEY, code);
          }
        }
      } catch {}
    };
    detect();
  }, [currencies]);

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
