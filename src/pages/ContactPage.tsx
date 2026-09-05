import { useState } from "react";
import { motion } from "framer-motion";
import {
  MapPin,
  Phone,
  Mail,
  Instagram,
  Send,
  MessageSquare,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { SITE } from "@/lib/site-content";

// Office location — the business operates from Arusha (the map pin is Arusha
// city centre). Update these if the office address changes.
const OFFICE = {
  address: SITE.contact.location,
  phone: SITE.contact.phone,
  email: SITE.contact.email,
  instagram: SITE.contact.instagram,
  instagramUrl: SITE.contact.instagramUrl,
  mapEmbedUrl:
    "https://www.openstreetmap.org/export/embed.html?bbox=36.58%2C-3.47%2C36.79%2C-3.30&layer=mapnik&marker=-3.3869%2C36.6830",
  directionsUrl:
    "https://www.google.com/maps/dir/?api=1&destination=-3.3869,36.6830",
};

const infoCards = [
  {
    icon: MapPin,
    label: "Visit Us",
    value: OFFICE.address,
    href: OFFICE.directionsUrl,
  },
  { icon: Phone, label: "Call Us", value: OFFICE.phone, href: `tel:${OFFICE.phone.replace(/\s/g, "")}` },
  { icon: Mail, label: "Email Us", value: OFFICE.email, href: `mailto:${OFFICE.email}` },
  { icon: Instagram, label: "Follow Us", value: OFFICE.instagram, href: OFFICE.instagramUrl },
];

export default function ContactPage() {
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const submit = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.subject.trim() || !form.message.trim()) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      toast({ title: "Please enter a valid email address", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to send message");
      }
      setSent(true);
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden h-[600px] max-w-[1500px] mx-auto mb-10">
        {/* Background image - full bleed */}
        <div className="absolute inset-0 -z-10">
          <img src="/images_new/company-brand.png" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/50" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center px-4 lg:px-8 py-16 lg:py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 glass-card-subtle px-4 py-2 rounded-pill mb-6">
              <MessageSquare className="w-4 h-4 text-[var(--accent-primary)]" />
              <span className="text-caption font-medium text-white/90" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>
                Contact Us
              </span>
            </div>
            <h1 className="text-large-title lg:text-[56px] font-bold text-white mb-6 leading-tight" style={{ textShadow: "0 2px 12px rgba(0,0,0,0.8)" }}>
              Let&apos;s work{" "}
              <span className="bg-gradient-to-r from-[var(--accent-primary)] to-[#E84530] bg-clip-text text-transparent">
                together
              </span>
            </h1>
            <p className="text-body lg:text-title-3 text-white/90 max-w-2xl mx-auto mb-8" style={{ textShadow: "0 1px 8px rgba(0,0,0,0.7)" }}>
              Whether you're launching a business, hosting an event, rebranding,
              or need a reliable print partner — {SITE.name} is ready to bring
              your ideas to life.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Info + Form */}
      <section className="px-4 lg:px-8 pb-10">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: office info + map */}
          <div className="lg:col-span-2 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {infoCards.map((card, i) => (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.08 }}
                >
                  <Card className="h-full">
                    <CardContent className="p-5">
                      <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[rgba(255,90,60,0.1)] flex items-center justify-center mb-3">
                        <card.icon className="w-5 h-5 text-[var(--accent-primary)]" />
                      </div>
                      <p className="text-caption text-[var(--text-tertiary)] uppercase tracking-wide">
                        {card.label}
                      </p>
                      {card.href ? (
                        <a
                          href={card.href}
                          target={card.href.startsWith("http") ? "_blank" : undefined}
                          rel="noreferrer"
                          className="text-subhead font-semibold text-[var(--text-primary)] hover:text-[var(--accent-primary)] transition-colors mt-1 inline-flex items-start gap-1"
                        >
                          {card.value}
                          {card.href.startsWith("http") && (
                            <ExternalLink className="w-3 h-3 mt-1 flex-shrink-0" />
                          )}
                        </a>
                      ) : (
                        <p className="text-subhead font-semibold text-[var(--text-primary)] mt-1">
                          {card.value}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Office map */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.35 }}
            >
              <Card className="overflow-hidden">
                <div className="h-64 lg:h-72 w-full">
                  <iframe
                    title="WXY Business Solutions office location"
                    src={OFFICE.mapEmbedUrl}
                    className="w-full h-full border-0"
                    loading="lazy"
                  />
                </div>
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-caption text-[var(--text-secondary)]">
                    <MapPin className="w-4 h-4 text-[var(--accent-primary)] flex-shrink-0" />
                    {OFFICE.address}
                  </div>
                  <a
                    href={OFFICE.directionsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-caption font-semibold text-[var(--accent-primary)] hover:underline flex items-center gap-1 flex-shrink-0"
                  >
                    Get Directions <ExternalLink className="w-3 h-3" />
                  </a>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Right: form */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="lg:col-span-3"
          >
            <Card variant="strong">
              <CardContent className="p-6 lg:p-8">
                {sent ? (
                  <div className="text-center py-14">
                    <CheckCircle2 className="w-14 h-14 text-[var(--accent-success)] mx-auto mb-4" />
                    <h2 className="text-title-2 font-bold text-[var(--text-primary)] mb-2">
                      Message sent!
                    </h2>
                    <p className="text-body text-[var(--text-secondary)] max-w-md mx-auto mb-6">
                      Thank you for reaching out. Our team will get back to you
                      as soon as possible.
                    </p>
                    <Button variant="outline" onClick={() => setSent(false)}>
                      Send another message
                    </Button>
                  </div>
                ) : (
                  <>
                    <h2 className="text-title-2 font-bold text-[var(--text-primary)] mb-1">
                      Send us a message
                    </h2>
                    <p className="text-subhead text-[var(--text-secondary)] mb-6">
                      Fill in the form and we&apos;ll respond shortly.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Full Name *</Label>
                        <Input
                          value={form.name}
                          onChange={update("name")}
                          placeholder="e.g. Jane Doe"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Email *</Label>
                        <Input
                          type="email"
                          value={form.email}
                          onChange={update("email")}
                          placeholder="you@example.com"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                      <div className="space-y-2">
                        <Label>Phone (optional)</Label>
                        <Input
                          value={form.phone}
                          onChange={update("phone")}
                          placeholder="+255 7XX XXX XXX"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Subject *</Label>
                        <Input
                          value={form.subject}
                          onChange={update("subject")}
                          placeholder="e.g. Quote for 1000 business cards"
                        />
                      </div>
                    </div>
                    <div className="space-y-2 mt-4">
                      <Label>Message *</Label>
                      <textarea
                        value={form.message}
                        onChange={update("message")}
                        rows={7}
                        placeholder="Tell us about your project — quantity, size, material, deadline…"
                        className="w-full rounded-[var(--radius-md)] glass-input resize-none"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-3 mt-6">
                      <p className="text-caption text-[var(--text-tertiary)]">
                        We usually reply within one business day.
                      </p>
                      <Button onClick={submit} disabled={sending} size="lg">
                        <Send className="w-4 h-4 mr-2" />
                        {sending ? "Sending..." : "Send Message"}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
