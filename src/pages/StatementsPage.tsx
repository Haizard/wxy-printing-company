import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  FileText,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  User,
  Printer,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

function getAuthHeaders() {
  const token = localStorage.getItem("printhub_token");
  return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

interface StatementEntry {
  id: string;
  date: string;
  type: "invoice" | "payment" | "credit";
  reference: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

interface CustomerStatement {
  customerId: string;
  customerName: string;
  customerEmail?: string;
  customerAddress?: string;
  entries: StatementEntry[];
  openingBalance: number;
  closingBalance: number;
  totalInvoiced: number;
  totalPaid: number;
}

export default function StatementsPage() {
  const { user } = useAuth();
  const [statements, setStatements] = useState<CustomerStatement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-TZ", { style: "currency", currency: "TZS", minimumFractionDigits: 0 }).format(amount);
  }

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (customers.length > 0) fetchStatements();
  }, [dateRange, selectedCustomer, customers]);

  const fetchCustomers = async () => {
    try {
      const res = await fetch("/api/customer-profiles", { headers: getAuthHeaders() });
      const data = await res.json();
      const profiles = Array.isArray(data) ? data : [];
      setCustomers(profiles.map((c: any) => ({ id: c.userId, name: c.userName || c.businessName || "Unknown" })));
    } catch (error) {
      console.error("Failed to fetch customers:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatements = async () => {
    try {
      const customerIds = selectedCustomer ? [selectedCustomer] : customers.map((c) => c.id);
      const results: CustomerStatement[] = [];

      for (const cid of customerIds) {
        const params = new URLSearchParams({
          startDate: dateRange.start,
          endDate: dateRange.end,
        });
        const res = await fetch(`/api/statements/${cid}?${params}`, { headers: getAuthHeaders() });
        if (!res.ok) continue;
        const data = await res.json();
        const customer = data.customer;
        const invoices = data.invoices || [];
        const payments = data.payments || [];
        const totalInvoiced = invoices.reduce((sum: number, inv: any) => sum + (inv.total || 0), 0);
        const totalPaid = payments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

        // Build entries
        const entries: StatementEntry[] = [];
        let runningBalance = 0;
        for (const inv of invoices) {
          runningBalance += inv.total || 0;
          entries.push({
            id: inv.id,
            date: inv.createdAt,
            type: "invoice",
            reference: inv.invoiceNumber,
            description: `Invoice ${inv.invoiceNumber}`,
            debit: inv.total || 0,
            credit: 0,
            balance: runningBalance,
          });
        }
        for (const pay of payments) {
          runningBalance -= pay.amount || 0;
          entries.push({
            id: pay.id,
            date: pay.createdAt,
            type: "payment",
            reference: pay.reference || "Payment",
            description: `Payment via ${pay.paymentMethod || "cash"}`,
            debit: 0,
            credit: pay.amount || 0,
            balance: runningBalance,
          });
        }

        results.push({
          customerId: cid,
          customerName: customer?.name || customers.find((c) => c.id === cid)?.name || "Unknown",
          customerEmail: customer?.email,
          entries: entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
          openingBalance: 0,
          closingBalance: totalInvoiced - totalPaid,
          totalInvoiced,
          totalPaid,
        });
      }
      setStatements(results);
    } catch (error) {
      console.error("Failed to fetch statements:", error);
    }
  };

  const handlePrint = (statement: CustomerStatement) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Statement - ${statement.customerName}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
            .header { display: flex; justify-content: space-between; margin-bottom: 30px; border-bottom: 2px solid #2563eb; padding-bottom: 20px; }
            .company { font-size: 24px; font-weight: bold; color: #2563eb; }
            .customer { margin-bottom: 20px; }
            .customer h3 { margin: 0 0 5px; }
            .customer p { margin: 0; color: #666; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th { background: #f1f5f9; padding: 10px; text-align: left; font-size: 12px; text-transform: uppercase; color: #64748b; }
            td { padding: 10px; border-bottom: 1px solid #e2e8f0; }
            .text-right { text-align: right; }
            .debit { color: #dc2626; }
            .credit { color: #16a34a; }
            .totals { margin-top: 20px; text-align: right; }
            .totals .row { display: flex; justify-content: space-between; width: 300px; margin-left: auto; padding: 5px 0; }
            .totals .grand { font-weight: bold; font-size: 16px; border-top: 2px solid #2563eb; padding-top: 10px; }
            .footer { margin-top: 40px; text-align: center; color: #999; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company">Freebuff</div>
            <div style="text-align:right">
              <strong>Account Statement</strong><br>
              ${dateRange.start} to ${dateRange.end}
            </div>
          </div>
          <div class="customer">
            <h3>${statement.customerName}</h3>
            ${statement.customerEmail ? `<p>${statement.customerEmail}</p>` : ""}
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Reference</th>
                <th>Description</th>
                <th class="text-right">Debit</th>
                <th class="text-right">Credit</th>
                <th class="text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              ${statement.entries.map((e) => `
                <tr>
                  <td>${new Date(e.date).toLocaleDateString()}</td>
                  <td>${e.type}</td>
                  <td>${e.reference}</td>
                  <td>${e.description}</td>
                  <td class="text-right ${e.debit > 0 ? "debit" : ""}">${e.debit > 0 ? `TZS ${e.debit.toLocaleString()}` : "-"}</td>
                  <td class="text-right ${e.credit > 0 ? "credit" : ""}">${e.credit > 0 ? `TZS ${e.credit.toLocaleString()}` : "-"}</td>
                  <td class="text-right">TZS ${e.balance.toLocaleString()}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
          <div class="totals">
            <div class="row"><span>Total Invoiced:</span> <span>TZS ${statement.totalInvoiced.toLocaleString()}</span></div>
            <div class="row"><span>Total Paid:</span> <span class="credit">TZS ${statement.totalPaid.toLocaleString()}</span></div>
            <div class="row grand"><span>Outstanding Balance:</span> <span>TZS ${statement.closingBalance.toLocaleString()}</span></div>
          </div>
          <div class="footer">
            Generated on ${new Date().toLocaleDateString()} by Freebuff
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const filtered = statements.filter(
    (s) =>
      s.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            to="/dashboard"
            className="p-2 rounded-lg bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Customer Statements
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Account statements showing invoices, payments, and balances
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Total Invoiced</p>
                <p className="text-2xl font-bold text-[var(--accent-primary)]">
                  {formatCurrency(statements.reduce((sum, s) => sum + s.totalInvoiced, 0))}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Total Paid</p>
                <p className="text-2xl font-bold text-[var(--accent-success)]">
                  {formatCurrency(statements.reduce((sum, s) => sum + s.totalPaid, 0))}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Outstanding</p>
                <p className="text-2xl font-bold text-[var(--accent-danger)]">
                  {formatCurrency(statements.reduce((sum, s) => sum + s.closingBalance, 0))}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <User className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Customers</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{statements.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={selectedCustomer || ""}
              onChange={(e) => setSelectedCustomer(e.target.value || null)}
              className="px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Customers</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="flex-1 px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="flex-1 px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Statements List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-slate-500 dark:text-slate-400 mt-4">Loading statements...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <FileText className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              No Statements Found
            </h3>
            <p className="text-slate-500 dark:text-slate-400">
              Create invoices and payments to generate customer statements
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((statement) => (
              <div
                key={statement.customerId}
                className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden"
              >
                <div
                  className="p-5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
                  onClick={() =>
                    setExpandedId(expandedId === statement.customerId ? null : statement.customerId)
                  }
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white">
                          {statement.customerName}
                        </h3>
                        <div className="flex items-center gap-3 mt-1 text-sm text-slate-500 dark:text-slate-400">
                          <span>{statement.entries.length} transactions</span>
                          <span>•</span>
                          <span>
                            {dateRange.start} to {dateRange.end}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-xs text-slate-500 dark:text-slate-400">Invoiced</p>
                        <p className="font-medium text-[var(--accent-primary)]">
                          {formatCurrency(statement.totalInvoiced)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500 dark:text-slate-400">Paid</p>
                        <p className="font-medium text-[var(--accent-success)]">
                          {formatCurrency(statement.totalPaid)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500 dark:text-slate-400">Balance</p>
                        <p className={`font-bold text-lg ${statement.closingBalance > 0 ? "text-[var(--accent-danger)]" : "text-[var(--accent-success)]"}`}>
                          {formatCurrency(statement.closingBalance)}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePrint(statement);
                        }}
                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        title="Print Statement"
                      >
                        <Printer className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Transaction List */}
                {expandedId === statement.customerId && (
                  <div className="border-t border-slate-200 dark:border-slate-700 p-5 bg-slate-50 dark:bg-slate-750">
                    {statement.entries.length === 0 ? (
                      <p className="text-center text-slate-500 dark:text-slate-400 py-4">
                        No transactions in this period
                      </p>
                    ) : (
                      <table className="w-full">
                        <thead>
                          <tr className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            <th className="pb-2">Date</th>
                            <th className="pb-2">Type</th>
                            <th className="pb-2">Reference</th>
                            <th className="pb-2">Description</th>
                            <th className="pb-2 text-right">Debit</th>
                            <th className="pb-2 text-right">Credit</th>
                            <th className="pb-2 text-right">Balance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {statement.entries.map((entry) => (
                            <tr key={entry.id} className="border-t border-slate-200 dark:border-slate-600">
                              <td className="py-2 text-sm text-slate-600 dark:text-slate-300">
                                {new Date(entry.date).toLocaleDateString()}
                              </td>
                              <td className="py-2">
                                <span
                                  className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                    entry.type === "invoice"
                                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                      : entry.type === "payment"
                                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                      : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                                  }`}
                                >
                                  {entry.type}
                                </span>
                              </td>
                              <td className="py-2 text-sm text-slate-600 dark:text-slate-300 font-mono">
                                {entry.reference}
                              </td>
                              <td className="py-2 text-sm text-slate-600 dark:text-slate-300">
                                {entry.description}
                              </td>
                              <td className="py-2 text-sm text-right font-medium text-[var(--accent-danger)]">
                                {entry.debit > 0 ? formatCurrency(entry.debit) : "-"}
                              </td>
                              <td className="py-2 text-sm text-right font-medium text-[var(--accent-success)]">
                                {entry.credit > 0 ? formatCurrency(entry.credit) : "-"}
                              </td>
                              <td className="py-2 text-sm text-right font-bold text-[var(--text-primary)]">
                                {formatCurrency(entry.balance)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
