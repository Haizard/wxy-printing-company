import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Package, ChevronRight, Plus, Pencil, Trash2, X, ImagePlus } from "lucide-react";
import ImageSlideshow from "@/components/ui/ImageSlideshow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { useCategories, useProducts } from "@/hooks/useApi";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { processImageFileForUpload } from "@/lib/image-utils";

const PRICING_MODELS = [
  "qty_band_per_unit",
  "area_based_range",
  "coverage_qty_band",
  "sheet_qty_tier_markup",
  "imposition_sheet_based",
  "flat_fixed_per_unit_band",
  "flat_fixed_service_fee",
  "percentage_markup_on_material",
  "package_tier_flat_fee",
  "per_page_band",
  "per_page_plus_design_fee",
  "range_service_fee",
  "area_qty_band",
  "qty_band_by_leaf_count",
  "flat_fixed_range_per_unit",
  "signage_engrave_cut_formula",
];

export default function CatalogPage() {
  const { data: categories, loading: catsLoading, refetch: refetchCats } = useCategories();
  const { data: products, loading: prodsLoading, refetch: refetchProds } = useProducts();
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === "admin";

  // Category dialog
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<any>(null);
  const [catForm, setCatForm] = useState({ name: "", slug: "", icon: "", parentId: "" });

  // Product dialog
  const [prodDialogOpen, setProdDialogOpen] = useState(false);
  const [editingProd, setEditingProd] = useState<any>(null);
  const [prodForm, setProdForm] = useState({
    name: "", slug: "", description: "", categoryId: "", pricingModel: "flat_fixed_per_unit_band",
    baseUnit: "piece", minOrderQty: 1, leadTimeDays: 3, images: [] as string[],
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImages, setUploadingImages] = useState(false);

  const getHeaderColor = (name: string) => {
    const colors: Record<string, string> = {
      "Digital Printing": "from-blue-500 to-blue-600",
      "Offset Printing": "from-orange-500 to-orange-600",
      "Large Format": "from-green-500 to-green-600",
      "Flat-Bed Rigid Media": "from-purple-500 to-purple-600",
      "Signage": "from-red-500 to-red-600",
      "Photo & Canvas": "from-pink-500 to-pink-600",
      "Cards & Small Format": "from-yellow-500 to-yellow-600",
      "Books & Stationery": "from-indigo-500 to-indigo-600",
      "Promotional Merchandise": "from-teal-500 to-teal-600",
      "Apparel & Digitization": "from-cyan-500 to-cyan-600",
      "Design Services": "from-rose-500 to-rose-600",
      "Calendars": "from-violet-500 to-violet-600",
    };
    return colors[name] || "from-gray-500 to-gray-600";
  };

  const openCreateCat = () => {
    setEditingCat(null);
    setCatForm({ name: "", slug: "", icon: "", parentId: "" });
    setCatDialogOpen(true);
  };

  const openEditCat = (cat: any) => {
    setEditingCat(cat);
    setCatForm({ name: cat.name, slug: cat.slug, icon: cat.icon || "", parentId: cat.parentId || "" });
    setCatDialogOpen(true);
  };

  const saveCat = async () => {
    const method = editingCat ? "PUT" : "POST";
    const url = editingCat ? `/api/categories/${editingCat.id}` : "/api/categories";
    const token = localStorage.getItem("printhub_token");
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...catForm, parentId: catForm.parentId || null }),
    });
    if (res.ok) {
      setCatDialogOpen(false);
      refetchCats();
      refetchProds();
    } else {
      const err = await res.json();
      alert(err.error || "Failed to save category");
    }
  };

  const deleteCat = async (id: string) => {
    if (!confirm("Delete this category and all its products?")) return;
    const token = localStorage.getItem("printhub_token");
    await fetch(`/api/categories/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    refetchCats();
    refetchProds();
  };

  const openCreateProd = (categoryId?: string) => {
    setEditingProd(null);
    setProdForm({ name: "", slug: "", description: "", categoryId: categoryId || "", pricingModel: "flat_fixed_per_unit_band", baseUnit: "piece", minOrderQty: 1, leadTimeDays: 3, images: [] });
    setProdDialogOpen(true);
  };

  const openEditProd = (prod: any) => {
    setEditingProd(prod);
    setProdForm({ name: prod.name, slug: prod.slug, description: prod.description || "", categoryId: prod.categoryId, pricingModel: prod.pricingModel, baseUnit: prod.baseUnit || "piece", minOrderQty: prod.minOrderQty || 1, leadTimeDays: prod.leadTimeDays || 3, images: prod.images || [] });
    setProdDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // Snapshot the File objects BEFORE clearing the input value — resetting
    // the input empties the FileList in place, which would otherwise make the
    // processing step see zero files.
    const fileList = Array.from(e.target.files || []);
    if (fileList.length === 0) return;
    e.target.value = "";
    setUploadingImages(true);
    const skipped: string[] = [];
    const keptAsIs: string[] = [];
    try {
      // Process files one at a time so previews stream in as each image is
      // ready and any problem file is reported by name instead of failing
      // the whole selection silently.
      for (const file of fileList) {
        const outcome = await processImageFileForUpload(file);
        if (outcome.dataUrl) {
          setProdForm((prev) => ({
            ...prev,
            images: [...prev.images, outcome.dataUrl as string],
          }));
          if (outcome.reason) {
            keptAsIs.push(`${file.name} — ${outcome.reason}`);
          }
        } else {
          skipped.push(`${file.name} — ${outcome.reason || "unsupported file"}`);
        }
      }
      if (skipped.length > 0) {
        toast({
          title: `${skipped.length} image${skipped.length > 1 ? "s" : ""} skipped`,
          description: skipped.join("\n"),
          variant: "destructive",
        });
      }
      if (keptAsIs.length > 0) {
        toast({
          title: `${keptAsIs.length} image${keptAsIs.length > 1 ? "s" : ""} kept as-is`,
          description:
            keptAsIs.join("\n") +
            "\nJPG or PNG images are compressed automatically and are safest for all devices.",
        });
      }
    } catch (err) {
      toast({
        title: "Image upload error",
        description:
          err instanceof Error ? err.message : "Something went wrong while processing the images.",
        variant: "destructive",
      });
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index: number) => {
    setProdForm((prev) => ({ ...prev, images: prev.images.filter((_: string, i: number) => i !== index) }));
  };

  const saveProd = async () => {
    const method = editingProd ? "PUT" : "POST";
    const url = editingProd ? `/api/products/${editingProd.id}` : "/api/products";
    const token = localStorage.getItem("printhub_token");
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(prodForm),
    });
    if (res.ok) {
      setProdDialogOpen(false);
      refetchProds();
    } else {
      const err = await res.json();
      alert(err.error || "Failed to save product");
    }
  };

  const deleteProd = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    const token = localStorage.getItem("printhub_token");
    await fetch(`/api/products/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    refetchProds();
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-title-1 font-bold text-[var(--text-primary)]">Catalog</h1>
            <p className="text-body text-[var(--text-secondary)] mt-1">Browse products & services</p>
          </div>
          {isAdmin && (
            <div className="flex gap-2">
              <Button size="sm" onClick={openCreateCat}>
                <Plus className="w-4 h-4 mr-1" /> Category
              </Button>
              <Button size="sm" variant="outline" onClick={() => openCreateProd()}>
                <Plus className="w-4 h-4 mr-1" /> Product
              </Button>
            </div>
          )}
        </div>
      </motion.div>

      {catsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 rounded-[var(--radius-lg)] bg-[var(--glass-fill-subtle)] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories?.filter((c: any) => !c.parentId).map((category: any) => {
            const catProducts = products?.filter((p: any) => p.categoryId === category.id) || [];
            return (
              <motion.div key={category.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                <Card className="overflow-hidden hover:shadow-glass-lg transition-shadow duration-200">
                  <div className={`h-2 bg-gradient-to-r ${getHeaderColor(category.name)}`} />
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{category.icon || "📁"}</span>
                        <div>
                          <CardTitle className="text-headline">{category.name}</CardTitle>
                          <p className="text-caption text-[var(--text-tertiary)]">{catProducts.length} products</p>
                        </div>
                      </div>
                      {isAdmin && (
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEditCat(category)}>
                            <Pencil className="w-3 h-3" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-[var(--accent-danger)]" onClick={() => deleteCat(category.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {catProducts.slice(0, 4).map((product: any) => (
                        <div key={product.id} className="flex items-center justify-between p-2 rounded-[var(--radius-sm)] bg-[var(--glass-fill-subtle)] hover:bg-[var(--glass-fill)] transition-colors">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {product.images && product.images.length > 0 ? (
                              <div className="w-8 h-8 rounded-[var(--radius-sm)] overflow-hidden flex-shrink-0">
                                <ImageSlideshow images={product.images} alt={product.name} showDots={false} showArrows={false} aspectRatio="square" />
                              </div>
                            ) : (
                              <Package className="w-3.5 h-3.5 text-[var(--text-tertiary)] flex-shrink-0" />
                            )}
                            <span className="text-subhead truncate">{product.name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {isAdmin && (
                              <>
                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => openEditProd(product)}>
                                  <Pencil className="w-3 h-3" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-6 w-6 text-[var(--accent-danger)]" onClick={() => deleteProd(product.id)}>
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </>
                            )}
                            <Link to={`/catalog/${category.id}`}>
                              <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)]" />
                            </Link>
                          </div>
                        </div>
                      ))}
                      {catProducts.length > 4 && (
                        <Link to={`/catalog/${category.id}`} className="block text-center text-caption text-[var(--accent-tertiary)] hover:underline py-1">
                          View all {catProducts.length} products →
                        </Link>
                      )}
                    </div>
                    {isAdmin && (
                      <Button size="sm" variant="ghost" className="w-full mt-2" onClick={() => openCreateProd(category.id)}>
                        <Plus className="w-3 h-3 mr-1" /> Add Product
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Category Dialog */}
      <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCat ? "Edit Category" : "New Category"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} placeholder="e.g. Digital Printing" />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input value={catForm.slug} onChange={(e) => setCatForm({ ...catForm, slug: e.target.value })} placeholder="e.g. digital-printing" />
            </div>
            <div className="space-y-2">
              <Label>Icon (emoji)</Label>
              <Input value={catForm.icon} onChange={(e) => setCatForm({ ...catForm, icon: e.target.value })} placeholder="🖨️" />
            </div>
            <div className="space-y-2">
              <Label>Parent Category</Label>
              <Select value={catForm.parentId || "none"} onValueChange={(v) => setCatForm({ ...catForm, parentId: v === "none" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="None (top-level)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (top-level)</SelectItem>
                  {categories?.filter((c: any) => !c.parentId).map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 pt-2">
              <Button className="flex-1" onClick={saveCat}>{editingCat ? "Save Changes" : "Create Category"}</Button>
              <Button variant="outline" onClick={() => setCatDialogOpen(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Product Dialog */}
      <Dialog open={prodDialogOpen} onOpenChange={setProdDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingProd ? "Edit Product" : "New Product"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={prodForm.name} onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })} placeholder="e.g. Business Cards" />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input value={prodForm.slug} onChange={(e) => setProdForm({ ...prodForm, slug: e.target.value })} placeholder="e.g. business-cards" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={prodForm.description} onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })} placeholder="Product description" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={prodForm.categoryId} onValueChange={(v) => setProdForm({ ...prodForm, categoryId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {categories?.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Pricing Model</Label>
                <Select value={prodForm.pricingModel} onValueChange={(v) => setProdForm({ ...prodForm, pricingModel: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRICING_MODELS.map((m) => (
                      <SelectItem key={m} value={m}>{m.replace(/_/g, " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Base Unit</Label>
                <Select value={prodForm.baseUnit} onValueChange={(v) => setProdForm({ ...prodForm, baseUnit: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["piece", "sheet", "sqm", "roll", "stitch", "page"].map((u) => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Min Qty</Label>
                <Input type="number" value={prodForm.minOrderQty} onChange={(e) => setProdForm({ ...prodForm, minOrderQty: parseInt(e.target.value) || 1 })} />
              </div>
              <div className="space-y-2">
                <Label>Lead Time (days)</Label>
                <Input type="number" value={prodForm.leadTimeDays} onChange={(e) => setProdForm({ ...prodForm, leadTimeDays: parseInt(e.target.value) || 1 })} />
              </div>
            </div>
            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Product Images</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageUpload}
              />
              {prodForm.images.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {prodForm.images.map((img: string, idx: number) => (
                    <div key={idx} className="relative group rounded-[var(--radius-md)] overflow-hidden border border-[var(--glass-border)]">
                      <img src={img} alt={`Image ${idx + 1}`} className="w-full aspect-square object-cover" />
                      <button
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImages}
              >
                <ImagePlus className="w-4 h-4 mr-2" />
                {uploadingImages ? "Processing..." : `Add Images (${prodForm.images.length} uploaded)`}
              </Button>
            </div>
            <div className="flex gap-3 pt-2">
              <Button className="flex-1" onClick={saveProd}>{editingProd ? "Save Changes" : "Create Product"}</Button>
              <Button variant="outline" onClick={() => setProdDialogOpen(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
