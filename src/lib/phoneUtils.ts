import { getCountries, getCountryCallingCode, parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";

const regionDisplayNames = new Intl.DisplayNames(["en"], { type: "region" });

const normalizeCountryName = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const COUNTRY_NAME_ALIASES: Record<string, CountryCode> = {
  "united states": "US",
  "united kingdom": "GB",
  "south korea": "KR",
  "north korea": "KP",
  "united arab emirates": "AE",
  "czech republic": "CZ",
  "vatican city": "VA",
  "palestine": "PS",
  "micronesia": "FM",
  "cabo verde": "CV",
  "cape verde": "CV",
  "laos": "LA",
  "eswatini": "SZ",
};

const COUNTRY_CODE_NAME_ALIASES: Partial<Record<CountryCode, string>> = {
  GB: "United Kingdom",
  US: "United States",
  KR: "South Korea",
  KP: "North Korea",
  AE: "United Arab Emirates",
  CZ: "Czech Republic",
  VA: "Vatican City",
  PS: "Palestine",
  FM: "Micronesia",
  CV: "Cabo Verde",
};

const NAME_TO_COUNTRY_CODE = (() => {
  const map: Record<string, CountryCode> = {};

  for (const code of getCountries()) {
    const name = regionDisplayNames.of(code);
    if (name) {
      map[normalizeCountryName(name)] = code;
    }
  }

  Object.entries(COUNTRY_NAME_ALIASES).forEach(([name, code]) => {
    map[normalizeCountryName(name)] = code;
  });

  return map;
})();

export const getCountryCodeFromName = (countryName?: string): CountryCode => {
  if (!countryName) return "BD";
  const normalized = normalizeCountryName(countryName);
  return NAME_TO_COUNTRY_CODE[normalized] || "BD";
};

export const getCountryNameFromCode = (countryCode?: string): string => {
  if (!countryCode) return "Bangladesh";

  const normalized = countryCode.toUpperCase() as CountryCode;

  if (COUNTRY_CODE_NAME_ALIASES[normalized]) {
    return COUNTRY_CODE_NAME_ALIASES[normalized] as string;
  }

  return regionDisplayNames.of(normalized) || "Bangladesh";
};

export const getDialPrefixForCountry = (countryCode: CountryCode): string => {
  return `+${getCountryCallingCode(countryCode)}`;
};

export const normalizePhoneForCountry = (phone: string, countryCode: CountryCode): string => {
  const prefix = getDialPrefixForCountry(countryCode);
  const trimmed = phone.trim();

  if (!trimmed) return prefix;

  const parsed = parsePhoneNumberFromString(trimmed);
  if (parsed?.nationalNumber) {
    return `${prefix}${parsed.nationalNumber}`;
  }

  const dialDigits = prefix.replace("+", "");
  const digits = trimmed.replace(/\D/g, "");
  const national = digits.startsWith(dialDigits) ? digits.slice(dialDigits.length) : digits;

  return `${prefix}${national}`;
};

export const isValidPhoneForCountry = (phone: string, countryCode: CountryCode): boolean => {
  if (!phone.trim()) return false;
  const parsed = parsePhoneNumberFromString(phone, countryCode);
  if (!parsed) return false;
  return parsed.countryCallingCode === getCountryCallingCode(countryCode) && parsed.isValid();
};
