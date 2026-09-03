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
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import {
  Building2,
  Plus,
  Pencil,
  Trash2,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";

interface Supplier {
  id: string;
  name: string;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
}

const emptySupplier: Omit<Supplier, "id" | "createdAt"> = {
  name: "",
  contactPerson: "",
  email: "",
  phone: "",
  address: "",
  notes: "",
  isActive: true,
};

export default function SuppliersPage() {
  const { token } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [form, setForm] = useState(emptySupplier);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const fetchSuppliers = async () => {
    try {
      const res = await fetch("/api/suppliers", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setSuppliers(await res.json());
    } catch {
      toast({ title: "Failed to load suppliers", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const openCreate = () => {
    setEditingSupplier(null);
    setForm(emptySupplier);
    setDialogOpen(true);
  };

  const openEdit = (s: Supplier) => {
    setEditingSupplier(s);
    setForm({
      name: s.name,
      contactPerson: s.contactPerson || "",
      email: s.email || "",
      phone: s.phone || "",
      address: s.address || "",
      notes: s.notes || "",
      isActive: s.isActive,
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const url = editingSupplier
        ? `/api/suppliers/${editingSupplier.id}`
        : "/api/suppliers";
      const method = editingSupplier ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast({
          title: editingSupplier ? "Supplier updated" : "Supplier created",
        });
        setDialogOpen(false);
        fetchSuppliers();
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

  const deleteSupplier = async (id: string) => {
    if (!confirm("Delete this supplier?")) return;
    try {
      const res = await fetch(`/api/suppliers/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast({ title: "Supplier deleted" });
        fetchSuppliers();
      }
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  };

  const filtered = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.contactPerson?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = suppliers.filter((s) => s.isActive).length;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-title-1 font-bold text-text-primary">Suppliers</h1>
          <p className="text-subhead text-text-secondary">
            {suppliers.length} total · {activeCount} active
          </p>
        </div>
        <Button onClick={openCreate} className="flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Supplier
        </Button>
      </div>

      {/* Search */}
      <div className="max-w-md">
        <Input
          placeholder="Search suppliers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Supplier Grid */}
      {loading ? (
        <div className="text-center py-12 text-text-secondary">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-text-secondary">
          {search ? "No suppliers match your search" : "No suppliers yet. Add your first supplier."}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((supplier) => (
            <Card key={supplier.id} className="glass-card">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[rgba(255,90,60,0.12)] flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-accent-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-headline">{supplier.name}</CardTitle>
                      {supplier.contactPerson && (
                        <p className="text-caption text-text-secondary">
                          Contact: {supplier.contactPerson}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge variant={supplier.isActive ? "success" : "secondary"}>
                    {supplier.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {supplier.phone && (
                  <div className="flex items-center gap-2 text-caption text-text-secondary">
                    <Phone className="w-3.5 h-3.5" /> {supplier.phone}
                  </div>
                )}
                {supplier.email && (
                  <div className="flex items-center gap-2 text-caption text-text-secondary">
                    <Mail className="w-3.5 h-3.5" /> {supplier.email}
                  </div>
                )}
                {supplier.address && (
                  <div className="flex items-center gap-2 text-caption text-text-secondary">
                    <MapPin className="w-3.5 h-3.5" /> {supplier.address}
                  </div>
                )}
                {supplier.notes && (
                  <p className="text-caption text-text-tertiary italic mt-2">
                    {supplier.notes}
                  </p>
                )}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEdit(supplier)}
                    className="flex items-center gap-1"
                  >
                    <Pencil className="w-3 h-3" /> Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteSupplier(supplier.id)}
                    className="flex items-center gap-1 text-accent-danger hover:text-accent-danger"
                  >
                    <Trash2 className="w-3 h-3" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingSupplier ? "Edit Supplier" : "Add Supplier"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Company Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. ABC Stationery"
              />
            </div>
            <div>
              <Label>Contact Person</Label>
              <Input
                value={form.contactPerson || ""}
                onChange={(e) =>
                  setForm({ ...form, contactPerson: e.target.value })
                }
                placeholder="e.g. John Doe"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={form.email || ""}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={form.phone || ""}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+255 xxx xxx xxx"
                />
              </div>
            </div>
            <div>
              <Label>Address</Label>
              <Input
                value={form.address || ""}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Physical address"
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={form.notes || ""}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Internal notes about this supplier"
                rows={3}
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={form.isActive}
                onCheckedChange={(checked) =>
                  setForm({ ...form, isActive: checked })
                }
              />
              <Label>Active</Label>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "Saving..." : editingSupplier ? "Update" : "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
