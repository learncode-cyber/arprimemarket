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
const CACHE_PARAM = "v";

let storageImageVersion = Date.now();

export const bumpStorageImageVersion = () => {
  storageImageVersion = Date.now();
  return storageImageVersion;
};

const withCacheVersion = (url: string, cacheBust: boolean) => {
  if (!cacheBust) return url;

  const hashIndex = url.indexOf("#");
  const hash = hashIndex >= 0 ? url.slice(hashIndex) : "";
  const base = hashIndex >= 0 ? url.slice(0, hashIndex) : url;

  const [path, rawQuery = ""] = base.split("?");
  const params = new URLSearchParams(rawQuery);
  params.set(CACHE_PARAM, String(storageImageVersion));

  return `${path}?${params.toString()}${hash}`;
};

export const resolveStorageImageUrl = (
  imageUrl: string | null | undefined,
  fallbackUrl: string,
  defaultBucket = "blog-images",
  cacheBust = true,
): string => {
  if (!imageUrl) return fallbackUrl;

  const trimmed = imageUrl.trim();
  if (!trimmed) return fallbackUrl;

  if (PROTOCOL_REGEX.test(trimmed)) return withCacheVersion(trimmed, cacheBust);

  const normalized = trimmed.replace(/^\/+/, "");

  if (KNOWN_LOCAL_PREFIXES.some((prefix) => normalized.toLowerCase().startsWith(prefix))) {
    return fallbackUrl;
  }

  if (normalized.startsWith(PUBLIC_STORAGE_PATH)) {
    return CLOUD_URL ? withCacheVersion(`${CLOUD_URL}/${normalized}`, cacheBust) : fallbackUrl;
  }

  if (/^[a-z0-9][a-z0-9_-]*\/.+$/i.test(normalized)) {
    // If the first segment matches the defaultBucket or a known sub-folder, use defaultBucket instead
    const firstSegment = normalized.split("/")[0];
    if (defaultBucket && defaultBucket !== firstSegment) {
      return CLOUD_URL ? withCacheVersion(`${CLOUD_URL}/${PUBLIC_STORAGE_PATH}${defaultBucket}/${normalized}`, cacheBust) : fallbackUrl;
    }
    return CLOUD_URL ? withCacheVersion(`${CLOUD_URL}/${PUBLIC_STORAGE_PATH}${normalized}`, cacheBust) : fallbackUrl;
  }

  return CLOUD_URL
    ? withCacheVersion(`${CLOUD_URL}/${PUBLIC_STORAGE_PATH}${defaultBucket}/${normalized}`, cacheBust)
    : fallbackUrl;
};
