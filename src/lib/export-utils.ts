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
