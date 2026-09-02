import express from "express";
import cors from "cors";
import { db } from "../db/index.js";
import {
  categories,
  products,
  productOptions,
  productOptionValues,
  priceRules,
  priceBands,
  finishingOptions,
  productFinishingOptions,
  users,
  quotes,
  quoteLines,
  orders,
  jobs,
  jobStatusHistory,
  inventoryItems,
  inventoryMovements,
  chatThreads,
  chatMessages,
} from "../db/schema.js";
import { eq, and, gte, lte, isNull, or, sql } from "drizzle-orm";
import authRoutes, { authMiddleware } from "./auth.js";

const app = express();
app.use(cors());
app.use(express.json());

// ── Auth Routes ─────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);

// ── Health Check ────────────────────────────────────────────────────────────

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Categories ──────────────────────────────────────────────────────────────

app.get("/api/categories", async (_req, res) => {
  try {
    const allCategories = await db.select().from(categories);
    res.json(allCategories);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

app.get("/api/categories/tree", async (_req, res) => {
  try {
    const allCategories = await db.select().from(categories);
    const topLevel = allCategories.filter((c) => !c.parentId);
    const tree = topLevel.map((cat) => ({
      ...cat,
      children: allCategories.filter((c) => c.parentId === cat.id),
    }));
    res.json(tree);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch category tree" });
  }
});

app.get("/api/categories/:slug", async (req, res) => {
  try {
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, req.params.slug));
    if (!category) return res.status(404).json({ error: "Category not found" });
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch category" });
  }
});

// ── Products ────────────────────────────────────────────────────────────────

app.get("/api/products", async (_req, res) => {
  try {
    const allProducts = await db.select().from(products);
    res.json(allProducts);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

app.get("/api/products/:id", async (req, res) => {
  try {
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, req.params.id));
    if (!product) return res.status(404).json({ error: "Product not found" });

    const options = await db
      .select()
      .from(productOptions)
      .where(eq(productOptions.productId, product.id));

    const optionsWithValues = await Promise.all(
      options.map(async (opt) => {
        const values = await db
          .select()
          .from(productOptionValues)
          .where(eq(productOptionValues.productOptionId, opt.id));
        return { ...opt, values };
      }),
    );

    res.json({ ...product, options: optionsWithValues });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

app.get("/api/products/:id/pricing-schema", async (req, res) => {
  try {
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, req.params.id));
    if (!product) return res.status(404).json({ error: "Product not found" });

    const options = await db
      .select()
      .from(productOptions)
      .where(eq(productOptions.productId, product.id));

    res.json({
      pricingModel: product.pricingModel,
      options: await Promise.all(
        options.map(async (opt) => {
          const values = await db
            .select()
            .from(productOptionValues)
            .where(eq(productOptionValues.productOptionId, opt.id));
          return { ...opt, values };
        }),
      ),
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch pricing schema" });
  }
});

// ── Calculator / Pricing ────────────────────────────────────────────────────

app.post("/api/calculator/quote", async (req, res) => {
  try {
    const { productId, categoryId, inputs } = req.body;

    // Find the product
    const [product] = productId
      ? await db.select().from(products).where(eq(products.id, productId))
      : await db.select().from(products).where(eq(products.id, categoryId));

    if (!product) return res.status(404).json({ error: "Product not found" });

    // Find matching price rule
    const rules = await db
      .select()
      .from(priceRules)
      .where(
        and(
          eq(priceRules.productId, product.id),
          eq(priceRules.isInternalCost, false),
          or(
            isNull(priceRules.activeTo),
            gte(priceRules.activeTo, new Date().toISOString().split("T")[0]),
          ),
        ),
      );

    if (rules.length === 0) {
      return res.status(404).json({ error: "No matching price rule found" });
    }

    const rule = rules[0];

    // Find matching band
    const bands = await db
      .select()
      .from(priceBands)
      .where(eq(priceBands.priceRuleId, rule.id))
      .orderBy(priceBands.sortOrder);

    let unitPrice = 0;
    let subtotal = 0;
    let matchedBandId: string | null = null;

    const qty = inputs.qty || 1;

    for (const band of bands) {
      const qtyMatch =
        (band.qtyMin === null || qty >= band.qtyMin) &&
        (band.qtyMax === null || qty <= band.qtyMax);

      if (qtyMatch) {
        unitPrice = band.unitPriceMin;
        matchedBandId = band.id;
        break;
      }
    }

    if (product.pricingModel === "area_based_range" && inputs.widthCm && inputs.heightCm) {
      const areaSqm = (inputs.widthCm / 100) * (inputs.heightCm / 100);
      if (areaSqm < 1 && rule.minCharge) {
        subtotal = rule.minCharge;
      } else if (unitPrice > 0) {
        subtotal = Math.round(areaSqm * unitPrice);
      }
    } else {
      subtotal = unitPrice * qty;
    }

    res.json({
      matchedRuleId: rule.id,
      matchedBandId,
      unitPrice,
      quantity: qty,
      subtotal,
      total: subtotal,
      pricingModel: product.pricingModel,
      requiresStaffReview:
        product.pricingModel === "signage_engrave_cut_formula",
    });
  } catch (error) {
    console.error("Calculator error:", error);
    res.status(500).json({ error: "Failed to calculate price" });
  }
});

// ── Quotes (protected) ──────────────────────────────────────────────────────

app.get("/api/quotes", authMiddleware, async (_req, res) => {
  try {
    const allQuotes = await db.select().from(quotes);
    // Fetch line items for each quote
    const quotesWithLines = await Promise.all(
      allQuotes.map(async (q) => {
        const lines = await db
          .select()
          .from(quoteLines)
          .where(eq(quoteLines.quoteId, q.id));
        return { ...q, lines };
      }),
    );
    res.json(quotesWithLines);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch quotes" });
  }
});

app.post("/api/quotes", authMiddleware, async (req, res) => {
  try {
    const { customerId, productId, productName, inputSpec, computedUnitPrice, quantity, finishingTotal, lineTotal, notes } = req.body;
    const user = (req as any).user;

    const year = new Date().getFullYear();
    const quoteNumber = `Q-${year}-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`;

    // Create the quote
    const [quote] = await db
      .insert(quotes)
      .values({
        quoteNumber,
        customerId: customerId || user.userId,
        createdBy: user.userId,
        notes,
        subtotal: lineTotal || 0,
        total: lineTotal || 0,
        status: "draft",
      })
      .returning();

    // Add quote line if product info provided
    if (productId && computedUnitPrice !== undefined) {
      await db.insert(quoteLines).values({
        quoteId: quote.id,
        productId,
        inputSpec: inputSpec || {},
        computedUnitPrice,
        quantity: quantity || 1,
        finishingTotal: finishingTotal || 0,
        lineTotal: lineTotal || 0,
        isManualOverride: false,
      });
    }

    res.json(quote);
  } catch (error) {
    console.error("Create quote error:", error);
    res.status(500).json({ error: "Failed to create quote" });
  }
});

// ── Jobs (protected) ────────────────────────────────────────────────────────

app.get("/api/jobs", authMiddleware, async (_req, res) => {
  try {
    const allJobs = await db.select().from(jobs);
    res.json(allJobs);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch jobs" });
  }
});

app.get("/api/jobs/:id", authMiddleware, async (req, res) => {
  try {
    const jobId = req.params.id as string;
    const [job] = await db
      .select()
      .from(jobs)
      .where(eq(jobs.id, jobId));
    if (!job) return res.status(404).json({ error: "Job not found" });

    const history = await db
      .select()
      .from(jobStatusHistory)
      .where(eq(jobStatusHistory.jobId, job.id));

    res.json({ ...job, history });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch job" });
  }
});

app.post("/api/jobs/:id/status", authMiddleware, async (req, res) => {
  try {
    const { status, changedBy, note } = req.body;
    const jobId = req.params.id as string;
    const [job] = await db
      .select()
      .from(jobs)
      .where(eq(jobs.id, jobId));
    if (!job) return res.status(404).json({ error: "Job not found" });

    await db.insert(jobStatusHistory).values({
      jobId: job.id,
      fromStatus: job.status,
      toStatus: status,
      changedBy,
      note,
    });

    await db.update(jobs).set({ status, updatedAt: new Date() }).where(eq(jobs.id, jobId));

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to update job status" });
  }
});

// ── Inventory ───────────────────────────────────────────────────────────────

app.get("/api/inventory", async (_req, res) => {
  try {
    const allItems = await db.select().from(inventoryItems);
    res.json(allItems);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch inventory" });
  }
});

app.get("/api/inventory/low-stock", async (_req, res) => {
  try {
    const lowItems = await db
      .select()
      .from(inventoryItems)
      .where(sql`${inventoryItems.currentQty} < ${inventoryItems.reorderLevel}`);
    res.json(lowItems);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch low stock items" });
  }
});

// ── Chat ────────────────────────────────────────────────────────────────────

app.get("/api/chat/threads/:jobId", async (req, res) => {
  try {
    const threads = await db
      .select()
      .from(chatThreads)
      .where(eq(chatThreads.jobId, req.params.jobId));
    res.json(threads);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch chat threads" });
  }
});

app.post("/api/chat/threads/:threadId/messages", async (req, res) => {
  try {
    const { senderId, body } = req.body;
    const [message] = await db
      .insert(chatMessages)
      .values({
        threadId: req.params.threadId,
        senderId,
        body,
        readBy: [],
      })
      .returning();
    res.json(message);
  } catch (error) {
    res.status(500).json({ error: "Failed to send message" });
  }
});

// ── Start Server ────────────────────────────────────────────────────────────

const PORT = process.env.API_PORT || 3001;

app.listen(PORT, () => {
  console.log(`PrintHub API server running on port ${PORT}`);
});
