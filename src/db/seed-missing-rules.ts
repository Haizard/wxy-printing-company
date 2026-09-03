import { db } from "./index.js";
import { eq } from "drizzle-orm";
import {
  products,
  priceRules,
  priceBands,
} from "./schema.js";

async function seedMissingRules() {
  console.log("🔍 Checking for products missing price rules...");

  // Get all products
  const allProducts = await db.select().from(products);
  const prodMap: Record<string, string> = {};
  allProducts.forEach((p) => (prodMap[p.slug] = p.id));

  // Check which products have rules
  const productsWithRules = new Set<string>();
  const allRules = await db.select().from(priceRules);
  allRules.forEach((r) => {
    const prod = allProducts.find((p) => p.id === r.productId);
    if (prod) productsWithRules.add(prod.slug);
  });

  const missing = allProducts.filter((p) => !productsWithRules.has(p.slug));
  if (missing.length === 0) {
    console.log("✅ All products have price rules!");
    process.exit(0);
  }

  console.log(`📋 Missing rules for: ${missing.map((p) => p.slug).join(", ")}`);

  // Helper to create price rule + bands
  async function addPricing(
    productSlug: string,
    model: string,
    filter: Record<string, any>,
    bands: { qtyMin?: number; qtyMax?: number; unitPriceMin: number; unitPriceMax?: number; sideCount?: number }[],
    opts: { minCharge?: number; markupPercent?: number } = {},
  ) {
    if (!prodMap[productSlug]) {
      console.log(`⚠️  Product ${productSlug} not found, skipping`);
      return;
    }
    const [rule] = await db
      .insert(priceRules)
      .values({
        productId: prodMap[productSlug],
        pricingModel: model,
        optionFilter: filter,
        minCharge: opts.minCharge,
        markupPercent: opts.markupPercent?.toString(),
        currency: "TZS",
        isInternalCost: false,
      })
      .returning();

    if (bands.length > 0) {
      await db.insert(priceBands).values(
        bands.map((b, i) => ({
          priceRuleId: rule.id,
          qtyMin: b.qtyMin ?? null,
          qtyMax: b.qtyMax ?? null,
          unitPriceMin: b.unitPriceMin,
          unitPriceMax: b.unitPriceMax ?? null,
          sideCount: b.sideCount ?? null,
          sortOrder: i + 1,
        })),
      );
    }
    console.log(`  ✅ ${productSlug} (${model})`);
  }

  // ── Books & Booklets (imposition_sheet_based) ─────────────────────────
  await addPricing("books-booklets", "imposition_sheet_based", { size: "a4" }, [
    { qtyMin: 10, qtyMax: 50, unitPriceMin: 3500 },
    { qtyMin: 51, qtyMax: 200, unitPriceMin: 2500 },
    { qtyMin: 201, qtyMax: 500, unitPriceMin: 1800 },
    { qtyMin: 501, unitPriceMin: 1200 },
  ]);
  await addPricing("books-booklets", "imposition_sheet_based", { size: "a5" }, [
    { qtyMin: 10, qtyMax: 50, unitPriceMin: 2500 },
    { qtyMin: 51, qtyMax: 200, unitPriceMin: 1800 },
    { qtyMin: 201, qtyMax: 500, unitPriceMin: 1300 },
    { qtyMin: 501, unitPriceMin: 900 },
  ]);

  // ── Xerox Printing (coverage_qty_band) ────────────────────────────────
  await addPricing("xerox-printing", "coverage_qty_band", { coverage: "0-20", sides: "1" }, [
    { qtyMin: 1, qtyMax: 100, unitPriceMin: 200 },
    { qtyMin: 101, qtyMax: 500, unitPriceMin: 150 },
    { qtyMin: 501, qtyMax: 1000, unitPriceMin: 100 },
    { qtyMin: 1001, unitPriceMin: 75 },
  ]);
  await addPricing("xerox-printing", "coverage_qty_band", { coverage: "0-20", sides: "2" }, [
    { qtyMin: 1, qtyMax: 100, unitPriceMin: 350 },
    { qtyMin: 101, qtyMax: 500, unitPriceMin: 250 },
    { qtyMin: 501, qtyMax: 1000, unitPriceMin: 180 },
    { qtyMin: 1001, unitPriceMin: 130 },
  ]);
  await addPricing("xerox-printing", "coverage_qty_band", { coverage: "20-50", sides: "1" }, [
    { qtyMin: 1, qtyMax: 100, unitPriceMin: 350 },
    { qtyMin: 101, qtyMax: 500, unitPriceMin: 250 },
    { qtyMin: 501, qtyMax: 1000, unitPriceMin: 180 },
    { qtyMin: 1001, unitPriceMin: 130 },
  ]);
  await addPricing("xerox-printing", "coverage_qty_band", { coverage: "20-50", sides: "2" }, [
    { qtyMin: 1, qtyMax: 100, unitPriceMin: 550 },
    { qtyMin: 101, qtyMax: 500, unitPriceMin: 400 },
    { qtyMin: 501, qtyMax: 1000, unitPriceMin: 280 },
    { qtyMin: 1001, unitPriceMin: 200 },
  ]);
  await addPricing("xerox-printing", "coverage_qty_band", { coverage: "50-100", sides: "1" }, [
    { qtyMin: 1, qtyMax: 100, unitPriceMin: 500 },
    { qtyMin: 101, qtyMax: 500, unitPriceMin: 350 },
    { qtyMin: 501, qtyMax: 1000, unitPriceMin: 250 },
    { qtyMin: 1001, unitPriceMin: 180 },
  ]);
  await addPricing("xerox-printing", "coverage_qty_band", { coverage: "50-100", sides: "2" }, [
    { qtyMin: 1, qtyMax: 100, unitPriceMin: 800 },
    { qtyMin: 101, qtyMax: 500, unitPriceMin: 550 },
    { qtyMin: 501, qtyMax: 1000, unitPriceMin: 400 },
    { qtyMin: 1001, unitPriceMin: 280 },
  ]);

  // ── ABS Sheets ────────────────────────────────────────────────────────
  await addPricing("abs-sheets", "sheet_qty_tier_markup", { material: "abs_1mm" }, [
    { qtyMin: 1, qtyMax: 10, unitPriceMin: 18000 },
    { qtyMin: 11, qtyMax: 25, unitPriceMin: 14000 },
    { qtyMin: 26, qtyMax: 50, unitPriceMin: 11000 },
    { qtyMin: 51, qtyMax: 100, unitPriceMin: 8500 },
  ], { markupPercent: 80 });

  // ── Wheel Covers ──────────────────────────────────────────────────────
  await addPricing("wheel-covers", "qty_band_per_unit", { type: "plain_branding" }, [
    { qtyMin: 4, qtyMax: 20, unitPriceMin: 25000 },
    { qtyMin: 21, qtyMax: 50, unitPriceMin: 18000 },
    { qtyMin: 51, qtyMax: 100, unitPriceMin: 14000 },
    { qtyMin: 101, unitPriceMin: 11000 },
  ]);

  // ── Vehicle & Office Branding ─────────────────────────────────────────
  await addPricing("vehicle-branding", "percentage_markup_on_material", {}, [
    { qtyMin: 1, unitPriceMin: 200000 },
  ], { markupPercent: 20 });

  console.log("🎉 Missing rules seeded!");
  process.exit(0);
}

seedMissingRules().catch((error) => {
  console.error("❌ Seed failed:", error);
  process.exit(1);
});
