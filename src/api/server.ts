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
  jobFiles,
  inventoryItems,
  inventoryMovements,
  chatThreads,
  chatMessages,
} from "../db/schema.js";
import { eq, and, gte, lte, isNull, or, sql } from "drizzle-orm";
import authRoutes, { authMiddleware } from "./auth.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

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

    // Find matching price rules
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
      // No price rules for this product yet — return a valid response so the UI
      // can show "Contact us for a custom quote" instead of crashing.
      return res.json({
        matchedRuleId: null,
        matchedBandId: null,
        unitPrice: 0,
        quantity: inputs.qty || 1,
        subtotal: 0,
        total: 0,
        pricingModel: product.pricingModel,
        requiresStaffReview: true,
        message: "No price rules configured yet. Please contact us for a quote.",
      });
    }

    // Filter rules by option_filter matching
    const inputOptions: Record<string, string> = {};
    if (inputs.material) inputOptions.material = inputs.material;
    if (inputs.sides) inputOptions.sides = String(inputs.sides);
    if (inputs.size) inputOptions.size = String(inputs.size);
    if (inputs.coverageTier) inputOptions.coverageTier = String(inputs.coverageTier);

    let rule = rules[0]; // default to first
    if (rules.length > 1 && Object.keys(inputOptions).length > 0) {
      // Try to find best match
      const bestMatch = rules.find((r) => {
        const filter = (r.optionFilter || {}) as Record<string, string>;
        return Object.entries(filter).every(([key, val]) => String(val) === String(inputOptions[key] ?? ""));
      });
      if (bestMatch) rule = bestMatch;
    }

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
    } else if (unitPrice > 0) {
      subtotal = unitPrice * qty;
    }

    const requiresStaffReview =
      product.pricingModel === "signage_engrave_cut_formula" ||
      product.pricingModel === "imposition_sheet_based" ||
      product.pricingModel === "coverage_qty_band" ||
      subtotal === 0;

    res.json({
      matchedRuleId: rule.id,
      matchedBandId,
      unitPrice,
      quantity: qty,
      subtotal,
      total: subtotal,
      pricingModel: product.pricingModel,
      requiresStaffReview,
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

    const files = await db
      .select()
      .from(jobFiles)
      .where(eq(jobFiles.jobId, job.id));

    res.json({ ...job, history, files });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch job" });
  }
});

app.post("/api/jobs/:id/status", authMiddleware, async (req, res) => {
  try {
    const { status, note } = req.body;
    const user = (req as any).user;
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
      changedBy: user.userId,
      note: note || null,
    });

    await db.update(jobs).set({ status, updatedAt: new Date() }).where(eq(jobs.id, jobId));

    res.json({ success: true });
  } catch (error) {
    console.error("Update job status error:", error);
    res.status(500).json({ error: "Failed to update job status" });
  }
});

// ── Job Creation (convert quote → job) ─────────────────────────────────────

app.post("/api/quotes/:id/convert-to-job", authMiddleware, async (req, res) => {
  try {
    const quoteId = req.params.id as string;
    const user = (req as any).user;
    const { priority, dueDate, assignedTo } = req.body;

    const [quote] = await db
      .select()
      .from(quotes)
      .where(eq(quotes.id, quoteId));
    if (!quote) return res.status(404).json({ error: "Quote not found" });
    if (quote.status === 'converted') return res.status(400).json({ error: "Quote already converted" });

    // Get quote lines for job title
    const lines = await db
      .select()
      .from(quoteLines)
      .where(eq(quoteLines.quoteId, quoteId));

    const jobTitle = lines.length > 0
      ? lines.map((l: any) => `${l.quantity}x Line Item`).join(', ')
      : quote.notes || 'Job from quote';

    const year = new Date().getFullYear();
    const jobNumber = `JOB-${year}-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`;

    // Create job
    const [job] = await db
      .insert(jobs)
      .values({
        jobNumber,
        orderId: null,
        title: jobTitle,
        status: "confirmed",
        assignedTo: assignedTo || null,
        priority: priority || "normal",
        dueDate: dueDate || null,
      })
      .returning();

    // Log status history
    await db.insert(jobStatusHistory).values({
      jobId: job.id,
      fromStatus: null,
      toStatus: "confirmed",
      changedBy: user.userId,
      note: `Created from quote ${quote.quoteNumber}`,
    });

    // Update quote status
    await db.update(quotes).set({ status: "converted" }).where(eq(quotes.id, quoteId));

    res.json({ job, quote: { ...quote, status: "converted" } });
  } catch (error) {
    console.error("Convert to job error:", error);
    res.status(500).json({ error: "Failed to convert quote to job" });
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

app.get("/api/inventory/:id/movements", authMiddleware, async (req, res) => {
  try {
    const itemId = req.params.id as string;
    const movements = await db
      .select()
      .from(inventoryMovements)
      .where(eq(inventoryMovements.itemId, itemId));
    res.json(movements);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch movements" });
  }
});

app.post("/api/inventory/:id/movements", authMiddleware, async (req, res) => {
  try {
    const itemId = req.params.id as string;
    const user = (req as any).user;
    const { movementType, quantity, reason, jobId } = req.body;

    const [item] = await db
      .select()
      .from(inventoryItems)
      .where(eq(inventoryItems.id, itemId));
    if (!item) return res.status(404).json({ error: "Item not found" });

    // Calculate new quantity
    let newQty = Number(item.currentQty);
    if (movementType === "in") {
      newQty += Number(quantity);
    } else if (movementType === "out") {
      if (Number(quantity) > newQty) {
        return res.status(400).json({ error: "Insufficient stock" });
      }
      newQty -= Number(quantity);
    } else {
      newQty = Number(quantity);
    }

    // Update item quantity
    await db.update(inventoryItems)
      .set({ currentQty: newQty.toString() })
      .where(eq(inventoryItems.id, itemId));

    // Log movement
    const [movement] = await db
      .insert(inventoryMovements)
      .values({
        itemId,
        jobId: jobId || null,
        movementType,
        quantity: quantity.toString(),
        reason,
        createdBy: user.userId,
      })
      .returning();

    res.json({ movement, newQty });
  } catch (error) {
    console.error("Record movement error:", error);
    res.status(500).json({ error: "Failed to record movement" });
  }
});

// ── Chat ────────────────────────────────────────────────────────────────────

app.get("/api/chat/threads", authMiddleware, async (_req, res) => {
  try {
    const threads = await db.select().from(chatThreads);
    res.json(threads);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch threads" });
  }
});

app.post("/api/chat/threads", authMiddleware, async (req, res) => {
  try {
    const { jobId, isInternal } = req.body;
    const [thread] = await db
      .insert(chatThreads)
      .values({
        jobId: jobId || null,
        isInternal: isInternal || false,
      })
      .returning();
    res.json(thread);
  } catch (error) {
    res.status(500).json({ error: "Failed to create thread" });
  }
});

app.get("/api/chat/threads/:threadId/messages", authMiddleware, async (req, res) => {
  try {
    const threadId = req.params.threadId as string;
    const messages = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.threadId, threadId));
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

app.post("/api/chat/threads/:threadId/messages", authMiddleware, async (req, res) => {
  try {
    const { body } = req.body;
    const user = (req as any).user;
    const threadId = req.params.threadId as string;
    const [message] = await db
      .insert(chatMessages)
      .values({
        threadId,
        senderId: user.userId,
        body,
        readBy: [],
      })
      .returning();
    res.json(message);
  } catch (error) {
    res.status(500).json({ error: "Failed to send message" });
  }
});

// ── Orders ──────────────────────────────────────────────────────────────────

app.get("/api/orders", authMiddleware, async (_req, res) => {
  try {
    const allOrders = await db.select().from(orders);
    res.json(allOrders);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

app.post("/api/orders", authMiddleware, async (req, res) => {
  try {
    const { quoteId, items, paymentMethod, notes } = req.body;
    const user = (req as any).user;

    const year = new Date().getFullYear();
    const orderNumber = `ORD-${year}-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`;

    // Calculate total from items
    const total = items?.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0) || 0;

    const [order] = await db
      .insert(orders)
      .values({
        orderNumber,
        quoteId: quoteId || null,
        customerId: user.userId,
        total,
        paymentMethod: paymentMethod || 'cash',
        status: 'pending',
      })
      .returning();

    res.json(order);
  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({ error: "Failed to create order" });
  }
});

// ── Order Status Update ──────────────────────────────────────────────────────

app.patch("/api/orders/:id/status", authMiddleware, async (req, res) => {
  try {
    const orderId = req.params.id as string;
    const { status, paymentMethod } = req.body;
    const validStatuses = ["pending", "paid", "partially_paid", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
    }
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
    if (!order) return res.status(404).json({ error: "Order not found" });

    const updateData: Record<string, any> = { status };
    if (paymentMethod) updateData.paymentMethod = paymentMethod;

    await db.update(orders).set(updateData).where(eq(orders.id, orderId));
    res.json({ success: true, orderId, status });
  } catch (error) {
    console.error("Update order status error:", error);
    res.status(500).json({ error: "Failed to update order status" });
  }
});

// ── Products by category slug ────────────────────────────────────────────────

app.get("/api/products-by-category/:identifier", async (req, res) => {
  try {
    const id = req.params.identifier;
    // Try slug first, then fallback to ID
    let [cat] = await db.select().from(categories).where(eq(categories.slug, id));
    if (!cat) {
      [cat] = await db.select().from(categories).where(eq(categories.id, id));
    }
    if (!cat) return res.status(404).json({ error: "Category not found" });
    const prods = await db.select().from(products).where(eq(products.categoryId, cat.id));
    res.json({ category: cat, products: prods });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch products by category" });
  }
});

// ── Chat threads with user info ──────────────────────────────────────────────

app.get("/api/chat/threads-with-users", authMiddleware, async (_req, res) => {
  try {
    const threads = await db.select().from(chatThreads);
    const threadsWithInfo = await Promise.all(
      threads.map(async (thread) => {
        let jobInfo = null;
        if (thread.jobId) {
          const [job] = await db.select().from(jobs).where(eq(jobs.id, thread.jobId));
          jobInfo = job;
        }
        const msgs = await db.select().from(chatMessages).where(eq(chatMessages.threadId, thread.id));
        const lastMessage = msgs[msgs.length - 1] || null;
        return { ...thread, jobInfo, lastMessage, messageCount: msgs.length };
      }),
    );
    res.json(threadsWithInfo);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch threads" });
  }
});

// ── Product Options (for dynamic calculator form) ─────────────────────────────

app.get("/api/products/:id/options", async (req, res) => {
  try {
    const productId = req.params.id as string;
    const options = await db
      .select()
      .from(productOptions)
      .where(eq(productOptions.productId, productId))
      .orderBy(productOptions.sortOrder);

    const optionsWithValues = await Promise.all(
      options.map(async (opt) => {
        const values = await db
          .select()
          .from(productOptionValues)
          .where(eq(productOptionValues.productOptionId, opt.id))
          .orderBy(productOptionValues.sortOrder);
        return { ...opt, values };
      }),
    );

    res.json(optionsWithValues);
  } catch (error) {
    console.error("Fetch product options error:", error);
    res.status(500).json({ error: "Failed to fetch product options" });
  }
});

// ── Finishing Options for product ─────────────────────────────────────────────

app.get("/api/products/:id/finishing", async (req, res) => {
  try {
    const productId = req.params.id as string;
    const links = await db
      .select({ finishingOptionId: productFinishingOptions.finishingOptionId })
      .from(productFinishingOptions)
      .where(eq(productFinishingOptions.productId, productId));

    if (links.length === 0) {
      // Return all finishing options if no specific ones linked
      const allFinishing = await db.select().from(finishingOptions);
      return res.json(allFinishing);
    }

    const ids = links.map((l) => l.finishingOptionId);
    const results = await db.select().from(finishingOptions);
    const filtered = results.filter((f) => ids.includes(f.id));
    res.json(filtered.length > 0 ? filtered : results);
  } catch (error) {
    console.error("Fetch finishing options error:", error);
    res.status(500).json({ error: "Failed to fetch finishing options" });
  }
});

// ── Job File Upload ───────────────────────────────────────────────────────────

app.get("/api/jobs/:id/files", authMiddleware, async (req, res) => {
  try {
    const jobId = req.params.id as string;
    const files = await db.select().from(jobFiles).where(eq(jobFiles.jobId, jobId));
    res.json(files);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch job files" });
  }
});

app.post("/api/jobs/:id/files", authMiddleware, async (req, res) => {
  try {
    const jobId = req.params.id as string;
    const user = (req as any).user;
    const { fileUrl, fileType } = req.body;
    if (!fileUrl) return res.status(400).json({ error: "fileUrl is required" });

    const [file] = await db
      .insert(jobFiles)
      .values({
        jobId,
        fileUrl,
        fileType: fileType || "artwork",
        uploadedBy: user.userId,
      })
      .returning();

    res.json(file);
  } catch (error) {
    console.error("Upload job file error:", error);
    res.status(500).json({ error: "Failed to upload file" });
  }
});

// ── Start Server ────────────────────────────────────────────────────────────

const PORT = process.env.API_PORT || 3001;

app.listen(PORT, () => {
  console.log(`PrintHub API server running on port ${PORT}`);
});
