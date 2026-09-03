import {
  Lightbulb,
  Building2,
  Gift,
  Printer,
  Layers,
  Factory,
  TrendingUp,
  Award,
  Clock,
  type LucideIcon,
} from "lucide-react";

/**
 * Public-facing site content, aligned with the WBH Catalog-1.pdf
 * capabilities catalogue.
 *
 * Company display name: WXY Business Solutions.
 * The company's operating location stays Arusha, Tanzania — only the
 * location is intentionally different from the PDF's contact page.
 */

export const SITE = {
  name: "WXY Business Solutions",
  shortName: "WXY",
  logoAlt: "WXY Business Solutions",
  tagline: "Manufacturing Visibility. Building Brands",
  mission: "Where Creativity Meets Impact Across Tanzania",
  descriptor:
    "Industrial design & manufacturer of quality signage, promotional materials and digital dynamic displays",
  copyrightYear: 2026,
  overview: [
    "WXY Business Solutions is a modern manufacturing and printing powerhouse delivering high-quality branding, signage and visual communication solutions tailored to diverse business needs.",
    "With a strong focus on customisation, we design and produce solutions that align perfectly with each client's brand identity, environment and objectives — ensuring every output is unique, functional and impactful.",
    "Our capabilities span a wide range of materials and finishes, including metal, acrylic, PVC, LED displays, wood, Aluco boards, vinyl, fabric and illuminated systems, allowing us to deliver both standard and fully bespoke solutions across multiple industries.",
    "Backed by advanced production technology and a skilled team, we handle everything from small-scale custom orders to large-volume projects — maintaining consistent quality, efficiency and attention to detail at every stage.",
  ],
  materials: [
    "Metal",
    "Acrylic",
    "PVC",
    "LED Displays",
    "Wood",
    "Aluco Boards",
    "Vinyl",
    "Fabric",
    "Illuminated Systems",
  ],
  contact: {
    location: "Arusha, Tanzania",
    phone: "+255 628 497 973",
    email: "wxyhubtz@gmail.com",
    instagram: "@wxy_businesshub",
    instagramUrl: "https://www.instagram.com/wxy_businesshub",
  },
};

export interface ServiceGroup {
  label: string;
  items: string[];
}

export interface ServiceFamily {
  id: string;
  num: string;
  title: string;
  icon: LucideIcon;
  tagline: string;
  description: string;
  gradient: string;
  groups: ServiceGroup[];
}

/** The four divisions of the WBH catalogue. */
export const FAMILIES: ServiceFamily[] = [
  {
    id: "signage",
    num: "01",
    title: "Signage & Visual Communication",
    icon: Lightbulb,
    tagline:
      "Where visibility meets impact — your brand deserves to be seen, remembered and respected.",
    description:
      "Elevate your presence with dimensional signage designed to captivate day or night — sharp, professional signage that communicates your brand with simplicity and strength.",
    gradient: "from-rose-500 to-red-600",
    groups: [
      {
        label: "2D Signage",
        items: ["Wall Branding", "Shop Signs"],
      },
      {
        label: "3D Signage",
        items: [
          "Illuminated Letters",
          "3D Letters",
          "LED Signage",
          "Lightbox Signs",
          "Digital LED Displays",
        ],
      },
      {
        label: "Safety Signs — SafeMark",
        items: ["Branded PPE", "Hazard & Safety Signs", "Construction Boards"],
      },
      {
        label: "Emergency Signs — ExitPro",
        items: ["Evacuation Maps", "Exit Signs"],
      },
      {
        label: "Road Signs — BarabaraSigns",
        items: ["Highway Signs", "Reflective Signs", "Directional Signs"],
      },
    ],
  },
  {
    id: "fabrication",
    num: "02",
    title: "Fabrication & Structural Branding",
    icon: Building2,
    tagline:
      "Built strong. Designed bold. We combine engineering precision with branding excellence to create structures that stand out and stand the test of time.",
    description:
      "From fuel stations and ATMs to exhibitions and outdoor landmarks, we engineer complete branding systems that turn everyday spaces into iconic brand experiences.",
    gradient: "from-sky-500 to-blue-600",
    groups: [
      {
        label: "Fuel Stations — FuelBrand Pro",
        items: ["Totems", "Canopies", "Pump Branding"],
      },
      {
        label: "ATM Branding — ATMFace",
        items: ["Kiosks & Surrounds", "Lightboxes"],
      },
      {
        label: "Exhibitions — ExpoFrame",
        items: [
          "Exhibition Display Stands",
          "Oval Pop-Up Stands",
          "Gazebos",
          "Hanging Signs",
          "X-Banners",
          "Roll-Up Banners",
          "Tear-Drop Banners",
          "Photo Booths",
          "Jumbo Banners",
          "Promotional Tables",
          "Umbrellas",
        ],
      },
      {
        label: "Event & Venue Branding",
        items: [
          "Expo & Event Gate Entrances",
          "Wayfinding Signs",
          "Conference Panels",
          "Reading-Area Info Kiosks",
        ],
      },
      {
        label: "Outdoor Structures",
        items: ["Billboards", "Pylon Signage", "Wheel Covers", "Drive-Thru Café Branding"],
      },
    ],
  },
  {
    id: "promotional",
    num: "03",
    title: "Promotional Materials",
    icon: Gift,
    tagline:
      "Tangible branding that travels, connects and converts everyday items into powerful marketing tools.",
    description:
      "From branded stationery and merchandise to event materials, we produce promotional products that reinforce your identity in every interaction.",
    gradient: "from-amber-500 to-orange-600",
    groups: [
      {
        label: "Stationery",
        items: ["Letterheads & Envelopes", "Notebooks", "Business Cards"],
      },
      {
        label: "Merchandise — BrandWear",
        items: [
          "Mugs",
          "Bags & Delivery Bags",
          "T-Shirts & Shirts",
          "Caps",
          "Pens",
          "ID Cards",
          "Armbands",
        ],
      },
      {
        label: "Marketing Materials",
        items: ["Brochures", "Catalogs", "Flyers"],
      },
      {
        label: "Event Materials — EventXpress",
        items: ["Backdrops", "Standing Banners"],
      },
    ],
  },
  {
    id: "printing",
    num: "04",
    title: "Printing & Production",
    icon: Printer,
    tagline:
      "Where technology meets craftsmanship for flawless results, every time.",
    description:
      "From short-run digital jobs to high-volume offset and large-scale print, our production floor delivers consistency, clarity and cost efficiency.",
    gradient: "from-violet-500 to-purple-600",
    groups: [
      {
        label: "Digital Printing",
        items: [
          "Flyers",
          "Stickers",
          "Folders",
          "Exercise Books",
          "Product Labels",
          "Warranty Cards",
        ],
      },
      {
        label: "Offset Printing",
        items: ["Books", "Magazines", "Calendars", "Packaging"],
      },
      {
        label: "Large Format — MegaPrint",
        items: [
          "Billboards",
          "Vinyl Wraps",
          "Flags",
          "Pole Banners",
          "POP Stands",
          "Blade Signs",
        ],
      },
      {
        label: "DTF Printing — VaaPrint",
        items: ["Custom Apparel & Garment Printing"],
      },
    ],
  },
];

export interface ValueProp {
  icon: LucideIcon;
  title: string;
  description: string;
}

/** "The Standard We Deliver" from the catalogue. */
export const STANDARDS: ValueProp[] = [
  {
    icon: Layers,
    title: "One-Stop Solution",
    description:
      "From concept and design to fabrication and final delivery, we simplify your entire branding journey — everything under one roof, zero compromises.",
  },
  {
    icon: Factory,
    title: "Manufacturing Capability",
    description:
      "Our in-house production ecosystem gives us unmatched control over quality, timelines and execution — every output meets elite standards.",
  },
  {
    icon: TrendingUp,
    title: "Scalable Production",
    description:
      "Whether it's a single project or a large-scale rollout, we have the capacity to grow with your business.",
  },
  {
    icon: Award,
    title: "High Quality",
    description:
      "Every product is crafted with attention to detail, premium materials and a commitment to perfection.",
  },
  {
    icon: Clock,
    title: "Fast Turnaround",
    description:
      "We move with urgency and efficiency to meet your deadlines without cutting corners.",
  },
];

/** Portfolio categories shown on the public Our Work page. */
export const WORK_CATEGORIES = [
  "2D & 3D Signage",
  "LED & Digital Displays",
  "Safety, Emergency & Road Signs",
  "Fuel & ATM Branding",
  "Exhibitions & Event Branding",
  "Outdoor Structures",
  "Stationery & Marketing Materials",
  "Merchandise & Apparel",
  "Printing & Production",
  "Other",
];

export const WORK_CATEGORY_ICONS: Record<string, string> = {
  "2D & 3D Signage": "🏷️",
  "LED & Digital Displays": "💡",
  "Safety, Emergency & Road Signs": "⚠️",
  "Fuel & ATM Branding": "⛽",
  "Exhibitions & Event Branding": "🎪",
  "Outdoor Structures": "🏗️",
  "Stationery & Marketing Materials": "📎",
  "Merchandise & Apparel": "👕",
  "Printing & Production": "🖨️",
  Other: "📁",
};

export const WORK_CATEGORY_GRADIENTS: Record<string, string> = {
  "2D & 3D Signage": "from-rose-500 to-red-600",
  "LED & Digital Displays": "from-amber-500 to-orange-600",
  "Safety, Emergency & Road Signs": "from-red-500 to-rose-700",
  "Fuel & ATM Branding": "from-sky-500 to-blue-600",
  "Exhibitions & Event Branding": "from-fuchsia-500 to-purple-600",
  "Outdoor Structures": "from-slate-500 to-gray-700",
  "Stationery & Marketing Materials": "from-indigo-500 to-blue-700",
  "Merchandise & Apparel": "from-teal-500 to-emerald-600",
  "Printing & Production": "from-violet-500 to-purple-700",
  Other: "from-gray-500 to-gray-600",
};
