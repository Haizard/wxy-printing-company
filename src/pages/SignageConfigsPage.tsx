import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Settings, Plus, Pencil, Trash2, Package, Link2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export default function SignageConfigsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === "admin";

  const [configs, setConfigs] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<any>(null);
  const [configForm, setConfigForm] = useState({ productId: "", name: "", description: "" });

  const [materialDialogOpen, setMaterialDialogOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<any>(null);
  const [materialForm, setMaterialForm] = useState({ materialId: "", isRequired: true, defaultValue: "1", maxValue: "", sortOrder: 0 });

  const getHeaders = () => {
    const token = localStorage.getItem("printhub_token");
    return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [cfgsRes, prodsRes, matsRes, catsRes] = await Promise.all([
        fetch("/api/signage-configs", { headers: getHeaders() }),
        fetch("/api/products"),
        fetch("/api/signage-materials", { headers: getHeaders() }),
        fetch("/api/signage-material-categories", { headers: getHeaders() }),
      ]);
      if (cfgsRes.ok) setConfigs(await cfgsRes.json());
      if (prodsRes.ok) setProducts(await prodsRes.json());
      if (matsRes.ok) setMaterials(await matsRes.json());
      if (catsRes.ok) setCategories(await catsRes.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const saveConfig = async () => {
    if (!configForm.productId || !configForm.name) { toast({ title: "Product and name required", variant: "destructive" }); return; }
    const url = editingConfig ? `/api/signage-configs/${editingConfig.id}` : "/api/signage-configs";
    const method = editingConfig ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: getHeaders(), body: JSON.stringify(configForm) });
    if (res.ok) { toast({ title: editingConfig ? "Updated" : "Created" }); setDialogOpen(false); fetchAll(); }
    else { toast({ title: "Failed", variant: "destructive" }); }
  };

  const deleteConfig = async (id: string) => {
    if (!confirm("Delete this config and all its materials?")) return;
    await fetch(`/api/signage-configs/${id}`, { method: "DELETE", headers: getHeaders() });
    fetchAll();
  };

  const openConfigDetails = async (config: any) => {
    try {
      const res = await fetch(`/api/signage-configs/${config.id}`);
      if (res.ok) {
        const full = await res.json();
        setSelectedConfig(full);
      }
    } catch (err) { console.error(err); }
  };

  const addMaterial = async () => {
    if (!materialForm.materialId || !selectedConfig) { toast({ title: "Select a material", variant: "destructive" }); return; }
    const res = await fetch(`/api/signage-configs/${selectedConfig.id}/materials`, {
      method: "POST", headers: getHeaders(),
      body: JSON.stringify({
        materialId: materialForm.materialId,
        isRequired: materialForm.isRequired,
        defaultValue: materialForm.defaultValue || null,
        maxValue: materialForm.maxValue || null,
        sortOrder: materialForm.sortOrder,
      }),
    });
    if (res.ok) { toast({ title: "Material added" }); setMaterialDialogOpen(false); openConfigDetails(selectedConfig); }
    else { toast({ title: "Failed", variant: "destructive" }); }
  };

  const removeMaterial = async (cmId: string) => {
    if (!confirm("Remove this material from config?")) return;
    await fetch(`/api/signage-configs/materials/${cmId}`, { method: "DELETE", headers: getHeaders() });
    if (selectedConfig) openConfigDetails(selectedConfig);
  };

  const getMaterialName = (id: string) => materials.find((m) => m.id === id)?.name || "Unknown";
  const getMaterialUnit = (id: string) => materials.find((m) => m.id === id)?.unit || "";
  const getMaterialPrice = (id: string) => materials.find((m) => m.id === id)?.pricePerUnit || 0;
  const getCatName = (catId: string) => categories.find((c) => c.id === catId)?.name || "";

  const matsByCategory = new Map<string, any[]>();
  materials.forEach((m) => {
    const catName = getCatName(m.categoryId) || "Other";
    if (!matsByCategory.has(catName)) matsByCategory.set(catName, []);
    matsByCategory.get(catName)!.push(m);
  });

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-title-1 font-bold text-[var(--text-primary)]">Signage Product Configs</h1>
            <p className="text-body text-[var(--text-secondary)] mt-1">
              Link any product to its required materials for multi-material pricing
            </p>
          </div>
          {isAdmin && (
            <Button onClick={() => { setEditingConfig(null); setConfigForm({ productId: "", name: "", description: "" }); setDialogOpen(true); }}>
              <Plus className="w-4 h-4 mr-1" /> New Config
            </Button>
          )}
        </div>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-32 rounded-[var(--radius-lg)] bg-[var(--glass-fill-subtle)] animate-pulse" />)}
        </div>
      ) : configs.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Settings className="w-10 h-10 text-[var(--text-tertiary)] mx-auto mb-3" />
            <p className="text-subhead text-[var(--text-tertiary)]">No signage configs yet.</p>
            <p className="text-caption text-[var(--text-tertiary)] mt-1">Create a config to link a product to its materials.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {configs.map((config) => {
            const product = products.find((p) => p.id === config.productId);
            return (
              <Card key={config.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => openConfigDetails(config)}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-headline flex items-center gap-2">
                      <Settings className="w-5 h-5 text-[var(--accent-primary)]" />
                      {config.name}
                    </CardTitle>
                    {isAdmin && (
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button size="sm" variant="ghost" onClick={() => { setEditingConfig(config); setConfigForm({ productId: config.productId, name: config.name, description: config.description || "" }); setDialogOpen(true); }}>
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => deleteConfig(config.id)}>
                          <Trash2 className="w-3 h-3 text-red-500" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p>{product?.name || "Unknown Product"}</p>
                  {config.description && <p>{config.description}</p>}
                  <div className="flex items-center gap-2 mt-2">
                    <Package className="w-3 h-3" />
                    <span>Linked materials</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      {selectedConfig && (
        <Card className="border-2 border-[var(--accent-primary)]/20">
          <CardHeader><div className="flex items-center justify-between">
            <CardTitle className="text-headline flex items-center gap-2">
              <Link2 className="w-5 h-5 text-[var(--accent-primary)]" />
              {selectedConfig.name} - Materials
            </CardTitle>
            <div>
              {isAdmin && <Button size="sm" onClick={() => { setMaterialForm({ materialId: "", isRequired: true, defaultValue: "1", maxValue: "", sortOrder: 0 }); setMaterialDialogOpen(true); }}><Plus className="w-3 h-3 mr-1" /> Add Material</Button>}
              <Button size="sm" variant="ghost" onClick={() => setSelectedConfig(null)}>Close</Button>
            </div>
          </div></CardHeader>
          <CardContent>
            {selectedConfig.materials && selectedConfig.materials.length > 0 ? (
              <div className="space-y-2">{selectedConfig.materials.map((cm: any) => (
                <div key={cm.id} className="flex items-center justify-between p-3 rounded bg-gray-50">
                  <div className="flex-1"><p className="font-medium">{cm.name}</p>
                    <p className="text-sm text-gray-500">{cm.unit} - {cm.pricePerUnit?.toLocaleString()} TZS/unit
                      {cm.isRequired && <Badge className="ml-2" variant="outline">Required</Badge>}</p></div>
                  {isAdmin && <Button size="sm" variant="ghost" onClick={() => removeMaterial(cm.id)}><Trash2 className="w-3 h-3 text-red-500" /></Button>}
                </div>
              ))}</div>
            ) : <p className="text-center text-gray-400 py-4">No materials linked yet.</p>}
          </CardContent></Card>
      )}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent>
        <DialogHeader><DialogTitle>{editingConfig ? "Edit Config" : "New Signage Config"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2"><Label>Product</Label>
            <Select value={configForm.productId} onValueChange={(v) => setConfigForm({ ...configForm, productId: v })}>
              <SelectTrigger><SelectValue placeholder="Select a product" /></SelectTrigger>
              <SelectContent>{products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select></div>
          <div className="space-y-2"><Label>Config Name</Label>
            <Input placeholder="e.g. 3D LED Sign Config" value={configForm.name} onChange={(e) => setConfigForm({ ...configForm, name: e.target.value })} /></div>
          <div className="space-y-2"><Label>Description</Label>
            <Input placeholder="Optional" value={configForm.description} onChange={(e) => setConfigForm({ ...configForm, description: e.target.value })} /></div>
          <Button className="w-full" onClick={saveConfig}>{editingConfig ? "Update" : "Create"}</Button>
        </div></DialogContent></Dialog>
      <Dialog open={materialDialogOpen} onOpenChange={setMaterialDialogOpen}><DialogContent>
        <DialogHeader><DialogTitle>Add Material to Config</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2"><Label>Material</Label>
            <Select value={materialForm.materialId} onValueChange={(v) => setMaterialForm({ ...materialForm, materialId: v })}>
              <SelectTrigger><SelectValue placeholder="Select material" /></SelectTrigger>
              <SelectContent>{Array.from(matsByCategory.entries()).map(([catName, mats]) => mats.map((m) => <SelectItem key={m.id} value={m.id}>{catName} - {m.name} ({m.unit}, {m.pricePerUnit?.toLocaleString()} TZS)</SelectItem>))}</SelectContent>
            </Select></div>
          <div className="flex items-center gap-3"><Switch checked={materialForm.isRequired} onCheckedChange={(v) => setMaterialForm({ ...materialForm, isRequired: v })} /><Label>Required</Label></div>
          <div className="space-y-2"><Label>Default Quantity</Label>
            <Input type="number" value={materialForm.defaultValue} onChange={(e) => setMaterialForm({ ...materialForm, defaultValue: e.target.value })} /></div>
          <div className="space-y-2"><Label>Max Quantity</Label>
            <Input type="number" placeholder="No limit" value={materialForm.maxValue} onChange={(e) => setMaterialForm({ ...materialForm, maxValue: e.target.value })} /></div>
          <Button className="w-full" onClick={addMaterial}>Add Material</Button>
        </div></DialogContent></Dialog>
    </div>
  );
}
