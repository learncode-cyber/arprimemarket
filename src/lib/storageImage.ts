const CLOUD_URL = import.meta.env.VITE_SUPABASE_URL || "";

export const STORAGE_PRODUCT_FALLBACK_URL = CLOUD_URL
  ? `${CLOUD_URL}/storage/v1/object/public/blog-images/placeholders/product-fallback.png`
  : "/images/logo.png";

export const STORAGE_CATEGORY_FALLBACK_URL = CLOUD_URL
  ? `${CLOUD_URL}/storage/v1/object/public/blog-images/placeholders/category-fallback.png`
  : "/images/logo.png";

const PUBLIC_STORAGE_PATH = "storage/v1/object/public/";
const PROTOCOL_REGEX = /^https?:\/\//i;
const KNOWN_LOCAL_PREFIXES = ["images/", "assets/", "public/"];

export const resolveStorageImageUrl = (
  imageUrl: string | null | undefined,
  fallbackUrl: string,
  defaultBucket = "blog-images",
  cacheBust = true,
): string => {
  if (!imageUrl) return fallbackUrl;

  const trimmed = imageUrl.trim();
  if (!trimmed) return fallbackUrl;

  const appendCacheBust = (url: string) => {
    if (!cacheBust) return url;
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}t=${Date.now()}`;
  };

  if (PROTOCOL_REGEX.test(trimmed)) return appendCacheBust(trimmed);

  const normalized = trimmed.replace(/^\/+/, "");

  if (KNOWN_LOCAL_PREFIXES.some((prefix) => normalized.toLowerCase().startsWith(prefix))) {
    return fallbackUrl;
  }

  if (normalized.startsWith(PUBLIC_STORAGE_PATH)) {
    return CLOUD_URL ? appendCacheBust(`${CLOUD_URL}/${normalized}`) : fallbackUrl;
  }

  if (/^[a-z0-9][a-z0-9_-]*\/.+$/i.test(normalized)) {
    return CLOUD_URL ? appendCacheBust(`${CLOUD_URL}/${PUBLIC_STORAGE_PATH}${normalized}`) : fallbackUrl;
  }

  return CLOUD_URL
    ? appendCacheBust(`${CLOUD_URL}/${PUBLIC_STORAGE_PATH}${defaultBucket}/${normalized}`)
    : fallbackUrl;
};
