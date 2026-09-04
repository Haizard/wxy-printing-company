import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Calculator, Package, Settings, ChevronDown, ChevronRight, Lightbulb, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Section = "overview" | "calculator" | "materials" | "configs" | "pricing" | "examples";

const sections: { id: Section; title: string; icon: any; description: string }[] = [
  { id: "overview", title: "System Overview", icon: BookOpen, description: "How the platform works" },
  { id: "calculator", title: "Using the Calculator", icon: Calculator, description: "Get instant price quotes" },
  { id: "materials", title: "Managing Materials", icon: Package, description: "Set up material catalog" },
  { id: "configs", title: "Product Configs", icon: Settings, description: "Link products to materials" },
  { id: "pricing", title: "Pricing Rules", icon: DollarSign, description: "Configure pricing models" },
  { id: "examples", title: "Real Examples", icon: Lightbulb, description: "Step-by-step walkthroughs" },
];

function Accordion({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border rounded-lg overflow-hidden">
      <button className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50" onClick={() => setOpen(!open)}>
        <span className="font-medium">{title}</span>
        {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>
      {open && <div className="px-4 pb-4 border-t bg-gray-50/50">{children}</div>}
    </div>
  );
}

function Step({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">{number}</div>
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  );
}

export default function HelpPage() {
  const [activeSection, setActiveSection] = useState<Section>("overview");

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold">Help and Documentation</h1>
        <p className="text-gray-600 mt-1">Learn how to use the calculator, materials system, and pricing tools</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-2">
              {sections.map((s) => (
                <button key={s.id} onClick={() => setActiveSection(s.id)} className={"w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors " + (activeSection === s.id ? "bg-orange-50 text-orange-600" : "hover:bg-gray-50")}>
                  <s.icon className="w-5 h-5" />
                  <div><p className="text-sm font-medium">{s.title}</p><p className="text-xs text-gray-500">{s.description}</p></div>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-3">
          <Card>
            <CardHeader><CardTitle>{sections.find((s) => s.id === activeSection)?.title}</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              {activeSection === "overview" && <div><p>This platform manages pricing, quotes, orders, and production for printing and signage products.</p></div>}
              {activeSection === "calculator" && <div><p>Get instant price quotes in 3 steps: 1) Select Product, 2) Configure Details, 3) Get Price.</p></div>}
              {activeSection === "materials" && <div><p>Manage materials with pricing per unit (per m2, per meter, per piece). Works for signs, banners, cards, and any product.</p></div>}
              {activeSection === "configs" && <div><p>Link any product to its required materials. The calculator automatically shows material costs when a product has a config.</p></div>}
              {activeSection === "pricing" && <div><p>Configure pricing models per product (per unit, per area, sheet-based). Set quantity bands and markup percentages.</p></div>}
              {activeSection === "examples" && <div><p>See real-world examples of how to set up and use the system.</p></div>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
