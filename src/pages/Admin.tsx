import AdminDashboard from "@/components/admin/AdminDashboard";
import ProductManagement from "@/components/admin/ProductManagement";
import OrderManagement from "@/components/admin/OrderManagement";
import CustomerManagement from "@/components/admin/CustomerManagement";
import CouponManagement from "@/components/admin/CouponManagement";
import PaymentSettings from "@/components/admin/PaymentSettings";
import ShippingManagement from "@/components/admin/ShippingManagement";
import SupplierManagement from "@/components/admin/SupplierManagement";
import TrackingManagement from "@/components/admin/TrackingManagement";
import SEOManagement from "@/components/admin/SEOManagement";
import PromotionManagement from "@/components/admin/PromotionManagement";
import ReferralManagement from "@/components/admin/ReferralManagement";
import CampaignManagement from "@/components/admin/CampaignManagement";
import BackupManagement from "@/components/admin/BackupManagement";
import APIHealthDashboard from "@/components/admin/APIHealthDashboard";
import InventoryManagement from "@/components/admin/InventoryManagement";
import BlogManagement from "@/components/admin/BlogManagement";
import HelpCenterManagement from "@/components/admin/HelpCenterManagement";
import FAQManagement from "@/components/admin/FAQManagement";
import ChatManagement from "@/components/admin/ChatManagement";
import TicketManagement from "@/components/admin/TicketManagement";
import AIAssistantDashboard from "@/components/admin/AIAssistantDashboard";
import SiteContentManagement from "@/components/admin/SiteContentManagement";
import BusinessIntelligence from "@/components/admin/BusinessIntelligence";
import ReturnsManagement from "@/components/admin/ReturnsManagement";
import CategoryManagement from "@/components/admin/CategoryManagement";
import AdminPasswordChange from "@/components/admin/AdminPasswordChange";
import AffiliateManagement from "@/components/admin/AffiliateManagement";
import APIKeyManagement from "@/components/admin/APIKeyManagement";
import WebhookManagement from "@/components/admin/WebhookManagement";

// Re-export all admin page components for routing
export const adminRoutes = [
  { path: "", element: <AdminDashboard /> },
  { path: "bi", element: <BusinessIntelligence /> },
  { path: "site-content", element: <SiteContentManagement /> },
  { path: "products", element: <ProductManagement /> },
  { path: "categories", element: <CategoryManagement /> },
  { path: "orders", element: <OrderManagement /> },
  { path: "customers", element: <CustomerManagement /> },
  { path: "coupons", element: <CouponManagement /> },
  { path: "promotions", element: <PromotionManagement /> },
  { path: "referrals", element: <ReferralManagement /> },
  { path: "campaigns", element: <CampaignManagement /> },
  { path: "affiliates", element: <AffiliateManagement /> },
  { path: "payments", element: <div className="bg-card border border-border rounded-2xl p-5 sm:p-6"><PaymentSettings /></div> },
  { path: "shipping", element: <div className="bg-card border border-border rounded-2xl p-5 sm:p-6"><ShippingManagement /></div> },
  { path: "suppliers", element: <SupplierManagement /> },
  { path: "inventory", element: <InventoryManagement /> },
  { path: "blog", element: <BlogManagement /> },
  { path: "helpcenter", element: <HelpCenterManagement /> },
  { path: "faq", element: <FAQManagement /> },
  { path: "chat", element: <ChatManagement /> },
  { path: "tickets", element: <TicketManagement /> },
  { path: "returns", element: <ReturnsManagement /> },
  { path: "tracking", element: <TrackingManagement /> },
  { path: "seo", element: <SEOManagement /> },
  { path: "ai-assistant", element: <AIAssistantDashboard /> },
  { path: "api-keys", element: <APIKeyManagement /> },
  { path: "webhooks", element: <WebhookManagement /> },
  { path: "backup", element: <div className="space-y-6"><AdminPasswordChange /><APIHealthDashboard /><BackupManagement /></div> },
];
