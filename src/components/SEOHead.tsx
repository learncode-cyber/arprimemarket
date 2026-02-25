import { Helmet } from "react-helmet-async";

interface SEOHeadProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  noindex?: boolean;
  jsonLd?: Record<string, any>;
}

const SITE_NAME = "AR Prime Market";
const DEFAULT_DESC = "Shop premium curated products at AR Prime Market. Electronics, Fashion, Accessories & more with fast delivery.";
const DEFAULT_IMAGE = "https://lovable.dev/opengraph-image-p98pqg.png";
const BASE_URL = "https://arprimemarket.lovable.app";

export const SEOHead = ({
  title,
  description = DEFAULT_DESC,
  image = DEFAULT_IMAGE,
  url,
  type = "website",
  noindex = false,
  jsonLd,
}: SEOHeadProps) => {
  const fullTitle = title ? `${title} — ${SITE_NAME}` : `${SITE_NAME} — Premium Ecommerce`;
  const canonical = url ? `${BASE_URL}${url}` : undefined;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={image} />
      {canonical && <meta property="og:url" content={canonical} />}
      <meta property="og:site_name" content={SITE_NAME} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Canonical */}
      {canonical && <link rel="canonical" href={canonical} />}

      {/* JSON-LD */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
};
