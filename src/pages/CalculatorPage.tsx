import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  Calculator,
  ChevronRight,
  Sparkles,
  Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { formatTZS, cmToSqm } from "@/lib/utils";
import { useSearchParams } from "react-router-dom";
import { useProducts, useCategories } from "@/hooks/useApi";
import { useCart } from "@/contexts/CartContext";


type Step = "category" | "details" | "result";

// Finishing options start empty, loaded from DB per product
// const finishingOptions = [];

// Map category names to icons
const categoryIcons: Record<string, string> = {
  "Banners & Vinyl": "🏁",
  "HP Indigo Paper Printing": "📄",
  "Business Cards": "💳",
  "A3 Posters": "🖼️",
  "Offset A3 Posters": "📰",
  "Acrylic Signs": "🪟",
  "Roll-up Banners": "🎪",
  "Custom Engraved Signage": "✂️",
};

// Material options per product slug (for products that require material selection)
const materialOptions: Record<string, { value: string; label: string }[]> = {
  "banners-vinyl": [
    { value: "black_back", label: "Black Back Banner" },
    { value: "white_back", label: "White Back Banner" },
    { value: "double_sided", label: "Double Sided Banner" },
    { value: "reflective", label: "Reflective Banner" },
    { value: "backlit_flex", label: "Backlit Flex" },
    { value: "white_glossy_vinyl", label: "White Glossy Vinyl" },
    { value: "white_matte_vinyl", label: "White Matte Vinyl" },
  ],
  "hp-indigo-paper": [
    { value: "80-150", label: "Paper 80-150 gsm" },
    { value: "170-250", label: "Paper 170-250 gsm" },
    { value: "300-350", label: "Paper 300-350 gsm" },
    { value: "sticker", label: "Sticker Paper" },
  ],
  "xerox-printing": [
    { value: "0-20", label: "0-20% Coverage" },
    { value: "20-50", label: "20-50% Coverage" },
    { value: "50-100", label: "50-100% Coverage" },
  ],
  "acrylic-sheets": [
    { value: "acrylic_6mm", label: "Acrylic 6mm" },
    { value: "acrylic_3mm", label: "Acrylic 3mm" },
  ],
};

// Size options per product
const productSizes: Record<string, { value: string; label: string }[]> = {
  "offset-a3-posters": [{ value: "a3", label: "A3" }],
  "offset-a2-posters": [{ value: "a2", label: "A2" }],
  "offset-a1-posters": [{ value: "a1", label: "A1" }],
  "offset-brochures": [
    { value: "a4", label: "A4" },
    { value: "a5", label: "A5" },
    { value: "dl", label: "DL" },
  ],
  "books-booklets": [
    { value: "a4", label: "A4" },
    { value: "a5", label: "A5" },
    { value: "dl", label: "DL" },
  ],
};

// Show sides toggle for these products
const showSidesFor = new Set(["business-cards-digital", "business-cards", "xerox-printing", "flyers"]);

export default function CalculatorPage() {
  const [step, setStep] = useState<Step>("category");
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [material, setMaterial] = useState("");
  const [sides, setSides] = useState<"1" | "2">("1");
  const [quantity, setQuantity] = useState(100);
  const [widthCm, setWidthCm] = useState(100);
  const [heightCm, setHeightCm] = useState(100);
  const [size, setSize] = useState("");
  const [selectedFinishing, setSelectedFinishing] = useState<string[]>([]);
  const [productOptions, setProductOptions] = useState<any[]>([]);
  const [dbFinishingOptions, setDbFinishingOptions] = useState<any[]>([]);
  const [optionValues, setOptionValues] = useState<Record<string, any[]>>({});

  const { data: products, loading: prodsLoading } = useProducts();
  const { data: categories, loading: catsLoading } = useCategories();
  const { addItem } = useCart();
  const [searchParams] = useSearchParams();
  const urlProductId = searchParams.get("product");

  const selectedProduct = products?.find((p: any) => p.id === selectedProductId);

  // Fetch product options and finishing options from DB when product is selected
  useEffect(() => {
    if (!selectedProductId) return;
    const fetchOptions = async () => {
      try {
        const [optsRes, finRes] = await Promise.all([
          fetch(`/api/products/${selectedProductId}/options`),
          fetch(`/api/products/${selectedProductId}/finishing`),
        ]);
        if (optsRes.ok) {
          const opts = await optsRes.json();
          setProductOptions(opts);
          // Fetch values for each option
          const valMap: Record<string, any[]> = {};
          for (const opt of opts) {
            valMap[opt.id] = opt.values || [];
          }
          setOptionValues(valMap);
        }
        if (finRes.ok) {
          const fins = await finRes.json();
          setDbFinishingOptions(fins);
        }
      } catch (err) {
        console.error("Failed to fetch options:", err);
      }
    };
    fetchOptions();
  }, [selectedProductId]);

  // Support ?product=<id> deep links (e.g. from the product catalogue): jump
  // straight into the details step for that product once the list has loaded.
  useEffect(() => {
    if (!urlProductId || !products?.length || selectedProductId) return;
    const target = products.find((p: any) => p.id === urlProductId);
    if (target) {
      setSelectedProductId(target.id);
      setStep("details");
    }
  }, [urlProductId, products, selectedProductId]);
  const selectedCategory = categories?.find((c: any) => c.id === selectedProduct?.categoryId);

  // Calculate price via server-side API (queries DB price rules)
  const [result, setResult] = useState<any>(null);
  const [calculating, setCalculating] = useState(false);

  const calculateServerPrice = useCallback(async () => {
    if (!selectedProduct) return;
    setCalculating(true);
    try {
      const response = await fetch("/api/calculator/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedProduct.id,
          inputs: {
            material,
            sides: parseInt(sides),
            qty: quantity,
            size: size || undefined,
            widthCm,
            heightCm,
          },
        }),
      });
      if (response.ok) {
        const data = await response.json();
        // Compute finishing total from selected options
        const allFinishOpts = dbFinishingOptions.length > 0 ? dbFinishingOptions : [];
        const finishingTotal = selectedFinishing.reduce((sum, id) => {
          const opt = allFinishOpts.find((f: any) => f.id === id);
          return sum + (opt ? opt.price * quantity : 0);
        }, 0);
        
        if (data.subtotal === 0 && data.unitPrice === 0 && data.message) {
          // No price rules configured for this product yet
          setResult({
            matchedRuleId: null,
            matchedBandId: null,
            unitPrice: 0,
            quantity: quantity,
            subtotal: 0,
            finishingTotal: 0,
            total: 0,
            breakdown: [{ label: data.message, amount: 0 }],
            requiresStaffReview: true,
          });
        } else {
          const breakdown = [
            { label: `${data.unitPrice?.toLocaleString() || 0} TZS × ${data.quantity || quantity} units`, amount: data.subtotal || 0 },
          ];
          if (selectedProduct.pricingModel === "area_based_range" && widthCm && heightCm) {
            const areaSqm = (widthCm / 100) * (heightCm / 100);
            breakdown.unshift({ label: `${areaSqm.toFixed(2)} m² × ${data.unitPrice?.toLocaleString() || 0} TZS/m²`, amount: data.subtotal || 0 });
            breakdown.splice(1, 1);
          }
          selectedFinishing.forEach((id) => {
            const allFinish = dbFinishingOptions.length > 0 ? dbFinishingOptions : [];
            const opt = allFinish.find((f: any) => f.id === id);
            if (opt) breakdown.push({ label: `${opt.name} (${opt.unit.replace(/_/g, " ")})`, amount: opt.price * quantity });
          });
          setResult({
            matchedRuleId: data.matchedRuleId,
            matchedBandId: data.matchedBandId,
            unitPrice: data.unitPrice,
            quantity: data.quantity || quantity,
            subtotal: data.subtotal,
            finishingTotal,
            total: (data.subtotal || 0) + finishingTotal,
            breakdown,
            requiresStaffReview: data.requiresStaffReview || false,
            sheetInfo: data.sheetInfo || null,
          });
        }
      } else {
        setResult(null);
      }
    } catch (err) {
      console.error("Price calculation error:", err);
      setResult(null);
    } finally {
      setCalculating(false);
    }
  }, [selectedProduct, material, sides, quantity, size, widthCm, heightCm, selectedFinishing]);

  // Recalculate when inputs change (debounced)
  useEffect(() => {
    if (!selectedProduct) return;
    const timer = setTimeout(() => {
      calculateServerPrice();
    }, 400);
    return () => clearTimeout(timer);
  }, [calculateServerPrice, selectedProduct]);

  const toggleFinishing = (id: string) => {
    setSelectedFinishing((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id],
    );
  };

  const handleSaveAsQuote = async () => {
    if (!result || !selectedProduct) return;
    try {
      const token = localStorage.getItem("printhub_token");
      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          inputSpec: { material, sides, qty: quantity, widthCm, heightCm },
          computedUnitPrice: result.unitPrice,
          quantity,
          finishingTotal: result.finishingTotal,
          lineTotal: result.total,
          notes: `${selectedProduct.name} - ${quantity} units`,
        }),
      });
      if (response.ok) {
        const quote = await response.json();
        alert(`Quote ${quote.quoteNumber} saved!`);
      } else {
        const err = await response.json();
        alert(`Error: ${err.error}`);
      }
    } catch (err) {
      console.error("Failed to save quote:", err);
      alert("Failed to save quote. Make sure you're logged in.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-title-1 font-bold text-[var(--text-primary)]">
          Price Calculator
        </h1>
        <p className="text-body text-[var(--text-secondary)] mt-1">
          Describe your project and get an instant quote
        </p>
      </motion.div>

      {/* Progress steps */}
      <div className="flex items-center gap-2">
        {(["category", "details", "result"] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-caption font-semibold transition-all duration-200 ${
                step === s
                  ? "bg-[var(--accent-primary)] text-white"
                  : i <
                    (["category", "details", "result"] as Step[]).indexOf(step)
                    ? "bg-[var(--accent-success)] text-white"
                    : "bg-[var(--glass-fill-subtle)] text-[var(--text-tertiary)]"
              }`}
            >
              {i + 1}
            </div>
            <span
              className={`text-caption font-medium hidden sm:block ${
                step === s ? "text-[var(--accent-primary)]" : "text-[var(--text-tertiary)]"
              }`}
            >
              {s === "category" ? "Category" : s === "details" ? "Details" : "Result"}
            </span>
            {i < 2 && <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)]" />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {step === "category" && (
              <motion.div
                key="category"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>What do you need?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {prodsLoading ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="h-20 rounded-[var(--radius-lg)] bg-[var(--glass-fill-subtle)] animate-pulse" />
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {products?.map((product: any) => (
                          <button
                            key={product.id}
                            onClick={() => {
                              setSelectedProductId(product.id);
                              setStep("details");
                            }}
                            className="flex items-center gap-3 p-4 rounded-[var(--radius-lg)] border border-[var(--glass-border)] bg-[var(--glass-fill-subtle)] hover:border-[var(--accent-primary)]/30 hover:bg-[rgba(255,90,60,0.03)] transition-all duration-200 text-left"
                          >
                            <span className="text-2xl">
                              {categoryIcons[product.name] || "🖨️"}
                            </span>
                            <div className="flex-1">
                              <p className="text-subhead font-semibold">{product.name}</p>
                              <p className="text-caption text-[var(--text-tertiary)]">
                                {product.description || product.pricingModel?.replace(/_/g, " ")}
                              </p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)]" />
                          </button>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {step === "details" && (
              <motion.div
                key="details"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <span>{categoryIcons[selectedProduct?.name || ""] || "🖨️"}</span>
                        {selectedProduct?.name}
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setStep("category")}
                      >
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Change
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Material selector (for products that need it) */}
                    {materialOptions[selectedProduct?.slug] && (
                      <div className="space-y-2">
                        <Label>Material</Label>
                        <Select value={material} onValueChange={setMaterial}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select material" />
                          </SelectTrigger>
                          <SelectContent>
                            {materialOptions[selectedProduct.slug].map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Size selector (for posters, brochures, books) */}
                    {productSizes[selectedProduct?.slug] && (
                      <div className="space-y-2">
                        <Label>Size</Label>
                        <div className="flex gap-2">
                          {productSizes[selectedProduct.slug].map((opt) => (
                            <Button
                              key={opt.value}
                              variant={size === opt.value ? "default" : "outline"}
                              size="sm"
                              onClick={() => setSize(opt.value)}
                              className="flex-1"
                            >
                              {opt.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Sides (for applicable products) */}
                    {showSidesFor.has(selectedProduct?.slug || "") && (
                      <div className="space-y-2">
                        <Label>Number of Sides</Label>
                        <div className="flex gap-2">
                          <Button
                            variant={sides === "1" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSides("1")}
                            className="flex-1"
                          >
                            Single Sided
                          </Button>
                          <Button
                            variant={sides === "2" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSides("2")}
                            className="flex-1"
                          >
                            Double Sided
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Dimensions (for area-based models) */}
                    {selectedProduct?.pricingModel === "area_based_range" && (
                      <div className="space-y-2">
                        <Label>Dimensions</Label>
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <Input
                              type="number"
                              placeholder="Width (cm)"
                              value={widthCm}
                              onChange={(e) => setWidthCm(parseInt(e.target.value) || 0)}
                            />
                          </div>
                          <div className="flex-1">
                            <Input
                              type="number"
                              placeholder="Height (cm)"
                              value={heightCm}
                              onChange={(e) => setHeightCm(parseInt(e.target.value) || 0)}
                            />
                          </div>
                        </div>
                        <p className="text-caption text-[var(--text-tertiary)]">
                          Area: {cmToSqm(widthCm, heightCm).toFixed(2)} m²
                        </p>
                      </div>
                    )}

                    {/* Quantity */}
                    <div className="space-y-2">
                      <Label>Quantity</Label>
                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setQuantity(Math.max(1, quantity - 10))}
                        >
                          −
                        </Button>
                        <Input
                          type="number"
                          value={quantity}
                          onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                          className="w-24 text-center"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setQuantity(quantity + 10)}
                        >
                          +
                        </Button>
                      </div>
                    </div>

                    {/* Dynamic options from product_options table */}
                    {productOptions.map((opt) => (
                      <div key={opt.id} className="space-y-2">
                        <Label>{opt.optionLabel}</Label>
                        {opt.inputType === "select" && (optionValues[opt.id]?.length || 0) > 0 ? (
                          <div className="flex gap-2 flex-wrap">
                            {(optionValues[opt.id] || []).map((val: any) => (
                              <Button
                                key={val.id}
                                variant={(material === val.valueKey || size === val.valueKey) ? "default" : "outline"}
                                size="sm"
                                onClick={() => {
                                  if (opt.optionKey === "material" || opt.optionKey === "gsm") setMaterial(val.valueKey);
                                  if (opt.optionKey === "size" || opt.optionKey === "size_variant") setSize(val.valueKey);
                                  if (opt.optionKey === "sides") setSides(val.valueKey === "double" ? "2" : "1");
                                }}
                                className="flex-1"
                              >
                                {val.valueLabel}
                              </Button>
                            ))}
                          </div>
                        ) : opt.inputType === "number" ? (
                          <Input
                            type="number"
                            placeholder={opt.optionLabel}
                            value={opt.optionKey === "qty" ? quantity : ""}
                            onChange={(e) => {
                              if (opt.optionKey === "qty") setQuantity(parseInt(e.target.value) || 1);
                            }}
                          />
                        ) : opt.inputType === "dimension" ? (
                          <div className="flex gap-3">
                            <div className="flex-1">
                              <Input type="number" placeholder="Width (cm)" value={widthCm} onChange={(e) => setWidthCm(parseInt(e.target.value) || 0)} />
                            </div>
                            <div className="flex-1">
                              <Input type="number" placeholder="Height (cm)" value={heightCm} onChange={(e) => setHeightCm(parseInt(e.target.value) || 0)} />
                            </div>
                          </div>
                        ) : opt.inputType === "boolean" ? (
                          <div className="flex items-center gap-3">
                            <Switch
                              checked={material === opt.optionKey}
                              onCheckedChange={() => setMaterial(material === opt.optionKey ? "" : opt.optionKey)}
                            />
                            <span className="text-subhead">Enable {opt.optionLabel}</span>
                          </div>
                        ) : null}
                      </div>
                    ))}

                    {/* Fallback: hardcoded material options if no DB options */}
                    {productOptions.length === 0 && materialOptions[selectedProduct?.slug] && (
                      <div className="space-y-2">
                        <Label>Material</Label>
                        <Select value={material} onValueChange={setMaterial}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select material" />
                          </SelectTrigger>
                          <SelectContent>
                            {materialOptions[selectedProduct.slug].map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Fallback: hardcoded size options if no DB options */}
                    {productOptions.length === 0 && productSizes[selectedProduct?.slug] && (
                      <div className="space-y-2">
                        <Label>Size</Label>
                        <div className="flex gap-2">
                          {productSizes[selectedProduct.slug].map((opt) => (
                            <Button key={opt.value} variant={size === opt.value ? "default" : "outline"} size="sm" onClick={() => setSize(opt.value)} className="flex-1">
                              {opt.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Fallback: hardcoded sides toggle if no DB options */}
                    {productOptions.length === 0 && showSidesFor.has(selectedProduct?.slug || "") && (
                      <div className="space-y-2">
                        <Label>Number of Sides</Label>
                        <div className="flex gap-2">
                          <Button variant={sides === "1" ? "default" : "outline"} size="sm" onClick={() => setSides("1")} className="flex-1">Single Sided</Button>
                          <Button variant={sides === "2" ? "default" : "outline"} size="sm" onClick={() => setSides("2")} className="flex-1">Double Sided</Button>
                        </div>
                      </div>
                    )}

                    <Button className="w-full" onClick={() => setStep("result")}>
                      Calculate Price
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {step === "result" && (
              <motion.div
                key="result"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-[var(--accent-secondary)]" />
                        Price Breakdown
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setStep("details")}
                      >
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Adjust
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {result && (
                      <>
                        <div className="space-y-3">
                          {result.breakdown.map((line: any, i: number) => (
                            <div key={i} className="flex items-center justify-between">
                              <span className="text-subhead text-[var(--text-secondary)]">
                                {line.label}
                              </span>
                              <span className="text-subhead font-medium">
                                {line.amount > 0 ? formatTZS(line.amount) : "—"}
                              </span>
                            </div>
                          ))}
                        </div>

                        <Separator />

                        {result.finishingTotal > 0 && (
                          <>
                            <div className="flex items-center justify-between">
                              <span className="text-subhead text-[var(--text-secondary)]">
                                Finishing Add-ons
                              </span>
                              <span className="text-subhead font-medium">
                                {formatTZS(result.finishingTotal)}
                              </span>
                            </div>
                            <Separator />
                          </>
                        )}

                        <div className="flex items-center justify-between">
                          <span className="text-title-2 font-bold">Total</span>
                          <span className="text-title-1 font-bold text-[var(--accent-primary)]">
                            {formatTZS(result.total)}
                          </span>
                        </div>

                        {result.requiresStaffReview && (
                          <div className="flex items-start gap-2 p-3 rounded-[var(--radius-md)] bg-[rgba(255,159,10,0.08)] border border-[rgba(255,159,10,0.2)]">
                            <Info className="w-4 h-4 text-[var(--accent-warning)] mt-0.5 flex-shrink-0" />
                            <p className="text-caption text-[var(--text-secondary)]">
                              This item needs a quick review from our team. We'll confirm your price shortly.
                            </p>
                          </div>
                        )}

                        <div className="flex gap-3 pt-2">
                          <Button className="flex-1" onClick={handleSaveAsQuote}>
                            Save as Quote
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                              if (selectedProduct && result) {
                                addItem({
                                  productId: selectedProduct.id,
                                  name: selectedProduct.name,
                                  price: result.unitPrice,
                                  quantity,
                                  inputSpec: { material, sides, qty: quantity, widthCm, heightCm },
                                });
                                alert("Added to cart!");
                              }
                            }}
                          >
                            Add to Cart
                          </Button>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar receipt */}
        <div className="hidden lg:block">
          <div className="sticky top-20">
            <Card variant="strong">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-[var(--accent-primary)]" />
                  Live Receipt
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {result ? (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between text-caption text-[var(--text-tertiary)]">
                        <span>Product</span>
                        <span>{selectedProduct?.name}</span>
                      </div>
                      <div className="flex justify-between text-caption text-[var(--text-tertiary)]">
                        <span>Quantity</span>
                        <span>{quantity}</span>
                      </div>
                      {selectedProduct?.pricingModel === "area_based_range" && (
                        <div className="flex justify-between text-caption text-[var(--text-tertiary)]">
                          <span>Area</span>
                          <span>{cmToSqm(widthCm, heightCm).toFixed(2)} m²</span>
                        </div>
                      )}
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      {result.breakdown.map((line: any, i: number) => (
                        <div key={i} className="flex justify-between text-caption">
                          <span className="text-[var(--text-secondary)]">{line.label}</span>
                          <span>{line.amount > 0 ? formatTZS(line.amount) : "—"}</span>
                        </div>
                      ))}
                    </div>

                    {result.sheetInfo && (
                      <div className="p-2 rounded bg-[rgba(46,125,255,0.08)] text-caption">
                        <p className="text-[var(--accent-tertiary)] font-medium">Sheet: {result.sheetInfo.sheetSize}</p>
                        <p className="text-[var(--text-secondary)]">{result.sheetInfo.itemsPerSheet} items/sheet, {result.sheetInfo.sheetsNeeded} sheets needed</p>
                      </div>
                    )}

                    {result.finishingTotal > 0 && (
                      <div className="flex justify-between text-caption">
                        <span className="text-[var(--text-secondary)]">Finishing</span>
                        <span>{formatTZS(result.finishingTotal)}</span>
                      </div>
                    )}

                    <Separator />

                    <div className="flex justify-between">
                      <span className="text-headline font-bold">Total</span>
                      <span className="text-title-2 font-bold text-[var(--accent-primary)]">
                        {formatTZS(result.total)}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Calculator className="w-10 h-10 text-[var(--text-tertiary)] mx-auto mb-3" />
                    <p className="text-subhead text-[var(--text-tertiary)]">
                      Fill in the details to see a live price
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
