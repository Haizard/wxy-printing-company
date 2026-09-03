import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Plus, Pencil, Trash2, Shield, UserCheck, UserX } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", role: "customer", isActive: true });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const token = localStorage.getItem("printhub_token");
    const res = await fetch("/api/users", { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const data = await res.json();
      setUsers(data);
    }
    setLoading(false);
  };

  const openEdit = (u: any) => {
    setEditingUser(u);
    setForm({ fullName: u.fullName, email: u.email || "", phone: u.phone || "", role: u.role, isActive: u.isActive !== false });
    setDialogOpen(true);
  };

  const openCreate = () => {
    setEditingUser(null);
    setForm({ fullName: "", email: "", phone: "", role: "customer", isActive: true });
    setDialogOpen(true);
  };

  const save = async () => {
    const token = localStorage.getItem("printhub_token");
    const method = editingUser ? "PUT" : "POST";
    const url = editingUser ? `/api/users/${editingUser.id}` : "/api/auth/register";
    const body = editingUser ? form : { ...form, password: "changeme123" };
    const res = await fetch(url, {
      method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    if (res.ok) { setDialogOpen(false); fetchUsers(); }
  };

  const toggleActive = async (u: any) => {
    const token = localStorage.getItem("printhub_token");
    await fetch(`/api/users/${u.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...u, isActive: !u.isActive }),
    });
    fetchUsers();
  };

  const deleteUser = async (id: string) => {
    if (!confirm("Delete this user?")) return;
    const token = localStorage.getItem("printhub_token");
    await fetch(`/api/users/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    fetchUsers();
  };

  const roleBadge = (role: string) => {
    const colors: Record<string, string> = {
      admin: "bg-[rgba(255,59,48,0.12)] text-[var(--accent-danger)]",
      sales: "bg-[rgba(46,125,255,0.12)] text-[var(--accent-tertiary)]",
      production: "bg-[rgba(255,159,10,0.12)] text-[var(--accent-warning)]",
      inventory_manager: "bg-[rgba(52,199,89,0.12)] text-[var(--accent-success)]",
      customer: "bg-[var(--glass-fill-subtle)] text-[var(--text-secondary)]",
    };
    return <Badge className={`${colors[role] || colors.customer} border-0`}>{role.replace(/_/g, " ")}</Badge>;
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-title-1 font-bold">Users</h1>
            <p className="text-body text-[var(--text-secondary)] mt-1">Manage team members & customers</p>
          </div>
          <Button size="sm" onClick={openCreate}>
            <Plus className="w-4 h-4 mr-1" /> Add User
          </Button>
        </div>
      </motion.div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-[var(--radius-lg)] bg-[var(--glass-fill-subtle)] animate-pulse" />)}</div>
      ) : (
        <div className="space-y-3">
          {users.map((u: any) => (
            <motion.div key={u.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className={`hover:shadow-glass transition-shadow ${!u.isActive ? "opacity-60" : ""}`}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${u.role === "admin" ? "bg-[rgba(255,59,48,0.12)]" : "bg-[var(--glass-fill-subtle)]"}`}>
                    {u.role === "admin" ? <Shield className="w-5 h-5 text-[var(--accent-danger)]" /> : <Users className="w-5 h-5 text-[var(--text-secondary)]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-subhead font-semibold truncate">{u.fullName}</p>
                      {roleBadge(u.role)}
                      {!u.isActive && <Badge className="bg-[var(--glass-fill-subtle)] text-[var(--text-tertiary)] border-0">Inactive</Badge>}
                    </div>
                    <p className="text-caption text-[var(--text-tertiary)]">{u.email || u.phone || "No contact"}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => toggleActive(u)}>
                      {u.isActive ? <UserX className="w-4 h-4 text-[var(--accent-warning)]" /> : <UserCheck className="w-4 h-4 text-[var(--accent-success)]" />}
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(u)}><Pencil className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-[var(--accent-danger)]" onClick={() => deleteUser(u.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingUser ? "Edit User" : "New User"}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2"><Label>Full Name</Label><Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["admin", "sales", "production", "inventory_manager", "customer"].map((r) => (
                    <SelectItem key={r} value={r}>{r.replace(/_/g, " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {!editingUser && <p className="text-caption text-[var(--text-tertiary)]">Default password: changeme123</p>}
            <div className="flex gap-3 pt-2">
              <Button className="flex-1" onClick={save}>{editingUser ? "Save Changes" : "Create User"}</Button>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
