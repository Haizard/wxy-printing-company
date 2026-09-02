import { motion } from "framer-motion";
import { Package, AlertTriangle, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useInventory, useLowStock } from "@/hooks/useApi";

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
  const { data: items, loading } = useInventory();
  const { data: lowStock } = useLowStock();

  const inventoryItems = items || [];
  const lowStockCount = lowStock?.length || 0;

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
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
