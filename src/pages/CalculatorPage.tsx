import { useState, useMemo } from "react";
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
import { useProducts, useCategories } from "@/hooks/useApi";

type Step = "category" | "details" | "result";

const finishingOptions = [
  { id: "creasing", name: "Creasing", price: 200, unit: "per_piece" },
  { id: "saddle_stitch", name: "Saddle Stitch", price: 500, unit: "per_piece" },
  { id: "perfect_bind", name: "Perfect Binding", price: 2000, unit: "per_piece" },
  { id: "hardcover", name: "Hardcover Binding", price: 5000, unit: "per_piece" },
  { id: "lamination", name: "Lamination", price: 300, unit: "per_a3_side" },
  { id: "folding", name: "Folding", price: 100, unit: "per_piece" },
];

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

export default function CalculatorPage() {
  const [step, setStep] = useState<Step>("category");
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [material, setMaterial] = useState("");
  const [sides, setSides] = useState<"1" | "2">("1");
  const [quantity, setQuantity] = useState(100);
  const [widthCm, setWidthCm] = useState(100);
  const [heightCm, setHeightCm] = useState(100);
  const [selectedFinishing, setSelectedFinishing] = useState<string[]>([]);

  const { data: products, loading: prodsLoading } = useProducts();
  const { data: categories, loading: catsLoading } = useCategories();

  const selectedProduct = products?.find((p: any) => p.id === selectedProductId);
  const selectedCategory = categories?.find((c: any) => c.id === selectedProduct?.categoryId);

  // Calculate price client-side using the pricing engine
  const result = useMemo(() => {
    if (!selectedProduct) return null;

    const { calculatePrice } = require("@/lib/pricing-engine");
    return calculatePrice({
      categoryId: selectedProduct.id,
      model: selectedProduct.pricingModel,
      material,
      sides: parseInt(sides),
      qty: quantity,
      widthCm,
      heightCm,
      finishing: selectedFinishing.map((id) =>
        finishingOptions.find((f) => f.id === id)!,
      ),
    });
  }, [selectedProduct, material, sides, quantity, widthCm, heightCm, selectedFinishing]);

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
                    {/* Sides (for applicable models) */}
                    {selectedProduct?.pricingModel === "flat_fixed_per_unit_band" && (
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

                    {/* Finishing options */}
                    <div className="space-y-3">
                      <Label>Finishing Options</Label>
                      <div className="space-y-2">
                        {finishingOptions.map((finish) => (
                          <div
                            key={finish.id}
                            className="flex items-center justify-between p-3 rounded-[var(--radius-md)] border border-[var(--glass-border)] bg-[var(--glass-fill-subtle)]"
                          >
                            <div className="flex items-center gap-3">
                              <Switch
                                checked={selectedFinishing.includes(finish.id)}
                                onCheckedChange={() => toggleFinishing(finish.id)}
                              />
                              <div>
                                <p className="text-subhead font-medium">{finish.name}</p>
                                <p className="text-caption text-[var(--text-tertiary)]">
                                  {formatTZS(finish.price)} {finish.unit.replace(/_/g, " ")}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

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
                          <Button variant="outline" className="flex-1">
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
