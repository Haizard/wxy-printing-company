import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

// ── PDF Export ─────────────────────────────────────────────────────────────

interface PDFColumn {
  header: string;
  accessor: string | ((row: any) => string | number);
  width?: number;
}

interface PDFExportOptions {
  title: string;
  subtitle?: string;
  columns: PDFColumn[];
  data: any[];
  filename: string;
  company?: string;
  footer?: string;
}

export function generatePDF(options: PDFExportOptions) {
  const {
    title,
    subtitle,
    columns,
    data,
    filename,
    company = "WXY Business Solutions",
    footer,
  } = options;

  const doc = new jsPDF({ orientation: columns.length > 5 ? "landscape" : "portrait" });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(255, 90, 60); // WXY red-orange
  doc.rect(0, 0, pageWidth, 35, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(company, 15, 15);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(title, 15, 23);

  if (subtitle) {
    doc.setFontSize(8);
    doc.text(subtitle, 15, 29);
  }

  // Date on the right
  doc.setFontSize(8);
  doc.text(`Generated: ${new Date().toLocaleDateString("en-TZ", { year: "numeric", month: "long", day: "numeric" })}`, pageWidth - 15, 15, { align: "right" });
  doc.text(`Time: ${new Date().toLocaleTimeString("en-TZ")}`, pageWidth - 15, 21, { align: "right" });

  // Table
  const head = [columns.map((c) => c.header)];
  const body = data.map((row) =>
    columns.map((c) => {
      if (typeof c.accessor === "function") return c.accessor(row);
      return row[c.accessor] ?? "—";
    })
  );

  autoTable(doc, {
    startY: 42,
    head,
    body,
    styles: {
      fontSize: 8,
      cellPadding: 3,
      overflow: "linebreak",
      font: "helvetica",
    },
    headStyles: {
      fillColor: [255, 90, 60],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
    margin: { top: 42, bottom: 20, left: 15, right: 15 },
  });

  // Footer
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(7);
  doc.setTextColor(160, 160, 165);
  doc.text(
    footer || `${company} — Inventory & Production Report System`,
    pageWidth / 2,
    pageHeight - 8,
    { align: "center" }
  );

  doc.save(`${filename}.pdf`);
}

// ── Excel Export ───────────────────────────────────────────────────────────

interface ExcelSheet {
  name: string;
  columns: { header: string; accessor: string | ((row: any) => string | number) }[];
  data: any[];
}

interface ExcelExportOptions {
  sheets: ExcelSheet[];
  filename: string;
  company?: string;
}

export function generateExcel(options: ExcelExportOptions) {
  const { sheets, filename, company = "WXY Business Solutions" } = options;

  const wb = XLSX.utils.book_new();

  // Summary sheet first
  const summaryData = sheets.map((s) => ({
    "Sheet Name": s.name,
    "Rows": s.data.length,
    "Columns": s.columns.length,
    "Generated": new Date().toISOString(),
  }));
  const summaryWs = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");

  // Data sheets
  for (const sheet of sheets) {
    const rows = sheet.data.map((row) => {
      const obj: Record<string, any> = {};
      for (const col of sheet.columns) {
        if (typeof col.accessor === "function") {
          obj[col.header] = col.accessor(row);
        } else {
          obj[col.header] = row[col.accessor] ?? "";
        }
      }
      return obj;
    });

    const ws = XLSX.utils.json_to_sheet(rows);

    // Auto-width columns
    const colWidths = sheet.columns.map((col) => ({
      wch: Math.min(40, Math.max(
        col.header.length + 2,
        ...rows.map((r) => String(r[col.header] ?? "").length + 2)
      )),
    }));
    ws["!cols"] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, sheet.name.slice(0, 31)); // Excel 31-char limit
  }

  XLSX.writeFile(wb, `${filename}.xlsx`);
}

// ── CSV Export ─────────────────────────────────────────────────────────────

interface CSVExportOptions {
  columns: { header: string; accessor: string | ((row: any) => string | number) }[];
  data: any[];
  filename: string;
}

export function generateCSV(options: CSVExportOptions) {
  const { columns, data, filename } = options;

  const header = columns.map((c) => `"${c.header}"`).join(",");
  const rows = data.map((row) =>
    columns
      .map((c) => {
        const val = typeof c.accessor === "function" ? c.accessor(row) : row[c.accessor] ?? "";
        return `"${String(val).replace(/"/g, '""')}"`;
      })
      .join(",")
  );

  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// ── Format Helpers ─────────────────────────────────────────────────────────

export function formatTZS(value: number): string {
  return new Intl.NumberFormat("en-TZ", {
    style: "currency",
    currency: "TZS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-TZ", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-TZ", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Single Invoice PDF (receipt-style) ────────────────────────────────────

export interface InvoiceSettings {
  companyName?: string;
  companyTagline?: string;
  addressLine1?: string;
  addressLine2?: string;
  addressCity?: string;
  addressCountry?: string;
  contactPhone?: string;
  contactEmail?: string;
  logoUrl?: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  swiftCode?: string;
  bankCode?: string;
  branchCode?: string;
  mpesaNumber?: string;
  defaultNotes?: string;
  thankYouMessage?: string;
  headerColorLeft?: string;
  headerColorRight?: string;
}

export interface InvoicePDFData {
  invoiceNumber: string;
  customerName: string;
  customerBusiness?: string;
  createdAt: string;
  dueDate?: string;
  status: string;
  lines: { description: string; quantity: number; unitPrice: number; taxRate?: number; lineTotal: number }[];
  subtotal: number;
  taxTotal: number;
  total: number;
  amountPaid: number;
  notes?: string;
  terms?: string;
  settings?: InvoiceSettings;
}

// Resolve logo to a data URL that jsPDF can consume.
// - data URLs are returned as-is
// - SVG file URLs are fetched, drawn on canvas → PNG data URL
async function resolveLogoForPdf(logoUrl: string): Promise<string | null> {
  try {
    if (!logoUrl || logoUrl === "/wxy-logo.svg") {
      // For the default SVG, fetch it from the same origin
      const resp = await fetch("/wxy-logo.svg", { credentials: "same-origin" });
      if (!resp.ok) return null;
      const svgText = await resp.text();
      const svgBlob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
      const blobUrl = URL.createObjectURL(svgBlob);
      try {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = blobUrl;
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error("SVG image load failed"));
          setTimeout(() => reject(new Error("SVG image timeout")), 5000);
        });
        const w = img.naturalWidth || 400;
        const h = img.naturalHeight || 140;
        const canvas = document.createElement("canvas");
        canvas.width = w * 2; // 2x for quality
        canvas.height = h * 2;
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL("image/png");
      } finally {
        URL.revokeObjectURL(blobUrl);
      }
    }
    // Already a data URL — use directly
    if (logoUrl.startsWith("data:")) return logoUrl;
    // External URL — fetch and convert
    const resp = await fetch(logoUrl, { credentials: "include" });
    if (!resp.ok) return null;
    const ct = resp.headers.get("content-type") || "";
    if (ct.includes("image/png") || ct.includes("image/jpeg")) {
      const blob = await resp.blob();
      return await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => resolve("");
        reader.readAsDataURL(blob);
      });
    }
    // SVG external URL
    const svgText = await resp.text();
    const svgBlob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
    const blobUrl = URL.createObjectURL(svgBlob);
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = blobUrl;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("SVG image load failed"));
        setTimeout(() => reject(new Error("SVG image timeout")), 5000);
      });
      const w = img.naturalWidth || 400;
      const h = img.naturalHeight || 140;
      const canvas = document.createElement("canvas");
      canvas.width = w * 2;
      canvas.height = h * 2;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL("image/png");
    } finally {
      URL.revokeObjectURL(blobUrl);
    }
  } catch (e) {
    console.warn("[Invoice] Logo resolution failed:", e);
    return null;
  }
}

export async function generateInvoicePDF(invoice: InvoicePDFData) {
  const s = invoice.settings || {};
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const ml = 10; // left margin
  const mr = 10; // right margin
  const contentWidth = pageWidth - ml - mr;
  let y = 8;

  // Resolve logo for PDF embedding (always tries — default logo included)
  let logoDataUrl: string | null = null;
  logoDataUrl = await resolveLogoForPdf(s.logoUrl || "/wxy-logo.svg");

  // Parse colors
  const parseHex = (hex: string) => {
    const h = hex.replace("#", "");
    return [parseInt(h.substring(0, 2), 16), parseInt(h.substring(2, 4), 16), parseInt(h.substring(4, 6), 16)];
  };
  const [cLr, cLg, cLb] = parseHex(s.headerColorLeft || "#ff0606");
  const [cRr, cRg, cRb] = parseHex(s.headerColorRight || "#cc1f1f");

  // ── Red header bar (two-tone) ──
  doc.setFillColor(cLr, cLg, cLb);
  doc.rect(0, 0, pageWidth / 2, 24, "F");
  doc.setFillColor(cRr, cRg, cRb);
  doc.rect(pageWidth / 2, 0, pageWidth / 2, 24, "F");

  // Company name + contact info in white on red bar (no logo in header)
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(s.companyName || "WXY SOLUTIONS", ml, 10);

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text(s.addressLine1 || "Dar Es Salaam Branch, Cocacola Road", ml, 16);
  doc.text(s.addressLine2 || "Sokoine Road, Central Plaza Opp, Naaz Hotel & Fifi's Cafe", ml, 20);

  // Contact info (right side, white on red)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("Contact Information", pageWidth - mr, 10, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.text(`Mobile: ${s.contactPhone || "+255 764 713 056 | +255 746 589 376"}`, pageWidth - mr, 16, { align: "right" });

  y = 30;

  // ── "INVOICE" title + tagline ──
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("INVOICE", ml, y + 6);

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 105);
  doc.text(s.companyTagline || "DESIGN | PRINTING | BRANDING | 3D SIGNAGE", ml, y + 12);

  // ── Amount Due box (right) ──
  const boxX = pageWidth - mr - 55;
  const boxY = y - 2;
  doc.setDrawColor(200, 200, 205);
  doc.setLineWidth(0.3);
  doc.roundedRect(boxX, boxY, 55, 16, 1, 1, "S");
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 85);
  doc.text("Amount Due (TZS)", boxX + 27.5, boxY + 5, { align: "center" });
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  const balance = invoice.total - invoice.amountPaid;
  doc.text(`Sh${balance.toLocaleString("en-US")}.00`, boxX + 27.5, boxY + 13, { align: "center" });

  y += 22;

  // ── Bill To (left) + Invoice Details (right) ──
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text("BILL TO", ml, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(invoice.customerBusiness || invoice.customerName, ml, y + 6);
  doc.setTextColor(80, 80, 85);
  doc.setFontSize(8);
  doc.text(invoice.customerName, ml, y + 11);

  // Invoice details (right side)
  const detailX = pageWidth - mr - 60;
  doc.setTextColor(80, 80, 85);
  doc.setFontSize(8);
  doc.text("Invoice Number:", detailX, y);
  doc.text(invoice.invoiceNumber, detailX + 40, y);
  doc.text("Invoice Date:", detailX, y + 6);
  doc.text(formatDate(invoice.createdAt), detailX + 40, y + 6);
  doc.text("Payment Due:", detailX, y + 12);
  doc.text(invoice.dueDate ? formatDate(invoice.dueDate) : "—", detailX + 40, y + 12);
  doc.text("Amount Due (TZS):", detailX, y + 18);
  doc.setFont("helvetica", "bold");
  doc.text(`Sh${balance.toLocaleString("en-US")}.00`, detailX + 40, y + 18);

  y += 30;

  // ── Line items table ──
  const head = [["PRODUCTS", "QUANTITY", "PRICE", "AMOUNT"]];
  // Filter out empty/zero-value line items
  const validLines = invoice.lines.filter((l) => l.description && l.lineTotal > 0);
  const body = validLines.map((l) => [
    l.description,
    String(l.quantity),
    `Sh${l.unitPrice.toLocaleString("en-US")}.00`,
    `Sh${l.lineTotal.toLocaleString("en-US")}.00`,
  ]);

  autoTable(doc, {
    startY: y,
    head,
    body,
    styles: {
      fontSize: 9,
      cellPadding: 5,
      overflow: "linebreak",
      font: "helvetica",
      textColor: [30, 30, 35],
      lineColor: [220, 222, 226],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [35, 35, 40],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
      cellPadding: 6,
    },
    alternateRowStyles: { fillColor: [248, 249, 250] },
    columnStyles: {
      0: { cellWidth: "auto", fontStyle: "bold" },
      1: { cellWidth: 28, halign: "center" },
      2: { cellWidth: 38, halign: "right" },
      3: { cellWidth: 38, halign: "right", fontStyle: "bold" },
    },
    margin: { left: ml, right: mr },
    didDrawCell: (data) => {
      // Add subtle bottom border to each row
      if (data.section === "body") {
        const { x, y: cy, width, height } = data.cell;
        doc.setDrawColor(230, 232, 235);
        doc.setLineWidth(0.1);
        doc.line(x, cy + height, x + width, cy + height);
      }
    },
  });

  // @ts-ignore – jspdf-autotable types lag behind
  y = (doc as any).lastAutoTable?.finalY || y + 20;

  // ── Totals (right-aligned, styled) ──
  const totalsX = pageWidth - mr - 65;
  y += 10;

  // Separator line above totals
  doc.setDrawColor(180, 182, 186);
  doc.setLineWidth(0.3);
  doc.line(totalsX, y, pageWidth - mr, y);

  y += 6;
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 55);
  doc.setFont("helvetica", "normal");
  doc.text("Total:", totalsX, y);
  doc.text(`Sh${invoice.total.toLocaleString("en-US")}.00`, pageWidth - mr, y, { align: "right" });

  y += 8;
  doc.setDrawColor(35, 35, 40);
  doc.setLineWidth(0.4);
  doc.line(totalsX, y, pageWidth - mr, y);

  y += 7;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text("Amount Due (TZS):", totalsX, y);
  doc.text(`Sh${balance.toLocaleString("en-US")}.00`, pageWidth - mr, y, { align: "right" });

  // ── Notes / Terms (bank details from settings) ──
  y += 16;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text("Notes / Terms", ml, y);

  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(60, 60, 65);
  const bankNotes = [
    s.defaultNotes || "Free Consultation at Your Business Premises if located within Arusha",
    "",
    "All PAYMENTS Should be made through",
    "",
    s.bankName || "NMB CLOCK TOWER",
    s.accountNumber ? `ACCOUNT NUMBER: ${s.accountNumber}` : "ACCOUNT NUMBER: 4081 0217 414",
    s.accountName ? `NAME: ${s.accountName}` : "NAME: WXY SOLUTION INVESTMENTS",
    s.swiftCode ? `SWIFT CODE: ${s.swiftCode}` : "SWIFT CODE: NMIBTZTZ",
    s.bankCode ? `BANK CODE: ${s.bankCode}` : "BANK CODE: 016408",
    s.branchCode ? `BRANCH CODE: ${s.branchCode}` : "BRANCH CODE: 408",
    "",
    s.mpesaNumber ? `M-PESA LIPA NUMBER: ${s.mpesaNumber}` : "M-PESA LIPA NUMBER",
  ];
  bankNotes.forEach((line) => {
    if (line) doc.text(line, ml, y);
    y += 4;
  });

  // Custom notes/terms from invoice data
  if (invoice.notes) {
    y += 2;
    const noteLines = doc.splitTextToSize(invoice.notes, contentWidth);
    doc.text(noteLines, ml, y);
    y += noteLines.length * 4;
  }
  if (invoice.terms) {
    y += 2;
    const termLines = doc.splitTextToSize(invoice.terms, contentWidth);
    doc.text(termLines, ml, y);
    y += termLines.length * 4;
  }

  // ── Thank you message ──
  y += 10;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 65);
  doc.text(s.thankYouMessage || "Thank you for the business", pageWidth / 2, y, { align: "center" });

  // ── Separator line between body and footer ──
  y += 12;
  doc.setDrawColor(150, 150, 155);
  doc.setLineWidth(0.5);
  doc.line(ml, y, pageWidth - mr, y);

  // ── Footer: 3-column layout (logo | company+address | contact) ──
  const footerY = y + 8;
  const colLeft = ml; // logo column
  const colMid = 60; // company name starts after logo space
  const colRight = pageWidth - mr - 55; // contact column

  // Left: logo (bigger)
  if (logoDataUrl) {
    try {
      const logoW = 45;
      const logoH = 18;
      doc.addImage(logoDataUrl, "PNG", colLeft, footerY - 2, logoW, logoH);
    } catch { /* ignore if image fails */ }
  }

  // Middle: company name + address
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text(s.companyName || "WXY SOLUTIONS", colMid, footerY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(80, 80, 85);
  doc.text(s.addressLine1 || "Dar Es Salaam Branch, Cocacola Road", colMid, footerY + 5);
  doc.text(s.addressLine2 || "Sokoine Road, Central Plaza Opp, Naaz Hotel & Fifi's Cafe", colMid, footerY + 10);
  doc.text(s.addressCity || "Arusha, Arusha", colMid, footerY + 15);
  doc.text(s.addressCountry || "Tanzania, United Republic of", colMid, footerY + 20);

  // Right: contact info
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("Contact Information", colRight + 55, footerY, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text(`Mobile: ${s.contactPhone || "+255 764 713 056 | +255 746 589 376"}`, colRight + 55, footerY + 5, { align: "right" });

  // ── Page number ──
  doc.setFontSize(7);
  doc.setTextColor(140, 140, 145);
  doc.text(`Page 1 of 1 for INVOICE #${invoice.invoiceNumber}`, pageWidth / 2, pageHeight - 10, { align: "center" });

  doc.save(`${invoice.invoiceNumber}.pdf`);
}

// ── Print Invoice as Receipt ───────────────────────────────────────────────

export function printInvoice(invoice: InvoicePDFData) {
  const s = invoice.settings || {};
  const balance = invoice.total - invoice.amountPaid;
  const headerLeft = s.headerColorLeft || "#ff0606";
  const headerRight = s.headerColorRight || "#cc1f1f";
  const companyName = s.companyName || "WXY SOLUTIONS";
  const addr1 = s.addressLine1 || "Dar Es Salaam Branch, Cocacola Road";
  const addr2 = s.addressLine2 || "Sokoine Road, Central Plaza Opp, Naaz Hotel & Fifi's Cafe";
  const addrCity = s.addressCity || "Arusha, Arusha";
  const addrCountry = s.addressCountry || "Tanzania, United Republic of";
  const phone = s.contactPhone || "+255 764 713 056 | +255 746 589 376";
  const tagline = s.companyTagline || "DESIGN | PRINTING | BRANDING | 3D SIGNAGE";
  const logo = s.logoUrl || "/wxy-logo.svg";
  const bankName = s.bankName || "NMB CLOCK TOWER";
  const acctNum = s.accountNumber || "4081 0217 414";
  const acctName = s.accountName || "WXY SOLUTION INVESTMENTS";
  const swift = s.swiftCode || "NMIBTZTZ";
  const bCode = s.bankCode || "016408";
  const brCode = s.branchCode || "408";
  const mpesa = s.mpesaNumber || "";
  const defaultNotes = s.defaultNotes || "Free Consultation at Your Business Premises if located within Arusha";
  const thankYou = s.thankYouMessage || "Thank you for the business";

  const validLines = invoice.lines.filter(l => l.description && l.lineTotal > 0);
  const lineRows = validLines.map(l => `
        <tr>
          <td><strong>${l.description}</strong></td>
          <td class="center">${l.quantity}</td>
          <td class="right">Sh${l.unitPrice.toLocaleString("en-US")}.00</td>
          <td class="right amount">Sh${l.lineTotal.toLocaleString("en-US")}.00</td>
        </tr>`).join("");

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice ${invoice.invoiceNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif; padding: 40px; color: #000; max-width: 800px; margin: 0 auto; background: white; }
    .company-header { margin-bottom: 10px; }
    .company-name { font-size: 20px; font-weight: 800; color: #000; }
    .company-address { font-size: 11px; color: #505055; line-height: 1.6; margin-top: 4px; }
    .contact-info { float: right; text-align: right; margin-top: -40px; }
    .contact-info .label { font-size: 12px; font-weight: 700; color: #000; }
    .contact-info .number { font-size: 11px; color: #505055; margin-top: 2px; }
    .invoice-title { margin-top: 16px; }
    .invoice-title h1 { font-size: 28px; font-weight: 800; color: #000; }
    .invoice-title .tagline { font-size: 11px; color: #646469; margin-top: 4px; letter-spacing: 0.5px; }
    .amount-box { float: right; border: 1px solid #ccc; border-radius: 6px; padding: 10px 20px; text-align: center; margin-top: -60px; width: 200px; }
    .amount-box .label { font-size: 11px; color: #505055; }
    .amount-box .value { font-size: 18px; font-weight: 800; color: #000; margin-top: 4px; }
    .bill-details { display: flex; justify-content: space-between; margin-top: 30px; padding-bottom: 10px; }
    .bill-to .label { font-size: 12px; font-weight: 700; color: #000; text-transform: uppercase; margin-bottom: 6px; }
    .bill-to .name { font-size: 13px; font-weight: 600; }
    .bill-to .phone { font-size: 12px; color: #505055; margin-top: 4px; }
    .invoice-meta { text-align: right; font-size: 12px; color: #505055; }
    .invoice-meta .row { margin-bottom: 4px; }
    .invoice-meta .label { font-weight: 400; }
    .invoice-meta .value { font-weight: 600; color: #000; margin-left: 8px; }
    .products-table { width: 100%; border-collapse: collapse; margin-top: 24px; border-radius: 6px; overflow: hidden; }
    .products-table th { background: #232328; color: #fff; padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px; }
    .products-table td { padding: 10px 14px; border-bottom: 1px solid #e8eaed; font-size: 12px; color: #1e1e23; }
    .products-table td.center { text-align: center; }
    .products-table td.right { text-align: right; }
    .products-table td.amount { font-weight: 600; }
    .products-table th.right, .products-table th.center { text-align: inherit; }
    .products-table tr:nth-child(even) { background: #f8f9fa; }
    .products-table tr:hover { background: #f0f1f3; }
    .totals-section { margin-top: 24px; text-align: right; width: 300px; margin-left: auto; padding: 12px 0; }
    .totals-section .row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 13px; color: #3c3c41; }
    .totals-section .row.total { border-top: 1px solid #dcdfe2; padding-top: 10px; margin-top: 6px; font-weight: 700; font-size: 14px; }
    .totals-section .row.amount-due { font-weight: 800; font-size: 15px; margin-top: 6px; border-top: 2px solid #232328; padding-top: 10px; color: #000; }
    .notes-section { margin-top: 30px; border-top: 1px solid #eee; padding-top: 16px; }
    .notes-section h3 { font-size: 13px; font-weight: 700; margin-bottom: 8px; }
    .notes-section p { font-size: 11px; color: #505055; line-height: 1.7; }
    .thank-you { text-align: center; margin-top: 30px; font-size: 14px; font-style: italic; color: #3c3c41; }
    .footer-separator { border-top: 1.5px solid #999; margin: 30px 0 8px 0; }
    .bottom-company { margin-top: 0; display: flex; justify-content: space-between; align-items: flex-start; padding-top: 12px; gap: 20px; }
    .bottom-logo { flex: 0 0 auto; }
    .bottom-logo img { height: 50px; width: auto; display: block; }
    .bottom-center { flex: 0 0 auto; text-align: center; }
    .bottom-center .company-name { font-size: 12px; font-weight: 700; text-align: center; margin-bottom: 4px; }
    .bottom-center .details { font-size: 9px; color: #505055; line-height: 1.5; text-align: center; }
    .bottom-contact { flex: 0 0 auto; text-align: right; min-width: 160px; }
    .bottom-contact .label { font-size: 11px; font-weight: 700; }
    .bottom-contact .number { font-size: 10px; color: #505055; }
    .page-footer { text-align: center; margin-top: 30px; font-size: 10px; color: #8c8c91; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div style="background: linear-gradient(to right, ${headerLeft} 50%, ${headerRight} 50%); color: white; padding: 16px 20px; border-radius: 6px 6px 0 0;">
    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
      <div>
        <div class="company-name">${companyName}</div>
        <div style="font-size: 10px; opacity: 0.9; margin-top: 4px; line-height: 1.5;">
          ${addr1}<br>
          ${addr2}<br>
          ${addrCity}<br>
          ${addrCountry}
        </div>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 12px; font-weight: 700;">Contact Information</div>
        <div style="font-size: 10px; opacity: 0.9; margin-top: 4px;">Mobile: ${phone}</div>
      </div>
    </div>
  </div>

  <div class="invoice-title">
    <h1>INVOICE</h1>
    <div class="tagline">${tagline}</div>
  </div>

  <div class="amount-box">
    <div class="label">Amount Due (TZS)</div>
    <div class="value">Sh${balance.toLocaleString("en-US")}.00</div>
  </div>

  <div class="bill-details">
    <div class="bill-to">
      <div class="label">BILL TO</div>
      <div class="name">${invoice.customerBusiness || invoice.customerName}</div>
      <div class="phone">${invoice.customerName}</div>
    </div>
    <div class="invoice-meta">
      <div class="row"><span class="label">Invoice Number:</span><span class="value">${invoice.invoiceNumber}</span></div>
      <div class="row"><span class="label">Invoice Date:</span><span class="value">${formatDate(invoice.createdAt)}</span></div>
      <div class="row"><span class="label">Payment Due:</span><span class="value">${invoice.dueDate ? formatDate(invoice.dueDate) : "—"}</span></div>
      <div class="row"><span class="label">Amount Due (TZS):</span><span class="value">Sh${balance.toLocaleString("en-US")}.00</span></div>
    </div>
  </div>

  <table class="products-table">
    <thead>
      <tr>
        <th>PRODUCTS</th>
        <th class="center">QUANTITY</th>
        <th class="right">PRICE</th>
        <th class="right">AMOUNT</th>
      </tr>
    </thead>
    <tbody>
      ${lineRows}
    </tbody>
  </table>

  <div class="totals-section">
    <div class="row total"><span>Total:</span><span>Sh${invoice.total.toLocaleString("en-US")}.00</span></div>
    <div class="row amount-due"><span>Amount Due (TZS):</span><span>Sh${balance.toLocaleString("en-US")}.00</span></div>
  </div>

  <div class="notes-section">
    <h3>Notes / Terms</h3>
    <p>
      ${defaultNotes}<br><br>
      All PAYMENTS Should be made through<br><br>
      <strong>${bankName}</strong><br>
      ACCOUNT NUMBER: ${acctNum}<br>
      NAME: ${acctName}<br>
      SWIFT CODE: ${swift}<br>
      BANK CODE: ${bCode}<br>
      BRANCH CODE: ${brCode}<br>${mpesa ? `<br>M-PESA LIPA NUMBER: ${mpesa}` : "<br><br>M-PESA LIPA NUMBER"}
    </p>
    ${invoice.notes ? `<p style="margin-top: 12px;"><strong>Notes:</strong> ${invoice.notes}</p>` : ""}
    ${invoice.terms ? `<p style="margin-top: 8px;"><strong>Terms:</strong> ${invoice.terms}</p>` : ""}
  </div>

  <div class="thank-you">${thankYou}</div>

  <div class="footer-separator"></div>

  <div class="bottom-company">
    <div class="bottom-logo">
      <img src="${logo}" alt="WXY" style="height: 50px; width: auto; display: block;" />
    </div>
    <div class="bottom-center">
      <div style="font-size: 12px; font-weight: 700;">${companyName}</div>
      <div style="font-size: 9px; color: #505055; margin-top: 4px; line-height: 1.5;">
        ${addr1}<br>
        ${addr2}<br>
        ${addrCity}<br>
        ${addrCountry}
      </div>
    </div>
    <div class="bottom-contact">
      <div class="label">Contact Information</div>
      <div class="number">Mobile: ${phone}</div>
    </div>
  </div>

  <div class="page-footer">Page 1 of 1 for INVOICE #${invoice.invoiceNumber}</div>
</body>
</html>`;

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 400);
  }
}
