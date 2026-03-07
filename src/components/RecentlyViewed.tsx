import { Link } from "react-router-dom";
import { Clock } from "lucide-react";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { useCurrency } from "@/context/CurrencyContext";
import { useLanguage } from "@/context/LanguageContext";

const RecentlyViewed = () => {
  const { recentlyViewed } = useRecentlyViewed();
  const { formatPrice } = useCurrency();
  const { lang } = useLanguage();

  if (recentlyViewed.length === 0) return null;

  const tx = (en: string, bn: string) => lang.code === "bn" ? bn : en;

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">
            {tx("Recently Viewed", "সম্প্রতি দেখেছেন")}
          </h2>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {recentlyViewed.slice(0, 8).map(product => (
            <Link
              key={product.id}
              to={`/products/${product.slug}`}
              className="flex-shrink-0 w-36 group"
            >
              <div className="aspect-square rounded-lg overflow-hidden bg-secondary mb-2">
                <img
                  src={product.image_url || "/placeholder.svg"}
                  alt={product.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  loading="lazy"
                />
              </div>
              <p className="text-xs font-medium text-foreground truncate">{product.title}</p>
              <p className="text-xs text-primary font-semibold">{formatPrice(product.price)}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RecentlyViewed;
