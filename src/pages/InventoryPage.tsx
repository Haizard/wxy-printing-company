import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Package, Plus, Pencil, Trash2, ArrowDown, ArrowUp, Minus, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useInventory } from "@/hooks/useApi";
import { formatTZS } from "@/lib/utils";

export default function InventoryPage() {
  const { data: items, loading, refetch } = useInventory();
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [itemForm, setItemForm] = useState({ name: "", sku: "", unit: "sheet", currentQty: 0, reorderLevel: 0, unitCost: 0, supplier: "" });
  const [movementType, setMovementType] = useState<"in" | "out" | "adjustment">("in");
  const [movementQty, setMovementQty] = useState(0);
  const [movementReason, setMovementReason] = useState("");

  const openCreateItem = () => {
    setEditingItem(null);
    setItemForm({ name: "", sku: "", unit: "sheet", currentQty: 0, reorderLevel: 0, unitCost: 0, supplier: "" });
    setItemDialogOpen(true);
  };

  const openEditItem = (item: any) => {
    setEditingItem(item);
    setItemForm({ name: item.name, sku: item.sku || "", unit: item.unit, currentQty: Number(item.currentQty), reorderLevel: Number(item.reorderLevel), unitCost: item.unitCost || 0, supplier: item.supplier || "" });
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
    if (res.ok) { setItemDialogOpen(false); refetch(); }
  };

  const deleteItem = async (id: string) => {
    if (!confirm("Delete this inventory item?")) return;
    const token = localStorage.getItem("printhub_token");
    await fetch(`/api/inventory/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    refetch();
  };

  const handleRecordMovement = async () => {
    if (!selectedItem || movementQty <= 0) return;
    const token = localStorage.getItem("printhub_token");
    const res = await fetch(`/api/inventory/${selectedItem.id}/movements`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ movementType, quantity: movementQty, reason: movementReason || null }),
    });
    if (res.ok) {
      setDialogOpen(false);
      setMovementQty(0);
      setMovementReason("");
      refetch();
    }
  };

  const lowStockItems = items?.filter((i: any) => Number(i.currentQty) <= Number(i.reorderLevel)) || [];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-title-1 font-bold">Inventory</h1>
            <p className="text-body text-[var(--text-secondary)] mt-1">Manage stock levels & movements</p>
          </div>
          <Button size="sm" onClick={openCreateItem}>
            <Plus className="w-4 h-4 mr-1" /> Add Item
          </Button>
        </div>
      </motion.div>

      {lowStockItems.length > 0 && (
        <div className="p-4 rounded-[var(--radius-md)] bg-[rgba(255,159,10,0.08)] border border-[rgba(255,159,10,0.2)]">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-[var(--accent-warning)]" />
            <p className="text-subhead font-semibold text-[var(--accent-warning)]">Low Stock Alert</p>
          </div>
          <p className="text-caption text-[var(--text-secondary)]">{lowStockItems.length} items below reorder level</p>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-32 rounded-[var(--radius-lg)] bg-[var(--glass-fill-subtle)] animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {items?.map((item: any) => {
            const current = Number(item.currentQty);
            const reorder = Number(item.reorderLevel);
            const pct = reorder > 0 ? Math.min((current / reorder) * 100, 100) : 100;
            const isLow = current <= reorder;
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
                          <p className="text-caption text-[var(--text-tertiary)]">{item.unit} • {item.sku || "No SKU"}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEditItem(item)}><Pencil className="w-3 h-3" /></Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-[var(--accent-danger)]" onClick={() => deleteItem(item.id)}><Trash2 className="w-3 h-3" /></Button>
                      </div>
                    </div>
                    <div className="flex items-end justify-between mb-2">
                      <div>
                        <p className="text-caption text-[var(--text-tertiary)]">Current Stock</p>
                        <p className="text-title-2 font-bold">{current.toLocaleString()}</p>
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
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => { setSelectedItem(item); setMovementType("in"); setDialogOpen(true); }}>
                        <ArrowDown className="w-3 h-3 mr-1" /> Stock In
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => { setSelectedItem(item); setMovementType("out"); setDialogOpen(true); }}>
                        <ArrowUp className="w-3 h-3 mr-1" /> Stock Out
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Item Dialog */}
      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingItem ? "Edit Item" : "Add Inventory Item"}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2"><Label>Name</Label><Input value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} placeholder="e.g. Paper 80gsm" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>SKU</Label><Input value={itemForm.sku} onChange={(e) => setItemForm({ ...itemForm, sku: e.target.value })} placeholder="Optional" /></div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Select value={itemForm.unit} onValueChange={(v) => setItemForm({ ...itemForm, unit: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["sheet", "roll", "sqm", "ml", "pc", "kg"].map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Current Quantity</Label><Input type="number" value={itemForm.currentQty} onChange={(e) => setItemForm({ ...itemForm, currentQty: parseInt(e.target.value) || 0 })} /></div>
              <div className="space-y-2"><Label>Reorder Level</Label><Input type="number" value={itemForm.reorderLevel} onChange={(e) => setItemForm({ ...itemForm, reorderLevel: parseInt(e.target.value) || 0 })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Unit Cost (TZS)</Label><Input type="number" value={itemForm.unitCost} onChange={(e) => setItemForm({ ...itemForm, unitCost: parseInt(e.target.value) || 0 })} /></div>
              <div className="space-y-2"><Label>Supplier</Label><Input value={itemForm.supplier} onChange={(e) => setItemForm({ ...itemForm, supplier: e.target.value })} placeholder="Optional" /></div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button className="flex-1" onClick={saveItem}>{editingItem ? "Save Changes" : "Add Item"}</Button>
              <Button variant="outline" onClick={() => setItemDialogOpen(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Movement Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Stock Movement — {selectedItem?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="flex gap-2">
              {(["in", "out", "adjustment"] as const).map((t) => (
                <Button key={t} size="sm" variant={movementType === t ? "default" : "outline"} className="flex-1" onClick={() => setMovementType(t)}>
                  {t === "in" ? "📥 Stock In" : t === "out" ? "📤 Stock Out" : "🔧 Adjustment"}
                </Button>
              ))}
            </div>
            <div className="space-y-2"><Label>Quantity</Label><Input type="number" value={movementQty || ""} onChange={(e) => setMovementQty(parseInt(e.target.value) || 0)} placeholder="Enter quantity" /></div>
            <div className="space-y-2"><Label>Reason</Label><Input value={movementReason} onChange={(e) => setMovementReason(e.target.value)} placeholder="e.g. New delivery, Used for job #123" /></div>
            <div className="flex gap-3 pt-2">
              <Button className="flex-1" onClick={handleRecordMovement} disabled={movementQty <= 0}>Record Movement</Button>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
