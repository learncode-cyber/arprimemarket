import { memo } from "react";
import { Download } from "lucide-react";
import { useCurrency } from "@/context/CurrencyContext";
import { toast } from "sonner";

interface OrderData {
  order_number: string;
  created_at: string;
  status: string;
  payment_status: string;
  shipping_name: string | null;
  shipping_phone: string | null;
  shipping_email: string | null;
  shipping_address: string | null;
  shipping_city: string | null;
  shipping_country: string | null;
  subtotal: number;
  discount_amount: number;
  shipping_cost: number;
  tax_amount: number;
  total: number;
  tracking_number: string | null;
  payment_method: string | null;
}

interface OrderItem {
  title: string;
  quantity: number;
  price: number;
  total: number;
}

interface InvoiceDownloadProps {
  order: OrderData;
  items: OrderItem[];
  className?: string;
}

const generateInvoiceNumber = (orderNumber: string): string => {
  return `INV-${orderNumber.replace("ARP-", "")}`;
};

export const InvoiceDownload = memo(({ order, items, className = "" }: InvoiceDownloadProps) => {
  const { formatPrice } = useCurrency();

  const downloadPDF = () => {
    const invoiceNumber = generateInvoiceNumber(order.order_number);
    const date = new Date(order.created_at).toLocaleDateString("en-US", {
      year: "numeric", month: "long", day: "numeric",
    });

    // Generate HTML for PDF-like invoice
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice ${invoiceNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; padding: 40px; max-width: 800px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 3px solid #6366f1; padding-bottom: 20px; }
    .logo { font-size: 24px; font-weight: 800; color: #6366f1; letter-spacing: -0.5px; }
    .logo-sub { font-size: 11px; color: #888; margin-top: 2px; }
    .invoice-title { text-align: right; }
    .invoice-title h1 { font-size: 28px; color: #6366f1; font-weight: 300; text-transform: uppercase; letter-spacing: 4px; }
    .invoice-title p { font-size: 12px; color: #666; margin-top: 4px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
    .info-block h3 { font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: #999; margin-bottom: 8px; }
    .info-block p { font-size: 13px; line-height: 1.6; color: #444; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    th { background: #f8f8fc; padding: 12px 16px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #666; border-bottom: 2px solid #e5e5e5; }
    th:last-child { text-align: right; }
    td { padding: 14px 16px; font-size: 13px; border-bottom: 1px solid #f0f0f0; }
    td:last-child { text-align: right; font-weight: 600; }
    .qty { text-align: center; }
    .totals { display: flex; justify-content: flex-end; }
    .totals-table { width: 280px; }
    .totals-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 13px; color: #555; }
    .totals-row.total { border-top: 2px solid #1a1a1a; margin-top: 8px; padding-top: 12px; font-size: 18px; font-weight: 700; color: #1a1a1a; }
    .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 11px; color: #999; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">AR PRIME MARKET</div>
      <div class="logo-sub">Global E-Commerce Platform</div>
    </div>
    <div class="invoice-title">
      <h1>Invoice</h1>
      <p>${invoiceNumber}</p>
      <p>${date}</p>
    </div>
  </div>

  <div class="info-grid">
    <div class="info-block">
      <h3>Bill To</h3>
      <p>
        <strong>${order.shipping_name || "—"}</strong><br>
        ${order.shipping_phone || ""}<br>
        ${order.shipping_email || ""}<br>
        ${order.shipping_address || ""}, ${order.shipping_city || ""}<br>
        ${order.shipping_country || ""}
      </p>
    </div>
    <div class="info-block">
      <h3>Order Details</h3>
      <p>
        <strong>Order:</strong> ${order.order_number}<br>
        <strong>Payment:</strong> ${order.payment_method || "N/A"}<br>
        <strong>Status:</strong> ${order.status}<br>
        ${order.tracking_number ? `<strong>Tracking:</strong> ${order.tracking_number}` : ""}
      </p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th class="qty">Qty</th>
        <th>Unit Price</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      ${items.map(item => `
        <tr>
          <td>${item.title}</td>
          <td class="qty">${item.quantity}</td>
          <td>${formatPrice(item.price)}</td>
          <td>${formatPrice(item.total)}</td>
        </tr>
      `).join("")}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-table">
      <div class="totals-row"><span>Subtotal</span><span>${formatPrice(order.subtotal)}</span></div>
      ${Number(order.discount_amount) > 0 ? `<div class="totals-row"><span>Discount</span><span>-${formatPrice(order.discount_amount)}</span></div>` : ""}
      <div class="totals-row"><span>Shipping</span><span>${Number(order.shipping_cost) > 0 ? formatPrice(order.shipping_cost) : "Free"}</span></div>
      ${Number(order.tax_amount) > 0 ? `<div class="totals-row"><span>Tax</span><span>${formatPrice(order.tax_amount)}</span></div>` : ""}
      <div class="totals-row total"><span>Total</span><span>${formatPrice(order.total)}</span></div>
    </div>
  </div>

  <div class="footer">
    <p>Thank you for shopping with AR Prime Market!</p>
    <p style="margin-top: 4px;">This is a computer-generated invoice. No signature required.</p>
  </div>
</body>
</html>`;

    // Open in new window for print/save as PDF
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 500);
      toast.success("Invoice ready for download!");
    } else {
      // Fallback: download as HTML
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${invoiceNumber}.html`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Invoice downloaded!");
    }
  };

  return (
    <button
      onClick={downloadPDF}
      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:brightness-105 active:scale-[0.98] transition-all touch-manipulation ${className}`}
    >
      <Download className="w-3.5 h-3.5" />
      Download Invoice
    </button>
  );
});

InvoiceDownload.displayName = "InvoiceDownload";
