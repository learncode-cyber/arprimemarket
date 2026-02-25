import type { Product } from "@/hooks/useProductData";

const BASE_URL = "https://arprimemarket.lovable.app";

export const organizationSchema = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "AR Prime Market",
  url: BASE_URL,
  logo: `${BASE_URL}/images/logo.png`,
  description: "Premium curated ecommerce — electronics, fashion, accessories & more.",
  sameAs: [],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    availableLanguage: ["English", "Arabic", "Bengali"],
  },
});

export const websiteSchema = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "AR Prime Market",
  url: BASE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: `${BASE_URL}/products?search={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
});

export const productSchema = (product: Product) => ({
  "@context": "https://schema.org",
  "@type": "Product",
  name: product.title,
  description: product.description,
  image: product.image,
  url: `${BASE_URL}/products/${product.slug}`,
  sku: product.id,
  brand: { "@type": "Brand", name: "AR Prime Market" },
  category: product.category,
  offers: {
    "@type": "Offer",
    priceCurrency: product.currency,
    price: product.price,
    availability: product.stock_quantity > 0
      ? "https://schema.org/InStock"
      : "https://schema.org/OutOfStock",
    seller: { "@type": "Organization", name: "AR Prime Market" },
  },
  aggregateRating: product.rating > 0
    ? {
        "@type": "AggregateRating",
        ratingValue: product.rating,
        reviewCount: product.review_count || 1,
        bestRating: 5,
        worstRating: 1,
      }
    : undefined,
});

export const breadcrumbSchema = (items: { name: string; url: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: item.name,
    item: `${BASE_URL}${item.url}`,
  })),
});

export const collectionPageSchema = (name: string, description: string) => ({
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name,
  description,
  url: `${BASE_URL}/products`,
  isPartOf: { "@type": "WebSite", name: "AR Prime Market", url: BASE_URL },
});
