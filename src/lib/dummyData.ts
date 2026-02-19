export interface Product {
  id: string;
  title: string;
  price: number;
  image: string;
  category: string;
  rating: number;
  description: string;
}

export const products: Product[] = [
  {
    id: "1",
    title: "Quantum Wireless Headphones",
    price: 249.99,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80",
    category: "Electronics",
    rating: 4.8,
    description: "Premium noise-cancelling headphones with spatial audio, 40-hour battery life, and ultra-comfortable memory foam cushions. Experience sound like never before.",
  },
  {
    id: "2",
    title: "Minimal Leather Watch",
    price: 189.99,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80",
    category: "Accessories",
    rating: 4.6,
    description: "Hand-crafted Italian leather strap with Swiss movement. A timeless piece that elevates any outfit with understated elegance.",
  },
  {
    id: "3",
    title: "Pro Running Shoes",
    price: 159.99,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80",
    category: "Fashion",
    rating: 4.7,
    description: "Engineered with responsive foam technology and breathable mesh upper. Designed for runners who demand peak performance and style.",
  },
  {
    id: "4",
    title: "Smart Home Speaker",
    price: 129.99,
    image: "https://images.unsplash.com/photo-1589003077984-894e133dabab?w=600&q=80",
    category: "Electronics",
    rating: 4.5,
    description: "360° immersive sound with built-in AI assistant. Controls your smart home, plays your music, and answers your questions — all hands-free.",
  },
  {
    id: "5",
    title: "Designer Sunglasses",
    price: 219.99,
    image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&q=80",
    category: "Accessories",
    rating: 4.4,
    description: "UV400 polarized lenses in a lightweight titanium frame. Effortlessly cool protection for your eyes with a modern silhouette.",
  },
  {
    id: "6",
    title: "Ceramic Plant Pot Set",
    price: 49.99,
    image: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=600&q=80",
    category: "Home",
    rating: 4.3,
    description: "Set of 3 minimalist ceramic pots with drainage holes and bamboo saucers. Perfect for succulents, herbs, or small houseplants.",
  },
  {
    id: "7",
    title: "Ultra Slim Laptop",
    price: 1299.99,
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&q=80",
    category: "Electronics",
    rating: 4.9,
    description: "14-inch Retina display, M-series chip, 20-hour battery life, and all-aluminum unibody design. Power and portability, perfected.",
  },
  {
    id: "8",
    title: "Organic Cotton T-Shirt",
    price: 39.99,
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80",
    category: "Fashion",
    rating: 4.2,
    description: "100% organic cotton with a relaxed fit. Sustainably made, incredibly soft, and available in a range of earth-tone colors.",
  },
];

export const categories = ["All", "Electronics", "Fashion", "Accessories", "Home"];
