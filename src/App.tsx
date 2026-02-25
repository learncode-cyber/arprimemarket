import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";
import { CurrencyProvider } from "./context/CurrencyContext";
import { LanguageProvider } from "./context/LanguageContext";
import { TrackingProvider } from "./context/TrackingContext";
import { Layout } from "./components/Layout";
import Index from "./pages/Index";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import Checkout from "./pages/Checkout";
import TrackOrder from "./pages/TrackOrder";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <LanguageProvider>
          <CurrencyProvider>
            <AuthProvider>
              <CartProvider>
                <TrackingProvider>
                <Toaster />
                <Sonner />
                <Routes>
                  <Route path="/admin" element={<Admin />} />
                  <Route path="*" element={
                    <Layout>
                      <Routes>
                        <Route path="/" element={<Index />} />
                        <Route path="/products" element={<Products />} />
                        <Route path="/products/:id" element={<ProductDetail />} />
                        <Route path="/cart" element={<Cart />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/checkout" element={<Checkout />} />
                        <Route path="/track-order" element={<TrackOrder />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Layout>
                  } />
                </Routes>
                </TrackingProvider>
              </CartProvider>
            </AuthProvider>
          </CurrencyProvider>
        </LanguageProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
