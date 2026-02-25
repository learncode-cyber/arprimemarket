import { Skeleton } from "@/components/ui/skeleton";

export const ProductCardSkeleton = () => (
  <div className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col">
    <Skeleton className="aspect-square w-full" />
    <div className="p-2.5 sm:p-3.5 flex flex-col gap-2">
      <Skeleton className="h-3 w-3/4" />
      <Skeleton className="h-2.5 w-1/2" />
      <div className="flex items-center justify-between mt-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
    </div>
  </div>
);

export const ProductGridSkeleton = ({ count = 8 }: { count?: number }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <ProductCardSkeleton key={i} />
    ))}
  </div>
);
