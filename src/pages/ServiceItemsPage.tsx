import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Package, Plus, Pencil, Trash2, Tag, DollarSign, Boxes } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";

function getAuthHeaders() {
  const token = localStorage.getItem("printhub_token");
  return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-TZ", { style: "currency", currency: "TZS", minimumFractionDigits: 0 }).format(amount);
}

export default function ServiceItemsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === "admin" || user?.role === "sales";

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    name: "", description: "", unitPrice: 0, costPrice: 0,
    taxRate: "0", type: "product", unit: "piece",
  });

  const fetchItems = async () => {
    try {
      const res = await fetch("/api/service-items", { headers: getAuthHeaders() });
      if (res.ok) setItems(await res.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchItems(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", description: "", unitPrice: 0, costPrice: 0, taxRate: "0", type: "product", unit: "piece" });
    setDialogOpen(true);
  };

  const openEdit = (item: any) => {
    setEditing(item);
    setForm({
      name: item.name, description: item.description || "",
      unitPrice: item.unitPrice || 0, costPrice: item.costPrice || 0,
      taxRate: item.taxRate || "0", type: item.type || "product", unit: item.unit || "piece",
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.name) { toast({ title: "Name is required", variant: "destructive" }); return; }
    const url = editing ? `/api/service-items/${editing.id}` : "/api/service-items";
    const method = editing ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: getAuthHeaders(), body: JSON.stringify(form) });
    if (res.ok) { toast({ title: editing ? "Updated" : "Created" }); setDialogOpen(false); fetchItems(); }
    else { const err = await res.json(); toast({ title: err.error || "Failed", variant: "destructive" }); }
  };

  const deleteItem = async (id: string) => {
    if (!confirm("Delete this service item?")) return;
    await fetch(`/api/service-items/${id}`, { method: "DELETE", headers: getAuthHeaders() });
    toast({ title: "Deleted" }); fetchItems();
  };

  const filtered = items
    .filter((i) => filter === "all" || i.type === filter)
    .filter((i) => i.name.toLowerCase().includes(search.toLowerCase()) || (i.description || "").toLowerCase().includes(search.toLowerCase()));

  const types = ["all", "product", "service"];
  const typeColors: Record<string, string> = { product: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", service: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-title-1 font-bold text-[var(--text-primary)]">Service Items</h1>
            <p className="text-body text-[var(--text-secondary)] mt-1">Manage products and services used as line items in estimates and invoices</p>
          </div>
          {isAdmin && <Button onClick={openCreate}><Plus className="w-4 h-4 mr-1" /> Add Item</Button>}
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { title: "Total Items", value: items.length, icon: Boxes, color: "text-[var(--accent-primary)]" },
          { title: "Products", value: items.filter(i => i.type === "product").length, icon: Package, color: "text-blue-500" },
          { title: "Services", value: items.filter(i => i.type === "service").length, icon: Tag, color: "text-purple-500" },
          { title: "Avg. Price", value: formatCurrency(items.length > 0 ? items.reduce((s, i) => s + (i.unitPrice || 0), 0) / items.length : 0), icon: DollarSign, color: "text-emerald-500" },
        ].map(s => (
          <Card key={s.title}><CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-caption text-[var(--text-secondary)]">{s.title}</p>
              <p className="text-title-2 font-bold">{s.value}</p>
            </div>
            <s.icon className={`w-8 h-8 ${s.color}`} />
          </CardContent></Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 bg-[var(--glass-fill-subtle)] rounded-lg p-1">
          {types.map(t => (
            <button key={t} onClick={() => setFilter(t)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${filter === t ? "bg-[var(--accent-primary)] text-white" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}>
              {t === "all" ? "All" : t.charAt(0).toUpperCase() + t.slice(1)}s
            </button>
          ))}
        </div>
        <Input placeholder="Search items..." value={search} onChange={e => setSearch(e.target.value)} className="sm:max-w-xs" />
      </div>

      {/* Items Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-36 rounded-[var(--radius-lg)] bg-[var(--glass-fill-subtle)] animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="text-center py-12">
          <Boxes className="w-10 h-10 text-[var(--text-tertiary)] mx-auto mb-3" />
          <p className="text-subhead text-[var(--text-tertiary)]">No items found</p>
          <p className="text-caption text-[var(--text-tertiary)] mt-1">Add products and services to use in estimates & invoices</p>
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item: any, i: number) => (
            <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Card className="hover:shadow-[var(--glass-shadow)] transition-all">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-headline font-semibold truncate">{item.name}</p>
                      {item.description && <p className="text-caption text-[var(--text-tertiary)] truncate mt-0.5">{item.description}</p>}
                    </div>
                    <Badge className={typeColors[item.type] || "bg-gray-100 text-gray-700"}>{item.type || "product"}</Badge>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-[rgba(60,60,67,0.1)]">
                    <div>
                      <p className="text-headline font-bold text-[var(--accent-primary)]">{formatCurrency(item.unitPrice || 0)}</p>
                      <p className="text-caption text-[var(--text-tertiary)]">per {item.unit || "piece"}</p>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(item)}><Pencil className="w-3 h-3" /></Button>
                        <Button size="sm" variant="ghost" className="text-red-500" onClick={() => deleteItem(item.id)}><Trash2 className="w-3 h-3" /></Button>
                      </div>
                    )}
                  </div>
                  {Number(item.taxRate || 0) > 0 && (
                    <p className="text-caption text-[var(--text-tertiary)] mt-1">Tax: {item.taxRate}%</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit Service Item" : "New Service Item"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Business Cards, Logo Design" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="glass-input w-full min-h-[60px]" placeholder="Brief description (optional)" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="product">Product</SelectItem>
                    <SelectItem value="service">Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Select value={form.unit} onValueChange={v => setForm({ ...form, unit: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="piece">Piece</SelectItem>
                    <SelectItem value="set">Set</SelectItem>
                    <SelectItem value="hour">Hour</SelectItem>
                    <SelectItem value="day">Day</SelectItem>
                    <SelectItem value="sheet">Sheet</SelectItem>
                    <SelectItem value="sqm">sqm</SelectItem>
                    <SelectItem value="page">Page</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Sale Price (TZS)</Label>
                <Input type="number" value={form.unitPrice} onChange={e => setForm({ ...form, unitPrice: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Cost Price (TZS)</Label>
                <Input type="number" value={form.costPrice} onChange={e => setForm({ ...form, costPrice: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Tax %</Label>
                <Input type="number" value={form.taxRate} onChange={e => setForm({ ...form, taxRate: e.target.value })} />
              </div>
            </div>
            {form.unitPrice > 0 && form.costPrice > 0 && (
              <p className="text-caption text-[var(--accent-success)]">
                Margin: {((1 - form.costPrice / form.unitPrice) * 100).toFixed(1)}%
              </p>
            )}
            <Button className="w-full" onClick={save}>{editing ? "Update" : "Create Item"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
