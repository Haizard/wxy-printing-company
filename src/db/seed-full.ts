import { db } from "./index.js";
import { eq } from "drizzle-orm";
import {
  categories,
  products,
  priceRules,
  priceBands,
  finishingOptions,
  productFinishingOptions,
  users,
} from "./schema.js";

async function seedFull() {
  console.log("🌱 Seeding full catalog...");

  // ── Admin user ──────────────────────────────────────────────────────────
  const existingAdmin = await db.select().from(users).where(eq(users.email, 'admin@printhub.co.tz'));
  const admin = existingAdmin[0] || (await db
    .insert(users)
    .values({
      fullName: "PrintHub Admin",
      email: "admin@printhub.co.tz",
      role: "admin",
      isActive: true,
    })
    .returning())[0];
  console.log("✅ Admin user ready");

  // ── Categories ──────────────────────────────────────────────────────────
  const catData = [
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

  const insertedCats = await db.insert(categories).values(catData).returning();
  const catMap: Record<string, string> = {};
  insertedCats.forEach((c) => (catMap[c.slug] = c.id));
  console.log("✅ Categories created:", insertedCats.length);

  // ── Products ────────────────────────────────────────────────────────────
  const allProducts = [
    // ── 1. Digital Printing (HP Indigo) ──────────────────────────────────
    { categoryId: catMap["digital-printing"], name: "HP Indigo Paper Printing", slug: "hp-indigo-paper", description: "Digital paper/sticker printing by GSM band", pricingModel: "qty_band_per_unit", baseUnit: "piece" },
    { categoryId: catMap["digital-printing"], name: "HP Indigo A3 Posters", slug: "hp-indigo-a3-posters", description: "A3 posters 135/150gsm", pricingModel: "qty_band_per_unit", baseUnit: "piece" },
    { categoryId: catMap["digital-printing"], name: "Books & Booklets", slug: "books-booklets", description: "A4/A5/DL booklets, imposed on A3 sheets", pricingModel: "imposition_sheet_based", baseUnit: "piece" },
    { categoryId: catMap["digital-printing"], name: "Business Cards (Digital)", slug: "business-cards-digital", description: "Single/double sided, w/wo lamination", pricingModel: "flat_fixed_per_unit_band", baseUnit: "set" },

    // ── 2. Digital Printing (Xerox) ──────────────────────────────────────
    { categoryId: catMap["digital-printing"], name: "Xerox Printing", slug: "xerox-printing", description: "Coverage-based toner printing", pricingModel: "coverage_qty_band", baseUnit: "sheet" },

    // ── 3. Offset Printing ───────────────────────────────────────────────
    { categoryId: catMap["offset-printing"], name: "Offset A3 Posters", slug: "offset-a3-posters", description: "135/150gsm A3 offset posters", pricingModel: "qty_band_per_unit", baseUnit: "piece" },
    { categoryId: catMap["offset-printing"], name: "Offset A2 Posters", slug: "offset-a2-posters", description: "150gsm A2 offset posters", pricingModel: "qty_band_per_unit", baseUnit: "piece" },
    { categoryId: catMap["offset-printing"], name: "Offset A1 Posters", slug: "offset-a1-posters", description: "170gsm A1 offset posters", pricingModel: "qty_band_per_unit", baseUnit: "piece" },
    { categoryId: catMap["offset-printing"], name: "Offset Brochures", slug: "offset-brochures", description: "A4/A5/DL brochures, 135gsm", pricingModel: "qty_band_per_unit", baseUnit: "piece" },

    // ── 4. Large Format ──────────────────────────────────────────────────
    { categoryId: catMap["large-format"], name: "Banners & Vinyl", slug: "banners-vinyl", description: "Solvent/eco-solvent large format printing", pricingModel: "area_based_range", baseUnit: "sqm" },
    { categoryId: catMap["large-format"], name: "Roll-up Banners", slug: "rollup-banners", description: "Roll-up stands (narrow/broad base)", pricingModel: "flat_fixed_range_per_unit", baseUnit: "piece" },
    { categoryId: catMap["large-format"], name: "X-Stand Banners", slug: "xstand-banners", description: "X-stand display banners", pricingModel: "flat_fixed_range_per_unit", baseUnit: "piece" },
    { categoryId: catMap["large-format"], name: "Tear-drop Banners", slug: "teardrop-banners", description: "Tear-drop banners 3/4.5/5m", pricingModel: "flat_fixed_range_per_unit", baseUnit: "piece" },
    { categoryId: catMap["large-format"], name: "Telescopic Banners", slug: "telescopic-banners", description: "Telescopic banners 3/4m", pricingModel: "flat_fixed_range_per_unit", baseUnit: "piece" },

    // ── 5. Flat-Bed Rigid Media ──────────────────────────────────────────
    { categoryId: catMap["flat-bed-rigid"], name: "Acrylic Sheets", slug: "acrylic-sheets", description: "Acrylic 3-12mm, flat-bed printing", pricingModel: "sheet_qty_tier_markup", baseUnit: "sheet" },
    { categoryId: catMap["flat-bed-rigid"], name: "Forex Sheets", slug: "forex-sheets", description: "Forex 2-5mm sheets", pricingModel: "sheet_qty_tier_markup", baseUnit: "sheet" },
    { categoryId: catMap["flat-bed-rigid"], name: "Corex Sheets", slug: "corex-sheets", description: "Corex 3-5mm sheets", pricingModel: "sheet_qty_tier_markup", baseUnit: "sheet" },
    { categoryId: catMap["flat-bed-rigid"], name: "ABS Sheets", slug: "abs-sheets", description: "ABS 0.8-2mm sheets", pricingModel: "sheet_qty_tier_markup", baseUnit: "sheet" },

    // ── 6. Signage ───────────────────────────────────────────────────────
    { categoryId: catMap["signage"], name: "Door Signs", slug: "door-signs", description: "Engraved acrylic door signs", pricingModel: "flat_fixed_per_unit_band", baseUnit: "piece" },
    { categoryId: catMap["signage"], name: "Indoor 2D Signs", slug: "indoor-2d-signs", description: "Indoor 2D signs with/without LED", pricingModel: "flat_fixed_per_unit_band", baseUnit: "piece" },
    { categoryId: catMap["signage"], name: "Light Box Signs", slug: "lightbox-signs", description: "Illuminated light box signs", pricingModel: "flat_fixed_service_fee", baseUnit: "piece" },
    { categoryId: catMap["signage"], name: "Custom Engraved Signage", slug: "custom-engraved-signage", description: "Custom engraving & cutting (staff review)", pricingModel: "signage_engrave_cut_formula", baseUnit: "piece" },

    // ── 7. Photo & Canvas ────────────────────────────────────────────────
    { categoryId: catMap["photo-canvas"], name: "Canvas + Frame", slug: "canvas-frame", description: "Canvas prints with frame, 7 sizes", pricingModel: "flat_fixed_per_unit_band", baseUnit: "piece" },
    { categoryId: catMap["photo-canvas"], name: "Photo Printing", slug: "photo-printing", description: "Gloss/Matt/Canvas photo prints", pricingModel: "area_based_range", baseUnit: "sqft" },
    { categoryId: catMap["photo-canvas"], name: "Picha Mbao (Photo on Wood)", slug: "picha-mbao", description: "Photo prints on wood, A5-A1", pricingModel: "flat_fixed_per_unit_band", baseUnit: "piece" },
    { categoryId: catMap["photo-canvas"], name: "Photo Book", slug: "photo-book", description: "40x30cm hardcover, 24 pages", pricingModel: "flat_fixed_service_fee", baseUnit: "piece" },
    { categoryId: catMap["photo-canvas"], name: "Customised Clocks", slug: "customised-clocks", description: "Custom clocks A3/A2", pricingModel: "flat_fixed_per_unit_band", baseUnit: "piece" },

    // ── 8. Cards & Small Format ──────────────────────────────────────────
    { categoryId: catMap["cards-small-format"], name: "Flyers", slug: "flyers", description: "A5/A6 flyers single/double side", pricingModel: "flat_fixed_per_unit_band", baseUnit: "piece" },
    { categoryId: catMap["cards-small-format"], name: "Business Cards", slug: "business-cards", description: "Business cards 100pc, w/wo lamination", pricingModel: "flat_fixed_per_unit_band", baseUnit: "set" },
    { categoryId: catMap["cards-small-format"], name: "PVC ID Cards", slug: "pvc-id-cards", description: "PVC ID cards with lanyard options", pricingModel: "flat_fixed_per_unit_band", baseUnit: "piece" },
    { categoryId: catMap["cards-small-format"], name: "Name Tags", slug: "name-tags", description: "Epoxy/Engraving finish, Magnetic/Pin", pricingModel: "flat_fixed_per_unit_band", baseUnit: "piece" },
    { categoryId: catMap["cards-small-format"], name: "Brochures (Small Format)", slug: "brochures-small", description: "A4 double-sided brochures", pricingModel: "qty_band_per_unit", baseUnit: "piece" },

    // ── 9. Books & Stationery ────────────────────────────────────────────
    { categoryId: catMap["books-stationery"], name: "Company Profiles", slug: "company-profiles", description: "Per page + flat design cost", pricingModel: "per_page_plus_design_fee", baseUnit: "page" },
    { categoryId: catMap["books-stationery"], name: "Product Catalogues", slug: "product-catalogues", description: "UV/engraving option available", pricingModel: "flat_fixed_per_unit_band", baseUnit: "piece" },
    { categoryId: catMap["books-stationery"], name: "Diary Printing", slug: "diary-printing", description: "UV/engraving diary printing", pricingModel: "flat_fixed_per_unit_band", baseUnit: "piece" },
    { categoryId: catMap["books-stationery"], name: "Notebook Printing", slug: "notebook-printing", description: "Customised/ready-made notebooks", pricingModel: "flat_fixed_per_unit_band", baseUnit: "piece" },

    // ── 10. Promotional Merchandise ──────────────────────────────────────
    { categoryId: catMap["promotional-merch"], name: "Bottle Printing", slug: "bottle-printing", description: "Small/large bottle printing", pricingModel: "flat_fixed_per_unit_band", baseUnit: "piece" },
    { categoryId: catMap["promotional-merch"], name: "Pen Printing", slug: "pen-printing", description: "Custom pen printing", pricingModel: "flat_fixed_per_unit_band", baseUnit: "piece" },
    { categoryId: catMap["promotional-merch"], name: "Cap & Hat Printing", slug: "cap-hat-printing", description: "Embroidery/DTF cap printing", pricingModel: "flat_fixed_per_unit_band", baseUnit: "piece" },
    { categoryId: catMap["promotional-merch"], name: "Umbrella Printing", slug: "umbrella-printing", description: "Small/large umbrella, 3 sides", pricingModel: "flat_fixed_per_unit_band", baseUnit: "piece" },
    { categoryId: catMap["promotional-merch"], name: "Metal Keychains", slug: "metal-keychains", description: "Round/rectangle keychains", pricingModel: "qty_band_per_unit", baseUnit: "piece" },
    { categoryId: catMap["promotional-merch"], name: "Non-woven Bags", slug: "nonwoven-bags", description: "D-cut bags A5-A2, per 100 pcs", pricingModel: "qty_band_per_unit", baseUnit: "100pcs" },
    { categoryId: catMap["promotional-merch"], name: "Mugs", slug: "mugs", description: "Magic/white/colour handle mugs", pricingModel: "qty_band_per_unit", baseUnit: "piece" },
    { categoryId: catMap["promotional-merch"], name: "Wheel Covers", slug: "wheel-covers", description: "Plain branding & promo wheel covers", pricingModel: "qty_band_per_unit", baseUnit: "piece" },

    // ── 11. Apparel & Digitization ───────────────────────────────────────
    { categoryId: catMap["apparel-digitization"], name: "Embroidery Digitization", slug: "embroidery-digitization", description: "By stitch count band", pricingModel: "qty_band_per_unit", baseUnit: "stitch" },
    { categoryId: catMap["apparel-digitization"], name: "Heat-transfer Numbering", slug: "heat-transfer-numbering", description: "By size cm² and quantity", pricingModel: "area_qty_band", baseUnit: "cm2" },

    // ── 12. Design Services ──────────────────────────────────────────────
    { categoryId: catMap["design-services"], name: "Logo Design Packages", slug: "logo-design", description: "Basic/Standard/Premium/Exclusive", pricingModel: "package_tier_flat_fee", baseUnit: "package" },
    { categoryId: catMap["design-services"], name: "Simple Design Services", slug: "simple-design", description: "Flyer/brochure/poster/card design", pricingModel: "flat_fixed_service_fee", baseUnit: "piece" },
    { categoryId: catMap["design-services"], name: "Book & Magazine Layout", slug: "book-layout", description: "Per-page layout design", pricingModel: "per_page_band", baseUnit: "page" },
    { categoryId: catMap["design-services"], name: "Signage Mockups", slug: "signage-mockups", description: "Signage design mockups", pricingModel: "flat_fixed_service_fee", baseUnit: "piece" },
    { categoryId: catMap["design-services"], name: "Vehicle & Office Branding", slug: "vehicle-branding", description: "Vehicle & office branding design", pricingModel: "percentage_markup_on_material", baseUnit: "project" },

    // ── 13. Calendars ────────────────────────────────────────────────────
    { categoryId: catMap["calendars"], name: "Desk/Table Calendars", slug: "desk-calendars", description: "Digital, double-sided A3/A5/DL", pricingModel: "qty_band_by_leaf_count", baseUnit: "piece" },
    { categoryId: catMap["calendars"], name: "Wall Calendars", slug: "wall-calendars", description: "Offset, A3/A2/A1, 7/13 leaves", pricingModel: "qty_band_by_leaf_count", baseUnit: "piece" },
  ];

  const insertedProducts = await db
    .insert(products)
    .values(allProducts.map(p => ({ ...p, minOrderQty: 1, isActive: true, isShopVisible: true })))
    .returning();
  const prodMap: Record<string, string> = {};
  insertedProducts.forEach((p) => (prodMap[p.slug] = p.id));
  console.log("✅ Products created:", insertedProducts.length);

  // ── Price Rules & Bands ─────────────────────────────────────────────────

  // Helper to create price rule + bands
  async function addPricing(
    productSlug: string,
    model: string,
    filter: Record<string, any>,
    bands: { qtyMin?: number; qtyMax?: number; unitPriceMin: number; unitPriceMax?: number; sideCount?: number }[],
    opts: { minCharge?: number; markupPercent?: number } = {},
  ) {
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
        createdBy: admin?.id,
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
    return rule;
  }

  // ── Digital Printing (HP Indigo) ──────────────────────────────────────
  await addPricing("hp-indigo-paper", "qty_band_per_unit", { gsm: "80-150" }, [
    { qtyMin: 1, qtyMax: 100, unitPriceMin: 800 },
    { qtyMin: 101, qtyMax: 500, unitPriceMin: 600 },
    { qtyMin: 501, qtyMax: 1000, unitPriceMin: 450 },
    { qtyMin: 1001, unitPriceMin: 350 },
  ]);
  await addPricing("hp-indigo-paper", "qty_band_per_unit", { gsm: "170-250" }, [
    { qtyMin: 1, qtyMax: 100, unitPriceMin: 1200 },
    { qtyMin: 101, qtyMax: 500, unitPriceMin: 900 },
    { qtyMin: 501, qtyMax: 1000, unitPriceMin: 700 },
    { qtyMin: 1001, unitPriceMin: 550 },
  ]);
  await addPricing("hp-indigo-paper", "qty_band_per_unit", { gsm: "300-350" }, [
    { qtyMin: 1, qtyMax: 100, unitPriceMin: 1800 },
    { qtyMin: 101, qtyMax: 500, unitPriceMin: 1400 },
    { qtyMin: 501, qtyMax: 1000, unitPriceMin: 1100 },
    { qtyMin: 1001, unitPriceMin: 850 },
  ]);
  await addPricing("hp-indigo-paper", "qty_band_per_unit", { gsm: "sticker" }, [
    { qtyMin: 1, qtyMax: 100, unitPriceMin: 1500 },
    { qtyMin: 101, qtyMax: 500, unitPriceMin: 1100 },
    { qtyMin: 501, qtyMax: 1000, unitPriceMin: 850 },
    { qtyMin: 1001, unitPriceMin: 650 },
  ]);

  await addPricing("hp-indigo-a3-posters", "qty_band_per_unit", { gsm: "135" }, [
    { qtyMin: 1, qtyMax: 100, unitPriceMin: 1500 },
    { qtyMin: 101, qtyMax: 500, unitPriceMin: 1000 },
    { qtyMin: 501, qtyMax: 1000, unitPriceMin: 700 },
    { qtyMin: 1001, unitPriceMin: 500 },
  ]);

  // Business Cards (Digital)
  await addPricing("business-cards-digital", "flat_fixed_per_unit_band", { sides: "1" }, [
    { qtyMin: 100, qtyMax: 100, unitPriceMin: 15000 },
    { qtyMin: 200, qtyMax: 200, unitPriceMin: 25000 },
    { qtyMin: 500, qtyMax: 500, unitPriceMin: 50000 },
    { qtyMin: 1000, qtyMax: 1000, unitPriceMin: 90000 },
  ]);
  await addPricing("business-cards-digital", "flat_fixed_per_unit_band", { sides: "2" }, [
    { qtyMin: 100, qtyMax: 100, unitPriceMin: 20000 },
    { qtyMin: 200, qtyMax: 200, unitPriceMin: 35000 },
    { qtyMin: 500, qtyMax: 500, unitPriceMin: 70000 },
    { qtyMin: 1000, qtyMax: 1000, unitPriceMin: 120000 },
  ]);

  // ── Offset Printing ────────────────────────────────────────────────────
  await addPricing("offset-a3-posters", "qty_band_per_unit", { gsm: "150" }, [
    { qtyMin: 100, qtyMax: 500, unitPriceMin: 700 },
    { qtyMin: 501, qtyMax: 1000, unitPriceMin: 500 },
    { qtyMin: 1001, unitPriceMin: 350 },
  ]);
  await addPricing("offset-a2-posters", "qty_band_per_unit", { gsm: "150" }, [
    { qtyMin: 100, qtyMax: 500, unitPriceMin: 1500 },
    { qtyMin: 501, qtyMax: 1000, unitPriceMin: 1100 },
    { qtyMin: 1001, unitPriceMin: 800 },
  ]);
  await addPricing("offset-a1-posters", "qty_band_per_unit", { gsm: "170" }, [
    { qtyMin: 50, qtyMax: 200, unitPriceMin: 3000 },
    { qtyMin: 201, qtyMax: 500, unitPriceMin: 2200 },
    { qtyMin: 501, unitPriceMin: 1600 },
  ]);
  await addPricing("offset-brochures", "qty_band_per_unit", { size: "a4" }, [
    { qtyMin: 100, qtyMax: 500, unitPriceMin: 600 },
    { qtyMin: 501, qtyMax: 1000, unitPriceMin: 400 },
    { qtyMin: 1001, unitPriceMin: 280 },
  ]);

  // ── Large Format ──────────────────────────────────────────────────────
  await addPricing("banners-vinyl", "area_based_range", { material: "black_back" }, [
    { unitPriceMin: 18000, unitPriceMax: 22000 },
  ], { minCharge: 25000 });
  await addPricing("banners-vinyl", "area_based_range", { material: "white_back" }, [
    { unitPriceMin: 15000, unitPriceMax: 19000 },
  ], { minCharge: 20000 });
  await addPricing("banners-vinyl", "area_based_range", { material: "double_sided" }, [
    { unitPriceMin: 25000, unitPriceMax: 30000 },
  ], { minCharge: 35000 });
  await addPricing("banners-vinyl", "area_based_range", { material: "reflective" }, [
    { unitPriceMin: 22000, unitPriceMax: 28000 },
  ], { minCharge: 30000 });
  await addPricing("banners-vinyl", "area_based_range", { material: "backlit_flex" }, [
    { unitPriceMin: 20000, unitPriceMax: 26000 },
  ], { minCharge: 28000 });
  await addPricing("banners-vinyl", "area_based_range", { material: "white_glossy_vinyl" }, [
    { unitPriceMin: 12000, unitPriceMax: 16000 },
  ], { minCharge: 15000 });
  await addPricing("banners-vinyl", "area_based_range", { material: "white_matte_vinyl" }, [
    { unitPriceMin: 12000, unitPriceMax: 16000 },
  ], { minCharge: 15000 });

  // Roll-up banners
  await addPricing("rollup-banners", "flat_fixed_range_per_unit", { variant: "narrow_base" }, [
    { qtyMin: 1, unitPriceMin: 180000 },
  ]);
  await addPricing("rollup-banners", "flat_fixed_range_per_unit", { variant: "broad_base" }, [
    { qtyMin: 1, unitPriceMin: 250000 },
  ]);
  await addPricing("xstand-banners", "flat_fixed_range_per_unit", { variant: "standard" }, [
    { qtyMin: 1, unitPriceMin: 150000 },
  ]);
  await addPricing("teardrop-banners", "flat_fixed_range_per_unit", { size: "3m" }, [
    { qtyMin: 1, unitPriceMin: 180000 },
  ]);
  await addPricing("teardrop-banners", "flat_fixed_range_per_unit", { size: "4.5m" }, [
    { qtyMin: 1, unitPriceMin: 220000 },
  ]);
  await addPricing("teardrop-banners", "flat_fixed_range_per_unit", { size: "5m" }, [
    { qtyMin: 1, unitPriceMin: 260000 },
  ]);
  await addPricing("telescopic-banners", "flat_fixed_range_per_unit", { size: "3m" }, [
    { qtyMin: 1, unitPriceMin: 200000 },
  ]);
  await addPricing("telescopic-banners", "flat_fixed_range_per_unit", { size: "4m" }, [
    { qtyMin: 1, unitPriceMin: 250000 },
  ]);

  // ── Flat-Bed Rigid Media ──────────────────────────────────────────────
  await addPricing("acrylic-sheets", "sheet_qty_tier_markup", { material: "acrylic_6mm" }, [
    { qtyMin: 1, qtyMax: 10, unitPriceMin: 40000 },
    { qtyMin: 11, qtyMax: 25, unitPriceMin: 30000 },
    { qtyMin: 26, qtyMax: 50, unitPriceMin: 25000 },
    { qtyMin: 51, qtyMax: 100, unitPriceMin: 20000 },
  ], { markupPercent: 100 });
  await addPricing("acrylic-sheets", "sheet_qty_tier_markup", { material: "acrylic_3mm" }, [
    { qtyMin: 1, qtyMax: 10, unitPriceMin: 25000 },
    { qtyMin: 11, qtyMax: 25, unitPriceMin: 20000 },
    { qtyMin: 26, qtyMax: 50, unitPriceMin: 16000 },
    { qtyMin: 51, qtyMax: 100, unitPriceMin: 12000 },
  ], { markupPercent: 100 });
  await addPricing("forex-sheets", "sheet_qty_tier_markup", { material: "forex_3mm" }, [
    { qtyMin: 1, qtyMax: 10, unitPriceMin: 20000 },
    { qtyMin: 11, qtyMax: 25, unitPriceMin: 15000 },
    { qtyMin: 26, qtyMax: 50, unitPriceMin: 12000 },
    { qtyMin: 51, qtyMax: 100, unitPriceMin: 9000 },
  ], { markupPercent: 80 });
  await addPricing("corex-sheets", "sheet_qty_tier_markup", { material: "corex_4mm" }, [
    { qtyMin: 1, qtyMax: 10, unitPriceMin: 15000 },
    { qtyMin: 11, qtyMax: 25, unitPriceMin: 11000 },
    { qtyMin: 26, qtyMax: 50, unitPriceMin: 8000 },
    { qtyMin: 51, qtyMax: 100, unitPriceMin: 6000 },
  ], { markupPercent: 80 });

  // ── Signage ────────────────────────────────────────────────────────────
  await addPricing("door-signs", "flat_fixed_per_unit_band", { material: "acrylic" }, [
    { qtyMin: 1, qtyMax: 5, unitPriceMin: 35000 },
    { qtyMin: 6, qtyMax: 20, unitPriceMin: 28000 },
    { qtyMin: 21, unitPriceMin: 22000 },
  ]);
  await addPricing("indoor-2d-signs", "flat_fixed_per_unit_band", { led: "no" }, [
    { qtyMin: 1, unitPriceMin: 45000 },
  ]);
  await addPricing("indoor-2d-signs", "flat_fixed_per_unit_band", { led: "yes" }, [
    { qtyMin: 1, unitPriceMin: 85000 },
  ]);
  await addPricing("lightbox-signs", "flat_fixed_service_fee", {}, [
    { qtyMin: 1, unitPriceMin: 150000 },
  ]);
  await addPricing("custom-engraved-signage", "signage_engrave_cut_formula", {}, []);

  // ── Photo & Canvas ────────────────────────────────────────────────────
  await addPricing("canvas-frame", "flat_fixed_per_unit_band", { size: "30x40" }, [
    { qtyMin: 1, unitPriceMin: 45000 },
  ]);
  await addPricing("canvas-frame", "flat_fixed_per_unit_band", { size: "40x60" }, [
    { qtyMin: 1, unitPriceMin: 65000 },
  ]);
  await addPricing("canvas-frame", "flat_fixed_per_unit_band", { size: "60x90" }, [
    { qtyMin: 1, unitPriceMin: 85000 },
  ]);
  await addPricing("canvas-frame", "flat_fixed_per_unit_band", { size: "90x120" }, [
    { qtyMin: 1, unitPriceMin: 120000 },
  ]);
  await addPricing("photo-printing", "area_based_range", { type: "gloss" }, [
    { unitPriceMin: 5000, unitPriceMax: 8000 },
  ], { minCharge: 8000 });
  await addPricing("picha-mbao", "flat_fixed_per_unit_band", { size: "a4" }, [
    { qtyMin: 1, unitPriceMin: 35000 },
  ]);
  await addPricing("picha-mbao", "flat_fixed_per_unit_band", { size: "a3" }, [
    { qtyMin: 1, unitPriceMin: 55000 },
  ]);
  await addPricing("photo-book", "flat_fixed_service_fee", {}, [
    { qtyMin: 1, unitPriceMin: 180000 },
  ]);
  await addPricing("customised-clocks", "flat_fixed_per_unit_band", { size: "a3" }, [
    { qtyMin: 1, unitPriceMin: 65000 },
  ]);

  // ── Cards & Small Format ──────────────────────────────────────────────
  await addPricing("flyers", "flat_fixed_per_unit_band", { size: "a5", sides: "1" }, [
    { qtyMin: 100, qtyMax: 100, unitPriceMin: 25000 },
    { qtyMin: 200, qtyMax: 200, unitPriceMin: 40000 },
    { qtyMin: 500, qtyMax: 500, unitPriceMin: 80000 },
  ]);
  await addPricing("business-cards", "flat_fixed_per_unit_band", { sides: "1" }, [
    { qtyMin: 100, qtyMax: 100, unitPriceMin: 15000 },
    { qtyMin: 200, qtyMax: 200, unitPriceMin: 25000 },
    { qtyMin: 500, qtyMax: 500, unitPriceMin: 50000 },
  ]);
  await addPricing("business-cards", "flat_fixed_per_unit_band", { sides: "2" }, [
    { qtyMin: 100, qtyMax: 100, unitPriceMin: 20000 },
    { qtyMin: 200, qtyMax: 200, unitPriceMin: 35000 },
    { qtyMin: 500, qtyMax: 500, unitPriceMin: 70000 },
  ]);
  await addPricing("pvc-id-cards", "flat_fixed_per_unit_band", { type: "plain" }, [
    { qtyMin: 10, qtyMax: 50, unitPriceMin: 3000 },
    { qtyMin: 51, qtyMax: 200, unitPriceMin: 2500 },
    { qtyMin: 201, unitPriceMin: 2000 },
  ]);
  await addPricing("pvc-id-cards", "flat_fixed_per_unit_band", { type: "with_lanyard" }, [
    { qtyMin: 10, qtyMax: 50, unitPriceMin: 5000 },
    { qtyMin: 51, qtyMax: 200, unitPriceMin: 4000 },
    { qtyMin: 201, unitPriceMin: 3500 },
  ]);
  await addPricing("name-tags", "flat_fixed_per_unit_band", { finish: "epoxy" }, [
    { qtyMin: 5, qtyMax: 20, unitPriceMin: 8000 },
    { qtyMin: 21, qtyMax: 50, unitPriceMin: 6000 },
    { qtyMin: 51, unitPriceMin: 4500 },
  ]);
  await addPricing("brochures-small", "qty_band_per_unit", { size: "a4" }, [
    { qtyMin: 100, qtyMax: 500, unitPriceMin: 600 },
    { qtyMin: 501, qtyMax: 1000, unitPriceMin: 400 },
    { qtyMin: 1001, unitPriceMin: 280 },
  ]);

  // ── Books & Stationery ────────────────────────────────────────────────
  await addPricing("company-profiles", "per_page_plus_design_fee", {}, [
    { qtyMin: 1, qtyMax: 25, unitPriceMin: 2000 },
    { qtyMin: 26, qtyMax: 50, unitPriceMin: 1500 },
    { qtyMin: 51, qtyMax: 100, unitPriceMin: 1200 },
    { qtyMin: 101, unitPriceMin: 1000 },
  ]);
  await addPricing("product-catalogues", "flat_fixed_per_unit_band", { pages: "24" }, [
    { qtyMin: 100, qtyMax: 100, unitPriceMin: 35000 },
    { qtyMin: 200, qtyMax: 200, unitPriceMin: 55000 },
    { qtyMin: 500, qtyMax: 500, unitPriceMin: 120000 },
  ]);
  await addPricing("diary-printing", "flat_fixed_per_unit_band", { type: "standard" }, [
    { qtyMin: 50, qtyMax: 100, unitPriceMin: 15000 },
    { qtyMin: 101, qtyMax: 500, unitPriceMin: 12000 },
    { qtyMin: 501, unitPriceMin: 9000 },
  ]);
  await addPricing("notebook-printing", "flat_fixed_per_unit_band", { type: "customised" }, [
    { qtyMin: 50, qtyMax: 100, unitPriceMin: 8000 },
    { qtyMin: 101, qtyMax: 500, unitPriceMin: 6000 },
    { qtyMin: 501, unitPriceMin: 4500 },
  ]);

  // ── Promotional Merchandise ──────────────────────────────────────────
  await addPricing("bottle-printing", "flat_fixed_per_unit_band", { size: "small" }, [
    { qtyMin: 10, qtyMax: 50, unitPriceMin: 5000 },
    { qtyMin: 51, qtyMax: 200, unitPriceMin: 3500 },
    { qtyMin: 201, unitPriceMin: 2500 },
  ]);
  await addPricing("bottle-printing", "flat_fixed_per_unit_band", { size: "large" }, [
    { qtyMin: 10, qtyMax: 50, unitPriceMin: 7000 },
    { qtyMin: 51, qtyMax: 200, unitPriceMin: 5000 },
    { qtyMin: 201, unitPriceMin: 3500 },
  ]);
  await addPricing("pen-printing", "flat_fixed_per_unit_band", {}, [
    { qtyMin: 50, qtyMax: 100, unitPriceMin: 2000 },
    { qtyMin: 101, qtyMax: 500, unitPriceMin: 1500 },
    { qtyMin: 501, unitPriceMin: 1000 },
  ]);
  await addPricing("cap-hat-printing", "flat_fixed_per_unit_band", { method: "embroidery" }, [
    { qtyMin: 10, qtyMax: 50, unitPriceMin: 8000 },
    { qtyMin: 51, qtyMax: 200, unitPriceMin: 6000 },
    { qtyMin: 201, unitPriceMin: 4500 },
  ]);
  await addPricing("umbrella-printing", "flat_fixed_per_unit_band", { size: "small" }, [
    { qtyMin: 10, qtyMax: 50, unitPriceMin: 25000 },
    { qtyMin: 51, unitPriceMin: 18000 },
  ]);
  await addPricing("metal-keychains", "qty_band_per_unit", { type: "round" }, [
    { qtyMin: 10, qtyMax: 50, unitPriceMin: 5000 },
    { qtyMin: 51, qtyMax: 200, unitPriceMin: 3500 },
    { qtyMin: 201, unitPriceMin: 2500 },
  ]);
  await addPricing("nonwoven-bags", "qty_band_per_unit", { size: "a4" }, [
    { qtyMin: 100, qtyMax: 100, unitPriceMin: 35000 },
    { qtyMin: 200, qtyMax: 200, unitPriceMin: 60000 },
    { qtyMin: 500, qtyMax: 500, unitPriceMin: 130000 },
  ]);
  await addPricing("mugs", "qty_band_per_unit", { type: "white" }, [
    { qtyMin: 10, qtyMax: 50, unitPriceMin: 8000 },
    { qtyMin: 51, qtyMax: 200, unitPriceMin: 6000 },
    { qtyMin: 201, unitPriceMin: 4500 },
  ]);
  await addPricing("mugs", "qty_band_per_unit", { type: "magic" }, [
    { qtyMin: 10, qtyMax: 50, unitPriceMin: 15000 },
    { qtyMin: 51, qtyMax: 200, unitPriceMin: 12000 },
    { qtyMin: 201, unitPriceMin: 9000 },
  ]);

  // ── Apparel & Digitization ────────────────────────────────────────────
  await addPricing("embroidery-digitization", "qty_band_per_unit", {}, [
    { qtyMin: 1000, qtyMax: 5000, unitPriceMin: 50 },
    { qtyMin: 5001, qtyMax: 20000, unitPriceMin: 35 },
    { qtyMin: 20001, unitPriceMin: 25 },
  ]);
  await addPricing("heat-transfer-numbering", "area_qty_band", {}, [
    { qtyMin: 11, qtyMax: 20, unitPriceMin: 3000 },
    { qtyMin: 21, qtyMax: 50, unitPriceMin: 2000 },
    { qtyMin: 51, qtyMax: 100, unitPriceMin: 1500 },
    { qtyMin: 101, unitPriceMin: 1000 },
  ]);

  // ── Design Services ──────────────────────────────────────────────────
  await addPricing("logo-design", "package_tier_flat_fee", { tier: "basic" }, [
    { qtyMin: 1, unitPriceMin: 80000 },
  ]);
  await addPricing("logo-design", "package_tier_flat_fee", { tier: "standard" }, [
    { qtyMin: 1, unitPriceMin: 150000 },
  ]);
  await addPricing("logo-design", "package_tier_flat_fee", { tier: "premium" }, [
    { qtyMin: 1, unitPriceMin: 300000 },
  ]);
  await addPricing("logo-design", "package_tier_flat_fee", { tier: "exclusive" }, [
    { qtyMin: 1, unitPriceMin: 500000 },
  ]);
  await addPricing("simple-design", "flat_fixed_service_fee", { type: "single_sided" }, [
    { qtyMin: 1, unitPriceMin: 35000 },
  ]);
  await addPricing("simple-design", "flat_fixed_service_fee", { type: "double_sided" }, [
    { qtyMin: 1, unitPriceMin: 55000 },
  ]);
  await addPricing("book-layout", "per_page_band", {}, [
    { qtyMin: 1, qtyMax: 25, unitPriceMin: 3000 },
    { qtyMin: 26, qtyMax: 50, unitPriceMin: 2500 },
    { qtyMin: 51, qtyMax: 100, unitPriceMin: 2000 },
    { qtyMin: 101, unitPriceMin: 1500 },
  ]);
  await addPricing("signage-mockups", "flat_fixed_service_fee", {}, [
    { qtyMin: 1, unitPriceMin: 50000 },
  ]);

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

  // ── Calendars ──────────────────────────────────────────────────────────
  await addPricing("desk-calendars", "qty_band_by_leaf_count", { leaves: "12" }, [
    { qtyMin: 50, qtyMax: 100, unitPriceMin: 8000 },
    { qtyMin: 101, qtyMax: 500, unitPriceMin: 6000 },
    { qtyMin: 501, unitPriceMin: 4500 },
  ]);
  await addPricing("wall-calendars", "qty_band_by_leaf_count", { leaves: "13", size: "a3" }, [
    { qtyMin: 50, qtyMax: 100, unitPriceMin: 12000 },
    { qtyMin: 101, qtyMax: 500, unitPriceMin: 9000 },
    { qtyMin: 501, unitPriceMin: 7000 },
  ]);

  console.log("✅ Price rules & bands created");

  // ── Finishing Options ───────────────────────────────────────────────────
  const finishingData = [
    { name: "Creasing", unit: "per_piece", price: 200 },
    { name: "Saddle Stitch", unit: "per_piece", price: 500 },
    { name: "Perfect Binding", unit: "per_piece", price: 2000 },
    { name: "Hardcover Binding", unit: "per_piece", price: 5000 },
    { name: "Lamination (A3 side)", unit: "per_a3_side", price: 300 },
    { name: "Folding", unit: "per_piece", price: 100 },
    { name: "Ring Wire Binding", unit: "per_piece", price: 800 },
  ];

  await db.insert(finishingOptions).values(finishingData).onConflictDoNothing();
  console.log("✅ Finishing options created");

  console.log("🎉 Full catalog seed complete!");
  console.log(`   Categories: ${insertedCats.length}`);
  console.log(`   Products: ${insertedProducts.length}`);
  process.exit(0);
}

seedFull().catch((error) => {
  console.error("❌ Seed failed:", error);
  process.exit(1);
});
