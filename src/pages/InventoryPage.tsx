import { useState } from "react";
import { motion } from "framer-motion";
import { Package, AlertTriangle, TrendingUp, Plus, Minus, ArrowUpDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useInventory, useLowStock } from "@/hooks/useApi";
import { useToast } from "@/components/ui/use-toast";

function StockIndicator({ current, reorder }: { current: number; reorder: number }) {
  const ratio = reorder > 0 ? current / reorder : 10;
  let color = "bg-[var(--accent-success)]";
  let label = "Healthy";
  let variant: "success" | "warning" | "danger" = "success";

  if (ratio < 1) {
    color = "bg-[var(--accent-danger)]";
    label = "Low Stock";
    variant = "danger";
  } else if (ratio < 1.5) {
    color = "bg-[var(--accent-warning)]";
    label = "Near Reorder";
    variant = "warning";
  }

  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-2 rounded-pill bg-[var(--glass-fill-subtle)] overflow-hidden">
        <div
          className={`h-full rounded-pill ${color} transition-all duration-500`}
          style={{ width: `${Math.min(100, ratio * 100)}%` }}
        />
      </div>
      <Badge variant={variant} className="text-[10px]">{label}</Badge>
    </div>
  );
}

export default function InventoryPage() {
  const { data: items, loading, refetch } = useInventory();
  const { data: lowStock } = useLowStock();
  const { toast } = useToast();
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [movementType, setMovementType] = useState<"in" | "out" | "adjustment">("in");
  const [quantity, setQuantity] = useState<number>(0);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const inventoryItems = items || [];
  const lowStockCount = lowStock?.length || 0;

  const handleRecordMovement = async () => {
    if (!selectedItem || quantity <= 0) return;
    setSubmitting(true);

    try {
      const token = localStorage.getItem("printhub_token");
      const response = await fetch(`/api/inventory/${selectedItem.id}/movements`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          movementType,
          quantity,
          reason: reason || `${movementType === "in" ? "Stock in" : movementType === "out" ? "Stock out" : "Adjustment"}`,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Movement recorded",
          description: `${movementType === "in" ? "+" : movementType === "out" ? "-" : "="}${quantity} ${selectedItem.unit} — New qty: ${data.newQty}`,
          variant: "success",
        });
        setDialogOpen(false);
        setSelectedItem(null);
        setQuantity(0);
        setReason("");
        refetch();
      } else {
        const err = await response.json();
        toast({ title: "Failed", description: err.error, variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to record movement", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-title-1 font-bold text-[var(--text-primary)]">Inventory</h1>
        <p className="text-body text-[var(--text-secondary)] mt-1">
          Track stock levels for paper, vinyl, acrylic, ink, and consumables
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[rgba(255,90,60,0.1)] flex items-center justify-center">
              <Package className="w-5 h-5 text-[var(--accent-primary)]" />
            </div>
            <div>
              <p className="text-caption text-[var(--text-secondary)]">Total Items</p>
              <p className="text-title-2 font-bold">{inventoryItems.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[rgba(255,59,48,0.1)] flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-[var(--accent-danger)]" />
            </div>
            <div>
              <p className="text-caption text-[var(--text-secondary)]">Low Stock Alerts</p>
              <p className="text-title-2 font-bold text-[var(--accent-danger)]">{lowStockCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[rgba(52,199,89,0.1)] flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-[var(--accent-success)]" />
            </div>
            <div>
              <p className="text-caption text-[var(--text-secondary)]">Healthy Stock</p>
              <p className="text-title-2 font-bold text-[var(--accent-success)]">
                {inventoryItems.length - lowStockCount}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 rounded-[var(--radius-lg)] bg-[var(--glass-fill-subtle)] animate-pulse" />
          ))}
        </div>
      ) : inventoryItems.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="w-10 h-10 text-[var(--text-tertiary)] mx-auto mb-3" />
            <p className="text-subhead text-[var(--text-tertiary)]">
              No inventory items yet. Add items to track stock.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {inventoryItems.map((item: any, index: number) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card className="hover:shadow-[var(--glass-shadow)] transition-all duration-200">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="w-10 h-10 rounded-[var(--radius-sm)] bg-[var(--glass-fill-subtle)] flex items-center justify-center">
                      <Package className="w-5 h-5 text-[var(--text-tertiary)]" />
                    </div>
                    {item.sku && (
                      <p className="text-caption text-[var(--text-tertiary)]">{item.sku}</p>
                    )}
                  </div>
                  <h3 className="text-subhead font-semibold mb-1">{item.name}</h3>
                  {item.supplier && (
                    <p className="text-caption text-[var(--text-tertiary)] mb-3">{item.supplier}</p>
                  )}

                  <div className="space-y-2">
                    <div className="flex justify-between text-caption">
                      <span className="text-[var(--text-secondary)]">Current Stock</span>
                      <span className="font-semibold">
                        {Number(item.currentQty).toLocaleString()} {item.unit}
                      </span>
                    </div>
                    <div className="flex justify-between text-caption">
                      <span className="text-[var(--text-secondary)]">Reorder Level</span>
                      <span>{Number(item.reorderLevel).toLocaleString()} {item.unit}</span>
                    </div>
                    <StockIndicator current={Number(item.currentQty)} reorder={Number(item.reorderLevel)} />
                  </div>

                  {/* Record movement button */}
                  <div className="mt-3 pt-3 border-t border-[rgba(60,60,67,0.15)]">
                    <Dialog open={dialogOpen && selectedItem?.id === item.id} onOpenChange={(open) => {
                      setDialogOpen(open);
                      if (open) setSelectedItem(item);
                      else { setSelectedItem(null); setQuantity(0); setReason(""); }
                    }}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" className="w-full">
                          <ArrowUpDown className="w-4 h-4 mr-1" />
                          Record Movement
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Record Stock Movement</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                          <div className="p-3 rounded-[var(--radius-md)] bg-[var(--glass-fill-subtle)]">
                            <p className="text-subhead font-semibold">{item.name}</p>
                            <p className="text-caption text-[var(--text-tertiary)]">
                              Current: {Number(item.currentQty).toLocaleString()} {item.unit}
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label>Movement Type</Label>
                            <div className="flex gap-2">
                              <Button
                                variant={movementType === "in" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setMovementType("in")}
                                className="flex-1"
                              >
                                <Plus className="w-4 h-4 mr-1" />
                                Stock In
                              </Button>
                              <Button
                                variant={movementType === "out" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setMovementType("out")}
                                className="flex-1"
                              >
                                <Minus className="w-4 h-4 mr-1" />
                                Stock Out
                              </Button>
                              <Button
                                variant={movementType === "adjustment" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setMovementType("adjustment")}
                                className="flex-1"
                              >
                                Adjust
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Quantity ({item.unit})</Label>
                            <Input
                              type="number"
                              value={quantity || ""}
                              onChange={(e) => setQuantity(Number(e.target.value))}
                              placeholder="Enter quantity"
                              min={0}
                            />
                            {movementType === "out" && quantity > Number(item.currentQty) && (
                              <p className="text-caption text-[var(--accent-danger)]">
                                Exceeds available stock ({Number(item.currentQty).toLocaleString()})
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label>Reason (optional)</Label>
                            <Input
                              value={reason}
                              onChange={(e) => setReason(e.target.value)}
                              placeholder="e.g., New shipment received, Used for JOB-0042"
                            />
                          </div>

                          <Button
                            className="w-full"
                            onClick={handleRecordMovement}
                            disabled={submitting || quantity <= 0 || (movementType === "out" && quantity > Number(item.currentQty))}
                          >
                            {submitting ? "Recording..." : "Record Movement"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
