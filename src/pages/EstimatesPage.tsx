import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FileText, Plus, Pencil, Trash2, Send, Check, ArrowRight, Clock, Eye, FileSpreadsheet } from "lucide-react";
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

const statusConfig: Record<string, { color: "default" | "secondary" | "success" | "warning" | "danger"; label: string }> = {
  draft: { color: "secondary", label: "Draft" },
  sent: { color: "default", label: "Sent" },
  accepted: { color: "success", label: "Accepted" },
  declined: { color: "danger", label: "Declined" },
  expired: { color: "warning", label: "Expired" },
  invoiced: { color: "success", label: "Invoiced" },
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-TZ", { style: "currency", currency: "TZS", minimumFractionDigits: 0 }).format(amount);
}

export default function EstimatesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const isAdmin = user?.role === "admin" || user?.role === "sales";

  const [estimates, setEstimates] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [serviceItems, setServiceItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({
    customerId: "", validUntil: "", notes: "", terms: "",
    lines: [] as any[],
  });

  const filterCustomer = searchParams.get("customer");

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [estRes, custRes, svcRes] = await Promise.all([
        fetch("/api/estimates", { headers: getAuthHeaders() }),
        fetch("/api/customer-profiles", { headers: getAuthHeaders() }),
        fetch("/api/service-items", { headers: getAuthHeaders() }),
      ]);
      if (estRes.ok) setEstimates(await estRes.json());
      if (custRes.ok) setCustomers(await custRes.json());
      if (svcRes.ok) setServiceItems(await svcRes.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ customerId: filterCustomer || "", validUntil: "", notes: "", terms: "Payment due within 30 days", lines: [{ description: "", quantity: 1, unitPrice: 0, taxRate: "0" }] });
    setDialogOpen(true);
  };

  const openEdit = (est: any) => {
    setEditing(est);
    setForm({
      customerId: est.customerId, validUntil: est.validUntil?.split("T")[0] || "",
      notes: est.notes || "", terms: est.terms || "",
      lines: est.lines?.length > 0 ? est.lines.map((l: any) => ({ description: l.description, quantity: l.quantity, unitPrice: l.unitPrice, taxRate: l.taxRate || "0", serviceItemId: l.serviceItemId || "" })) : [{ description: "", quantity: 1, unitPrice: 0, taxRate: "0" }],
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.customerId) { toast({ title: "Select a customer", variant: "destructive" }); return; }
    const url = editing ? `/api/estimates/${editing.id}` : "/api/estimates";
    const method = editing ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: getAuthHeaders(), body: JSON.stringify(form) });
    if (res.ok) { toast({ title: editing ? "Updated" : "Created" }); setDialogOpen(false); fetchAll(); }
    else { const err = await res.json(); toast({ title: err.error || "Failed", variant: "destructive" }); }
  };

  const updateStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/estimates/${id}`, { method: "PUT", headers: getAuthHeaders(), body: JSON.stringify({ status }) });
    if (res.ok) { toast({ title: `Status updated to ${status}` }); fetchAll(); }
  };

  const convertToInvoice = async (id: string) => {
    const res = await fetch(`/api/estimates/${id}/convert-to-invoice`, { method: "POST", headers: getAuthHeaders(), body: JSON.stringify({ paymentTerms: 30 }) });
    if (res.ok) { toast({ title: "Invoice created from estimate" }); fetchAll(); }
    else { const err = await res.json(); toast({ title: err.error || "Failed", variant: "destructive" }); }
  };

  const deleteEstimate = async (id: string) => {
    if (!confirm("Delete this estimate?")) return;
    await fetch(`/api/estimates/${id}`, { method: "DELETE", headers: getAuthHeaders() });
    toast({ title: "Deleted" }); fetchAll();
  };

  const addLine = () => setForm({ ...form, lines: [...form.lines, { description: "", quantity: 1, unitPrice: 0, taxRate: "0", serviceItemId: "" }] });
  const removeLine = (i: number) => setForm({ ...form, lines: form.lines.filter((_, idx) => idx !== i) });
  const updateLine = (i: number, field: string, value: any) => {
    const newLines = [...form.lines];
    newLines[i] = { ...newLines[i], [field]: value };
    if (field === "serviceItemId" && value) {
      const svc = serviceItems.find((s: any) => s.id === value);
      if (svc) { newLines[i].description = svc.name; newLines[i].unitPrice = svc.unitPrice; newLines[i].taxRate = svc.taxRate || "0"; }
    }
    setForm({ ...form, lines: newLines });
  };

  const subtotal = form.lines.reduce((sum, l) => sum + (l.quantity || 1) * (l.unitPrice || 0), 0);
  const taxTotal = form.lines.reduce((sum, l) => sum + Math.round((l.quantity || 1) * (l.unitPrice || 0) * (parseFloat(l.taxRate || "0") / 100)), 0);

  const filteredEstimates = filterCustomer ? estimates.filter((e: any) => e.customerId === filterCustomer) : estimates;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-title-1 font-bold text-[var(--text-primary)]">Estimates</h1>
            <p className="text-body text-[var(--text-secondary)] mt-1">Create and manage estimates for customers</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => {
              generateCSV({
                filename: `estimates-${new Date().toISOString().split("T")[0]}`,
                columns: [
                  { header: "Estimate #", accessor: "estimateNumber" },
                  { header: "Customer", accessor: (r: any) => r.customerName || "—" },
                  { header: "Status", accessor: "status" },
                  { header: "Total", accessor: "total" },
                  { header: "Valid Until", accessor: (r: any) => r.validUntil || "—" },
                  { header: "Date", accessor: (r: any) => formatDate(r.createdAt) },
                ],
                data: filteredEstimates,
              });
            }}><FileSpreadsheet className="w-4 h-4 mr-1" /> CSV</Button>
            <Button size="sm" variant="outline" onClick={() => {
              generatePDF({
                title: "Estimates Report",
                subtitle: `${filteredEstimates.length} total estimates`,
                filename: `estimates-${new Date().toISOString().split("T")[0]}`,
                columns: [
                  { header: "Estimate #", accessor: "estimateNumber" },
                  { header: "Customer", accessor: (r: any) => r.customerName || "—" },
                  { header: "Status", accessor: "status" },
                  { header: "Total", accessor: (r: any) => formatCurrency(r.total || 0) },
                  { header: "Date", accessor: (r: any) => formatDate(r.createdAt) },
                ],
                data: filteredEstimates,
              });
            }}><FileText className="w-4 h-4 mr-1" /> PDF</Button>
            {isAdmin && <Button onClick={openCreate}><Plus className="w-4 h-4 mr-1" /> New Estimate</Button>}
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { title: "Total", value: filteredEstimates.length },
          { title: "Draft", value: filteredEstimates.filter((e: any) => e.status === "draft").length },
          { title: "Sent", value: filteredEstimates.filter((e: any) => e.status === "sent").length },
          { title: "Accepted", value: filteredEstimates.filter((e: any) => e.status === "accepted").length },
        ].map(s => (
          <Card key={s.title}><CardContent className="p-4 text-center">
            <p className="text-caption text-[var(--text-secondary)]">{s.title}</p>
            <p className="text-title-2 font-bold">{s.value}</p>
          </CardContent></Card>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-48 rounded-[var(--radius-lg)] bg-[var(--glass-fill-subtle)] animate-pulse" />)}
        </div>
      ) : filteredEstimates.length === 0 ? (
        <Card><CardContent className="text-center py-12">
          <FileText className="w-10 h-10 text-[var(--text-tertiary)] mx-auto mb-3" />
          <p className="text-subhead text-[var(--text-tertiary)]">No estimates yet</p>
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEstimates.map((est: any, i: number) => {
            const config = statusConfig[est.status] || statusConfig.draft;
            return (
              <motion.div key={est.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="hover:shadow-[var(--glass-shadow)] transition-all">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-headline font-semibold">{est.estimateNumber}</p>
                        <p className="text-caption text-[var(--text-tertiary)]">{est.customerName || "No customer"}</p>
                      </div>
                      <Badge variant={config.color}>{config.label}</Badge>
                    </div>
                    <div className="text-caption text-[var(--text-secondary)] space-y-1">
                      {est.lines?.length > 0 && <p>{est.lines.length} line item{est.lines.length !== 1 ? "s" : ""}</p>}
                      {est.validUntil && <p className="flex items-center gap-1"><Clock className="w-3 h-3" /> Valid until {new Date(est.validUntil).toLocaleDateString()}</p>}
                      <p className="text-caption text-[var(--text-tertiary)]">{new Date(est.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-[rgba(60,60,67,0.1)]">
                      <span className="text-headline font-bold text-[var(--accent-primary)]">{formatCurrency(est.total)}</span>
                      <div className="flex gap-1">
                        {est.status === "draft" && <Button size="sm" variant="outline" onClick={() => updateStatus(est.id, "sent")}><Send className="w-3 h-3 mr-1" /> Send</Button>}
                        {est.status === "sent" && <Button size="sm" variant="outline" onClick={() => convertToInvoice(est.id)}><ArrowRight className="w-3 h-3 mr-1" /> Invoice</Button>}
                        {isAdmin && <Button size="sm" variant="ghost" onClick={() => openEdit(est)}><Pencil className="w-3 h-3" /></Button>}
                        {isAdmin && <Button size="sm" variant="ghost" className="text-red-500" onClick={() => deleteEstimate(est.id)}><Trash2 className="w-3 h-3" /></Button>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Estimate" : "New Estimate"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
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
              <Label>Valid Until</Label>
              <Input type="date" value={form.validUntil} onChange={e => setForm({ ...form, validUntil: e.target.value })} />
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
                    <Select value={line.serviceItemId || ""} onValueChange={v => updateLine(i, "serviceItemId", v)}>
                      <SelectTrigger className="h-9"><SelectValue placeholder="Service/Item" /></SelectTrigger>
                      <SelectContent>
                        {serviceItems.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name} ({formatCurrency(s.unitPrice)})</SelectItem>)}
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
              <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="glass-input w-full min-h-[60px]" placeholder="Additional notes" />
            </div>
            <Button className="w-full" onClick={save}>{editing ? "Update" : "Create Estimate"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
