import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  flag: string;
  rate: number; // rate relative to BDT (base)
}

export const currencies: CurrencyConfig[] = [
  { code: "BDT", symbol: "৳", name: "Bangladeshi Taka", flag: "🇧🇩", rate: 1 },
  { code: "USD", symbol: "$", name: "US Dollar", flag: "🇺🇸", rate: 0.0083 },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar", flag: "🇨🇦", rate: 0.012 },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham", flag: "🇦🇪", rate: 0.031 },
];

interface CurrencyContextType {
  currency: CurrencyConfig;
  setCurrencyByCode: (code: string) => void;
  formatPrice: (bdtPrice: number) => string;
  convertPrice: (bdtPrice: number) => number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const STORAGE_KEY = "ar-pm-currency";

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [currency, setCurrency] = useState<CurrencyConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const found = currencies.find(c => c.code === saved);
      if (found) return found;
    }
    return currencies[0]; // BDT default
  });

  // Auto-detect country on first visit
  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return;
    const detect = async () => {
      try {
        const res = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(3000) });
        const data = await res.json();
        const countryMap: Record<string, string> = {
          US: "USD", CA: "CAD", AE: "AED", BD: "BDT",
        };
        const code = countryMap[data.country_code];
        if (code) {
          const found = currencies.find(c => c.code === code);
          if (found) {
            setCurrency(found);
            localStorage.setItem(STORAGE_KEY, code);
          }
        }
      } catch {
        // fallback to BDT
      }
    };
    detect();
  }, []);

  const setCurrencyByCode = useCallback((code: string) => {
    const found = currencies.find(c => c.code === code);
    if (found) {
      setCurrency(found);
      localStorage.setItem(STORAGE_KEY, code);
    }
  }, []);

  const convertPrice = useCallback((bdtPrice: number) => {
    return Math.round(bdtPrice * currency.rate * 100) / 100;
  }, [currency]);

  const formatPrice = useCallback((bdtPrice: number) => {
    const converted = convertPrice(bdtPrice);
    return `${currency.symbol}${converted.toLocaleString(undefined, { minimumFractionDigits: currency.code === "BDT" ? 0 : 2, maximumFractionDigits: 2 })}`;
  }, [currency, convertPrice]);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrencyByCode, formatPrice, convertPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
};
