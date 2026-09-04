import { useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Pencil,
  Trash2,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Tag,
  Package,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePriceRules, useProducts, useCategories } from "@/hooks/useApi";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const PRICING_MODELS = [
  "qty_band_per_unit",
  "area_based_range",
  "coverage_qty_band",
  "sheet_qty_tier_markup",
  "imposition_sheet_based",
  "flat_fixed_per_unit_band",
  "flat_fixed_service_fee",
  "flat_fixed_range_per_unit",
  "percentage_markup_on_material",
  "package_tier_flat_fee",
  "per_page_band",
  "per_page_plus_design_fee",
  "range_service_fee",
  "area_qty_band",
  "qty_band_by_leaf_count",
  "signage_engrave_cut_formula",
];

interface BandForm {
  qtyMin: string;
  qtyMax: string;
  unitPriceMin: string;
  unitPriceMax: string;
  areaMin: string;
  areaMax: string;
  sideCount: string;
  leafCount: string;
}

interface RuleForm {
  productId: string;
  pricingModel: string;
  optionFilterKey: string;
  optionFilterValue: string;
  markupPercent: string;
  minCharge: string;
  currency: string;
  isInternalCost: boolean;
  bands: BandForm[];
  // Sheet optimization fields
  sheetOptEnabled: boolean;
  sheetSize: string;
  itemWidthMm: string;
  itemHeightMm: string;
  wasteFactor: string;
}

const emptyBand: BandForm = {
  qtyMin: "",
  qtyMax: "",
  unitPriceMin: "",
  unitPriceMax: "",
  areaMin: "",
  areaMax: "",
  sideCount: "",
  leafCount: "",
};

const emptyForm: RuleForm = {
  productId: "",
  pricingModel: "qty_band_per_unit",
  optionFilterKey: "",
  optionFilterValue: "",
  markupPercent: "",
  minCharge: "",
  currency: "TZS",
  isInternalCost: false,
  bands: [{ ...emptyBand }],
  sheetOptEnabled: false,
  sheetSize: "A4",
  itemWidthMm: "",
  itemHeightMm: "",
  wasteFactor: "5",
};

export default function PriceRulesPage() {
  const { data: rules, loading, refetch } = usePriceRules();
  const { data: products } = useProducts();
  const { data: categories } = useCategories();
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === "admin";

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);
  const [form, setForm] = useState<RuleForm>({ ...emptyForm });
  const [expandedRule, setExpandedRule] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setEditingRule(null);
    setForm({ ...emptyForm });
    setDialogOpen(true);
  };

  const openEdit = (rule: any) => {
    setEditingRule(rule);
    const filter = rule.optionFilter || {};
    // Extract sheet optimization if present
    const sheetOpt = filter._sheetOptimization || {};
    const filterKeys = Object.keys(filter).filter(k => k !== '_sheetOptimization');
    setForm({
      productId: rule.productId || "",
      pricingModel: rule.pricingModel || "",
      optionFilterKey: filterKeys[0] || "",
      optionFilterValue: filterKeys[0] ? String(filter[filterKeys[0]]) : "",
      markupPercent: rule.markupPercent || "",
      minCharge: rule.minCharge ? String(rule.minCharge) : "",
      currency: rule.currency || "TZS",
      isInternalCost: rule.isInternalCost || false,
      sheetOptEnabled: sheetOpt.enabled || false,
      sheetSize: sheetOpt.sheetSize || "A4",
      itemWidthMm: sheetOpt.itemWidthMm ? String(sheetOpt.itemWidthMm) : "",
      itemHeightMm: sheetOpt.itemHeightMm ? String(sheetOpt.itemHeightMm) : "",
      wasteFactor: sheetOpt.wasteFactor ? String(sheetOpt.wasteFactor * 100) : "5",
      bands:
        rule.bands && rule.bands.length > 0
          ? rule.bands.map((b: any) => ({
              qtyMin: b.qtyMin != null ? String(b.qtyMin) : "",
              qtyMax: b.qtyMax != null ? String(b.qtyMax) : "",
              unitPriceMin: b.unitPriceMin != null ? String(b.unitPriceMin) : "",
              unitPriceMax: b.unitPriceMax != null ? String(b.unitPriceMax) : "",
              areaMin: b.areaMin != null ? String(b.areaMin) : "",
              areaMax: b.areaMax != null ? String(b.areaMax) : "",
              sideCount: b.sideCount != null ? String(b.sideCount) : "",
              leafCount: b.leafCount != null ? String(b.leafCount) : "",
            }))
          : [{ ...emptyBand }],
    });
    setDialogOpen(true);
  };

  const addBand = () => {
    setForm((prev) => ({
      ...prev,
      bands: [...prev.bands, { ...emptyBand }],
    }));
  };

  const removeBand = (index: number) => {
    setForm((prev) => ({
      ...prev,
      bands: prev.bands.filter((_, i) => i !== index),
    }));
  };

  const updateBand = (index: number, field: keyof BandForm, value: string) => {
    setForm((prev) => {
      const bands = [...prev.bands];
      bands[index] = { ...bands[index], [field]: value };
      return { ...prev, bands };
    });
  };

  const save = async () => {
    if (!form.productId || !form.pricingModel) {
      toast({ title: "Product and pricing model are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const optionFilter: Record<string, any> = {};
      if (form.optionFilterKey && form.optionFilterValue) {
        optionFilter[form.optionFilterKey] = form.optionFilterValue;
      }
      // Add sheet optimization to optionFilter if enabled
      if (form.sheetOptEnabled && form.itemWidthMm && form.itemHeightMm) {
        optionFilter._sheetOptimization = {
          enabled: true,
          sheetSize: form.sheetSize,
          itemWidthMm: Number(form.itemWidthMm),
          itemHeightMm: Number(form.itemHeightMm),
          wasteFactor: form.wasteFactor ? Number(form.wasteFactor) / 100 : 0.05,
        };
      }

      const bands = form.bands
        .filter((b) => b.unitPriceMin)
        .map((b, i) => ({
          qtyMin: b.qtyMin ? Number(b.qtyMin) : null,
          qtyMax: b.qtyMax ? Number(b.qtyMax) : null,
          unitPriceMin: Number(b.unitPriceMin),
          unitPriceMax: b.unitPriceMax ? Number(b.unitPriceMax) : null,
          areaMin: b.areaMin ? Number(b.areaMin) : null,
          areaMax: b.areaMax ? Number(b.areaMax) : null,
          sideCount: b.sideCount ? Number(b.sideCount) : null,
          leafCount: b.leafCount ? Number(b.leafCount) : null,
          sortOrder: i,
        }));

      const body = {
        productId: form.productId,
        pricingModel: form.pricingModel,
        optionFilter,
        markupPercent: form.markupPercent ? Number(form.markupPercent) : null,
        minCharge: form.minCharge ? Number(form.minCharge) : null,
        currency: form.currency,
        isInternalCost: form.isInternalCost,
        bands,
      };

      const token = localStorage.getItem("printhub_token");
      const method = editingRule ? "PUT" : "POST";
      const url = editingRule
        ? `/api/price-rules/${editingRule.id}`
        : "/api/price-rules";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast({
          title: editingRule ? "Rule updated" : "Rule created",
          variant: "success",
        });
        setDialogOpen(false);
        refetch();
      } else {
        const err = await res.json();
        toast({ title: err.error || "Failed to save", variant: "destructive" });
      }
    } catch {
      toast({ title: "Failed to save rule", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const deleteRule = async (id: string) => {
    if (!confirm("Delete this price rule and all its bands?")) return;
    try {
      const token = localStorage.getItem("printhub_token");
      const res = await fetch(`/api/price-rules/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast({ title: "Rule deleted", variant: "success" });
        refetch();
      }
    } catch {
      toast({ title: "Failed to delete rule", variant: "destructive" });
    }
  };

  // Group rules by product
  const rulesByProduct = new Map<string, any[]>();
  (rules || []).forEach((rule: any) => {
    const key = rule.productName || "Unknown Product";
    if (!rulesByProduct.has(key)) rulesByProduct.set(key, []);
    rulesByProduct.get(key)!.push(rule);
  });

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-title-1 font-bold text-[var(--text-primary)]">
              Price Rules
            </h1>
            <p className="text-body text-[var(--text-secondary)] mt-1">
              Manage pricing rules and bands for the calculator
            </p>
          </div>
          {isAdmin && (
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4 mr-1" /> New Rule
            </Button>
          )}
        </div>
      </motion.div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 rounded-[var(--radius-lg)] bg-[var(--glass-fill-subtle)] animate-pulse"
            />
          ))}
        </div>
      ) : !rules || rules.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <DollarSign className="w-10 h-10 text-[var(--text-tertiary)] mx-auto mb-3" />
            <p className="text-subhead text-[var(--text-tertiary)]">
              No price rules configured yet.
            </p>
            {isAdmin && (
              <Button className="mt-4" onClick={openCreate}>
                <Plus className="w-4 h-4 mr-1" /> Create First Rule
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Array.from(rulesByProduct.entries()).map(([productName, productRules]) => (
            <motion.div
              key={productName}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[rgba(255,90,60,0.1)] flex items-center justify-center">
                      <Package className="w-5 h-5 text-[var(--accent-primary)]" />
                    </div>
                    <div>
                      <CardTitle className="text-headline">{productName}</CardTitle>
                      <p className="text-caption text-[var(--text-tertiary)]">
                        {productRules.length} rule{productRules.length !== 1 ? "s" : ""}{" "}
                        · {productRules.reduce((sum: number, r: any) => sum + (r.bands?.length || 0), 0)} bands
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {productRules.map((rule: any) => (
                      <div
                        key={rule.id}
                        className="border border-[var(--glass-border)] rounded-[var(--radius-md)] overflow-hidden"
                      >
                        {/* Rule header */}
                        <div
                          className="flex items-center justify-between p-3 cursor-pointer hover:bg-[rgba(255,90,60,0.04)] transition-colors"
                          onClick={() =>
                            setExpandedRule(expandedRule === rule.id ? null : rule.id)
                          }
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Badge variant="secondary" className="flex-shrink-0 text-[10px]">
                              <Tag className="w-3 h-3 mr-1" />
                              {rule.pricingModel?.replace(/_/g, " ")}
                            </Badge>
                            {rule.isInternalCost && (
                              <Badge variant="warning" className="text-[10px]">Internal</Badge>
                            )}
                            {rule.minCharge && (
                              <span className="text-caption text-[var(--text-tertiary)]">
                                Min: {Number(rule.minCharge).toLocaleString()} {rule.currency}
                              </span>
                            )}
                            {rule.optionFilter && Object.keys(rule.optionFilter).length > 0 && (
                              <span className="text-caption text-[var(--text-tertiary)] hidden sm:inline">
                                Filter:{" "}
                                {Object.entries(rule.optionFilter)
                                  .map(([k, v]) => `${k}=${v}`)
                                  .join(", ")}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <span className="text-caption text-[var(--text-tertiary)] mr-2">
                              {rule.bands?.length || 0} bands
                            </span>
                            {isAdmin && (
                              <>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEdit(rule);
                                  }}
                                >
                                  <Pencil className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-[var(--accent-danger)]"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteRule(rule.id);
                                  }}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </>
                            )}
                            {expandedRule === rule.id ? (
                              <ChevronUp className="w-4 h-4 text-[var(--text-tertiary)]" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-[var(--text-tertiary)]" />
                            )}
                          </div>
                        </div>

                        {/* Bands table (expanded) */}
                        {expandedRule === rule.id && rule.bands && rule.bands.length > 0 && (
                          <div className="border-t border-[var(--glass-border)]">
                            <div className="overflow-x-auto">
                              <table className="w-full text-caption">
                                <thead>
                                  <tr className="bg-[var(--glass-fill-subtle)]">
                                    <th className="text-left px-3 py-2 font-medium text-[var(--text-secondary)]">
                                      Qty Min
                                    </th>
                                    <th className="text-left px-3 py-2 font-medium text-[var(--text-secondary)]">
                                      Qty Max
                                    </th>
                                    <th className="text-left px-3 py-2 font-medium text-[var(--text-secondary)]">
                                      Price Min (TZS)
                                    </th>
                                    <th className="text-left px-3 py-2 font-medium text-[var(--text-secondary)]">
                                      Price Max
                                    </th>
                                    <th className="text-left px-3 py-2 font-medium text-[var(--text-secondary)]">
                                      Area Min
                                    </th>
                                    <th className="text-left px-3 py-2 font-medium text-[var(--text-secondary)]">
                                      Area Max
                                    </th>
                                    <th className="text-left px-3 py-2 font-medium text-[var(--text-secondary)]">
                                      Sides
                                    </th>
                                    <th className="text-left px-3 py-2 font-medium text-[var(--text-secondary)]">
                                      Leaf
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {rule.bands.map((band: any, i: number) => (
                                    <tr
                                      key={band.id || i}
                                      className="border-t border-[rgba(60,60,67,0.1)]"
                                    >
                                      <td className="px-3 py-2">{band.qtyMin ?? "—"}</td>
                                      <td className="px-3 py-2">{band.qtyMax ?? "∞"}</td>
                                      <td className="px-3 py-2 font-medium">
                                        {Number(band.unitPriceMin).toLocaleString()}
                                      </td>
                                      <td className="px-3 py-2">
                                        {band.unitPriceMax
                                          ? Number(band.unitPriceMax).toLocaleString()
                                          : "—"}
                                      </td>
                                      <td className="px-3 py-2">{band.areaMin ?? "—"}</td>
                                      <td className="px-3 py-2">{band.areaMax ?? "—"}</td>
                                      <td className="px-3 py-2">{band.sideCount ?? "—"}</td>
                                      <td className="px-3 py-2">{band.leafCount ?? "—"}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRule ? "Edit Price Rule" : "New Price Rule"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {/* Product */}
            <div className="space-y-2">
              <Label>Product</Label>
              <Select
                value={form.productId}
                onValueChange={(v) => setForm({ ...form, productId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {products?.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({p.slug})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Pricing model */}
            <div className="space-y-2">
              <Label>Pricing Model</Label>
              <Select
                value={form.pricingModel}
                onValueChange={(v) => setForm({ ...form, pricingModel: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRICING_MODELS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Option filter */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Filter Key (optional)</Label>
                <Input
                  value={form.optionFilterKey}
                  onChange={(e) =>
                    setForm({ ...form, optionFilterKey: e.target.value })
                  }
                  placeholder="e.g. material, sides, size"
                />
              </div>
              <div className="space-y-2">
                <Label>Filter Value</Label>
                <Input
                  value={form.optionFilterValue}
                  onChange={(e) =>
                    setForm({ ...form, optionFilterValue: e.target.value })
                  }
                  placeholder="e.g. paper_80_150gsm"
                />
              </div>
            </div>

            {/* Pricing details */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Markup %</Label>
                <Input
                  type="number"
                  value={form.markupPercent}
                  onChange={(e) =>
                    setForm({ ...form, markupPercent: e.target.value })
                  }
                  placeholder="e.g. 100"
                />
              </div>
              <div className="space-y-2">
                <Label>Min Charge (TZS)</Label>
                <Input
                  type="number"
                  value={form.minCharge}
                  onChange={(e) =>
                    setForm({ ...form, minCharge: e.target.value })
                  }
                  placeholder="e.g. 25000"
                />
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Input
                  value={form.currency}
                  onChange={(e) =>
                    setForm({ ...form, currency: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={form.isInternalCost}
                onCheckedChange={(v) =>
                  setForm({ ...form, isInternalCost: v })
                }
              />
              <Label className="cursor-pointer">Internal cost rule</Label>
            </div>

            <div className="border border-[var(--glass-border)] rounded-[var(--radius-md)] p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-semibold">Sheet Optimization</Label>
                  <p className="text-caption text-[var(--text-tertiary)]">Auto-calculate how many items fit per sheet</p>
                </div>
                <Switch
                  checked={form.sheetOptEnabled}
                  onCheckedChange={(v) => setForm({ ...form, sheetOptEnabled: v })}
                />
              </div>
              
              {form.sheetOptEnabled && (
                <div className="space-y-3 pt-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Sheet Size</Label>
                      <Select value={form.sheetSize} onValueChange={(v) => setForm({ ...form, sheetSize: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A3">A3 (297 � 420 mm)</SelectItem>
                          <SelectItem value="A4">A4 (210 � 297 mm)</SelectItem>
                          <SelectItem value="SRA3">SRA3 (320 � 450 mm)</SelectItem>
                          <SelectItem value="A2">A2 (420 � 594 mm)</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Waste Factor (%)</Label>
                      <Input
                        type="number"
                        value={form.wasteFactor}
                        onChange={(e) => setForm({ ...form, wasteFactor: e.target.value })}
                        placeholder="5"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Item Width (mm)</Label>
                      <Input
                        type="number"
                        value={form.itemWidthMm}
                        onChange={(e) => setForm({ ...form, itemWidthMm: e.target.value })}
                        placeholder="e.g. 90"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Item Height (mm)</Label>
                      <Input
                        type="number"
                        value={form.itemHeightMm}
                        onChange={(e) => setForm({ ...form, itemHeightMm: e.target.value })}
                        placeholder="e.g. 55"
                      />
                    </div>
                  </div>
                  {(form.itemWidthMm && form.itemHeightMm && form.sheetSize) ? (() => {
                    const sheets: Record<string, { w: number; h: number }> = {
                      A4: { w: 210, h: 297 },
                      A3: { w: 297, h: 420 },
                      SRA3: { w: 320, h: 450 },
                      A2: { w: 420, h: 594 },
                    };
                    const sheet = sheets[form.sheetSize] || sheets.A4;
                    const iw = Number(form.itemWidthMm);
                    const ih = Number(form.itemHeightMm);
                    if (iw <= 0 || ih <= 0) return null;
                    const cols = Math.floor(sheet.w / iw);
                    const rows = Math.floor(sheet.h / ih);
                    const itemsNormal = cols * rows;
                    const rotCols = Math.floor(sheet.w / ih);
                    const rotRows = Math.floor(sheet.h / iw);
                    const itemsRotated = rotCols * rotRows;
                    const best = Math.max(itemsNormal, itemsRotated);
                    return (
                      <div className="p-3 rounded-[var(--radius-md)] bg-[rgba(52,199,89,0.08)] border border-[rgba(52,199,89,0.2)]">
                        <p className="text-caption text-[var(--text-secondary)]">
                          <span className="font-semibold">Preview:</span> {best} items per {form.sheetSize} sheet ({cols}x{rows} normal, {rotCols}x{rotRows} rotated)
                        </p>
                      </div>
                    );
                  })() : null}
                </div>
              )}
            </div>

            {/* Bands */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Price Bands</Label>
                <Button size="sm" variant="outline" onClick={addBand}>
                  <Plus className="w-3 h-3 mr-1" /> Add Band
                </Button>
              </div>

              {form.bands.map((band, index) => (
                <div
                  key={index}
                  className="border border-[var(--glass-border)] rounded-[var(--radius-md)] p-3 space-y-3 relative"
                >
                  {form.bands.length > 1 && (
                    <button
                      onClick={() => removeBand(index)}
                      className="absolute top-2 right-2 text-[var(--text-tertiary)] hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[10px]">Qty Min</Label>
                      <Input
                        type="number"
                        value={band.qtyMin}
                        onChange={(e) =>
                          updateBand(index, "qtyMin", e.target.value)
                        }
                        placeholder="Min"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Qty Max</Label>
                      <Input
                        type="number"
                        value={band.qtyMax}
                        onChange={(e) =>
                          updateBand(index, "qtyMax", e.target.value)
                        }
                        placeholder="Max (empty=∞)"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Unit Price (TZS) *</Label>
                      <Input
                        type="number"
                        value={band.unitPriceMin}
                        onChange={(e) =>
                          updateBand(index, "unitPriceMin", e.target.value)
                        }
                        placeholder="Price"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Unit Price Max</Label>
                      <Input
                        type="number"
                        value={band.unitPriceMax}
                        onChange={(e) =>
                          updateBand(index, "unitPriceMax", e.target.value)
                        }
                        placeholder="Max (for ranges)"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[10px]">Area Min (m²)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={band.areaMin}
                        onChange={(e) =>
                          updateBand(index, "areaMin", e.target.value)
                        }
                        placeholder="Min"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Area Max (m²)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={band.areaMax}
                        onChange={(e) =>
                          updateBand(index, "areaMax", e.target.value)
                        }
                        placeholder="Max"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Sides</Label>
                      <Input
                        type="number"
                        value={band.sideCount}
                        onChange={(e) =>
                          updateBand(index, "sideCount", e.target.value)
                        }
                        placeholder="1 or 2"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Leaf Count</Label>
                      <Input
                        type="number"
                        value={band.leafCount}
                        onChange={(e) =>
                          updateBand(index, "leafCount", e.target.value)
                        }
                        placeholder="Leaf"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <Button className="flex-1" onClick={save} disabled={saving}>
                {saving ? "Saving..." : editingRule ? "Save Changes" : "Create Rule"}
              </Button>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
