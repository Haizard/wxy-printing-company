import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Calculator, Package, Settings, ChevronDown, ChevronRight, AlertTriangle, CheckCircle, ArrowRight, Lightbulb, DollarSign, Layers } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Section =
  | "overview"
  | "workflow"
  | "calculator"
  | "materials"
  | "configs"
  | "pricing"
  | "examples"
  | "troubleshooting";

const sections: { id: Section; title: string; icon: any }[] = [
  { id: "overview", title: "How The System Works", icon: BookOpen },
  { id: "workflow", title: "The Complete Workflow", icon: Layers },
  { id: "pricing", title: "Step 1: Set Up Pricing Rules", icon: DollarSign },
  { id: "materials", title: "Step 2: Add Materials", icon: Package },
  { id: "configs", title: "Step 3: Link Products to Materials", icon: Settings },
  { id: "calculator", title: "Step 4: Use The Calculator", icon: Calculator },
  { id: "examples", title: "Real-World Examples", icon: Lightbulb },
  { id: "troubleshooting", title: "Common Mistakes", icon: AlertTriangle },
];
function Callout({ type, children }: { type: "info" | "warning" | "success" | "danger"; children: React.ReactNode }) {
  const styles = {
    info: "bg-blue-50 border-blue-200 text-blue-800",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
    success: "bg-green-50 border-green-200 text-green-800",
    danger: "bg-red-50 border-red-200 text-red-800",
  };
  const icons = {
    info: <Lightbulb className="w-5 h-5 flex-shrink-0 mt-0.5" />,
    warning: <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />,
    success: <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />,
    danger: <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />,
  };
  return (
    <div className={`flex gap-3 p-4 rounded-lg border ${styles[type]}`}>
      {icons[type]}
      <div className="text-sm leading-relaxed">{children}</div>
    </div>
  );
}

function Step({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <div className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
        {number}
      </div>
      <div className="flex-1 space-y-2">
        <h4 className="font-semibold text-lg">{title}</h4>
        <div className="text-gray-600 leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

function Arrow() {
  return (
    <div className="flex justify-center py-2">
      <ArrowRight className="w-5 h-5 text-orange-400 rotate-90" />
    </div>
  );
}

function Scenario({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-gray-100 px-4 py-2 font-medium text-sm">{title}</div>
      <div className="p-4 text-sm leading-relaxed space-y-2">{children}</div>
    </div>
  );
}
export default function HelpPage() {
  const [activeSection, setActiveSection] = useState<Section>("overview");

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold">Platform Guide</h1>
        <p className="text-gray-600 mt-1">
          A complete walkthrough of how the pricing, materials, and calculator systems work together
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardContent className="p-2">
              {sections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                    activeSection === s.id ? "bg-orange-50 text-orange-600 font-medium" : "hover:bg-gray-50"
                  }`}
                >
                  <s.icon className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm">{s.title}</span>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-6 space-y-6">              {/* ===== OVERVIEW ===== */}
              {activeSection === "overview" && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold">How The System Works</h2>

                  <p className="text-gray-600 leading-relaxed">
                    This platform helps you price printing and signage products for your clients. Instead of
                    guessing prices or using a spreadsheet, the system automatically calculates exact costs
                    based on the materials each product needs and the quantities ordered.
                  </p>

                  <Callout type="info">
                    <strong>Think of it this way:</strong> You are building a pricing machine. You feed it the
                    raw materials and their costs, you tell it which products use which materials, and then
                    the calculator does all the math automatically whenever a salesperson needs a quote.
                  </Callout>

                  <h3 className="text-lg font-semibold">The Four Pillars</h3>
                  <p className="text-gray-600">
                    The entire system is built on four connected pieces. If any piece is missing or misconfigured,
                    the calculator will not work correctly for that product.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-orange-500" />
                        <h4 className="font-semibold">1. Pricing Rules</h4>
                      </div>
                      <p className="text-sm text-gray-600">
                        Define <strong>how</strong> a product is priced. Is it per unit? Per square meter?
                        Sheet-based? This tells the calculator the formula to use.
                      </p>
                      <p className="text-sm text-orange-600 font-medium">
                        Without this: The calculator has no base price to work with.
                      </p>
                    </div>

                    <div className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <Package className="w-5 h-5 text-blue-500" />
                        <h4 className="font-semibold">2. Materials</h4>
                      </div>
                      <p className="text-sm text-gray-600">
                        The raw ingredients. Acrylic sheets, LED strips, paper, vinyl, ink, aluminum frames,
                        screws, wiring, packaging, etc. Each has a cost per unit (per m2, per meter, per piece).
                      </p>
                      <p className="text-sm text-blue-600 font-medium">
                        Without this: The calculator cannot add material costs to the quote.
                      </p>
                    </div>

                    <div className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <Settings className="w-5 h-5 text-green-500" />
                        <h4 className="font-semibold">3. Product Configs</h4>
                      </div>
                      <p className="text-sm text-gray-600">
                        The bridge between a product and its materials. A config says "This product requires
                        these materials in these quantities." It is the recipe that connects everything.
                      </p>
                      <p className="text-sm text-green-600 font-medium">
                        Without this: The calculator knows the base price but not the material costs.
                      </p>
                    </div>

                    <div className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <Calculator className="w-5 h-5 text-purple-500" />
                        <h4 className="font-semibold">4. The Calculator</h4>
                      </div>
                      <p className="text-sm text-gray-600">
                        Where salespeople come to get quotes. It pulls the pricing rule, loads the product
                        config, lists the materials, and calculates the total automatically.
                      </p>
                      <p className="text-sm text-purple-600 font-medium">
                        This is the end result that your team uses every day.
                      </p>
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold">How They Connect</h3>
                  <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm space-y-1">
                    <p>Pricing Rule says: "Business cards cost TZS 2,500 per 100 units"</p>
                    <p>Materials says: "80gsm paper costs TZS 500 per A4 sheet"</p>
                    <p>Product Config says: "Business cards need 10 sheets of 80gsm paper per 100 cards"</p>
                    <p className="font-bold text-orange-600 pt-2">
                      Calculator output: TZS 2,500 + (10 x TZS 500) = TZS 7,500 total
                    </p>
                  </div>

                  <Callout type="warning">
                    <strong>Important:</strong> You do NOT need to set up all four pieces for every product.
                    Simple products like flyers might only need a Pricing Rule (no materials). Complex products
                    like 3D LED signs need all four. The calculator is smart enough to work with whatever
                    is configured.
                  </Callout>
                </div>
              )}              {/* ===== WORKFLOW ===== */}
              {activeSection === "workflow" && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold">The Complete Workflow</h2>

                  <p className="text-gray-600">
                    This is the order in which you set things up. Think of it as building from the ground up:
                    first you set prices, then you add ingredients, then you write recipes, then you cook.
                  </p>

                  <div className="border-2 border-orange-200 rounded-lg p-6 space-y-4">
                    <Step number={1} title="Set Up Pricing Rules (Admin)">
                      <p>Before anything else, each product needs a pricing rule. This tells the system
                        <strong> how</strong> to calculate the base price. Go to <strong>Price Rules</strong> in the sidebar.</p>
                      <ul className="list-disc list-inside space-y-1 ml-4">
                        <li>Choose the product from your catalog</li>
                        <li>Select a pricing model (per_unit, per_area, qty_band_per_unit, etc.)</li>
                        <li>Set price bands for different quantities</li>
                        <li>Optionally configure sheet optimization for cut-from-sheet products</li>
                      </ul>
                    </Step>

                    <Arrow />

                    <Step number={2} title="Add Your Materials (Admin)">
                      <p>Go to <strong>Signage Materials</strong> in the sidebar. Despite the name, this works
                        for ALL products, not just signage. Create categories first, then add individual materials.</p>
                      <ul className="list-disc list-inside space-y-1 ml-4">
                        <li><strong>Categories</strong> group materials by type: Base Materials, Illumination, Fabrication, Packaging, etc.</li>
                        <li><strong>Materials</strong> are the individual items: Acrylic 6mm, LED strip, 80gsm paper, etc.</li>
                        <li>Each material has a <strong>price per unit</strong> and a <strong>unit type</strong> (m2, meter, piece, kg)</li>
                      </ul>
                    </Step>

                    <Arrow />

                    <Step number={3} title="Create Product Configs (Admin)">
                      <p>Go to <strong>Signage Configs</strong> in the sidebar. This is where you write the "recipe"
                        for each product that uses multiple materials.</p>
                      <ul className="list-disc list-inside space-y-1 ml-4">
                        <li>Give the config a name (e.g., "3D LED Sign Standard Setup")</li>
                        <li>Select which product this config applies to</li>
                        <li>Add the materials this product needs</li>
                        <li>Set default quantities for each material</li>
                      </ul>
                      <Callout type="danger">
                        <strong>Skip this step:</strong> The calculator will still show the base price, but
                        material costs will NOT be included. The quote will be too low and you will lose money.
                      </Callout>
                    </Step>

                    <Arrow />

                    <Step number={4} title="Quote With Calculator (Sales Team)">
                      <p>Sales staff go to the <strong>Calculator</strong> page. This is the front door:</p>
                      <ul className="list-disc list-inside space-y-1 ml-4">
                        <li>Select the product the client wants</li>
                        <li>Enter quantity or dimensions</li>
                        <li>If the product has a config, materials appear automatically with adjustable quantities</li>
                        <li>The final price includes base pricing + material costs</li>
                      </ul>
                    </Step>

                    <Arrow />

                    <Step number={5} title="Create Quote & Order (Sales Team)">
                      <p>Once the price looks right, the salesperson can create a formal Quote from the calculator.
                        The client approves it, it becomes an Order, and production begins.</p>
                    </Step>
                  </div>

                  <Callout type="info">
                    <strong>Who does what:</strong> Only admins (or the shop owner) do steps 1-3. Once those
                    are set up, sales staff only use step 4 (the calculator) and step 5 (quotes/orders).
                    The setup is done once; the calculator is used every day.
                  </Callout>
                </div>
              )}              {/* ===== PRICING RULES ===== */}
              {activeSection === "pricing" && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold">Step 1: Setting Up Pricing Rules</h2>

                  <p className="text-gray-600">Pricing rules are the foundation. Without them, the calculator cannot give any price at all. Each product needs its own pricing rule.</p>

                  <h3 className="text-lg font-semibold">How To Create a Pricing Rule</h3>
                  <ol className="list-decimal list-inside space-y-2 text-gray-600">
                    <li>Go to <strong>Price Rules</strong> in the sidebar</li>
                    <li>Click <strong>"New Rule"</strong></li>
                    <li>Select the <strong>Product</strong> this rule is for</li>
                    <li>Choose a <strong>Pricing Model</strong> (see below)</li>
                    <li>Add <strong>Option Filters</strong> if the rule only applies to certain variants</li>
                    <li>Add <strong>Price Bands</strong> for quantity-based pricing</li>
                    <li>Optionally enable <strong>Sheet Optimization</strong> for products cut from standard sheets</li>
                    <li>Click <strong>Save</strong></li>
                  </ol>

                  <h3 className="text-lg font-semibold">Pricing Models Explained</h3>

                  <div className="space-y-4">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold">per_unit</h4>
                      <p className="text-sm text-gray-600 mt-1">Simple per-item pricing. "TZS 500 per business card" regardless of quantity.</p>
                      <p className="text-sm mt-2"><strong>Use for:</strong> Simple products with no volume discounts.</p>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold">qty_band_per_unit</h4>
                      <p className="text-sm text-gray-600 mt-1">Price per unit changes based on quantity. "1-50 cards: TZS 500 each, 51-200: TZS 350 each, 200+: TZS 250 each."</p>
                      <p className="text-sm mt-2"><strong>Use for:</strong> Most printing products. Business cards, flyers, booklets, stickers. This is the most common model.</p>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold">area_based_range</h4>
                      <p className="text-sm text-gray-600 mt-1">Price per square meter. "TZS 150,000/m2." The client enters dimensions and the system calculates the area.</p>
                      <p className="text-sm mt-2"><strong>Use for:</strong> Signage, banners, large format printing. Any product where size determines cost.</p>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold">sheet_based</h4>
                      <p className="text-sm text-gray-600 mt-1">Price per sheet of material. Combined with sheet optimization to calculate how many sheets are needed.</p>
                      <p className="text-sm mt-2"><strong>Use for:</strong> Products cut from standard paper/vinyl sheets (A4, A3, A2).</p>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold">custom_formula</h4>
                      <p className="text-sm text-gray-600 mt-1">Admin-defined formula that can combine multiple factors (area, quantity, material, complexity).</p>
                      <p className="text-sm mt-2"><strong>Use for:</strong> Complex products that do not fit standard models.</p>
                    </div>
                  </div>

                  <Callout type="warning">
                    <strong>What happens if you skip this:</strong> The calculator will show the product but have no price at all. The salesperson will see "Price: TZS 0" or an error. Always set up pricing rules first.
                  </Callout>
                </div>
              )}              {/* ===== MATERIALS ===== */}
              {activeSection === "materials" && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold">Step 2: Adding Materials</h2>

                  <p className="text-gray-600">Materials are the physical ingredients your products are made of. Every material has a cost, and the calculator adds these costs to the base price. Go to <strong>Signage Materials</strong> in the sidebar.</p>

                  <Callout type="info">
                    <strong>Naming note:</strong> The page is called "Signage Materials" but it works for ALL product types. Business cards use paper. Banners use vinyl. Signs use acrylic and LEDs. Everything goes here.
                  </Callout>

                  <h3 className="text-lg font-semibold">Part A: Create Categories First</h3>
                  <p className="text-gray-600">Categories group your materials so they are organized. Before adding any material, you MUST create at least one category.</p>

                  <Scenario title="Scenario: What Happens Without Categories">
                    <p>You try to add a material but the category dropdown is empty. You cannot save the material because every material must belong to a category. <strong>The system requires a category before you can add materials.</strong></p>
                  </Scenario>

                  <h4 className="font-medium mt-4">How to Create a Category:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-gray-600">
                    <li>Go to <strong>Signage Materials</strong> page</li>
                    <li>Click <strong>"New Category"</strong> button</li>
                    <li>Enter a name (e.g., "Base Materials", "Illumination", "Fabrication")</li>
                    <li>Add a description (optional but recommended)</li>
                    <li>Click <strong>Create</strong></li>
                  </ol>

                  <h4 className="font-medium mt-4">Suggested Categories for a Print Shop:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3"><p className="font-medium">Base Materials</p><p className="text-sm text-gray-600">Paper, acrylic, aluminum, PVC, vinyl, wood, fabric</p></div>
                    <div className="bg-gray-50 rounded-lg p-3"><p className="font-medium">Illumination</p><p className="text-sm text-gray-600">LED strips, LED modules, neon tubes, power supplies</p></div>
                    <div className="bg-gray-50 rounded-lg p-3"><p className="font-medium">Fabrication Services</p><p className="text-sm text-gray-600">CNC cutting, laser cutting, bending, welding, assembly</p></div>
                    <div className="bg-gray-50 rounded-lg p-3"><p className="font-medium">Hardware & Mounting</p><p className="text-sm text-gray-600">Screws, brackets, standoffs, frames, cables</p></div>
                    <div className="bg-gray-50 rounded-lg p-3"><p className="font-medium">Ink & Printing</p><p className="text-sm text-gray-600">CMYK ink, spot colors, UV coating, lamination</p></div>
                    <div className="bg-gray-50 rounded-lg p-3"><p className="font-medium">Packaging</p><p className="text-sm text-gray-600">Boxes, shrink wrap, labels, shipping materials</p></div>
                  </div>

                  <h3 className="text-lg font-semibold mt-6">Part B: Add Materials to Categories</h3>
                  <p className="text-gray-600">Once categories exist, you can add individual materials. Each material needs:</p>

                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100"><tr><th className="text-left p-3">Field</th><th className="text-left p-3">What It Means</th><th className="text-left p-3">Example</th></tr></thead>
                      <tbody className="divide-y">
                        <tr><td className="p-3 font-medium">Category</td><td className="p-3">Which group this belongs to (you MUST pick one)</td><td className="p-3">Base Materials</td></tr>
                        <tr><td className="p-3 font-medium">Name</td><td className="p-3">Descriptive name</td><td className="p-3">Acrylic Sheet 6mm Clear</td></tr>
                        <tr><td className="p-3 font-medium">Unit</td><td className="p-3">How this material is measured and sold</td><td className="p-3">m2, meter, piece, kg, liter, roll</td></tr>
                        <tr><td className="p-3 font-medium">Price Per Unit</td><td className="p-3">What you charge the client per unit</td><td className="p-3">TZS 45,000 per m2</td></tr>
                        <tr><td className="p-3 font-medium">Cost Per Unit</td><td className="p-3">What YOU pay for this material (internal only)</td><td className="p-3">TZS 28,000 per m2</td></tr>
                        <tr><td className="p-3 font-medium">Supplier</td><td className="p-3">Who supplies this (for reference)</td><td className="p-3">Plastics Industries Ltd</td></tr>
                      </tbody>
                    </table>
                  </div>

                  <Callout type="danger">
                    <strong>What happens if you skip this:</strong> You can still create product configs, but when you try to add materials to a config, the material dropdown will be empty. You cannot link a product to materials that do not exist. <strong>Materials MUST exist before configs.</strong>
                  </Callout>
                </div>
              )}              {/* ===== CONFIGS ===== */}
              {activeSection === "configs" && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold">Step 3: Linking Products to Materials</h2>

                  <p className="text-gray-600">A <strong>Product Config</strong> is a recipe. It tells the calculator: "When someone orders this product, these are the materials it uses, in these quantities." Go to <strong>Signage Configs</strong> in the sidebar.</p>

                  <Callout type="info">
                    <strong>You only need configs for products that use physical materials.</strong> If a product is priced purely by area or per unit with no material breakdown, you can skip this step. But if you want the calculator to show material costs, you need a config.
                  </Callout>

                  <h3 className="text-lg font-semibold">How to Create a Config</h3>
                  <ol className="list-decimal list-inside space-y-2 text-gray-600">
                    <li>Go to <strong>Signage Configs</strong> page</li>
                    <li>Click <strong>"New Config"</strong></li>
                    <li>Give it a name: "3D LED Sign - Standard" or "Business Cards - 300gsm"</li>
                    <li>Select the <strong>Product</strong> this config applies to</li>
                    <li>Write a description explaining what this config includes</li>
                    <li>Click <strong>Create</strong></li>
                    <li>Click on the config to open it and add materials</li>
                    <li>For each material needed, click <strong>"Add Material"</strong> and select from the list</li>
                    <li>Set the <strong>default quantity</strong> for each material</li>
                  </ol>

                  <h3 className="text-lg font-semibold mt-4">Example: 3D LED Sign Config</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-1 font-mono text-sm">
                    <p>Config Name: "3D LED Sign - Standard"</p>
                    <p>Product: Indoor LED Sign</p>
                    <p>&nbsp;</p>
                    <p>Materials:</p>
                    <p>&nbsp;&nbsp;Acrylic Sheet 6mm (Base Materials) -- 0.5 m2 default</p>
                    <p>&nbsp;&nbsp;LED Strip RGB (Illumination) -- 2 meters default</p>
                    <p>&nbsp;&nbsp;Power Supply 12V (Illumination) -- 1 piece default</p>
                    <p>&nbsp;&nbsp;Aluminum Frame (Hardware) -- 2 meters default</p>
                    <p>&nbsp;&nbsp;CNC Cutting (Fabrication) -- 3 meters default</p>
                    <p>&nbsp;&nbsp;Assembly (Fabrication) -- 1 piece default</p>
                  </div>

                  <Callout type="warning">
                    <strong>What happens if you skip this:</strong> The calculator shows ONLY the base price from the pricing rule. For a 3D LED sign priced at TZS 200,000/m2, the client would see TZS 200,000 but not the TZS 150,000+ in materials. You would either underquote (lose money) or overquote (lose the client).
                  </Callout>

                  <h3 className="text-lg font-semibold mt-4">What Happens at Each Stage</h3>
                  <div className="space-y-3">
                    <Scenario title="Product has Pricing Rule ONLY (no config)">
                      <p>Calculator shows: <strong>TZS 200,000</strong> (just the base area price)</p>
                      <p className="text-gray-500">Material costs are NOT included. The quote may be inaccurate.</p>
                    </Scenario>
                    <Scenario title="Product has Pricing Rule AND Config">
                      <p>Calculator shows: <strong>TZS 200,000 base + TZS 150,000 materials = TZS 350,000 total</strong></p>
                      <p className="text-green-600">The salesperson sees the full breakdown and can adjust material quantities if needed.</p>
                    </Scenario>
                    <Scenario title="Product has Config but NO Pricing Rule">
                      <p>Calculator shows: <strong>Error or TZS 0</strong></p>
                      <p className="text-red-600">There is no base price formula. Materials alone are not enough. You ALWAYS need a pricing rule.</p>
                    </Scenario>
                  </div>
                </div>
              )}              {/* ===== CALCULATOR ===== */}
              {activeSection === "calculator" && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold">Step 4: Using The Calculator</h2>

                  <p className="text-gray-600">This is what your sales team uses daily. All the setup from Steps 1-3 feeds into this. The calculator is the front door for creating quotes.</p>

                  <h3 className="text-lg font-semibold">How to Use It (Sales Staff)</h3>

                  <Step number={1} title="Select a Product">
                    <p>Pick the product the client wants from the dropdown. Products are organized by category. If a product has a pricing rule, it will appear here. If not, it will not show up (which means the admin has not set up a pricing rule for it yet).</p>
                    <Callout type="danger">
                      <strong>Problem:</strong> The product I need is not in the list!
                      <br />
                      <strong>Solution:</strong> Ask an admin to create a Pricing Rule for that product in the Price Rules page.
                    </Callout>
                  </Step>

                  <Arrow />

                  <Step number={2} title="Enter Quantity or Dimensions">
                    <p>Depending on the pricing model, you enter:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li><strong>per_unit / qty_band:</strong> Enter the quantity (e.g., 100 business cards)</li>
                      <li><strong>area_based:</strong> Enter width and height in cm (the system calculates m2)</li>
                      <li><strong>sheet_based:</strong> Enter quantity, and the system calculates sheets needed</li>
                    </ul>
                  </Step>

                  <Arrow />

                  <Step number={3} title="Configure Options">
                    <p>Some products have options (material type, number of sides, finish, etc.). Select the options that match what the client wants. These options may affect the price.</p>
                  </Step>

                  <Arrow />

                  <Step number={4} title="Review Materials (If Config Exists)">
                    <p>If the product has a Product Config, the calculator automatically shows the materials and their quantities. You can:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>See each material and its per-unit price</li>
                      <li>Increase or decrease quantities using the +/- buttons</li>
                      <li>The total updates in real-time as you adjust</li>
                    </ul>
                    <Callout type="info">
                      <strong>Why adjust quantities?</strong> A client might want a simpler sign with fewer LEDs, or a larger one needing more acrylic. The salesperson can customize the material quantities to match the actual job, giving an accurate quote.
                    </Callout>
                  </Step>

                  <Arrow />

                  <Step number={5} title="Get the Quote">
                    <p>Click <strong>"Calculate Price"</strong>. The system shows:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Base price (from the pricing rule)</li>
                      <li>Material costs breakdown</li>
                      <li><strong>Total price</strong></li>
                    </ul>
                    <p className="mt-2">You can then save this as a formal Quote to send to the client.</p>
                  </Step>

                  <h3 className="text-lg font-semibold mt-6">The Live Receipt</h3>
                  <p className="text-gray-600">On the right side of the calculator, you will see a "Live Receipt" that updates in real-time. This shows a running total as you change quantities and options. It is like a shopping cart that always shows the current price.</p>
                </div>
              )}              {/* ===== EXAMPLES ===== */}
              {activeSection === "examples" && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold">Real-World Examples</h2>

                  <p className="text-gray-600">Here are complete walkthroughs showing how the system handles different types of products.</p>

                  <h3 className="text-lg font-semibold">Example 1: Business Cards (Sheet-Based)</h3>
                  <div className="space-y-3">
                    <Scenario title="Setup by Admin">
                      <p><strong>Category created:</strong> "Paper and Printing"</p>
                      <p><strong>Materials added:</strong></p>
                      <p>&nbsp;&nbsp;80gsm Art Paper -- TZS 500 per A4 sheet</p>
                      <p>&nbsp;&nbsp;CMYK Ink Set -- TZS 100 per job</p>
                      <p>&nbsp;&nbsp;Lamination Film -- TZS 30 per card</p>
                      <p><strong>Config:</strong> "Business Cards" with 10 sheets + 1 ink + 1 lamination per card</p>
                      <p><strong>Pricing Rule:</strong> qty_band -- 1-50: TZS 500, 51-200: TZS 350, 200+: TZS 250</p>
                    </Scenario>
                    <Scenario title="Quote for 100 Cards">
                      <p>Base: 100 x TZS 350 = TZS 35,000</p>
                      <p>Materials: Paper TZS 5,000 + Ink TZS 100 + Lamination TZS 3,000 = TZS 8,100</p>
                      <p className="font-bold">TOTAL: TZS 43,100</p>
                    </Scenario>
                    <Scenario title="Client Says No Lamination">
                      <p>Salesperson sets lamination qty to 0. Materials become TZS 5,100.</p>
                      <p className="font-bold">NEW TOTAL: TZS 40,100</p>
                      <p className="text-green-600">Recalculated automatically. No code changes needed.</p>
                    </Scenario>
                  </div>

                  <h3 className="text-lg font-semibold mt-6">Example 2: 3D LED Sign (Multi-Material)</h3>
                  <div className="space-y-3">
                    <Scenario title="Setup by Admin">
                      <p><strong>Categories:</strong> Base Materials, Illumination, Fabrication, Hardware</p>
                      <p><strong>Materials:</strong> Acrylic 6mm (TZS 45,000/m2), LED Strip (TZS 15,000/m), Power Supply (TZS 25,000/pc), Frame (TZS 8,000/m), CNC Cutting (TZS 5,000/m), Assembly (TZS 20,000/pc)</p>
                      <p><strong>Pricing Rule:</strong> area_based at TZS 200,000/m2</p>
                    </Scenario>
                    <Scenario title="Quote for 1.5m x 0.8m Sign">
                      <p>Area: 1.2 m2. Base: TZS 240,000</p>
                      <p>Materials adjusted: Acrylic 1.2m2 + LED 4m + PSU 1 + Frame 4.6m + CNC 6m + Assembly 1</p>
                      <p>Materials total: TZS 225,800</p>
                      <p className="font-bold">TOTAL: TZS 465,800</p>
                    </Scenario>
                    <Scenario title="Client Wants No Lights">
                      <p>Set LED and PSU to 0. Materials become TZS 140,800.</p>
                      <p className="font-bold">NEW TOTAL: TZS 380,800</p>
                      <p className="text-green-600">Same product, different config. No separate product needed.</p>
                    </Scenario>
                  </div>

                  <h3 className="text-lg font-semibold mt-6">Example 3: Vinyl Banner (Area-Based)</h3>
                  <div className="space-y-3">
                    <Scenario title="Quote for 3m x 1m Banner">
                      <p>Area: 3 m2. Base: 3 x TZS 25,000 = TZS 75,000</p>
                      <p>Materials: Vinyl TZS 24,000 + Grommets TZS 4,000 + Hemming TZS 16,000</p>
                      <p className="font-bold">TOTAL: TZS 119,000</p>
                    </Scenario>
                  </div>
                </div>
              )}              {/* ===== TROUBLESHOOTING ===== */}
              {activeSection === "troubleshooting" && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold">Common Mistakes and Troubleshooting</h2>

                  <p className="text-gray-600">These are the most common issues people run into and how to fix them.</p>

                  <div className="space-y-4">
                    <div className="border-l-4 border-red-400 pl-4 py-2">
                      <h4 className="font-semibold">"The calculator shows no price"</h4>
                      <p className="text-sm text-gray-600 mt-1"><strong>Cause:</strong> The product does not have a Pricing Rule.</p>
                      <p className="text-sm text-gray-600"><strong>Fix:</strong> Go to Price Rules and create one for this product. The calculator cannot work without a pricing rule.</p>
                    </div>

                    <div className="border-l-4 border-red-400 pl-4 py-2">
                      <h4 className="font-semibold">"Materials dropdown is empty when creating a config"</h4>
                      <p className="text-sm text-gray-600 mt-1"><strong>Cause:</strong> No materials have been added yet, or no categories exist.</p>
                      <p className="text-sm text-gray-600"><strong>Fix:</strong> Go to Signage Materials. First create at least one Category, then add Materials to that Category.</p>
                    </div>

                    <div className="border-l-4 border-red-400 pl-4 py-2">
                      <h4 className="font-semibold">"Material prices are not showing in the calculator"</h4>
                      <p className="text-sm text-gray-600 mt-1"><strong>Cause:</strong> The product does not have a Product Config linking it to materials.</p>
                      <p className="text-sm text-gray-600"><strong>Fix:</strong> Go to Signage Configs, create a config for this product, and add the required materials.</p>
                    </div>

                    <div className="border-l-4 border-yellow-400 pl-4 py-2">
                      <h4 className="font-semibold">"The price seems too low or too high"</h4>
                      <p className="text-sm text-gray-600 mt-1"><strong>Possible causes:</strong></p>
                      <ul className="list-disc list-inside space-y-1 ml-4 text-sm text-gray-600">
                        <li>Material costs are not included (no config) -- price is base only</li>
                        <li>Material quantities in the config are wrong -- check defaults</li>
                        <li>Pricing rule price bands are outdated -- update in Price Rules</li>
                        <li>Material unit prices are wrong -- check in Signage Materials</li>
                      </ul>
                    </div>

                    <div className="border-l-4 border-yellow-400 pl-4 py-2">
                      <h4 className="font-semibold">"I want to use this for a new product type"</h4>
                      <p className="text-sm text-gray-600 mt-1"><strong>Steps:</strong></p>
                      <ol className="list-decimal list-inside space-y-1 ml-4 text-sm text-gray-600">
                        <li>Make sure the product exists in the Products catalog</li>
                        <li>Create a Pricing Rule for it (mandatory)</li>
                        <li>Create material Categories and Materials if needed</li>
                        <li>Create a Product Config linking the product to its materials</li>
                        <li>Test it in the Calculator</li>
                      </ol>
                    </div>

                    <div className="border-l-4 border-green-400 pl-4 py-2">
                      <h4 className="font-semibold">"Can I have multiple configs for one product?"</h4>
                      <p className="text-sm text-gray-600 mt-1"><strong>Yes!</strong> Create multiple configs with different names. For example: "3D LED Sign - Premium" and "3D LED Sign - Budget". The salesperson picks the one that matches what the client wants.</p>
                    </div>

                    <div className="border-l-4 border-green-400 pl-4 py-2">
                      <h4 className="font-semibold">"Can I change material prices without breaking old quotes?"</h4>
                      <p className="text-sm text-gray-600 mt-1"><strong>Yes.</strong> Old quotes store the price at the time they were created. Changing material prices only affects new quotes going forward.</p>
                    </div>
                  </div>
                </div>
              )}

            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}