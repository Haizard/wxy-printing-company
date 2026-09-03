import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Package, Plus, Pencil, Trash2, ArrowDown, ArrowUp, Minus, AlertTriangle, BarChart3, TrendingDown, Recycle, Eye, Filter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useInventory } from "@/hooks/useApi";
import { formatTZS } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// Material categories are fetched from the API. This default list is only used as a fallback seed.

const UNITS = ["sheet", "roll", "meter", "sqm", "liter", "ml", "kg", "gram", "cartridge", "pc", "box", "pack", "coil", "strip"];

const WASTE_REASONS = [
  "Printing error", "Cutting error", "Machine setup", "Damaged material",
  "Wrong measurement", "Color problem", "Customer change", "Operator error", "Other",
];

const categoryColors: Record<string, string> = {
  general: "bg-[var(--glass-fill-subtle)] text-[var(--text-secondary)]",
  paper: "bg-[rgba(46,125,255,0.12)] text-[var(--accent-tertiary)]",
  ink: "bg-[rgba(255,59,48,0.12)] text-[var(--accent-danger)]",
  vinyl: "bg-[rgba(52,199,89,0.12)] text-[var(--accent-success)]",
  acrylic: "bg-[rgba(255,176,32,0.12)] text-[var(--accent-secondary)]",
  finishing: "bg-[rgba(255,159,10,0.12)] text-[var(--accent-warning)]",
  hardware: "bg-[rgba(110,110,115,0.12)] text-[var(--text-secondary)]",
  packaging: "bg-[rgba(175,82,222,0.12)] text-[#AF52DE]",
  fabric: "bg-[rgba(90,200,250,0.12)] text-[#5AC8FA]",
};

export default function InventoryPage() {
  const { data: items, loading, refetch } = useInventory();
  const { user } = useAuth();
  const canEdit = user?.role === "admin" || user?.role === "inventory_manager";
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [itemForm, setItemForm] = useState({ name: "", sku: "", unit: "sheet", category: "general", currentQty: 0, reorderLevel: 0, unitCost: 0, supplier: "" });
  const [movementType, setMovementType] = useState<"in" | "out" | "waste" | "return" | "adjustment">("in");
  const [movementQty, setMovementQty] = useState(0);
  const [movementReason, setMovementReason] = useState("");
  const [wasteReason, setWasteReason] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [dashboard, setDashboard] = useState<any>(null);
  const [movementHistory, setMovementHistory] = useState<any[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [materialCategories, setMaterialCategories] = useState<any[]>([]);
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<any>(null);
  const [catForm, setCatForm] = useState({ name: "", value: "", color: "", icon: "", sortOrder: 0 });

  // Fetch material categories from API
  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/material-categories", { headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` } });
      if (res.ok) setMaterialCategories(await res.json());
    } catch (e) { console.error("Failed to fetch categories", e); }
  };

  // Seed default categories if empty
  const seedDefaultCategories = async () => {
    try {
      const res = await fetch("/api/material-categories", { headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` } });
      if (res.ok) {
        const existing = await res.json();
        if (existing.length === 0) {
          const defaults = [
            { name: "General", value: "general", color: "bg-[var(--glass-fill-subtle)] text-[var(--text-secondary)]" },
            { name: "Paper & Cardboard", value: "paper", color: "bg-[rgba(46,125,255,0.12)] text-[var(--accent-tertiary)]" },
            { name: "Ink & Consumables", value: "ink", color: "bg-[rgba(255,59,48,0.12)] text-[var(--accent-danger)]" },
            { name: "Vinyl & Banners", value: "vinyl", color: "bg-[rgba(52,199,89,0.12)] text-[var(--accent-success)]" },
            { name: "Acrylic & Rigid", value: "acrylic", color: "bg-[rgba(255,176,32,0.12)] text-[var(--accent-secondary)]" },
            { name: "Finishing Materials", value: "finishing", color: "bg-[rgba(175,82,222,0.12)] text-[#AF52DE]" },
            { name: "Hardware & Accessories", value: "hardware", color: "bg-[rgba(90,90,90,0.12)] text-[var(--text-secondary)]" },
            { name: "Packaging", value: "packaging", color: "bg-[rgba(255,149,0,0.12)] text-[var(--accent-warning)]" },
            { name: "Fabric & Textile", value: "fabric", color: "bg-[rgba(0,122,255,0.12)] text-[#007AFF]" },
          ];
          for (const cat of defaults) {
            await fetch("/api/material-categories", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("auth_token")}` }, body: JSON.stringify(cat) });
          }
          fetchCategories();
        }
      }
    } catch (e) { console.error("Failed to seed categories", e); }
  };

  const handleSaveCategory = async () => {
    try {
      const method = editingCat ? "PUT" : "POST";
      const url = editingCat ? `/api/material-categories/${editingCat.id}` : "/api/material-categories";
      await fetch(url, { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("auth_token")}` }, body: JSON.stringify(catForm) });
      setCatDialogOpen(false); setEditingCat(null); setCatForm({ name: "", value: "", color: "", icon: "", sortOrder: 0 });
      fetchCategories();
    } catch (e) { console.error("Failed to save category", e); }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    try {
      await fetch(`/api/material-categories/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` } });
      fetchCategories();
    } catch (e) { console.error("Failed to delete category", e); }
  };

  useEffect(() => {
    fetchDashboard();
    fetchCategories();
    seedDefaultCategories();
  }, []);

  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem("printhub_token");
      const res = await fetch("/api/inventory/dashboard", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setDashboard(await res.json());
    } catch {}
  };

  const fetchHistory = async (itemId: string) => {
    try {
      const token = localStorage.getItem("printhub_token");
      const res = await fetch(`/api/inventory/${itemId}/movements`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setMovementHistory(await res.json());
    } catch {}
  };

  const openCreateItem = () => {
    setEditingItem(null);
    setItemForm({ name: "", sku: "", unit: "sheet", category: "general", currentQty: 0, reorderLevel: 0, unitCost: 0, supplier: "" });
    setItemDialogOpen(true);
  };

  const openEditItem = (item: any) => {
    setEditingItem(item);
    setItemForm({ name: item.name, sku: item.sku || "", unit: item.unit, category: item.category || "general", currentQty: Number(item.currentQty), reorderLevel: Number(item.reorderLevel), unitCost: item.unitCost || 0, supplier: item.supplier || "" });
    setItemDialogOpen(true);
  };

  const saveItem = async () => {
    const method = editingItem ? "PUT" : "POST";
    const url = editingItem ? `/api/inventory/${editingItem.id}` : "/api/inventory";
    const token = localStorage.getItem("printhub_token");
    const res = await fetch(url, {
      method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(itemForm),
    });
    if (res.ok) { setItemDialogOpen(false); refetch(); fetchDashboard(); }
  };

  const deleteItem = async (id: string) => {
    if (!confirm("Delete this inventory item?")) return;
    const token = localStorage.getItem("printhub_token");
    await fetch(`/api/inventory/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    refetch(); fetchDashboard();
  };

  const handleRecordMovement = async () => {
    if (!selectedItem || movementQty <= 0) return;
    const token = localStorage.getItem("printhub_token");
    const body: any = { movementType, quantity: movementQty, reason: movementReason || null };
    if (movementType === "waste" && wasteReason) body.wasteReason = wasteReason;
    const res = await fetch(`/api/inventory/${selectedItem.id}/movements`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setDialogOpen(false); setMovementQty(0); setMovementReason(""); setWasteReason("");
      refetch(); fetchDashboard();
    }
  };

  const filteredItems = items?.filter((i: any) => categoryFilter === "all" || (i.category || "general") === categoryFilter) || [];
  const lowStockItems = items?.filter((i: any) => Number(i.currentQty) <= Number(i.reorderLevel)) || [];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-title-1 font-bold">Inventory</h1>
            <p className="text-body text-[var(--text-secondary)] mt-1">Materials & consumables management</p>
          </div>
          {canEdit && (
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => { setCatDialogOpen(true); setEditingCat(null); setCatForm({ name: "", value: "", color: "", icon: "", sortOrder: 0 }); }}>
                <Pencil className="w-4 h-4 mr-1" /> Manage Categories
              </Button>
              <Button size="sm" onClick={openCreateItem}>
                <Plus className="w-4 h-4 mr-1" /> Add Material
              </Button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Dashboard Stats */}
      {dashboard && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Items", value: dashboard.totalItems, icon: Package, color: "text-[var(--accent-tertiary)]", bg: "bg-[rgba(46,125,255,0.1)]" },
            { label: "Stock Value", value: formatTZS(dashboard.totalStockValue), icon: BarChart3, color: "text-[var(--accent-success)]", bg: "bg-[rgba(52,199,89,0.1)]" },
            { label: "Low Stock", value: dashboard.lowStockCount, icon: AlertTriangle, color: "text-[var(--accent-warning)]", bg: "bg-[rgba(255,159,10,0.1)]" },
            { label: "Waste %", value: `${dashboard.wastePercentage}%`, icon: Recycle, color: "text-[var(--accent-danger)]", bg: "bg-[rgba(255,59,48,0.1)]" },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <Card>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-caption text-[var(--text-secondary)]">{stat.label}</p>
                    <p className="text-title-2 font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-[var(--radius-md)] ${stat.bg} flex items-center justify-center`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Category Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-[var(--text-tertiary)]" />
        <Button size="sm" variant={categoryFilter === "all" ? "default" : "outline"} onClick={() => setCategoryFilter("all")}>All</Button>
        {materialCategories.filter((c: any) => c.value !== "general").map((cat: any) => (
          <Button key={cat.value} size="sm" variant={categoryFilter === cat.value ? "default" : "outline"} onClick={() => setCategoryFilter(cat.value)}>
            {cat.name}
          </Button>
        ))}
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="p-4 rounded-[var(--radius-md)] bg-[rgba(255,159,10,0.08)] border border-[rgba(255,159,10,0.2)]">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-[var(--accent-warning)]" />
            <p className="text-subhead font-semibold text-[var(--accent-warning)]">Low Stock Alert</p>
          </div>
          <div className="space-y-1">
            {lowStockItems.slice(0, 5).map((item: any) => (
              <p key={item.id} className="text-caption text-[var(--text-secondary)]">
                {item.name}: {item.currentQty} {item.unit} (min: {item.reorderLevel})
              </p>
            ))}
            {lowStockItems.length > 5 && <p className="text-caption text-[var(--text-tertiary)]">+{lowStockItems.length - 5} more</p>}
          </div>
        </div>
      )}

      {/* Items Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-40 rounded-[var(--radius-lg)] bg-[var(--glass-fill-subtle)] animate-pulse" />)}
        </div>
      ) : filteredItems.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="w-10 h-10 text-[var(--text-tertiary)] mx-auto mb-3" />
            <p className="text-subhead text-[var(--text-tertiary)]">
              {categoryFilter !== "all" ? "No items in this category" : "No inventory items yet. Add your first material."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredItems.map((item: any) => {
            const current = Number(item.currentQty);
            const reorder = Number(item.reorderLevel);
            const pct = reorder > 0 ? Math.min((current / reorder) * 100, 100) : 100;
            const isLow = current <= reorder;
            const cat = item.category || "general";
            return (
              <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <Card className={`hover:shadow-glass-lg transition-shadow ${isLow ? "border-[rgba(255,159,10,0.3)]" : ""}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center ${isLow ? "bg-[rgba(255,159,10,0.12)]" : "bg-[var(--glass-fill-subtle)]"}`}>
                          <Package className={`w-5 h-5 ${isLow ? "text-[var(--accent-warning)]" : "text-[var(--text-secondary)]"}`} />
                        </div>
                        <div>
                          <p className="text-subhead font-semibold">{item.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge className={`${materialCategories.find((c: any) => c.value === cat)?.color || "bg-[var(--glass-fill-subtle)] text-[var(--text-secondary)]"} border-0 text-[10px]`}>{materialCategories.find((c: any) => c.value === cat)?.name || cat}</Badge>
                            <span className="text-caption text-[var(--text-tertiary)]">{item.unit} • {item.sku || "No SKU"}</span>
                          </div>
                        </div>
                      </div>
                      {canEdit && (
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setSelectedItem(item); fetchHistory(item.id); setHistoryOpen(true); }}><Eye className="w-3 h-3" /></Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEditItem(item)}><Pencil className="w-3 h-3" /></Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-[var(--accent-danger)]" onClick={() => deleteItem(item.id)}><Trash2 className="w-3 h-3" /></Button>
                        </div>
                      )}
                    </div>
                    <div className="flex items-end justify-between mb-2">
                      <div>
                        <p className="text-caption text-[var(--text-tertiary)]">Current Stock</p>
                        <p className="text-title-2 font-bold">{current.toLocaleString()} <span className="text-caption text-[var(--text-tertiary)]">{item.unit}</span></p>
                      </div>
                      <div className="text-right">
                        <p className="text-caption text-[var(--text-tertiary)]">Reorder Level</p>
                        <p className="text-subhead">{reorder.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[var(--glass-fill-subtle)] mb-3">
                      <div className={`h-2 rounded-full transition-all ${isLow ? "bg-[var(--accent-warning)]" : "bg-[var(--accent-success)]"}`} style={{ width: `${pct}%` }} />
                    </div>
                    {item.supplier && <p className="text-caption text-[var(--text-tertiary)] mb-3">Supplier: {item.supplier}</p>}
                    {item.unitCost > 0 && <p className="text-caption text-[var(--text-tertiary)] mb-3">Value: {formatTZS(item.unitCost * current)}</p>}
                    {canEdit && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => { setSelectedItem(item); setMovementType("in"); setDialogOpen(true); }}>
                          <ArrowDown className="w-3 h-3 mr-1" /> Stock In
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => { setSelectedItem(item); setMovementType("out"); setDialogOpen(true); }}>
                          <ArrowUp className="w-3 h-3 mr-1" /> Stock Out
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => { setSelectedItem(item); setMovementType("waste"); setDialogOpen(true); }}>
                          <Recycle className="w-3 h-3 mr-1" /> Waste
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Movement History Dialog */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Movement History — {selectedItem?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {movementHistory.length === 0 ? (
              <p className="text-caption text-[var(--text-tertiary)] text-center py-4">No movements recorded</p>
            ) : movementHistory.map((m: any) => (
              <div key={m.id} className="flex items-center justify-between p-3 rounded-[var(--radius-md)] bg-[var(--glass-fill-subtle)]">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    m.movementType === "in" ? "bg-[rgba(52,199,89,0.12)]" :
                    m.movementType === "waste" ? "bg-[rgba(255,59,48,0.12)]" :
                    m.movementType === "return_to_stock" ? "bg-[rgba(46,125,255,0.12)]" :
                    "bg-[rgba(255,159,10,0.12)]"
                  }`}>
                    {m.movementType === "in" ? <ArrowDown className="w-4 h-4 text-[var(--accent-success)]" /> :
                     m.movementType === "waste" ? <Recycle className="w-4 h-4 text-[var(--accent-danger)]" /> :
                     <ArrowUp className="w-4 h-4 text-[var(--accent-warning)]" />}
                  </div>
                  <div>
                    <p className="text-subhead font-medium capitalize">{m.movementType.replace(/_/g, " ")}</p>
                    <p className="text-caption text-[var(--text-tertiary)]">{m.reason || "No reason"} {m.wasteReason ? `(${m.wasteReason})` : ""}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-subhead font-semibold ${m.movementType === "in" || m.movementType === "return_to_stock" ? "text-[var(--accent-success)]" : "text-[var(--accent-danger)]"}`}>
                    {m.movementType === "in" || m.movementType === "return_to_stock" ? "+" : "-"}{m.quantity}
                  </p>
                  <p className="text-[10px] text-[var(--text-tertiary)]">{new Date(m.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Item Dialog */}
      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingItem ? "Edit Material" : "Add Material"}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2"><Label>Name</Label><Input value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} placeholder="e.g. Glossy Paper 250gsm" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>SKU</Label><Input value={itemForm.sku} onChange={(e) => setItemForm({ ...itemForm, sku: e.target.value })} placeholder="Optional" /></div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={itemForm.category} onValueChange={(v) => setItemForm({ ...itemForm, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{materialCategories.map((c: any) => <SelectItem key={c.value} value={c.value}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Unit</Label>
                <Select value={itemForm.unit} onValueChange={(v) => setItemForm({ ...itemForm, unit: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Unit Cost (TZS)</Label><Input type="number" value={itemForm.unitCost} onChange={(e) => setItemForm({ ...itemForm, unitCost: parseInt(e.target.value) || 0 })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Current Quantity</Label><Input type="number" value={itemForm.currentQty} onChange={(e) => setItemForm({ ...itemForm, currentQty: parseInt(e.target.value) || 0 })} /></div>
              <div className="space-y-2"><Label>Reorder Level</Label><Input type="number" value={itemForm.reorderLevel} onChange={(e) => setItemForm({ ...itemForm, reorderLevel: parseInt(e.target.value) || 0 })} /></div>
            </div>
            <div className="space-y-2"><Label>Supplier</Label><Input value={itemForm.supplier} onChange={(e) => setItemForm({ ...itemForm, supplier: e.target.value })} placeholder="Optional" /></div>
            <div className="flex gap-3 pt-2">
              <Button className="flex-1" onClick={saveItem}>{editingItem ? "Save Changes" : "Add Material"}</Button>
              <Button variant="outline" onClick={() => setItemDialogOpen(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Movement Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Movement — {selectedItem?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="flex gap-2 flex-wrap">
              {(["in", "out", "waste", "return", "adjustment"] as const).map((t) => (
                <Button key={t} size="sm" variant={movementType === t ? "default" : "outline"} onClick={() => setMovementType(t)}>
                  {t === "in" ? "📥 Stock In" : t === "out" ? "📤 Stock Out" : t === "waste" ? "🗑️ Waste" : t === "return" ? "↩️ Return" : "🔧 Adjust"}
                </Button>
              ))}
            </div>
            <div className="space-y-2"><Label>Quantity</Label><Input type="number" value={movementQty || ""} onChange={(e) => setMovementQty(parseInt(e.target.value) || 0)} placeholder="Enter quantity" /></div>
            <div className="space-y-2"><Label>Reason</Label><Input value={movementReason} onChange={(e) => setMovementReason(e.target.value)} placeholder={movementType === "waste" ? "What happened?" : "e.g. New delivery, Used for job #123"} /></div>
            {movementType === "waste" && (
              <div className="space-y-2">
                <Label>Waste Reason</Label>
                <Select value={wasteReason} onValueChange={setWasteReason}>
                  <SelectTrigger><SelectValue placeholder="Select waste reason" /></SelectTrigger>
                  <SelectContent>{WASTE_REASONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <Button className="flex-1" onClick={handleRecordMovement} disabled={movementQty <= 0}>Record Movement</Button>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manage Categories Dialog */}
      <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Manage Material Categories</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2 p-3 glass-card-subtle rounded-lg">
              <Label>{editingCat ? "Edit Category" : "Add New Category"}</Label>
              <Input placeholder="Name (e.g. Paper & Cardboard)" value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} />
              <Input placeholder="Value/slug (auto-generated if empty)" value={catForm.value} onChange={(e) => setCatForm({ ...catForm, value: e.target.value })} />
              <div className="flex gap-2">
                <Input placeholder="Color class (optional)" value={catForm.color} onChange={(e) => setCatForm({ ...catForm, color: e.target.value })} className="flex-1" />
                <Input placeholder="Sort order" type="number" value={catForm.sortOrder} onChange={(e) => setCatForm({ ...catForm, sortOrder: Number(e.target.value) })} className="w-24" />
              </div>
              <Button size="sm" onClick={handleSaveCategory} disabled={!catForm.name}>{editingCat ? "Update" : "Add Category"}</Button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {materialCategories.map((cat: any) => (
                <div key={cat.id} className="flex items-center justify-between p-2 glass-card-subtle rounded-lg">
                  <div className="flex items-center gap-2">
                    <Badge className={`${cat.color || "bg-gray-100 text-gray-600"} border-0 text-xs`}>{cat.name}</Badge>
                    <span className="text-caption text-[var(--text-tertiary)]">({cat.value})</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" onClick={() => { setEditingCat(cat); setCatForm({ name: cat.name, value: cat.value, color: cat.color || "", icon: cat.icon || "", sortOrder: cat.sortOrder || 0 }); }}>
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDeleteCategory(cat.id)} className="text-red-500 hover:text-red-700">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
