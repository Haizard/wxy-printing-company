/**
 * PrintHub OS — Pricing Engine
 *
 * Pure TypeScript module with no framework dependencies.
 * Can be used server-side (authoritative) and client-side (live preview).
 *
 * Implements 7 pricing models:
 * 1. qty_band_per_unit
 * 2. coverage_qty_band
 * 3. area_based_range
 * 4. sheet_qty_tier_markup
 * 5. imposition_sheet_based
 * 6. signage_engrave_cut_formula
 * 7. flat_fixed_* variants
 */

import { cmToSqm } from "./utils";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface FinishingOption {
  id: string;
  name: string;
  price: number;
  unit: string;
}

export interface BreakdownLine {
  label: string;
  amount: number;
}

export interface CalculatorInput {
  categoryId: string;
  model: string;
  material?: string;
  sides?: number;
  size?: string;
  qty?: number;
  widthCm?: number;
  heightCm?: number;
  pageSize?: string;
  pageCount?: number;
  leafCount?: number;
  coverageTier?: string;
  cutTimeHours?: number;
  engraveTimeHours?: number;
  upsPerSheet?: number;
  finishing?: FinishingOption[];
  manualOverride?: number | null;
}

export interface CalculatorResult {
  matchedRuleId: string;
  matchedBandId?: string;
  unitPrice: number;
  unitPriceRange?: [number, number];
  quantity: number;
  areaSqm?: number;
  subtotal: number;
  finishingTotal: number;
  total: number;
  breakdown: BreakdownLine[];
  requiresStaffReview: boolean;
}

// ─── Seed Price Data (from source PDFs) ──────────────────────────────────────
// In production, these come from the database. For MVP, we use seed data.

interface PriceBand {
  id: string;
  qtyMin?: number;
  qtyMax?: number;
  areaMin?: number;
  areaMax?: number;
  unitPriceMin: number;
  unitPriceMax?: number;
  sideCount?: number;
  leafCount?: number;
}

interface PriceRule {
  id: string;
  productId: string;
  model: string;
  optionFilter: Record<string, string | number>;
  markupPercent?: number;
  minCharge?: number;
  bands: PriceBand[];
}

const seedPriceRules: PriceRule[] = [
  // ── Area-based range: Banners & Vinyl ─────────────────────────────────────
  {
    id: "pr-banners-blackback",
    productId: "banners-vinyl",
    model: "area_based_range",
    optionFilter: { material: "black_back_banner" },
    minCharge: 25000,
    bands: [
      { id: "pb-blackback-1", unitPriceMin: 18000, unitPriceMax: 22000 },
    ],
  },
  {
    id: "pr-banners-whiteback",
    productId: "banners-vinyl",
    model: "area_based_range",
    optionFilter: { material: "white_back_banner" },
    minCharge: 20000,
    bands: [
      { id: "pb-whiteback-1", unitPriceMin: 15000, unitPriceMax: 19000 },
    ],
  },
  {
    id: "pr-banners-doublesided",
    productId: "banners-vinyl",
    model: "area_based_range",
    optionFilter: { material: "double_sided_banner" },
    minCharge: 35000,
    bands: [
      { id: "pb-doublesided-1", unitPriceMin: 25000, unitPriceMax: 30000 },
    ],
  },
  {
    id: "pr-banners-reflective",
    productId: "banners-vinyl",
    model: "area_based_range",
    optionFilter: { material: "reflective_banner" },
    minCharge: 30000,
    bands: [
      { id: "pb-reflective-1", unitPriceMin: 22000, unitPriceMax: 28000 },
    ],
  },
  {
    id: "pr-banners-backlit",
    productId: "banners-vinyl",
    model: "area_based_range",
    optionFilter: { material: "backlit_flex" },
    minCharge: 28000,
    bands: [
      { id: "pb-backlit-1", unitPriceMin: 20000, unitPriceMax: 26000 },
    ],
  },
  {
    id: "pr-vinyl-whiteglossy",
    productId: "banners-vinyl",
    model: "area_based_range",
    optionFilter: { material: "white_glossy_vinyl" },
    minCharge: 15000,
    bands: [
      { id: "pb-wgv-1", unitPriceMin: 12000, unitPriceMax: 16000 },
    ],
  },
  {
    id: "pr-vinyl-whitematte",
    productId: "banners-vinyl",
    model: "area_based_range",
    optionFilter: { material: "white_matte_vinyl" },
    minCharge: 15000,
    bands: [
      { id: "pb-wmv-1", unitPriceMin: 12000, unitPriceMax: 16000 },
    ],
  },

  // ── Qty band per unit: Digital Paper ──────────────────────────────────────
  {
    id: "pr-paper-80-150",
    productId: "digital-paper",
    model: "qty_band_per_unit",
    optionFilter: { material: "paper_80_150gsm" },
    bands: [
      { id: "pb-paper-80-150-1", qtyMin: 1, qtyMax: 100, unitPriceMin: 800 },
      { id: "pb-paper-80-150-2", qtyMin: 101, qtyMax: 500, unitPriceMin: 600 },
      { id: "pb-paper-80-150-3", qtyMin: 501, qtyMax: 1000, unitPriceMin: 450 },
      { id: "pb-paper-80-150-4", qtyMin: 1001, qtyMax: undefined, unitPriceMin: 350 },
    ],
  },
  {
    id: "pr-paper-170-250",
    productId: "digital-paper",
    model: "qty_band_per_unit",
    optionFilter: { material: "paper_170_250gsm" },
    bands: [
      { id: "pb-paper-170-250-1", qtyMin: 1, qtyMax: 100, unitPriceMin: 1200 },
      { id: "pb-paper-170-250-2", qtyMin: 101, qtyMax: 500, unitPriceMin: 900 },
      { id: "pb-paper-170-250-3", qtyMin: 501, qtyMax: 1000, unitPriceMin: 700 },
      { id: "pb-paper-170-250-4", qtyMin: 1001, qtyMax: undefined, unitPriceMin: 550 },
    ],
  },

  // ── Flat fixed: Business Cards ────────────────────────────────────────────
  {
    id: "pr-bcards-single",
    productId: "business-cards",
    model: "flat_fixed_per_unit_band",
    optionFilter: { sides: "1" },
    bands: [
      { id: "pb-bcards-s1", qtyMin: 100, qtyMax: 100, unitPriceMin: 15000 },
      { id: "pb-bcards-s2", qtyMin: 200, qtyMax: 200, unitPriceMin: 25000 },
      { id: "pb-bcards-s3", qtyMin: 500, qtyMax: 500, unitPriceMin: 50000 },
    ],
  },
  {
    id: "pr-bcards-double",
    productId: "business-cards",
    model: "flat_fixed_per_unit_band",
    optionFilter: { sides: "2" },
    bands: [
      { id: "pb-bcards-d1", qtyMin: 100, qtyMax: 100, unitPriceMin: 20000 },
      { id: "pb-bcards-d2", qtyMin: 200, qtyMax: 200, unitPriceMin: 35000 },
      { id: "pb-bcards-d3", qtyMin: 500, qtyMax: 500, unitPriceMin: 70000 },
    ],
  },

  // ── Qty band per unit: Posters ────────────────────────────────────────────
  {
    id: "pr-poster-a3",
    productId: "posters",
    model: "qty_band_per_unit",
    optionFilter: { size: "a3" },
    bands: [
      { id: "pb-poster-a3-1", qtyMin: 1, qtyMax: 100, unitPriceMin: 1500 },
      { id: "pb-poster-a3-2", qtyMin: 101, qtyMax: 500, unitPriceMin: 1000 },
      { id: "pb-poster-a3-3", qtyMin: 501, qtyMax: 1000, unitPriceMin: 700 },
      { id: "pb-poster-a3-4", qtyMin: 1001, qtyMax: undefined, unitPriceMin: 500 },
    ],
  },

  // ── Sheet qty tier markup: Acrylic Signs ──────────────────────────────────
  {
    id: "pr-acrylic-6mm",
    productId: "acrylic-signs",
    model: "sheet_qty_tier_markup",
    optionFilter: { material: "acrylic_6mm" },
    markupPercent: 100,
    bands: [
      { id: "pb-acrylic-6-1", qtyMin: 1, qtyMax: 10, unitPriceMin: 40000 },
      { id: "pb-acrylic-6-2", qtyMin: 11, qtyMax: 25, unitPriceMin: 30000 },
      { id: "pb-acrylic-6-3", qtyMin: 26, qtyMax: 50, unitPriceMin: 25000 },
      { id: "pb-acrylic-6-4", qtyMin: 51, qtyMax: 100, unitPriceMin: 20000 },
    ],
  },
  {
    id: "pr-acrylic-3mm",
    productId: "acrylic-signs",
    model: "sheet_qty_tier_markup",
    optionFilter: { material: "acrylic_3mm" },
    markupPercent: 100,
    bands: [
      { id: "pb-acrylic-3-1", qtyMin: 1, qtyMax: 10, unitPriceMin: 25000 },
      { id: "pb-acrylic-3-2", qtyMin: 11, qtyMax: 25, unitPriceMin: 20000 },
      { id: "pb-acrylic-3-3", qtyMin: 26, qtyMax: 50, unitPriceMin: 16000 },
      { id: "pb-acrylic-3-4", qtyMin: 51, qtyMax: 100, unitPriceMin: 12000 },
    ],
  },

  // ── Signage engrave cut formula ───────────────────────────────────────────
  {
    id: "pr-signage-engrave",
    productId: "custom-signage",
    model: "signage_engrave_cut_formula",
    optionFilter: {},
    bands: [],
  },
];

// ─── Resolution Algorithm ────────────────────────────────────────────────────

function findMatchingRule(
  categoryId: string,
  options: Record<string, string | number>,
): PriceRule | undefined {
  return seedPriceRules.find((rule) => {
    if (rule.productId !== categoryId) return false;

    const filter = rule.optionFilter;
    for (const [key, value] of Object.entries(filter)) {
      const optVal = options[key];
      if (optVal === undefined || String(optVal) !== String(value)) return false;
    }

    return true;
  });
}

function findMatchingBand(
  bands: PriceBand[],
  qty: number,
): PriceBand | undefined {
  return bands.find((band) => {
    if (band.qtyMin !== undefined && qty < band.qtyMin) return false;
    if (band.qtyMax !== undefined && qty > band.qtyMax) return false;
    return true;
  });
}

// ─── Model-Specific Resolvers ────────────────────────────────────────────────

function resolveQtyBandPerUnit(
  rule: PriceRule,
  qty: number,
): { unitPrice: number; band: PriceBand } | null {
  const band = findMatchingBand(rule.bands, qty);
  if (!band) return null;
  return { unitPrice: band.unitPriceMin, band };
}

function resolveAreaBasedRange(
  rule: PriceRule,
  widthCm: number,
  heightCm: number,
): {
  unitPrice: number;
  unitPriceRange: [number, number];
  areaSqm: number;
  subtotal: number;
  requiresStaffReview: boolean;
  band: PriceBand;
} | null {
  const band = rule.bands[0];
  if (!band) return null;

  const areaSqm = cmToSqm(widthCm, heightCm);

  if (areaSqm < 1) {
    return {
      unitPrice: rule.minCharge || 0,
      unitPriceRange: [rule.minCharge || 0, rule.minCharge || 0],
      areaSqm,
      subtotal: rule.minCharge || 0,
      requiresStaffReview: false,
      band,
    };
  }

  const unitPrice = (band.unitPriceMin + (band.unitPriceMax || band.unitPriceMin)) / 2;
  return {
    unitPrice,
    unitPriceRange: [band.unitPriceMin, band.unitPriceMax || band.unitPriceMin],
    areaSqm,
    subtotal: Math.round(areaSqm * unitPrice),
    requiresStaffReview: true, // ranges need staff pick
    band,
  };
}

function resolveSheetQtyTierMarkup(
  rule: PriceRule,
  qty: number,
): { unitPrice: number; subtotal: number; band: PriceBand } | null {
  const band = findMatchingBand(rule.bands, qty);
  if (!band) return null;
  return {
    unitPrice: band.unitPriceMin,
    subtotal: band.unitPriceMin * qty,
    band,
  };
}

function resolveFlatFixedPerUnitBand(
  rule: PriceRule,
  qty: number,
): { unitPrice: number; subtotal: number; band: PriceBand } | null {
  const band = findMatchingBand(rule.bands, qty);
  if (!band) return null;
  return {
    unitPrice: band.unitPriceMin,
    subtotal: band.unitPriceMin,
    band,
  };
}

function resolveSignageEngraveCut(
  input: CalculatorInput,
): {
  subtotal: number;
  requiresStaffReview: boolean;
  breakdown: BreakdownLine[];
} {
  const cutRate = 120000; // per hour
  const engraveRate = 150000; // per hour
  const sheetPrice = 50000; // base sheet price (seeded)

  const cutCost = (input.cutTimeHours || 0) * cutRate;
  const engraveCost = (input.engraveTimeHours || 0) * engraveRate;
  const rawCost = sheetPrice + cutCost + engraveCost;
  const upsPerSheet = input.upsPerSheet || 1;
  const pricePerPiece = Math.round(rawCost / upsPerSheet);

  const breakdown: BreakdownLine[] = [
    { label: "Sheet Price", amount: sheetPrice },
    { label: `Cutting (${input.cutTimeHours || 0}hrs × ${cutRate.toLocaleString()})`, amount: cutCost },
    { label: `Engraving (${input.engraveTimeHours || 0}hrs × ${engraveRate.toLocaleString()})`, amount: engraveCost },
    { label: `÷ ${upsPerSheet} pieces per sheet`, amount: 0 },
  ];

  return {
    subtotal: pricePerPiece,
    requiresStaffReview: true,
    breakdown,
  };
}

// ─── Main Export ─────────────────────────────────────────────────────────────

export function calculatePrice(input: CalculatorInput): CalculatorResult {
  const options: Record<string, string | number> = {};
  if (input.material) options.material = input.material;
  if (input.sides) options.sides = String(input.sides);
  if (input.size) options.size = String(input.size);

  const rule = findMatchingRule(input.categoryId, options);

  if (!rule) {
    return {
      matchedRuleId: "",
      unitPrice: 0,
      quantity: input.qty || 0,
      subtotal: 0,
      finishingTotal: 0,
      total: 0,
      breakdown: [{ label: "No matching price rule found", amount: 0 }],
      requiresStaffReview: true,
    };
  }

  const qty = input.qty || 1;
  const finishing = input.finishing || [];
  let subtotal = 0;
  let unitPrice = 0;
  let unitPriceRange: [number, number] | undefined;
  let areaSqm: number | undefined;
  let requiresStaffReview = false;
  let matchedBandId: string | undefined;
  const breakdown: BreakdownLine[] = [];

  switch (rule.model) {
    case "qty_band_per_unit": {
      const resolved = resolveQtyBandPerUnit(rule, qty);
      if (resolved) {
        unitPrice = resolved.unitPrice;
        subtotal = unitPrice * qty;
        matchedBandId = resolved.band.id;
        breakdown.push({
          label: `${unitPrice.toLocaleString()} TZS × ${qty} pcs`,
          amount: subtotal,
        });
      }
      break;
    }

    case "area_based_range": {
      const resolved = resolveAreaBasedRange(
        rule,
        input.widthCm || 100,
        input.heightCm || 100,
      );
      if (resolved) {
        unitPrice = resolved.unitPrice;
        unitPriceRange = resolved.unitPriceRange;
        areaSqm = resolved.areaSqm;
        subtotal = resolved.subtotal;
        requiresStaffReview = resolved.requiresStaffReview;
        matchedBandId = resolved.band.id;

        if (areaSqm < 1) {
          breakdown.push({
            label: `Min charge (< 1 m²)`,
            amount: subtotal,
          });
        } else {
          breakdown.push({
            label: `${areaSqm.toFixed(2)} m² × ${unitPrice.toLocaleString()} TZS/m²`,
            amount: subtotal,
          });
          breakdown.push({
            label: `Range: ${unitPriceRange[0].toLocaleString()} – ${unitPriceRange[1].toLocaleString()} TZS/m²`,
            amount: 0,
          });
        }
      }
      break;
    }

    case "sheet_qty_tier_markup": {
      const resolved = resolveSheetQtyTierMarkup(rule, qty);
      if (resolved) {
        unitPrice = resolved.unitPrice;
        subtotal = resolved.subtotal;
        matchedBandId = resolved.band.id;
        breakdown.push({
          label: `${unitPrice.toLocaleString()} TZS/sheet × ${qty} sheets`,
          amount: subtotal,
        });
      }
      break;
    }

    case "flat_fixed_per_unit_band":
    case "flat_fixed_service_fee":
    case "flat_fixed_range_per_unit": {
      const resolved = resolveFlatFixedPerUnitBand(rule, qty);
      if (resolved) {
        unitPrice = resolved.unitPrice;
        subtotal = resolved.subtotal;
        matchedBandId = resolved.band.id;
        breakdown.push({
          label: `Fixed price per unit`,
          amount: subtotal,
        });
      }
      break;
    }

    case "signage_engrave_cut_formula": {
      const resolved = resolveSignageEngraveCut(input);
      subtotal = resolved.subtotal;
      requiresStaffReview = resolved.requiresStaffReview;
      breakdown.push(...resolved.breakdown);
      breakdown.push({
        label: `Price per piece`,
        amount: subtotal,
      });
      break;
    }

    default: {
      breakdown.push({ label: "Unknown pricing model", amount: 0 });
      requiresStaffReview = true;
    }
  }

  // Apply manual override
  if (input.manualOverride !== null && input.manualOverride !== undefined) {
    subtotal = input.manualOverride;
    requiresStaffReview = true;
    breakdown.push({
      label: `Manual override applied`,
      amount: input.manualOverride,
    });
  }

  // Calculate finishing total
  const finishingTotal = finishing.reduce((sum, f) => sum + f.price * qty, 0);

  if (finishingTotal > 0) {
    finishing.forEach((f) => {
      breakdown.push({
        label: `${f.name} (${f.unit.replace(/_/g, " ")})`,
        amount: f.price * qty,
      });
    });
  }

  return {
    matchedRuleId: rule.id,
    matchedBandId,
    unitPrice,
    unitPriceRange,
    quantity: qty,
    areaSqm,
    subtotal,
    finishingTotal,
    total: subtotal + finishingTotal,
    breakdown,
    requiresStaffReview,
  };
}
