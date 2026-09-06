import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FileText, Plus, Pencil, Trash2, Send, DollarSign, Clock, CheckCircle, AlertCircle, FileSpreadsheet, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { generatePDF, generateCSV, formatDate } from "@/lib/export-utils";
import { useSearchParams } from "react-router-dom";

function getAuthHeaders() {
  const token = localStorage.getItem("printhub_token");
  return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

const statusConfig: Record<string, { color: "default" | "secondary" | "success" | "warning" | "danger"; label: string; icon: any }> = {
  draft: { color: "secondary", label: "Draft", icon: FileText },
  sent: { color: "default", label: "Sent", icon: Send },
  viewed: { color: "default", label: "Viewed", icon: CheckCircle },
  paid: { color: "success", label: "Paid", icon: CheckCircle },
  partially_paid: { color: "warning", label: "Partial", icon: Clock },
  overdue: { color: "danger", label: "Overdue", icon: AlertCircle },
  cancelled: { color: "danger", label: "Cancelled", icon: XCircle },
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-TZ", { style: "currency", currency: "TZS", minimumFractionDigits: 0 }).format(amount);
}

export default function InvoicesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const isAdmin = user?.role === "admin" || user?.role === "sales";

  const [invoices, setInvoices] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [paymentForm, setPaymentForm] = useState({ amount: 0, paymentMethod: "cash", reference: "", notes: "" });
  const [detailInvoice, setDetailInvoice] = useState<any>(null);

  const [form, setForm] = useState({
    customerId: "", estimateId: "", dueDate: "", paymentTerms: 30, notes: "", terms: "",
    lines: [] as any[],
  });

  const filterCustomer = searchParams.get("customer");

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [invRes, custRes, svcRes] = await Promise.all([
        fetch("/api/invoices", { headers: getAuthHeaders() }),
        fetch("/api/customer-profiles", { headers: getAuthHeaders() }),
        fetch("/api/billing-products", { headers: getAuthHeaders() }),
      ]);
      if (invRes.ok) setInvoices(await invRes.json());
      if (custRes.ok) setCustomers(await custRes.json());
      if (svcRes.ok) setCatalogProducts(await svcRes.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const openCreate = () => {
    setEditing(null);
    const dueDate = new Date(); dueDate.setDate(dueDate.getDate() + 30);
    setForm({
      customerId: filterCustomer || "", estimateId: "", dueDate: dueDate.toISOString().split("T")[0],
      paymentTerms: 30, notes: "", terms: "Payment due within 30 days of invoice date",
      lines: [{ description: "", quantity: 1, unitPrice: 0, taxRate: "0", productId: "" }],
    });
    setDialogOpen(true);
  };

  const openEdit = (inv: any) => {
    setEditing(inv);
    setForm({
      customerId: inv.customerId, estimateId: inv.estimateId || "",
      dueDate: inv.dueDate?.split("T")[0] || "", paymentTerms: inv.paymentTerms || 30,
      notes: inv.notes || "", terms: inv.terms || "",
      lines: inv.lines?.length > 0 ? inv.lines.map((l: any) => ({ description: l.description, quantity: l.quantity, unitPrice: l.unitPrice, taxRate: l.taxRate || "0", productId: l.productId || l.serviceItemId || "" })) : [{ description: "", quantity: 1, unitPrice: 0, taxRate: "0", productId: "" }],
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.customerId) { toast({ title: "Select a customer", variant: "destructive" }); return; }
    const url = editing ? `/api/invoices/${editing.id}` : "/api/invoices";
    const method = editing ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: getAuthHeaders(), body: JSON.stringify(form) });
    if (res.ok) { toast({ title: editing ? "Updated" : "Created" }); setDialogOpen(false); fetchAll(); }
    else { const err = await res.json(); toast({ title: err.error || "Failed", variant: "destructive" }); }
  };

  const recordPayment = async () => {
    if (!selectedInvoice || paymentForm.amount <= 0) return;
    const res = await fetch(`/api/invoices/${selectedInvoice.id}/payments`, {
      method: "POST", headers: getAuthHeaders(),
      body: JSON.stringify(paymentForm),
    });
    if (res.ok) { toast({ title: "Payment recorded" }); setPaymentDialogOpen(false); fetchAll(); }
    else { const err = await res.json(); toast({ title: err.error || "Failed", variant: "destructive" }); }
  };

  const deleteInvoice = async (id: string) => {
    if (!confirm("Delete this invoice?")) return;
    await fetch(`/api/invoices/${id}`, { method: "DELETE", headers: getAuthHeaders() });
    toast({ title: "Deleted" }); fetchAll();
  };

  const addLine = () => setForm({ ...form, lines: [...form.lines, { description: "", quantity: 1, unitPrice: 0, taxRate: "0", productId: "" }] });
  const removeLine = (i: number) => setForm({ ...form, lines: form.lines.filter((_, idx) => idx !== i) });
  const updateLine = (i: number, field: string, value: any) => {
    const newLines = [...form.lines];
    newLines[i] = { ...newLines[i], [field]: value };
    if (field === "productId" && value) {
      const prod = catalogProducts.find((p: any) => p.id === value);
      if (prod) { newLines[i].description = prod.name; newLines[i].taxRate = "0"; }
    }
    setForm({ ...form, lines: newLines });
  };

  const subtotal = form.lines.reduce((sum, l) => sum + (l.quantity || 1) * (l.unitPrice || 0), 0);
  const taxTotal = form.lines.reduce((sum, l) => sum + Math.round((l.quantity || 1) * (l.unitPrice || 0) * (parseFloat(l.taxRate || "0") / 100)), 0);

  const filteredInvoices = filterCustomer ? invoices.filter((i: any) => i.customerId === filterCustomer) : invoices;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-title-1 font-bold text-[var(--text-primary)]">Invoices</h1>
            <p className="text-body text-[var(--text-secondary)] mt-1">Manage invoices and track payments</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => {
              generateCSV({
                filename: `invoices-${new Date().toISOString().split("T")[0]}`,
                columns: [
                  { header: "Invoice #", accessor: "invoiceNumber" },
                  { header: "Customer", accessor: (r: any) => r.customerName || "—" },
                  { header: "Status", accessor: "status" },
                  { header: "Total", accessor: "total" },
                  { header: "Paid", accessor: "amountPaid" },
                  { header: "Due Date", accessor: (r: any) => r.dueDate || "—" },
                  { header: "Date", accessor: (r: any) => formatDate(r.createdAt) },
                ],
                data: filteredInvoices,
              });
            }}><FileSpreadsheet className="w-4 h-4 mr-1" /> CSV</Button>
            <Button size="sm" variant="outline" onClick={() => {
              generatePDF({
                title: "Invoices Report",
                subtitle: `${filteredInvoices.length} total invoices`,
                filename: `invoices-${new Date().toISOString().split("T")[0]}`,
                columns: [
                  { header: "Invoice #", accessor: "invoiceNumber" },
                  { header: "Customer", accessor: (r: any) => r.customerName || "—" },
                  { header: "Status", accessor: "status" },
                  { header: "Total", accessor: (r: any) => formatCurrency(r.total || 0) },
                  { header: "Paid", accessor: (r: any) => formatCurrency(r.amountPaid || 0) },
                  { header: "Date", accessor: (r: any) => formatDate(r.createdAt) },
                ],
                data: filteredInvoices,
              });
            }}><FileText className="w-4 h-4 mr-1" /> PDF</Button>
            {isAdmin && <Button onClick={openCreate}><Plus className="w-4 h-4 mr-1" /> New Invoice</Button>}
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { title: "Total Invoiced", value: formatCurrency(filteredInvoices.reduce((s: number, i: any) => s + (i.total || 0), 0)), color: "text-[var(--accent-primary)]" },
          { title: "Paid", value: formatCurrency(filteredInvoices.reduce((s: number, i: any) => s + (i.amountPaid || 0), 0)), color: "text-[var(--accent-success)]" },
          { title: "Outstanding", value: formatCurrency(filteredInvoices.reduce((s: number, i: any) => s + Math.max(0, (i.total || 0) - (i.amountPaid || 0)), 0)), color: "text-[var(--accent-warning)]" },
          { title: "Overdue", value: String(filteredInvoices.filter((i: any) => i.status === "overdue").length), color: "text-[var(--accent-danger)]" },
        ].map(s => (
          <Card key={s.title}><CardContent className="p-4">
            <p className="text-caption text-[var(--text-secondary)]">{s.title}</p>
            <p className={`text-title-2 font-bold ${s.color}`}>{s.value}</p>
          </CardContent></Card>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-48 rounded-[var(--radius-lg)] bg-[var(--glass-fill-subtle)] animate-pulse" />)}
        </div>
      ) : filteredInvoices.length === 0 ? (
        <Card><CardContent className="text-center py-12">
          <FileText className="w-10 h-10 text-[var(--text-tertiary)] mx-auto mb-3" />
          <p className="text-subhead text-[var(--text-tertiary)]">No invoices yet</p>
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredInvoices.map((inv: any, i: number) => {
            const config = statusConfig[inv.status] || statusConfig.draft;
            const balance = (inv.total || 0) - (inv.amountPaid || 0);
            const Icon = config.icon;
            return (
              <motion.div key={inv.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="hover:shadow-[var(--glass-shadow)] transition-all">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-headline font-semibold">{inv.invoiceNumber}</p>
                        <p className="text-caption text-[var(--text-tertiary)]">{inv.customerName}</p>
                      </div>
                      <Badge variant={config.color}><Icon className="w-3 h-3 mr-1" /> {config.label}</Badge>
                    </div>
                    <div className="text-caption text-[var(--text-secondary)] space-y-1">
                      <p>{inv.lines?.length || 0} line item{(inv.lines?.length || 0) !== 1 ? "s" : ""}</p>
                      {inv.dueDate && <p className="flex items-center gap-1"><Clock className="w-3 h-3" /> Due {new Date(inv.dueDate).toLocaleDateString()}</p>}
                      <p className="text-caption text-[var(--text-tertiary)]">{new Date(inv.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="mt-3 pt-3 border-t border-[rgba(60,60,67,0.1)]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-headline font-bold text-[var(--accent-primary)]">{formatCurrency(inv.total)}</span>
                        {inv.amountPaid > 0 && <span className="text-caption text-[var(--accent-success)]">Paid: {formatCurrency(inv.amountPaid)}</span>}
                      </div>
                      {balance > 0 && inv.status !== "paid" && inv.status !== "cancelled" && (
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-caption font-medium text-[var(--accent-warning)]">Balance: {formatCurrency(balance)}</span>
                          <Button size="sm" onClick={() => { setSelectedInvoice(inv); setPaymentForm({ amount: balance, paymentMethod: "cash", reference: "", notes: "" }); setPaymentDialogOpen(true); }}>
                            <DollarSign className="w-3 h-3 mr-1" /> Pay
                          </Button>
                        </div>
                      )}
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => setDetailInvoice(inv)}><Eye className="w-3 h-3" /></Button>
                        {isAdmin && <Button size="sm" variant="ghost" onClick={() => openEdit(inv)}><Pencil className="w-3 h-3" /></Button>}
                        {isAdmin && <Button size="sm" variant="ghost" className="text-red-500" onClick={() => deleteInvoice(inv.id)}><Trash2 className="w-3 h-3" /></Button>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Invoice Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Invoice" : "New Invoice"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Customer</Label>
                <Select value={form.customerId} onValueChange={v => setForm({ ...form, customerId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                  <SelectContent>
                    {customers.map((c: any) => <SelectItem key={c.id} value={c.userId}>{c.businessName || c.userName}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Line Items</Label>
                <Button size="sm" variant="outline" onClick={addLine}><Plus className="w-3 h-3 mr-1" /> Add</Button>
              </div>
              {form.lines.map((line, i) => (
                <div key={i} className="grid grid-cols-[1fr_60px_100px_80px_40px] gap-2 items-end">
                  <div className="space-y-1">
                    {i === 0 && <span className="text-caption text-[var(--text-tertiary)]">Description</span>}
                    <Select value={line.productId || ""} onValueChange={v => updateLine(i, "productId", v)}>
                      <SelectTrigger className="h-9"><SelectValue placeholder="Select product" /></SelectTrigger>
                      <SelectContent>
                        {catalogProducts.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}{p.categoryName ? ` (${p.categoryName})` : ""}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Input value={line.description} onChange={e => updateLine(i, "description", e.target.value)} placeholder="Description" className="h-9" />
                  </div>
                  <div>
                    {i === 0 && <span className="text-caption text-[var(--text-tertiary)]">Qty</span>}
                    <Input type="number" value={line.quantity} onChange={e => updateLine(i, "quantity", Number(e.target.value))} className="h-9" />
                  </div>
                  <div>
                    {i === 0 && <span className="text-caption text-[var(--text-tertiary)]">Unit Price</span>}
                    <Input type="number" value={line.unitPrice} onChange={e => updateLine(i, "unitPrice", Number(e.target.value))} className="h-9" />
                  </div>
                  <div>
                    {i === 0 && <span className="text-caption text-[var(--text-tertiary)]">Tax %</span>}
                    <Input type="number" value={line.taxRate} onChange={e => updateLine(i, "taxRate", e.target.value)} className="h-9" />
                  </div>
                  <Button variant="ghost" className="h-9 w-9 text-red-500" onClick={() => removeLine(i)} disabled={form.lines.length <= 1}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="text-right space-y-1">
              <p className="text-subhead">Subtotal: {formatCurrency(subtotal)}</p>
              <p className="text-subhead">Tax: {formatCurrency(taxTotal)}</p>
              <p className="text-headline font-bold text-[var(--accent-primary)]">Total: {formatCurrency(subtotal + taxTotal)}</p>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="glass-input w-full min-h-[60px]" />
            </div>
            <Button className="w-full" onClick={save}>{editing ? "Update" : "Create Invoice"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <p className="text-subhead text-[var(--text-secondary)]">
                Invoice: <span className="font-semibold">{selectedInvoice.invoiceNumber}</span> — Total: {formatCurrency(selectedInvoice.total)}
              </p>
              <div className="space-y-2">
                <Label>Amount</Label>
                <Input type="number" value={paymentForm.amount} onChange={e => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={paymentForm.paymentMethod} onValueChange={v => setPaymentForm({ ...paymentForm, paymentMethod: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="mobile_money">Mobile Money</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Reference</Label>
                <Input value={paymentForm.reference} onChange={e => setPaymentForm({ ...paymentForm, reference: e.target.value })} placeholder="Transaction reference" />
              </div>
              <Button className="w-full" onClick={recordPayment} disabled={paymentForm.amount <= 0}>Record Payment</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Invoice Detail Dialog */}
      <Dialog open={!!detailInvoice} onOpenChange={() => setDetailInvoice(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Invoice {detailInvoice?.invoiceNumber}</DialogTitle></DialogHeader>
          {detailInvoice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-caption text-[var(--text-tertiary)]">Customer</p><p className="text-subhead font-medium">{detailInvoice.customerName || "—"}</p></div>
                <div><p className="text-caption text-[var(--text-tertiary)]">Status</p><Badge variant={statusConfig[detailInvoice.status]?.color || "secondary"}>{statusConfig[detailInvoice.status]?.label || detailInvoice.status}</Badge></div>
                <div><p className="text-caption text-[var(--text-tertiary)]">Created</p><p className="text-subhead">{new Date(detailInvoice.createdAt).toLocaleDateString()}</p></div>
                <div><p className="text-caption text-[var(--text-tertiary)]">Due Date</p><p className="text-subhead">{detailInvoice.dueDate ? new Date(detailInvoice.dueDate).toLocaleDateString() : "—"}</p></div>
              </div>
              {detailInvoice.lines?.length > 0 && (
                <div>
                  <p className="text-headline font-semibold mb-2">Line Items</p>
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-[rgba(60,60,67,0.15)]">
                      <th className="text-left py-2 text-[var(--text-tertiary)]">Description</th>
                      <th className="text-right py-2 text-[var(--text-tertiary)]">Qty</th>
                      <th className="text-right py-2 text-[var(--text-tertiary)]">Unit Price</th>
                      <th className="text-right py-2 text-[var(--text-tertiary)]">Tax</th>
                      <th className="text-right py-2 text-[var(--text-tertiary)]">Total</th>
                    </tr></thead>
                    <tbody>
                      {detailInvoice.lines.map((line: any, i: number) => (
                        <tr key={i} className="border-b border-[rgba(60,60,67,0.08)]">
                          <td className="py-2">{line.description}</td>
                          <td className="py-2 text-right">{line.quantity}</td>
                          <td className="py-2 text-right">{formatCurrency(line.unitPrice)}</td>
                          <td className="py-2 text-right">{line.taxRate || 0}%</td>
                          <td className="py-2 text-right font-medium">{formatCurrency(line.lineTotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="flex justify-end space-y-1 text-right">
                <div className="w-48">
                  <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Subtotal</span><span>{formatCurrency(detailInvoice.subtotal)}</span></div>
                  <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Tax</span><span>{formatCurrency(detailInvoice.taxTotal)}</span></div>
                  <div className="flex justify-between font-bold text-[var(--accent-primary)]"><span>Total</span><span>{formatCurrency(detailInvoice.total)}</span></div>
                  {detailInvoice.amountPaid > 0 && <div className="flex justify-between text-[var(--accent-success)]"><span>Paid</span><span>{formatCurrency(detailInvoice.amountPaid)}</span></div>}
                  {detailInvoice.total - detailInvoice.amountPaid > 0 && <div className="flex justify-between font-bold text-[var(--accent-warning)]"><span>Balance Due</span><span>{formatCurrency(detailInvoice.total - detailInvoice.amountPaid)}</span></div>}
                </div>
              </div>
              {detailInvoice.notes && <div><p className="text-caption text-[var(--text-tertiary)]">Notes</p><p className="text-subhead">{detailInvoice.notes}</p></div>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function XCircle({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>;
}
