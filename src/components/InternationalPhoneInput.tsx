import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Phone, Search } from "lucide-react";

const COUNTRY_CODES = [
  { name: "Bangladesh", code: "BD", dial: "+880", flag: "🇧🇩" },
  { name: "India", code: "IN", dial: "+91", flag: "🇮🇳" },
  { name: "Pakistan", code: "PK", dial: "+92", flag: "🇵🇰" },
  { name: "United States", code: "US", dial: "+1", flag: "🇺🇸" },
  { name: "United Kingdom", code: "GB", dial: "+44", flag: "🇬🇧" },
  { name: "United Arab Emirates", code: "AE", dial: "+971", flag: "🇦🇪" },
  { name: "Saudi Arabia", code: "SA", dial: "+966", flag: "🇸🇦" },
  { name: "Qatar", code: "QA", dial: "+974", flag: "🇶🇦" },
  { name: "Kuwait", code: "KW", dial: "+965", flag: "🇰🇼" },
  { name: "Bahrain", code: "BH", dial: "+973", flag: "🇧🇭" },
  { name: "Oman", code: "OM", dial: "+968", flag: "🇴🇲" },
  { name: "Malaysia", code: "MY", dial: "+60", flag: "🇲🇾" },
  { name: "Singapore", code: "SG", dial: "+65", flag: "🇸🇬" },
  { name: "Australia", code: "AU", dial: "+61", flag: "🇦🇺" },
  { name: "Canada", code: "CA", dial: "+1", flag: "🇨🇦" },
  { name: "Germany", code: "DE", dial: "+49", flag: "🇩🇪" },
  { name: "France", code: "FR", dial: "+33", flag: "🇫🇷" },
  { name: "Italy", code: "IT", dial: "+39", flag: "🇮🇹" },
  { name: "Spain", code: "ES", dial: "+34", flag: "🇪🇸" },
  { name: "Netherlands", code: "NL", dial: "+31", flag: "🇳🇱" },
  { name: "Turkey", code: "TR", dial: "+90", flag: "🇹🇷" },
  { name: "Egypt", code: "EG", dial: "+20", flag: "🇪🇬" },
  { name: "South Africa", code: "ZA", dial: "+27", flag: "🇿🇦" },
  { name: "Nigeria", code: "NG", dial: "+234", flag: "🇳🇬" },
  { name: "Kenya", code: "KE", dial: "+254", flag: "🇰🇪" },
  { name: "Japan", code: "JP", dial: "+81", flag: "🇯🇵" },
  { name: "South Korea", code: "KR", dial: "+82", flag: "🇰🇷" },
  { name: "China", code: "CN", dial: "+86", flag: "🇨🇳" },
  { name: "Indonesia", code: "ID", dial: "+62", flag: "🇮🇩" },
  { name: "Thailand", code: "TH", dial: "+66", flag: "🇹🇭" },
  { name: "Vietnam", code: "VN", dial: "+84", flag: "🇻🇳" },
  { name: "Philippines", code: "PH", dial: "+63", flag: "🇵🇭" },
  { name: "Brazil", code: "BR", dial: "+55", flag: "🇧🇷" },
  { name: "Mexico", code: "MX", dial: "+52", flag: "🇲🇽" },
  { name: "Nepal", code: "NP", dial: "+977", flag: "🇳🇵" },
  { name: "Sri Lanka", code: "LK", dial: "+94", flag: "🇱🇰" },
  { name: "Myanmar", code: "MM", dial: "+95", flag: "🇲🇲" },
  { name: "Iraq", code: "IQ", dial: "+964", flag: "🇮🇶" },
  { name: "Jordan", code: "JO", dial: "+962", flag: "🇯🇴" },
  { name: "Lebanon", code: "LB", dial: "+961", flag: "🇱🇧" },
].sort((a, b) => a.name.localeCompare(b.name));

const COUNTRY_NAME_TO_CODE: Record<string, string> = {
  "Bangladesh": "BD", "India": "IN", "Pakistan": "PK", "United States": "US",
  "United Kingdom": "GB", "United Arab Emirates": "AE", "Saudi Arabia": "SA",
  "Qatar": "QA", "Kuwait": "KW", "Malaysia": "MY", "Singapore": "SG",
  "Australia": "AU", "Canada": "CA", "Germany": "DE", "France": "FR",
  "Italy": "IT", "Spain": "ES", "Turkey": "TR", "Egypt": "EG",
  "Nigeria": "NG", "Japan": "JP", "South Korea": "KR", "China": "CN",
  "Indonesia": "ID", "Thailand": "TH", "Brazil": "BR", "Mexico": "MX",
  "Nepal": "NP", "Sri Lanka": "LK", "Philippines": "PH", "Vietnam": "VN",
};

interface InternationalPhoneInputProps {
  value: string;
  onChange: (fullPhone: string) => void;
  country?: string;
  label?: string;
  error?: string;
  placeholder?: string;
}

const InternationalPhoneInput = ({
  value,
  onChange,
  country = "Bangladesh",
  label = "Phone Number",
  error,
  placeholder = "1XXXXXXXXX",
}: InternationalPhoneInputProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Derive selected country from the shipping country prop
  const derivedCode = COUNTRY_NAME_TO_CODE[country] || "BD";
  const [selectedCode, setSelectedCode] = useState(derivedCode);

  useEffect(() => {
    const newCode = COUNTRY_NAME_TO_CODE[country];
    if (newCode && newCode !== selectedCode) {
      setSelectedCode(newCode);
      // Update the phone value with new dial code if it starts with old dial code
      const oldCountry = COUNTRY_CODES.find(c => c.code === selectedCode);
      const newCountry = COUNTRY_CODES.find(c => c.code === newCode);
      if (oldCountry && newCountry && value.startsWith(oldCountry.dial)) {
        onChange(newCountry.dial + value.slice(oldCountry.dial.length));
      } else if (newCountry && !value.startsWith(newCountry.dial)) {
        const digits = value.replace(/^\+\d+\s*/, "");
        onChange(newCountry.dial + digits);
      }
    }
  }, [country]);

  const selected = COUNTRY_CODES.find(c => c.code === selectedCode) || COUNTRY_CODES[0];

  // Extract local number from full phone
  const localNumber = value.startsWith(selected.dial)
    ? value.slice(selected.dial.length)
    : value.replace(/^\+\d+\s*/, "");

  const filtered = useMemo(() => {
    if (!search.trim()) return COUNTRY_CODES;
    const q = search.toLowerCase();
    return COUNTRY_CODES.filter(c =>
      c.name.toLowerCase().includes(q) || c.dial.includes(q) || c.code.toLowerCase().includes(q)
    );
  }, [search]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (open) { setSearch(""); setTimeout(() => searchRef.current?.focus(), 50); }
  }, [open]);

  const handleLocalChange = (local: string) => {
    const cleaned = local.replace(/[^\d]/g, "");
    onChange(selected.dial + cleaned);
  };

  const handleCountrySelect = (c: typeof COUNTRY_CODES[0]) => {
    setSelectedCode(c.code);
    onChange(c.dial + localNumber);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      {label && <label className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</label>}
      <div className={`flex items-center rounded-xl border bg-background transition-all ${error ? "border-destructive ring-1 ring-destructive/20" : "border-border focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary/30"}`}>
        {/* Country code button */}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1 px-3 py-3 border-r border-border hover:bg-secondary/50 transition-colors rounded-l-xl touch-manipulation shrink-0"
        >
          <span className="text-base leading-none">{selected.flag}</span>
          <span className="text-xs text-muted-foreground font-mono">{selected.dial}</span>
          <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        {/* Phone number input */}
        <div className="relative flex-1">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="tel"
            value={localNumber}
            onChange={e => handleLocalChange(e.target.value)}
            placeholder={placeholder}
            maxLength={15}
            className="w-full pl-9 pr-3 py-3 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none rounded-r-xl"
          />
        </div>
      </div>

      {error && (
        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-[11px] text-destructive mt-1">
          {error}
        </motion.p>
      )}

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute z-50 mt-1 w-full bg-card border border-border rounded-xl shadow-xl overflow-hidden"
          >
            <div className="p-2 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  ref={searchRef}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search country or code..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto scrollbar-hide">
              {filtered.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No results</p>
              ) : (
                filtered.map(c => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => handleCountrySelect(c)}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-secondary transition-colors flex items-center gap-3 ${
                      c.code === selectedCode ? "bg-primary/5 text-primary font-medium" : "text-foreground"
                    }`}
                  >
                    <span className="text-base">{c.flag}</span>
                    <span className="flex-1">{c.name}</span>
                    <span className="text-xs text-muted-foreground font-mono">{c.dial}</span>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InternationalPhoneInput;
