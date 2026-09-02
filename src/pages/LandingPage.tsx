import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Calculator,
  ShoppingCart,
  ClipboardList,
  MessageCircle,
  Package,
  Layers,
  ArrowRight,
  Sparkles,
  Zap,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const features = [
  {
    icon: Calculator,
    title: "Smart Price Calculator",
    description:
      "Rules-driven quoting engine that handles 7+ pricing models — from per-unit bands to area-based ranges and imposition layouts.",
  },
  {
    icon: Layers,
    title: "Full Product Catalog",
    description:
      "15 categories, 100+ products with data-driven pricing. Add new products or reprice without code deploys.",
  },
  {
    icon: ClipboardList,
    title: "Job Management",
    description:
      "Kanban-style job lifecycle: Quote → Confirmed → In Production → QA → Ready → Delivered.",
  },
  {
    icon: ShoppingCart,
    title: "Web Shop",
    description:
      "Browse, calculate, and order standard printing products with a beautiful iOS-style shopping experience.",
  },
  {
    icon: Package,
    title: "Inventory Tracking",
    description:
      "Real-time stock levels for paper, vinyl, acrylic, ink, and consumables with low-stock alerts.",
  },
  {
    icon: MessageCircle,
    title: "In-App Chat",
    description:
      "Customer ↔ staff messaging on job threads with file attachments and internal staff notes.",
  },
];

const stats = [
  { value: "7+", label: "Pricing Models" },
  { value: "15", label: "Categories" },
  { value: "100+", label: "Products" },
  { value: "5", label: "User Roles" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="glass-chrome border-b border-[var(--glass-border)] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[var(--radius-md)] bg-gradient-to-br from-[var(--accent-primary)] to-[#E84530] flex items-center justify-center shadow-[0_2px_12px_rgba(255,90,60,0.3)]">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <span className="text-title-3 font-semibold">PrintHub</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/auth">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="sm">
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden px-4 lg:px-8 pt-16 lg:pt-24 pb-20">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 glass-card-subtle px-4 py-2 rounded-pill mb-6">
              <Sparkles className="w-4 h-4 text-[var(--accent-secondary)]" />
              <span className="text-caption font-medium text-[var(--text-secondary)]">
                Replacing spreadsheets with intelligence
              </span>
            </div>

            <h1 className="text-large-title lg:text-[56px] font-bold text-[var(--text-primary)] mb-6 leading-tight">
              One platform for your{" "}
              <span className="text-[var(--accent-primary)]">
                entire printing business
              </span>
            </h1>

            <p className="text-body lg:text-title-3 text-[var(--text-secondary)] max-w-2xl mx-auto mb-8">
              From digital HP Indigo to large-format solvent, offset to signage,
              apparel to design services — manage catalog, pricing, quotes, jobs,
              inventory, and chat in one beautiful system.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/auth">
                <Button size="lg" className="w-full sm:w-auto">
                  Start Free
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link to="/catalog">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Browse Catalog
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-16"
          >
            {stats.map((stat) => (
              <Card key={stat.label} variant="subtle" className="text-center">
                <div className="text-title-1 lg:text-title-2 font-bold text-[var(--accent-primary)]">
                  {stat.value}
                </div>
                <div className="text-caption text-[var(--text-secondary)] mt-1">
                  {stat.label}
                </div>
              </Card>
            ))}
          </motion.div>
        </div>

        {/* Decorative gradient orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-[var(--accent-primary)] opacity-[0.04] rounded-full blur-[100px]" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-[var(--accent-tertiary)] opacity-[0.04] rounded-full blur-[120px]" />
      </section>

      {/* Features */}
      <section className="px-4 lg:px-8 py-20">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-title-1 lg:text-title-2 font-bold text-[var(--text-primary)] mb-4">
              Everything you need to run your print shop
            </h2>
            <p className="text-body text-[var(--text-secondary)] max-w-xl mx-auto">
              Built for full-service printing companies that need more than
              spreadsheets and WhatsApp.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-[var(--glass-shadow)] transition-all duration-300">
                  <div className="w-12 h-12 rounded-[var(--radius-md)] bg-[rgba(255,90,60,0.1)] flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-[var(--accent-primary)]" />
                  </div>
                  <h3 className="text-headline font-semibold mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-subhead text-[var(--text-secondary)]">
                    {feature.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 lg:px-8 py-20">
        <div className="max-w-3xl mx-auto">
          <Card variant="strong" className="text-center p-8 lg:p-12">
            <Zap className="w-12 h-12 text-[var(--accent-primary)] mx-auto mb-4" />
            <h2 className="text-title-1 font-bold text-[var(--text-primary)] mb-4">
              Ready to transform your print business?
            </h2>
            <p className="text-body text-[var(--text-secondary)] mb-8 max-w-lg mx-auto">
              Stop juggling spreadsheets and WhatsApp messages. Get your entire
              team on one beautiful platform today.
            </p>
            <Link to="/auth">
              <Button size="lg">
                Get Started Now
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="glass-chrome border-t border-[var(--glass-border)] px-4 lg:px-8 py-8">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-gradient-to-br from-[var(--accent-primary)] to-[#E84530] flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span className="text-subhead font-medium">PrintHub OS</span>
          </div>
          <p className="text-caption text-[var(--text-tertiary)]">
            © 2026 PrintHub OS. Built for full-service printing companies.
          </p>
        </div>
      </footer>
    </div>
  );
}


