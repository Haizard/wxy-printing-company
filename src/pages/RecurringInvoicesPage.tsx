import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Search,
  Calendar,
  Pause,
  Play,
  Trash2,
  Edit,
  Clock,
  DollarSign,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  FileText,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-TZ", { style: "currency", currency: "TZS", minimumFractionDigits: 0 }).format(amount);
}

interface RecurringInvoice {
  id: string;
  customerId: string;
  customerName?: string;
  frequency: "weekly" | "biweekly" | "monthly" | "quarterly" | "yearly";
  nextDueDate: string;
  lastGeneratedDate?: string;
  status: "active" | "paused";
  notes?: string;
  createdAt: string;
  lines: RecurringLine[];
}

interface RecurringLine {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

const frequencyLabels: Record<string, string> = {
  weekly: "Weekly",
  biweekly: "Bi-weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
};

const statusColors: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  paused: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

export default function RecurringInvoicesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [recurringInvoices, setRecurringInvoices] = useState<RecurringInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<RecurringInvoice | null>(null);
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<{ id: string; name: string; categoryName?: string }[]>([]);
  const [formData, setFormData] = useState({
    customerId: "",
    frequency: "monthly" as string,
    nextDueDate: new Date().toISOString().split("T")[0],
    notes: "",
    lines: [{ description: "", quantity: 1, unitPrice: 0 }] as { description: string; quantity: number; unitPrice: number }[],
  });

  useEffect(() => {
    fetchRecurringInvoices();
    fetchCustomers();
    fetchCatalogProducts();
  }, []);

  const fetchRecurringInvoices = async () => {
    try {
      const res = await fetch("/api/recurring-invoices", {
        headers: { Authorization: `Bearer ${user?.id || ""}` },
      });
      const data = await res.json();
      setRecurringInvoices(Array.isArray(data) ? data : data.recurringInvoices || []);
    } catch (error) {
      console.error("Failed to fetch recurring invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch("/api/customer-profiles", {
        headers: { Authorization: `Bearer ${user?.id || ""}` },
      });
      const data = await res.json();
      const profiles = Array.isArray(data) ? data : [];
      setCustomers(profiles.map((c: any) => ({ id: c.userId, name: c.userName || c.businessName || "Unknown" })));
    } catch (error) {
      console.error("Failed to fetch customers:", error);
    }
  };

  const fetchCatalogProducts = async () => {
    try {
      const res = await fetch("/api/billing-products", {
        headers: { Authorization: `Bearer ${user?.id || ""}` },
      });
      const data = await res.json();
      setCatalogProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch catalog products:", error);
    }
  };

  const handleCreate = async () => {
    try {
      const res = await fetch("/api/recurring-invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.id || ""}`,
        },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setShowForm(false);
        resetForm();
        fetchRecurringInvoices();
      }
    } catch (error) {
      console.error("Failed to create recurring invoice:", error);
    }
  };

  const handleUpdate = async () => {
    if (!editingItem) return;
    try {
      const res = await fetch(`/api/recurring-invoices/${editingItem.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.id || ""}`,
        },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setShowForm(false);
        setEditingItem(null);
        resetForm();
        fetchRecurringInvoices();
      }
    } catch (error) {
      console.error("Failed to update recurring invoice:", error);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "paused" : "active";
    try {
      const res = await fetch(`/api/recurring-invoices/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.id || ""}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) fetchRecurringInvoices();
    } catch (error) {
      console.error("Failed to toggle status:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this recurring invoice template?")) return;
    try {
      const res = await fetch(`/api/recurring-invoices/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${user?.id || ""}` },
      });
      if (res.ok) fetchRecurringInvoices();
    } catch (error) {
      console.error("Failed to delete recurring invoice:", error);
    }
  };

  const handleEdit = (item: RecurringInvoice) => {
    setEditingItem(item);
    setFormData({
      customerId: item.customerId,
      frequency: item.frequency,
      nextDueDate: item.nextDueDate,
      notes: item.notes || "",
      lines: item.lines.map((l) => ({ description: l.description, quantity: l.quantity, unitPrice: l.unitPrice })),
    });
    setShowForm(true);
  };

  const handleGenerateInvoice = async (ri: RecurringInvoice) => {
    if (!ri.customerId) return;
    try {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);
      const lines = ri.lines.map((l) => ({
        description: l.description,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        taxRate: "0",
      }));
      const total = lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.id || ""}`,
        },
        body: JSON.stringify({
          customerId: ri.customerId,
          dueDate: dueDate.toISOString().split("T")[0],
          paymentTerms: 30,
          notes: `Auto-generated from recurring template`,
          lines,
        }),
      });
      if (res.ok) {
        toast({ title: "Invoice generated from template" });
        // Update lastInvoiceDate
        await fetch(`/api/recurring-invoices/${ri.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user?.id || ""}`,
          },
          body: JSON.stringify({ lastInvoiceDate: new Date().toISOString().split("T")[0] }),
        });
        fetchRecurringInvoices();
      } else {
        const err = await res.json();
        toast({ title: err.error || "Failed", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Failed to generate invoice", variant: "destructive" });
    }
  };

  const resetForm = () => {
    setFormData({
      customerId: "",
      frequency: "monthly",
      nextDueDate: new Date().toISOString().split("T")[0],
      notes: "",
      lines: [{ description: "", quantity: 1, unitPrice: 0 }],
    });
  };

  const addLine = () => {
    setFormData((prev) => ({
      ...prev,
      lines: [...prev.lines, { description: "", quantity: 1, unitPrice: 0, productId: "" }],
    }));
  };

  const updateLine = (index: number, field: string, value: any) => {
    setFormData((prev) => {
      const newLines = prev.lines.map((l, i) => (i === index ? { ...l, [field]: value } : l));
      if (field === "productId" && value) {
        const prod = catalogProducts.find((p) => p.id === value);
        if (prod) { newLines[index] = { ...newLines[index], description: prod.name }; }
      }
      return { ...prev, lines: newLines };
    });
  };

  const removeLine = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      lines: prev.lines.filter((_, i) => i !== index),
    }));
  };

  const filtered = recurringInvoices.filter(
    (ri) =>
      ri.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ri.frequency.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getMonthlyTotal = (lines: RecurringLine[]) =>
    lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);

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
              Recurring Invoices
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Manage auto-generated invoice templates
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setEditingItem(null);
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Template
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <RefreshCw className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Active</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {recurringInvoices.filter((r) => r.status === "active").length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <Pause className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Paused</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {recurringInvoices.filter((r) => r.status === "paused").length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Monthly Value</p>
                <p className="text-2xl font-bold text-[var(--accent-primary)]">
                  {formatCurrency(
                    recurringInvoices
                      .filter((r) => r.status === "active")
                      .reduce((sum, r) => {
                        let mult = 1;
                        if (r.frequency === "weekly") mult = 4.33;
                        else if (r.frequency === "biweekly") mult = 2.17;
                        else if (r.frequency === "quarterly") mult = 1 / 3;
                        else if (r.frequency === "yearly") mult = 1 / 12;
                        return sum + getMonthlyTotal(r.lines) * mult;
                      }, 0)
                  )}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Due This Month</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {
                    recurringInvoices.filter((r) => {
                      const due = new Date(r.nextDueDate);
                      const now = new Date();
                      return due.getMonth() === now.getMonth() && due.getFullYear() === now.getFullYear();
                    }).length
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by customer or frequency..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Recurring Invoices List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-slate-500 dark:text-slate-400 mt-4">Loading recurring invoices...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <RefreshCw className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              No Recurring Invoices
            </h3>
            <p className="text-slate-500 dark:text-slate-400">
              Create a template to automate invoice generation
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((ri) => (
              <div
                key={ri.id}
                className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden"
              >
                <div
                  className="p-5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
                  onClick={() => setExpandedId(expandedId === ri.id ? null : ri.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <RefreshCw className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white">
                          {ri.customerName || "Unknown Customer"}
                        </h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {frequencyLabels[ri.frequency]}
                          </span>
                          <span className="text-sm text-slate-500 dark:text-slate-400">
                            Next: {new Date(ri.nextDueDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusColors[ri.status]}`}>
                        {ri.status}
                      </span>
                      <span className="text-lg font-bold text-[var(--accent-primary)]">
                        {formatCurrency(getMonthlyTotal(ri.lines))}/cycle
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleStatus(ri.id, ri.status);
                          }}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                          title={ri.status === "active" ? "Pause" : "Activate"}
                        >
                          {ri.status === "active" ? (
                            <Pause className="w-4 h-4 text-amber-600" />
                          ) : (
                            <Play className="w-4 h-4 text-emerald-600" />
                          )}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(ri);
                          }}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        >
                          <Edit className="w-4 h-4 text-blue-600" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(ri.id);
                          }}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                      {expandedId === ri.id ? (
                        <ChevronUp className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedId === ri.id && (
                  <div className="border-t border-slate-200 dark:border-slate-700 p-5 bg-slate-50 dark:bg-slate-750">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          <th className="pb-2">Description</th>
                          <th className="pb-2 text-right">Qty</th>
                          <th className="pb-2 text-right">Unit Price</th>
                          <th className="pb-2 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ri.lines.map((line, idx) => (
                          <tr key={idx} className="border-t border-slate-200 dark:border-slate-600">
                            <td className="py-2 text-sm text-slate-900 dark:text-white">{line.description}</td>
                            <td className="py-2 text-sm text-slate-600 dark:text-slate-300 text-right">{line.quantity}</td>
                            <td className="py-2 text-sm text-slate-600 dark:text-slate-300 text-right">
                              {formatCurrency(line.unitPrice)}
                            </td>
                            <td className="py-2 text-sm font-medium text-slate-900 dark:text-white text-right">
                              {formatCurrency(line.quantity * line.unitPrice)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {ri.notes && (
                      <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                        <strong>Notes:</strong> {ri.notes}
                      </p>
                    )}
                    {ri.status === "active" && (
                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGenerateInvoice(ri);
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
                        >
                          <FileText className="w-4 h-4" />
                          Generate Invoice Now
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Create/Edit Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {editingItem ? "Edit Recurring Template" : "New Recurring Template"}
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Customer
                  </label>
                  <select
                    value={formData.customerId}
                    onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="">Select customer</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Frequency
                    </label>
                    <select
                      value={formData.frequency}
                      onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    >
                      <option value="weekly">Weekly</option>
                      <option value="biweekly">Bi-weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Next Due Date
                    </label>
                    <input
                      type="date"
                      value={formData.nextDueDate}
                      onChange={(e) => setFormData({ ...formData, nextDueDate: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Line Items */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Line Items
                  </label>
                  {formData.lines.map((line, idx) => (
                    <div key={idx} className="flex gap-2 mb-2">
                      <select
                        value={(line as any).productId || ""}
                        onChange={(e) => updateLine(idx, "productId", e.target.value)}
                        className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                      >
                        <option value="">Select product…</option>
                        {catalogProducts.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}{p.categoryName ? ` (${p.categoryName})` : ""}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="Description"
                        value={line.description}
                        onChange={(e) => updateLine(idx, "description", e.target.value)}
                        className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Qty"
                        value={line.quantity}
                        onChange={(e) => updateLine(idx, "quantity", Number(e.target.value))}
                        className="w-20 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Price"
                        step="0.01"
                        value={line.unitPrice}
                        onChange={(e) => updateLine(idx, "unitPrice", Number(e.target.value))}
                        className="w-28 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                      />
                      {formData.lines.length > 1 && (
                        <button
                          onClick={() => removeLine(idx)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={addLine}
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 mt-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Line
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                  />
                </div>
              </div>
              <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingItem(null);
                  }}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={editingItem ? handleUpdate : handleCreate}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingItem ? "Update Template" : "Create Template"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
