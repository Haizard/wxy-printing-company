import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Plus, Pencil, Trash2, Building2, Phone, Mail, MapPin, FileText, UserPlus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

function getAuthHeaders() {
  const token = localStorage.getItem("printhub_token");
  return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-TZ", { style: "currency", currency: "TZS", minimumFractionDigits: 0 }).format(amount);
}

export default function CustomersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin" || user?.role === "sales";

  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [billingStats, setBillingStats] = useState<Record<string, { invoiced: number; paid: number; outstanding: number }>>({});

  // "link" = link to existing user, "new" = create new user + profile
  const [createMode, setCreateMode] = useState<"link" | "new">("new");

  // Profile form fields
  const [form, setForm] = useState({
    userId: "", businessName: "", billingAddress: "", shippingAddress: "",
    taxId: "", paymentTerms: 30, creditLimit: 0, currency: "TZS", notes: "",
  });

  // New customer fields (only used in "new" mode)
  const [newCustomer, setNewCustomer] = useState({
    fullName: "", email: "", phone: "",
  });

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [profilesRes, usersRes, invoicesRes] = await Promise.all([
        fetch("/api/customer-profiles", { headers: getAuthHeaders() }),
        fetch("/api/users", { headers: getAuthHeaders() }),
        fetch("/api/invoices", { headers: getAuthHeaders() }),
      ]);
      if (profilesRes.ok) setCustomers(await profilesRes.json());
      if (usersRes.ok) setUsers((await usersRes.json()).filter((u: any) => u.role === "customer"));
      if (invoicesRes.ok) {
        const invoices = await invoicesRes.json();
        const stats: Record<string, { invoiced: number; paid: number; outstanding: number }> = {};
        for (const inv of invoices) {
          const cid = inv.customerId;
          if (!stats[cid]) stats[cid] = { invoiced: 0, paid: 0, outstanding: 0 };
          stats[cid].invoiced += inv.total || 0;
          stats[cid].paid += inv.amountPaid || 0;
          stats[cid].outstanding += Math.max(0, (inv.total || 0) - (inv.amountPaid || 0));
        }
        setBillingStats(stats);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const openCreate = () => {
    setEditing(null);
    setCreateMode("new");
    setForm({ userId: "", businessName: "", billingAddress: "", shippingAddress: "", taxId: "", paymentTerms: 30, creditLimit: 0, currency: "TZS", notes: "" });
    setNewCustomer({ fullName: "", email: "", phone: "" });
    setDialogOpen(true);
  };

  const openEdit = (profile: any) => {
    setEditing(profile);
    setCreateMode("link");
    setForm({
      userId: profile.userId, businessName: profile.businessName || "",
      billingAddress: profile.billingAddress || "", shippingAddress: profile.shippingAddress || "",
      taxId: profile.taxId || "", paymentTerms: profile.paymentTerms || 30,
      creditLimit: profile.creditLimit || 0, currency: profile.currency || "TZS", notes: profile.notes || "",
    });
    setNewCustomer({ fullName: "", email: "", phone: "" });
    setDialogOpen(true);
  };

  const save = async () => {
    if (editing) {
      // Edit mode: update existing profile
      const url = `/api/customer-profiles/${editing.id}`;
      const res = await fetch(url, { method: "PUT", headers: getAuthHeaders(), body: JSON.stringify(form) });
      if (res.ok) { toast({ title: "Updated" }); setDialogOpen(false); fetchAll(); }
      else { const err = await res.json(); toast({ title: err.error || "Failed", variant: "destructive" }); }
    } else if (createMode === "new") {
      // Create new customer: user + profile in one step
      if (!newCustomer.fullName.trim()) { toast({ title: "Full name is required", variant: "destructive" }); return; }
      if (!newCustomer.email.trim() && !newCustomer.phone.trim()) { toast({ title: "Email or phone is required", variant: "destructive" }); return; }
      const res = await fetch("/api/customer-profiles/create-customer", {
        method: "POST", headers: getAuthHeaders(),
        body: JSON.stringify({ ...newCustomer, ...form }),
      });
      if (res.ok) { toast({ title: "Customer created" }); setDialogOpen(false); fetchAll(); }
      else { const err = await res.json(); toast({ title: err.error || "Failed", variant: "destructive" }); }
    } else {
      // Link mode: create profile for existing user
      if (!form.userId) { toast({ title: "Select a customer", variant: "destructive" }); return; }
      const res = await fetch("/api/customer-profiles", { method: "POST", headers: getAuthHeaders(), body: JSON.stringify(form) });
      if (res.ok) { toast({ title: "Profile created" }); setDialogOpen(false); fetchAll(); }
      else { const err = await res.json(); toast({ title: err.error || "Failed", variant: "destructive" }); }
    }
  };

  const deleteProfile = async (id: string) => {
    if (!confirm("Delete this customer profile?")) return;
    await fetch(`/api/customer-profiles/${id}`, { method: "DELETE", headers: getAuthHeaders() });
    toast({ title: "Deleted" }); fetchAll();
  };

  // Customers without profiles (from users table)
  const customerUserIds = new Set(customers.map(c => c.userId));
  const unlinkedUsers = users.filter(u => !customerUserIds.has(u.id));

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-title-1 font-bold text-[var(--text-primary)]">Customers</h1>
            <p className="text-body text-[var(--text-secondary)] mt-1">Manage customer profiles and billing details</p>
          </div>
          {isAdmin && (
            <Button onClick={openCreate}><Plus className="w-4 h-4 mr-1" /> Add Customer</Button>
          )}
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { title: "Total Customers", value: customers.length, icon: Users, color: "text-[var(--accent-primary)]" },
          { title: "With Profiles", value: customers.length, icon: Building2, color: "text-[var(--accent-success)]" },
          { title: "Pending Setup", value: unlinkedUsers.length, icon: FileText, color: "text-[var(--accent-warning)]" },
        ].map((stat) => (
          <Card key={stat.title}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-caption text-[var(--text-secondary)]">{stat.title}</p>
                <p className="text-title-2 font-bold">{stat.value}</p>
              </div>
              <stat.icon className={`w-8 h-8 ${stat.color}`} />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Customer List */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-40 rounded-[var(--radius-lg)] bg-[var(--glass-fill-subtle)] animate-pulse" />)}
        </div>
      ) : customers.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="w-10 h-10 text-[var(--text-tertiary)] mx-auto mb-3" />
            <p className="text-subhead text-[var(--text-tertiary)]">No customer profiles yet</p>
            <p className="text-caption text-[var(--text-tertiary)] mt-1">Add billing profiles for your customers</p>
            {isAdmin && (
              <Button className="mt-4" onClick={openCreate}><Plus className="w-4 h-4 mr-1" /> Create First Customer</Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.map((profile, index) => (
            <motion.div key={profile.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
              <Card className="hover:shadow-[var(--glass-shadow)] transition-all">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-headline font-semibold">{profile.businessName || profile.userName || "Unnamed"}</p>
                      <p className="text-caption text-[var(--text-tertiary)]">{profile.userEmail}</p>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-1">
                        <Button variant="ghost" className="h-7 w-7" onClick={() => openEdit(profile)}><Pencil className="w-3 h-3" /></Button>
                        <Button variant="ghost" className="h-7 w-7 text-red-500" onClick={() => deleteProfile(profile.id)}><Trash2 className="w-3 h-3" /></Button>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1 text-caption text-[var(--text-secondary)]">
                    {profile.billingAddress && <p className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {profile.billingAddress}</p>}
                    {profile.userPhone && <p className="flex items-center gap-1"><Phone className="w-3 h-3" /> {profile.userPhone}</p>}
                    {profile.taxId && <p className="flex items-center gap-1"><FileText className="w-3 h-3" /> Tax: {profile.taxId}</p>}
                  </div>
                  <div className="flex gap-2 mt-3 pt-3 border-t border-[rgba(60,60,67,0.1)]">
                    <Badge variant="secondary">{profile.paymentTerms || 30} days</Badge>
                    {profile.creditLimit > 0 && <Badge variant="secondary">Limit: {profile.currency || "TZS"} {profile.creditLimit.toLocaleString()}</Badge>}
                  </div>
                  {billingStats[profile.userId] && (
                    <div className="grid grid-cols-3 gap-2 mt-3 p-2 rounded bg-[rgba(255,90,60,0.04)]">
                      <div className="text-center">
                        <p className="text-[10px] text-[var(--text-tertiary)] uppercase">Invoiced</p>
                        <p className="text-xs font-bold text-[var(--accent-primary)]">{formatCurrency(billingStats[profile.userId].invoiced)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-[var(--text-tertiary)] uppercase">Paid</p>
                        <p className="text-xs font-bold text-[var(--accent-success)]">{formatCurrency(billingStats[profile.userId].paid)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-[var(--text-tertiary)] uppercase">Outstanding</p>
                        <p className="text-xs font-bold text-[var(--accent-warning)]">{formatCurrency(billingStats[profile.userId].outstanding)}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => navigate(`/estimates?customer=${profile.userId}`)}>
                      <FileText className="w-3 h-3 mr-1" /> Estimates
                    </Button>
                    <Button size="sm" className="flex-1" onClick={() => navigate(`/invoices?customer=${profile.userId}`)}>
                      <FileText className="w-3 h-3 mr-1" /> Invoices
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Unlinked users */}
      {unlinkedUsers.length > 0 && (
        <Card variant="subtle">
          <CardContent className="p-5">
            <p className="text-headline font-semibold mb-3">Customers Without Profiles</p>
            <p className="text-caption text-[var(--text-tertiary)] mb-3">These registered customers don't have billing profiles yet</p>
            <div className="space-y-2">
              {unlinkedUsers.map((u: any) => (
                <div key={u.id} className="flex items-center justify-between p-3 rounded bg-[rgba(255,90,60,0.04)]">
                  <div>
                    <p className="text-subhead font-medium">{u.fullName}</p>
                    <p className="text-caption text-[var(--text-tertiary)]">{u.email || u.phone}</p>
                  </div>
                  {isAdmin && (
                    <Button size="sm" variant="outline" onClick={() => { setCreateMode("link"); setForm({ ...form, userId: u.id, businessName: u.fullName }); setEditing(null); setDialogOpen(true); }}>
                      <Plus className="w-3 h-3 mr-1" /> Create Profile
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Customer" : "Add Customer"}</DialogTitle>
          </DialogHeader>

          {/* Mode tabs (only when creating, not editing) */}
          {!editing && (
            <div className="flex gap-2 p-1 rounded-[var(--radius-md)] bg-[var(--glass-fill-subtle)]">
              <button
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[var(--radius-sm)] text-subhead font-medium transition-all ${createMode === "new" ? "bg-[var(--accent-primary)] text-white shadow-sm" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}
                onClick={() => setCreateMode("new")}
              >
                <UserPlus className="w-4 h-4" /> New Customer
              </button>
              <button
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[var(--radius-sm)] text-subhead font-medium transition-all ${createMode === "link" ? "bg-[var(--accent-primary)] text-white shadow-sm" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}
                onClick={() => setCreateMode("link")}
              >
                <Users className="w-4 h-4" /> Link Existing
              </button>
            </div>
          )}

          <div className="space-y-4">
            {/* New Customer fields */}
            {!editing && createMode === "new" && (
              <>
                <div className="space-y-2">
                  <Label>Full Name *</Label>
                  <Input value={newCustomer.fullName} onChange={e => setNewCustomer({ ...newCustomer, fullName: e.target.value })} placeholder="Customer name" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" value={newCustomer.email} onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })} placeholder="email@example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input value={newCustomer.phone} onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })} placeholder="+255..." />
                  </div>
                </div>
              </>
            )}

            {/* Link Existing user selector */}
            {!editing && createMode === "link" && (
              <div className="space-y-2">
                <Label>Customer User</Label>
                <Select value={form.userId} onValueChange={v => setForm({ ...form, userId: v })}>
                  <SelectTrigger><SelectValue placeholder={unlinkedUsers.length === 0 ? "No unlinked customers available" : "Select a registered customer"} /></SelectTrigger>
                  <SelectContent>
                    {unlinkedUsers.length === 0 && (
                      <SelectItem value="none" disabled>No unlinked customers — create a new one above</SelectItem>
                    )}
                    {unlinkedUsers.map((u: any) => (
                      <SelectItem key={u.id} value={u.id}>{u.fullName} ({u.email || u.phone})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {unlinkedUsers.length === 0 && (
                  <p className="text-caption text-[var(--accent-primary)]">
                    All registered customers already have profiles. Use "New Customer" to create one.
                  </p>
                )}
              </div>
            )}

            {/* Business profile fields (always shown) */}
            <div className="pt-2 border-t border-[rgba(60,60,67,0.1)]">
              <p className="text-caption text-[var(--text-tertiary)] mb-3 font-medium uppercase tracking-wide">Billing Details</p>
            </div>
            <div className="space-y-2">
              <Label>Business Name</Label>
              <Input value={form.businessName} onChange={e => setForm({ ...form, businessName: e.target.value })} placeholder="Company name" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Payment Terms (days)</Label>
                <Input type="number" value={form.paymentTerms} onChange={e => setForm({ ...form, paymentTerms: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Credit Limit</Label>
                <Input type="number" value={form.creditLimit} onChange={e => setForm({ ...form, creditLimit: Number(e.target.value) })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Billing Address</Label>
              <Input value={form.billingAddress} onChange={e => setForm({ ...form, billingAddress: e.target.value })} placeholder="Full address" />
            </div>
            <div className="space-y-2">
              <Label>Tax ID / VAT</Label>
              <Input value={form.taxId} onChange={e => setForm({ ...form, taxId: e.target.value })} placeholder="Tax identification number" />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="glass-input w-full min-h-[60px] text-subhead" placeholder="Internal notes" />
            </div>
            <Button className="w-full" onClick={save}>{editing ? "Update" : createMode === "new" ? "Create Customer" : "Create Profile"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
