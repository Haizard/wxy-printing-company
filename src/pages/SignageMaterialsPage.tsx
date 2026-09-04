import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Package, Plus, Pencil, Trash2, DollarSign, Tag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { formatTZS } from "@/lib/utils";

const UNITS = ["m2", "meter", "piece", "kg", "set", "roll", "sheet", "liter", "meter_run"];

export default function SignageMaterialsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === "admin";

  const [categories, setCategories] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Category dialog
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<any>(null);
  const [catForm, setCatForm] = useState({ name: "", slug: "", description: "", sortOrder: 0 });

  // Material dialog
  const [matDialogOpen, setMatDialogOpen] = useState(false);
  const [editingMat, setEditingMat] = useState<any>(null);
  const [matForm, setMatForm] = useState({
    categoryId: "", name: "", slug: "", description: "", unit: "piece",
    pricePerUnit: 0, costPerUnit: 0, minOrderQty: "1", leadTimeDays: 0, supplier: "",
  });

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [catsRes, matsRes] = await Promise.all([
        fetch("/api/signage-material-categories"),
        fetch("/api/signage-materials"),
      ]);
      if (catsRes.ok) setCategories(await catsRes.json());
      if (matsRes.ok) setMaterials(await matsRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const getHeaders = () => {
    const token = localStorage.getItem("printhub_token");
    return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  };

  // Category CRUD
  const saveCat = async () => {
    if (!catForm.name || !catForm.slug) { toast({ title: "Name and slug required", variant: "destructive" }); return; }
    const url = editingCat ? `/api/signage-material-categories/${editingCat.id}` : "/api/signage-material-categories";
    const method = editingCat ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: getHeaders(), body: JSON.stringify(catForm) });
    if (res.ok) { toast({ title: editingCat ? "Updated" : "Created", variant: "success" as any }); setCatDialogOpen(false); fetchAll(); }
    else { toast({ title: "Failed", variant: "destructive" }); }
  };

  const deleteCat = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    await fetch(`/api/signage-material-categories/${id}`, { method: "DELETE", headers: getHeaders() });
    fetchAll();
  };

  // Material CRUD
  const saveMat = async () => {
    if (!matForm.name || !matForm.slug || !matForm.categoryId) { toast({ title: "Name, slug, and category required", variant: "destructive" }); return; }
    const url = editingMat ? `/api/signage-materials/${editingMat.id}` : "/api/signage-materials";
    const method = editingMat ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: getHeaders(), body: JSON.stringify(matForm) });
    if (res.ok) { toast({ title: editingMat ? "Updated" : "Created", variant: "success" as any }); setMatDialogOpen(false); fetchAll(); }
    else { toast({ title: "Failed", variant: "destructive" }); }
  };

  const deleteMat = async (id: string) => {
    if (!confirm("Delete this material?")) return;
    await fetch(`/api/signage-materials/${id}`, { method: "DELETE", headers: getHeaders() });
    fetchAll();
  };

  const openCreateMat = () => {
    setEditingMat(null);
    setMatForm({ categoryId: categories[0]?.id || "", name: "", slug: "", description: "", unit: "piece", pricePerUnit: 0, costPerUnit: 0, minOrderQty: "1", leadTimeDays: 0, supplier: "" });
    setMatDialogOpen(true);
  };

  const openEditMat = (mat: any) => {
    setEditingMat(mat);
    setMatForm({ categoryId: mat.categoryId || "", name: mat.name || "", slug: mat.slug || "", description: mat.description || "", unit: mat.unit || "piece", pricePerUnit: mat.pricePerUnit || 0, costPerUnit: mat.costPerUnit || 0, minOrderQty: mat.minOrderQty || "1", leadTimeDays: mat.leadTimeDays || 0, supplier: mat.supplier || "" });
    setMatDialogOpen(true);
  };

  // Group materials by category
  const matsByCategory = new Map<string, any[]>();
  materials.forEach((m) => {
    const cat = categories.find((c) => c.id === m.categoryId);
    const key = cat?.name || "Uncategorized";
    if (!matsByCategory.has(key)) matsByCategory.set(key, []);
    matsByCategory.get(key)!.push(m);
  });

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-title-1 font-bold text-[var(--text-primary)]">Signage Materials</h1>
            <p className="text-body text-[var(--text-secondary)] mt-1">
              Manage materials, pricing, and categories for signage products
            </p>
          </div>
          {isAdmin && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setEditingCat(null); setCatForm({ name: "", slug: "", description: "", sortOrder: 0 }); setCatDialogOpen(true); }}>
                <Tag className="w-4 h-4 mr-1" /> Add Category
              </Button>
              <Button onClick={openCreateMat}>
                <Plus className="w-4 h-4 mr-1" /> Add Material
              </Button>
            </div>
          )}
        </div>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-32 rounded-[var(--radius-lg)] bg-[var(--glass-fill-subtle)] animate-pulse" />)}
        </div>
      ) : categories.length === 0 && materials.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="w-10 h-10 text-[var(--text-tertiary)] mx-auto mb-3" />
            <p className="text-subhead text-[var(--text-tertiary)]">No materials configured yet.</p>
            <p className="text-caption text-[var(--text-tertiary)] mt-1">Add categories first, then add materials with pricing.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Categories */}
          <Card>
            <CardHeader>
              <CardTitle>Categories ({categories.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <div key={cat.id} className="flex items-center gap-2 p-2 rounded-[var(--radius-md)] bg-[var(--glass-fill-subtle)]">
                    <span className="text-subhead font-medium">{cat.name}</span>
                    <Badge variant="outline" className="text-caption">{materials.filter((m) => m.categoryId === cat.id).length} items</Badge>
                    {isAdmin && (
                      <>
                        <button onClick={() => { setEditingCat(cat); setCatForm({ name: cat.name, slug: cat.slug, description: cat.description || "", sortOrder: cat.sortOrder || 0 }); setCatDialogOpen(true); }} className="text-[var(--text-tertiary)] hover:text-[var(--accent-tertiary)]">
                          <Pencil className="w-3 h-3" />
                        </button>
                     
                          <button onClick={() => deleteCat(cat.id)} className="text-[var(--text-tertiary)] hover:text-red-500">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {Array.from(matsByCategory.entries()).map(([catName, catMaterials]) => (
            <Card key={catName}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-[var(--accent-primary)]" />
                  {catName}
                  <Badge variant="outline">{catMaterials.length} materials</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--glass-border)]">
                        <th className="text-left py-3 px-2 text-caption font-semibold text-[var(--text-secondary)]">Name</th>
                        <th className="text-left py-3 px-2 text-caption font-semibold text-[var(--text-secondary)]">Unit</th>
                        <th className="text-right py-3 px-2 text-caption font-semibold text-[var(--text-secondary)]">Price/Unit</th>
                        <th className="text-right py-3 px-2 text-caption font-semibold text-[var(--text-secondary)]">Cost/Unit</th>
                        <th className="text-left py-3 px-2 text-caption font-semibold text-[var(--text-secondary)]">Supplier</th>
                        <th className="text-center py-3 px-2 text-caption font-semibold text-[var(--text-secondary)]">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {catMaterials.map((mat) => (
                        <tr key={mat.id} className="border-b border-[rgba(0,0,0,0.04)] hover:bg-[var(--glass-fill-subtle)]">
                          <td className="py-3 px-2">
                            <p className="font-medium">{mat.name}</p>
                            {mat.description && <p className="text-caption text-[var(--text-tertiary)]">{mat.description}</p>}
                          </td>
                          <td className="py-3 px-2 text-[var(--text-secondary)]">{mat.unit}</td>
                          <td className="py-3 px-2 text-right font-semibold">{formatTZS(mat.pricePerUnit)}</td>
                          <td className="py-3 px-2 text-right text-[var(--text-secondary)]">{mat.costPerUnit ? formatTZS(mat.costPerUnit) : "—"}</td>
                          <td className="py-3 px-2 text-[var(--text-secondary)]">{mat.supplier || "—"}</td>
                          <td className="py-3 px-2 text-center">
                            {isAdmin && (
                              <div className="flex items-center justify-center gap-2">
                                <Button size="sm" variant="ghost" onClick={() => openEditMat(mat)}>
                                  <Pencil className="w-3 h-3" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => deleteMat(mat.id)} className="text-red-500">
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingCat ? "Edit Category" : "New Category"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Name</Label><Input value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} placeholder="e.g. Base Materials" /></div>
            <div className="space-y-2"><Label>Slug</Label><Input value={catForm.slug} onChange={(e) => setCatForm({ ...catForm, slug: e.target.value })} placeholder="e.g. base-materials" /></div>
            <div className="space-y-2"><Label>Description</Label><Input value={catForm.description} onChange={(e) => setCatForm({ ...catForm, description: e.target.value })} /></div>
            <div className="flex gap-3">
              <Button className="flex-1" onClick={saveCat}>{editingCat ? "Save" : "Create"}</Button>
              <Button variant="outline" onClick={() => setCatDialogOpen(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={matDialogOpen} onOpenChange={setMatDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingMat ? "Edit Material" : "New Material"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Category</Label>
              <Select value={matForm.categoryId} onValueChange={(v) => setMatForm({ ...matForm, categoryId: v })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Name</Label><Input value={matForm.name} onChange={(e) => setMatForm({ ...matForm, name: e.target.value })} placeholder="e.g. Acrylic 6mm" /></div>
              <div className="space-y-2"><Label>Slug</Label><Input value={matForm.slug} onChange={(e) => setMatForm({ ...matForm, slug: e.target.value })} placeholder="e.g. acrylic-6mm" /></div>
            </div>
            <div className="space-y-2"><Label>Description</Label><Input value={matForm.description} onChange={(e) => setMatForm({ ...matForm, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Unit</Label>
                <Select value={matForm.unit} onValueChange={(v) => setMatForm({ ...matForm, unit: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Min Order Qty</Label><Input type="number" value={matForm.minOrderQty} onChange={(e) => setMatForm({ ...matForm, minOrderQty: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Price per Unit (TZS)</Label><Input type="number" value={matForm.pricePerUnit} onChange={(e) => setMatForm({ ...matForm, pricePerUnit: Number(e.target.value) })} /></div>
              <div className="space-y-2"><Label>Cost per Unit (TZS)</Label><Input type="number" value={matForm.costPerUnit} onChange={(e) => setMatForm({ ...matForm, costPerUnit: Number(e.target.value) })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Lead Time (days)</Label><Input type="number" value={matForm.leadTimeDays} onChange={(e) => setMatForm({ ...matForm, leadTimeDays: Number(e.target.value) })} /></div>
              <div className="space-y-2"><Label>Supplier</Label><Input value={matForm.supplier} onChange={(e) => setMatForm({ ...matForm, supplier: e.target.value })} /></div>
            </div>
            <div className="flex gap-3">
              <Button className="flex-1" onClick={saveMat}>{editingMat ? "Save" : "Create"}</Button>
              <Button variant="outline" onClick={() => setMatDialogOpen(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}