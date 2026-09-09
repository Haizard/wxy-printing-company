import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Lock, Bell, Shield, Save, Check, FileText, Palette } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast"

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [fullName, setFullName] = useState(user?.fullName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [saving, setSaving] = useState(false);

  // Invoice settings
  const [invoiceSettings, setInvoiceSettings] = useState<any>(null);
  const [invSaving, setInvSaving] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("printhub_token");
    fetch("/api/invoice-settings", {
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    }).then(r => r.ok ? r.json() : null).then(d => { if (d) setInvoiceSettings(d); }).catch(() => {});
  }, []);

  const handleSaveInvoiceSettings = async () => {
    if (!invoiceSettings) return;
    setInvSaving(true);
    try {
      const token = localStorage.getItem("printhub_token");
      const res = await fetch("/api/invoice-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(invoiceSettings),
      });
      if (res.ok) {
        const updated = await res.json();
        setInvoiceSettings(updated);
        toast({ title: "Invoice template saved", variant: "success" as any });
      } else {
        const err = await res.json();
        toast({ title: "Failed", description: err.error, variant: "destructive" });
      }
    } catch { toast({ title: "Error", description: "Failed to save", variant: "destructive" }); }
    finally { setInvSaving(false); }
  };

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("printhub_token");
      const response = await fetch("/api/auth/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ fullName, email, phone }),
      });
      if (response.ok) {
        toast({ title: "Profile updated", variant: "success" });
      } else {
        const err = await response.json();
        toast({ title: "Failed", description: err.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to update profile", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    setChangingPassword(true);
    try {
      const token = localStorage.getItem("printhub_token");
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (response.ok) {
        toast({ title: "Password changed", variant: "success" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        const err = await response.json();
        toast({ title: "Failed", description: err.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to change password", variant: "destructive" });
    } finally {
      setChangingPassword(false);
    }
  };

  const roleLabels: Record<string, string> = {
    admin: "Admin / Director",
    sales: "Sales / Front Desk",
    production: "Production Staff",
    inventory_manager: "Inventory Manager",
    customer: "Customer",
  };

  const setInv = (key: string, val: string) => setInvoiceSettings((prev: any) => ({ ...prev, [key]: val }));

  return (
    <div className="space-y-6 max-w-2xl">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-title-1 font-bold text-[var(--text-primary)]">Settings</h1>
        <p className="text-body text-[var(--text-secondary)] mt-1">
          Manage your account and preferences
        </p>
      </motion.div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--accent-primary)] flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Your account information</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-caption text-[var(--text-tertiary)]">Role:</span>
            <Badge variant="secondary">{roleLabels[user?.role || "customer"]}</Badge>
          </div>

          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <Button onClick={handleSaveProfile} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : "Save Profile"}
          </Button>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--accent-secondary)] flex items-center justify-center">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your password</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Current Password</Label>
            <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>New Password</Label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Confirm New Password</Label>
            <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>
          <Button onClick={handleChangePassword} disabled={changingPassword} variant="outline">
            <Lock className="w-4 h-4 mr-2" />
            {changingPassword ? "Changing..." : "Change Password"}
          </Button>
        </CardContent>
      </Card>

      {/* Invoice Template Settings */}
      {invoiceSettings && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--accent-primary)] flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle>Invoice Template</CardTitle>
                <CardDescription>Customize the look and content of your invoices</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Company Info */}
            <div className="space-y-1">
              <p className="text-caption font-medium text-[var(--text-tertiary)] uppercase">Company</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Company Name</Label>
                <Input value={invoiceSettings.companyName || ""} onChange={(e) => setInv("companyName", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Tagline</Label>
                <Input value={invoiceSettings.companyTagline || ""} onChange={(e) => setInv("companyTagline", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Address Line 1</Label>
                <Input value={invoiceSettings.addressLine1 || ""} onChange={(e) => setInv("addressLine1", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Address Line 2</Label>
                <Input value={invoiceSettings.addressLine2 || ""} onChange={(e) => setInv("addressLine2", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>City</Label>
                <Input value={invoiceSettings.addressCity || ""} onChange={(e) => setInv("addressCity", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <Input value={invoiceSettings.addressCountry || ""} onChange={(e) => setInv("addressCountry", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Contact Phone</Label>
                <Input value={invoiceSettings.contactPhone || ""} onChange={(e) => setInv("contactPhone", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Contact Email</Label>
                <Input value={invoiceSettings.contactEmail || ""} onChange={(e) => setInv("contactEmail", e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Logo URL</Label>
              <Input value={invoiceSettings.logoUrl || ""} onChange={(e) => setInv("logoUrl", e.target.value)} placeholder="/wxy-logo.svg" />
            </div>

            <Separator className="my-4" />

            {/* Bank Details */}
            <div className="space-y-1">
              <p className="text-caption font-medium text-[var(--text-tertiary)] uppercase">Bank Details</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Bank Name</Label>
                <Input value={invoiceSettings.bankName || ""} onChange={(e) => setInv("bankName", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Account Number</Label>
                <Input value={invoiceSettings.accountNumber || ""} onChange={(e) => setInv("accountNumber", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Account Name</Label>
                <Input value={invoiceSettings.accountName || ""} onChange={(e) => setInv("accountName", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>SWIFT Code</Label>
                <Input value={invoiceSettings.swiftCode || ""} onChange={(e) => setInv("swiftCode", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Bank Code</Label>
                <Input value={invoiceSettings.bankCode || ""} onChange={(e) => setInv("bankCode", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Branch Code</Label>
                <Input value={invoiceSettings.branchCode || ""} onChange={(e) => setInv("branchCode", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>M-PESA Number</Label>
                <Input value={invoiceSettings.mpesaNumber || ""} onChange={(e) => setInv("mpesaNumber", e.target.value)} />
              </div>
            </div>

            <Separator className="my-4" />

            {/* Messages & Colors */}
            <div className="space-y-1">
              <p className="text-caption font-medium text-[var(--text-tertiary)] uppercase">Messages & Styling</p>
            </div>
            <div className="space-y-2">
              <Label>Default Notes</Label>
              <Input value={invoiceSettings.defaultNotes || ""} onChange={(e) => setInv("defaultNotes", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Thank You Message</Label>
              <Input value={invoiceSettings.thankYouMessage || ""} onChange={(e) => setInv("thankYouMessage", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Palette className="w-3 h-3" /> Header Color (Left)</Label>
                <div className="flex gap-2">
                  <input type="color" value={invoiceSettings.headerColorLeft || "#ff0606"} onChange={(e) => setInv("headerColorLeft", e.target.value)} className="w-10 h-9 rounded border cursor-pointer" />
                  <Input value={invoiceSettings.headerColorLeft || ""} onChange={(e) => setInv("headerColorLeft", e.target.value)} className="flex-1" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Palette className="w-3 h-3" /> Header Color (Right)</Label>
                <div className="flex gap-2">
                  <input type="color" value={invoiceSettings.headerColorRight || "#cc1f1f"} onChange={(e) => setInv("headerColorRight", e.target.value)} className="w-10 h-9 rounded border cursor-pointer" />
                  <Input value={invoiceSettings.headerColorRight || ""} onChange={(e) => setInv("headerColorRight", e.target.value)} className="flex-1" />
                </div>
              </div>
            </div>

            <Button onClick={handleSaveInvoiceSettings} disabled={invSaving} className="mt-4">
              <Save className="w-4 h-4 mr-2" />
              {invSaving ? "Saving..." : "Save Invoice Template"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Security Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--accent-success)] flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle>Security</CardTitle>
              <CardDescription>Account security status</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-subhead">Two-factor authentication</span>
              <Badge variant="secondary">Not enabled</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-subhead">Session</span>
              <Badge variant="success">
                <Check className="w-3 h-3 mr-1" />
                Active
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
