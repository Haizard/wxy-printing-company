import { db } from "./index.js";
import {
  categories,
  products,
  priceRules,
  priceBands,
  finishingOptions,
  productFinishingOptions,
  users,
} from "./schema.js";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("🌱 Seeding database...");

  // ── Create admin user ───────────────────────────────────────────────────
  const [admin] = await db
    .insert(users)
    .values({
      fullName: "Admin User",
      email: "admin@printhub.co.tz",
      role: "admin",
      isActive: true,
    })
    .returning();
  console.log("✅ Created admin user");

  // ── Categories ──────────────────────────────────────────────────────────
  const categoryData = [
    { name: "Digital Printing", slug: "digital-printing", icon: "🖨️", sortOrder: 1 },
    { name: "Offset Printing", slug: "offset-printing", icon: "📰", sortOrder: 2 },
    { name: "Large Format", slug: "large-format", icon: "🏁", sortOrder: 3 },
    { name: "Flat-Bed Rigid Media", slug: "flat-bed-rigid", icon: "🪟", sortOrder: 4 },
    { name: "Signage", slug: "signage", icon: "✂️", sortOrder: 5 },
    { name: "Photo & Canvas", slug: "photo-canvas", icon: "🖼️", sortOrder: 6 },
    { name: "Cards & Small Format", slug: "cards-small-format", icon: "💳", sortOrder: 7 },
    { name: "Books & Stationery", slug: "books-stationery", icon: "📚", sortOrder: 8 },
    { name: "Promotional Merchandise", slug: "promotional-merch", icon: "🎁", sortOrder: 9 },
    { name: "Apparel & Digitization", slug: "apparel-digitization", icon: "👕", sortOrder: 10 },
    { name: "Design Services", slug: "design-services", icon: "🎨", sortOrder: 11 },
    { name: "Calendars", slug: "calendars", icon: "📅", sortOrder: 12 },
  ];

  const insertedCategories = await db
    .insert(categories)
    .values(categoryData)
    .returning();
  console.log("✅ Created categories");

  // ── Products ────────────────────────────────────────────────────────────
  const productData = [
    // Large Format
    {
      categoryId: insertedCategories[2].id, // Large Format
      name: "Banners & Vinyl",
      slug: "banners-vinyl",
      description: "Large format solvent/eco-solvent printing",
      pricingModel: "area_based_range",
      baseUnit: "sqm",
      minOrderQty: 1,
    },
    // Digital Printing
    {
      categoryId: insertedCategories[0].id, // Digital Printing
      name: "HP Indigo Paper Printing",
      slug: "hp-indigo-paper",
      description: "Digital paper & sticker printing by GSM band",
      pricingModel: "qty_band_per_unit",
      baseUnit: "piece",
      minOrderQty: 1,
    },
    {
      categoryId: insertedCategories[0].id,
      name: "A3 Posters",
      slug: "a3-posters",
      description: "HP Indigo A3 posters",
      pricingModel: "qty_band_per_unit",
      baseUnit: "piece",
      minOrderQty: 1,
    },
    // Cards
    {
      categoryId: insertedCategories[6].id, // Cards
      name: "Business Cards",
      slug: "business-cards",
      description: "Single/double sided with lamination options",
      pricingModel: "flat_fixed_per_unit_band",
      baseUnit: "set",
      minOrderQty: 1,
    },
    // Offset
    {
      categoryId: insertedCategories[1].id, // Offset
      name: "Offset A3 Posters",
      slug: "offset-a3-posters",
      description: "Offset printed A3 posters",
      pricingModel: "qty_band_per_unit",
      baseUnit: "piece",
      minOrderQty: 1,
    },
    // Acrylic Signs
    {
      categoryId: insertedCategories[4].id, // Signage
      name: "Acrylic Signs",
      slug: "acrylic-signs",
      description: "Flat-bed rigid media cutting & printing",
      pricingModel: "sheet_qty_tier_markup",
      baseUnit: "sheet",
      minOrderQty: 1,
    },
    // Roll-up
    {
      categoryId: insertedCategories[2].id, // Large Format
      name: "Roll-up Banners",
      slug: "rollup-banners",
      description: "Roll-up stand banners (narrow/broad base)",
      pricingModel: "flat_fixed_range_per_unit",
      baseUnit: "piece",
      minOrderQty: 1,
    },
    // Custom Signage
    {
      categoryId: insertedCategories[4].id,
      name: "Custom Engraved Signage",
      slug: "custom-engraved-signage",
      description: "Engraved/cut signage (staff review required)",
      pricingModel: "signage_engrave_cut_formula",
      baseUnit: "piece",
      minOrderQty: 1,
    },
  ];

  const insertedProducts = await db
    .insert(products)
    .values(productData)
    .returning();
  console.log("✅ Created products");

  // ── Price Rules & Bands ─────────────────────────────────────────────────

  // Area-based: Banners & Vinyl
  const [bannerRule] = await db
    .insert(priceRules)
    .values({
      productId: insertedProducts[0].id,
      pricingModel: "area_based_range",
      optionFilter: { material: "general" },
      minCharge: 25000,
      currency: "TZS",
      isInternalCost: false,
      createdBy: admin.id,
    })
    .returning();

  await db.insert(priceBands).values([
    { priceRuleId: bannerRule.id, unitPriceMin: 18000, unitPriceMax: 22000, sortOrder: 1 },
    { priceRuleId: bannerRule.id, unitPriceMin: 15000, unitPriceMax: 19000, sortOrder: 2 },
  ]);

  // Qty band: HP Indigo Paper
  const [paperRule] = await db
    .insert(priceRules)
    .values({
      productId: insertedProducts[1].id,
      pricingModel: "qty_band_per_unit",
      optionFilter: { gsm: "80-150" },
      currency: "TZS",
      isInternalCost: false,
      createdBy: admin.id,
    })
    .returning();

  await db.insert(priceBands).values([
    { priceRuleId: paperRule.id, qtyMin: 1, qtyMax: 100, unitPriceMin: 800, sortOrder: 1 },
    { priceRuleId: paperRule.id, qtyMin: 101, qtyMax: 500, unitPriceMin: 600, sortOrder: 2 },
    { priceRuleId: paperRule.id, qtyMin: 501, qtyMax: 1000, unitPriceMin: 450, sortOrder: 3 },
    { priceRuleId: paperRule.id, qtyMin: 1001, qtyMax: null, unitPriceMin: 350, sortOrder: 4 },
  ]);

  // Qty band: A3 Posters
  const [posterRule] = await db
    .insert(priceRules)
    .values({
      productId: insertedProducts[2].id,
      pricingModel: "qty_band_per_unit",
      optionFilter: { size: "a3" },
      currency: "TZS",
      isInternalCost: false,
      createdBy: admin.id,
    })
    .returning();

  await db.insert(priceBands).values([
    { priceRuleId: posterRule.id, qtyMin: 1, qtyMax: 100, unitPriceMin: 1500, sortOrder: 1 },
    { priceRuleId: posterRule.id, qtyMin: 101, qtyMax: 500, unitPriceMin: 1000, sortOrder: 2 },
    { priceRuleId: posterRule.id, qtyMin: 501, qtyMax: 1000, unitPriceMin: 700, sortOrder: 3 },
    { priceRuleId: posterRule.id, qtyMin: 1001, qtyMax: null, unitPriceMin: 500, sortOrder: 4 },
  ]);

  // Flat fixed: Business Cards
  const [bcSingleRule] = await db
    .insert(priceRules)
    .values({
      productId: insertedProducts[3].id,
      pricingModel: "flat_fixed_per_unit_band",
      optionFilter: { sides: "1" },
      currency: "TZS",
      isInternalCost: false,
      createdBy: admin.id,
    })
    .returning();

  await db.insert(priceBands).values([
    { priceRuleId: bcSingleRule.id, qtyMin: 100, qtyMax: 100, unitPriceMin: 15000, sortOrder: 1 },
    { priceRuleId: bcSingleRule.id, qtyMin: 200, qtyMax: 200, unitPriceMin: 25000, sortOrder: 2 },
    { priceRuleId: bcSingleRule.id, qtyMin: 500, qtyMax: 500, unitPriceMin: 50000, sortOrder: 3 },
  ]);

  const [bcDoubleRule] = await db
    .insert(priceRules)
    .values({
      productId: insertedProducts[3].id,
      pricingModel: "flat_fixed_per_unit_band",
      optionFilter: { sides: "2" },
      currency: "TZS",
      isInternalCost: false,
      createdBy: admin.id,
    })
    .returning();

  await db.insert(priceBands).values([
    { priceRuleId: bcDoubleRule.id, qtyMin: 100, qtyMax: 100, unitPriceMin: 20000, sortOrder: 1 },
    { priceRuleId: bcDoubleRule.id, qtyMin: 200, qtyMax: 200, unitPriceMin: 35000, sortOrder: 2 },
    { priceRuleId: bcDoubleRule.id, qtyMin: 500, qtyMax: 500, unitPriceMin: 70000, sortOrder: 3 },
  ]);

  // Sheet qty tier: Acrylic Signs
  const [acrylicRule] = await db
    .insert(priceRules)
    .values({
      productId: insertedProducts[5].id,
      pricingModel: "sheet_qty_tier_markup",
      optionFilter: { material: "acrylic_6mm" },
      markupPercent: "100",
      currency: "TZS",
      isInternalCost: false,
      createdBy: admin.id,
    })
    .returning();

  await db.insert(priceBands).values([
    { priceRuleId: acrylicRule.id, qtyMin: 1, qtyMax: 10, unitPriceMin: 40000, sortOrder: 1 },
    { priceRuleId: acrylicRule.id, qtyMin: 11, qtyMax: 25, unitPriceMin: 30000, sortOrder: 2 },
    { priceRuleId: acrylicRule.id, qtyMin: 26, qtyMax: 50, unitPriceMin: 25000, sortOrder: 3 },
    { priceRuleId: acrylicRule.id, qtyMin: 51, qtyMax: 100, unitPriceMin: 20000, sortOrder: 4 },
  ]);

  // Flat fixed range: Roll-up Banners
  const [rollupRule] = await db
    .insert(priceRules)
    .values({
      productId: insertedProducts[6].id,
      pricingModel: "flat_fixed_range_per_unit",
      optionFilter: { variant: "broad_base" },
      currency: "TZS",
      isInternalCost: false,
      createdBy: admin.id,
    })
    .returning();

  await db.insert(priceBands).values([
    { priceRuleId: rollupRule.id, qtyMin: 1, qtyMax: null, unitPriceMin: 250000, sortOrder: 1 },
  ]);

  // Signage engrave cut
  await db.insert(priceRules).values({
    productId: insertedProducts[7].id,
    pricingModel: "signage_engrave_cut_formula",
    optionFilter: {},
    currency: "TZS",
    isInternalCost: false,
    createdBy: admin.id,
  });

  console.log("✅ Created price rules & bands");

  // ── Finishing Options ───────────────────────────────────────────────────

  const finishingData = [
    { name: "Creasing", unit: "per_piece", price: 200 },
    { name: "Saddle Stitch", unit: "per_piece", price: 500 },
    { name: "Perfect Binding", unit: "per_piece", price: 2000 },
    { name: "Hardcover Binding", unit: "per_piece", price: 5000 },
    { name: "Lamination", unit: "per_a3_side", price: 300 },
    { name: "Folding", unit: "per_piece", price: 100 },
  ];

  const insertedFinishing = await db
    .insert(finishingOptions)
    .values(finishingData)
    .returning();
  console.log("✅ Created finishing options");

  // ── Done ────────────────────────────────────────────────────────────────
  console.log("🎉 Seed complete!");
  process.exit(0);
}

seed().catch((error) => {
  console.error("❌ Seed failed:", error);
  process.exit(1);
});
