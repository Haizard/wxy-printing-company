import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { Plus, Trash2, Eye, Package, Clock, CheckCircle, XCircle } from "lucide-react";

interface Supplier {
  id: string;
  name: string;
}

interface InventoryItem {
  id: string;
  name: string;
  unit: string;
}

interface POItem {
  inventoryItemId: string;
  quantity: number;
  unitCost: number;
}

interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplierId: string;
  status: string;
  totalAmount: number;
  notes: string | null;
  expectedDate: string | null;
  receivedDate: string | null;
  createdBy: string;
  createdAt: string;
  supplierName: string | null;
  items?: {
    id: string;
    inventoryItemId: string;
    quantity: string;
    unitCost: number;
    totalCost: number;
    itemName: string;
    itemUnit: string;
  }[];
}

const statusColors: Record<string, string> = {
  draft: "bg-[rgba(255,159,10,0.12)] text-[var(--accent-warning)] border border-[rgba(255,159,10,0.2)]",
  ordered: "bg-[rgba(46,125,255,0.12)] text-[var(--accent-tertiary)] border border-[rgba(46,125,255,0.2)]",
  received: "bg-[rgba(52,199,89,0.12)] text-[var(--accent-success)] border border-[rgba(52,199,89,0.2)]",
  cancelled: "bg-[rgba(255,59,48,0.12)] text-[var(--accent-danger)] border border-[rgba(255,59,48,0.2)]",
};

export default function PurchaseOrdersPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [saving, setSaving] = useState(false);

  // Create form
  const [poSupplierId, setPoSupplierId] = useState("");
  const [poNotes, setPoNotes] = useState("");
  const [poExpectedDate, setPoExpectedDate] = useState("");
  const [poItems, setPoItems] = useState<POItem[]>([
    { inventoryItemId: "", quantity: 1, unitCost: 0 },
  ]);
  const [search, setSearch] = useState("");

  const headers = { Authorization: `Bearer ${token}` };

  const fetchAll = async () => {
    try {
      const [oRes, sRes, iRes] = await Promise.all([
        fetch("/api/purchase-orders", { headers }),
        fetch("/api/suppliers", { headers }),
        fetch("/api/inventory", { headers }),
      ]);
      if (oRes.ok) setOrders(await oRes.json());
      if (sRes.ok) setSuppliers(await sRes.json());
      if (iRes.ok) setItems(await iRes.json());
    } catch {
      toast({ title: "Failed to load data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const viewOrder = async (orderId: string) => {
    try {
      const res = await fetch(`/api/purchase-orders/${orderId}`, { headers });
      if (res.ok) {
        setSelectedOrder(await res.json());
        setDetailOpen(true);
      }
    } catch {
      toast({ title: "Failed to load order details", variant: "destructive" });
    }
  };

  const addPoItem = () => {
    setPoItems([...poItems, { inventoryItemId: "", quantity: 1, unitCost: 0 }]);
  };

  const removePoItem = (idx: number) => {
    setPoItems(poItems.filter((_, i) => i !== idx));
  };

  const updatePoItem = (idx: number, field: keyof POItem, value: any) => {
    const updated = [...poItems];
    (updated[idx] as any)[field] = value;
    setPoItems(updated);
  };

  const createOrder = async () => {
    if (!poSupplierId) {
      toast({ title: "Select a supplier", variant: "destructive" });
      return;
    }
    const validItems = poItems.filter(
      (item) => item.inventoryItemId && item.quantity > 0 && item.unitCost > 0
    );
    if (validItems.length === 0) {
      toast({ title: "Add at least one item", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/purchase-orders", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId: poSupplierId,
          notes: poNotes || null,
          expectedDate: poExpectedDate || null,
          items: validItems,
        }),
      });
      if (res.ok) {
        toast({ title: "Purchase order created" });
        setCreateOpen(false);
        setPoSupplierId("");
        setPoNotes("");
        setPoExpectedDate("");
        setPoItems([{ inventoryItemId: "", quantity: 1, unitCost: 0 }]);
        fetchAll();
      } else {
        const data = await res.json();
        toast({ title: data.error || "Failed", variant: "destructive" });
      }
    } catch {
      toast({ title: "Network error", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (orderId: string, status: string) => {
    try {
      const res = await fetch(`/api/purchase-orders/${orderId}/status`, {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        toast({ title: `Order marked as ${status}` });
        setDetailOpen(false);
        fetchAll();
      }
    } catch {
      toast({ title: "Failed to update status", variant: "destructive" });
    }
  };

  const deleteOrder = async (orderId: string) => {
    if (!confirm("Delete this purchase order?")) return;
    try {
      const res = await fetch(`/api/purchase-orders/${orderId}`, {
        method: "DELETE",
        headers,
      });
      if (res.ok) {
        toast({ title: "Order deleted" });
        setDetailOpen(false);
        fetchAll();
      }
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  };

  const formatTZS = (n: number) =>
    new Intl.NumberFormat("en-TZ", { style: "currency", currency: "TZS", minimumFractionDigits: 0 }).format(n);

  const filtered = orders.filter(
    (o) =>
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.supplierName?.toLowerCase().includes(search.toLowerCase())
  );

  const statusIcon = (status: string) => {
    switch (status) {
      case "draft": return <Clock className="w-3.5 h-3.5" />;
      case "ordered": return <Package className="w-3.5 h-3.5" />;
      case "received": return <CheckCircle className="w-3.5 h-3.5" />;
      case "cancelled": return <XCircle className="w-3.5 h-3.5" />;
      default: return null;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-title-1 font-bold text-text-primary">Purchase Orders</h1>
          <p className="text-subhead text-text-secondary">{orders.length} orders</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Purchase Order
        </Button>
      </div>

      <div className="max-w-md">
        <Input placeholder="Search orders..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="text-center py-12 text-text-secondary">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-text-secondary">
          {search ? "No orders match" : "No purchase orders yet"}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => (
            <Card key={order.id} className="glass-card cursor-pointer hover:shadow-glass transition-shadow" onClick={() => viewOrder(order.id)}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[rgba(46,125,255,0.12)] flex items-center justify-center">
                    <Package className="w-5 h-5 text-accent-tertiary" />
                  </div>
                  <div>
                    <p className="text-headline font-semibold">{order.orderNumber}</p>
                    <p className="text-caption text-text-secondary">
                      {order.supplierName || "Unknown supplier"} · {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-headline font-semibold">{formatTZS(order.totalAmount)}</p>
                  <Badge className={statusColors[order.status] || ""}>
                    <span className="flex items-center gap-1">
                      {statusIcon(order.status)} {order.status}
                    </span>
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Purchase Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Supplier *</Label>
              <Select value={poSupplierId} onValueChange={setPoSupplierId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Expected Delivery Date</Label>
              <Input type="date" value={poExpectedDate} onChange={(e) => setPoExpectedDate(e.target.value)} />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={poNotes} onChange={(e) => setPoNotes(e.target.value)} placeholder="Order notes..." rows={2} />
            </div>

            {/* Items */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-headline">Items</Label>
                <Button variant="outline" size="sm" onClick={addPoItem}>
                  <Plus className="w-3 h-3 mr-1" /> Add Item
                </Button>
              </div>
              {poItems.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-5">
                    {idx === 0 && <Label className="text-caption mb-1 block">Material</Label>}
                    <Select value={item.inventoryItemId} onValueChange={(v) => updatePoItem(idx, "inventoryItemId", v)}>
                      <SelectTrigger><SelectValue placeholder="Select item" /></SelectTrigger>
                      <SelectContent>
                        {items.map((i) => (
                          <SelectItem key={i.id} value={i.id}>{i.name} ({i.unit})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    {idx === 0 && <Label className="text-caption mb-1 block">Qty</Label>}
                    <Input type="number" value={item.quantity} onChange={(e) => updatePoItem(idx, "quantity", Number(e.target.value))} min={1} />
                  </div>
                  <div className="col-span-3">
                    {idx === 0 && <Label className="text-caption mb-1 block">Unit Cost (TZS)</Label>}
                    <Input type="number" value={item.unitCost} onChange={(e) => updatePoItem(idx, "unitCost", Number(e.target.value))} min={0} />
                  </div>
                  <div className="col-span-2">
                    {idx === 0 && <Label className="text-caption mb-1 block">Total</Label>}
                    <p className="text-subhead font-medium py-2">{formatTZS(item.quantity * item.unitCost)}</p>
                  </div>
                  {poItems.length > 1 && (
                    <Button variant="ghost" size="sm" onClick={() => removePoItem(idx)} className="col-span-12 sm:col-span-1">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end text-headline font-bold border-t pt-3">
              Total: {formatTZS(poItems.reduce((s, i) => s + i.quantity * i.unitCost, 0))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={createOrder} disabled={saving}>{saving ? "Creating..." : "Create Order"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>{selectedOrder.orderNumber}</span>
                  <Badge className={statusColors[selectedOrder.status] || ""}>
                    {selectedOrder.status}
                  </Badge>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-subhead">
                  <div>
                    <p className="text-caption text-text-secondary">Supplier</p>
                    <p className="font-medium">{selectedOrder.supplierName}</p>
                  </div>
                  <div>
                    <p className="text-caption text-text-secondary">Created</p>
                    <p className="font-medium">{new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                  </div>
                  {selectedOrder.expectedDate && (
                    <div>
                      <p className="text-caption text-text-secondary">Expected</p>
                      <p className="font-medium">{new Date(selectedOrder.expectedDate).toLocaleDateString()}</p>
                    </div>
                  )}
                  {selectedOrder.receivedDate && (
                    <div>
                      <p className="text-caption text-text-secondary">Received</p>
                      <p className="font-medium">{new Date(selectedOrder.receivedDate).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
                {selectedOrder.notes && (
                  <p className="text-caption text-text-secondary italic">{selectedOrder.notes}</p>
                )}

                {/* Items Table */}
                {selectedOrder.items && selectedOrder.items.length > 0 && (
                  <div className="border rounded-[var(--radius-md)] overflow-hidden">
                    <table className="w-full text-subhead">
                      <thead className="bg-[rgba(255,255,255,0.3)]">
                        <tr>
                          <th className="text-left px-3 py-2 text-caption font-medium">Item</th>
                          <th className="text-right px-3 py-2 text-caption font-medium">Qty</th>
                          <th className="text-right px-3 py-2 text-caption font-medium">Unit Cost</th>
                          <th className="text-right px-3 py-2 text-caption font-medium">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOrder.items.map((item) => (
                          <tr key={item.id} className="border-t">
                            <td className="px-3 py-2">{item.itemName}</td>
                            <td className="px-3 py-2 text-right">
                              {item.quantity} {item.itemUnit}
                            </td>
                            <td className="px-3 py-2 text-right">{formatTZS(item.unitCost)}</td>
                            <td className="px-3 py-2 text-right font-medium">{formatTZS(item.totalCost)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="flex justify-end text-title-3 font-bold border-t pt-3">
                  Total: {formatTZS(selectedOrder.totalAmount)}
                </div>

                {/* Status Actions */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {selectedOrder.status === "draft" && (
                    <Button onClick={() => updateStatus(selectedOrder.id, "ordered")} className="flex items-center gap-1">
                      <Package className="w-4 h-4" /> Mark as Ordered
                    </Button>
                  )}
                  {selectedOrder.status === "ordered" && (
                    <Button onClick={() => updateStatus(selectedOrder.id, "received")} className="flex items-center gap-1 bg-accent-success hover:bg-accent-success/90">
                      <CheckCircle className="w-4 h-4" /> Mark as Received
                    </Button>
                  )}
                  {(selectedOrder.status === "draft" || selectedOrder.status === "ordered") && (
                    <Button
                      variant="outline"
                      onClick={() => updateStatus(selectedOrder.id, "cancelled")}
                      className="flex items-center gap-1 text-accent-danger"
                    >
                      <XCircle className="w-4 h-4" /> Cancel
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => deleteOrder(selectedOrder.id)} className="flex items-center gap-1 text-accent-danger ml-auto">
                    <Trash2 className="w-4 h-4" /> Delete
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
