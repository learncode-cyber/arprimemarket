import { memo } from "react";
import { Heart } from "lucide-react";
import { useWishlist } from "@/hooks/useWishlist";

interface WishlistButtonProps {
  productId: string;
  className?: string;
  size?: "sm" | "md";
}

export const WishlistButton = memo(({ productId, className = "", size = "sm" }: WishlistButtonProps) => {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const active = isInWishlist(productId);
  const iconSize = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";
  const padding = size === "sm" ? "p-1.5" : "p-2";

  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWishlist(productId); }}
      className={`${padding} rounded-lg transition-all touch-manipulation active:scale-90 ${
        active ? "text-red-500" : "text-muted-foreground hover:text-red-400"
      } ${className}`}
      aria-label={active ? "Remove from wishlist" : "Add to wishlist"}
    >
      <Heart className={`${iconSize} ${active ? "fill-current" : ""}`} />
    </button>
  );
});

WishlistButton.displayName = "WishlistButton";
