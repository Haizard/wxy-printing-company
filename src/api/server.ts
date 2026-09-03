import express from "express";
import cors from "cors";
import { db } from "../db/index";
import { ensureSchema } from "../db/bootstrap";
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
  contactMessages,
  suppliers,
  purchaseOrders,
  purchaseOrderItems,
  materialIssuances,
  materialCategories,
} from "../db/schema";
import { eq, and, gte, lte, isNull, or, sql } from "drizzle-orm";
import authRoutes, { authMiddleware } from "./auth";

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

// ── Auth Routes ─────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);

// ── Health Check ────────────────────────────────────────────────────────────

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── User Management (admin) ─────────────────────────────────────────────────

app.get("/api/users", authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    if (!isAdminUser(user)) return res.status(403).json({ error: "Admin access required" });
    const allUsers = await db.select().from(users).orderBy(sql`${users.createdAt} DESC NULLS LAST`);
    const safe = allUsers.map(({ passwordHash, ...rest }) => rest);
    res.json(safe);
  } catch (error) {
    console.error("Fetch users error:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

app.put("/api/users/:id", authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    if (!isAdminUser(user)) return res.status(403).json({ error: "Admin access required" });
    const id = req.params.id as string;
    const { fullName, email, phone, role, isActive } = req.body;
    const updates: Record<string, any> = {};
    if (fullName !== undefined) updates.fullName = fullName;
    if (email !== undefined) updates.email = email || null;
    if (phone !== undefined) updates.phone = phone || null;
    if (role !== undefined) updates.role = role;
    if (isActive !== undefined) updates.isActive = isActive;
    if (Object.keys(updates).length === 0) return res.status(400).json({ error: "No fields to update" });
    const [updated] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    if (!updated) return res.status(404).json({ error: "User not found" });
    const { passwordHash, ...safe } = updated;
    res.json(safe);
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
});

app.delete("/api/users/:id", authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    if (!isAdminUser(user)) return res.status(403).json({ error: "Admin access required" });
    const id = req.params.id as string;
    if (user.userId === id) return res.status(400).json({ error: "Cannot delete your own account" });
    await db.delete(users).where(eq(users.id, id));
    res.json({ success: true });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
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

app.get("/api/jobs", authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    // Jobs are an internal production concern — clients never see the list.
    if (!isStaffUser(user)) return res.json([]);
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
    const { movementType, quantity, reason, wasteReason, jobId } = req.body;

    const [item] = await db
      .select()
      .from(inventoryItems)
      .where(eq(inventoryItems.id, itemId));
    if (!item) return res.status(404).json({ error: "Item not found" });

    // Calculate new quantity based on movement type
    let newQty = Number(item.currentQty);
    const validIncreaseTypes = ["in", "return", "return_to_stock"];
    const validDecreaseTypes = ["out", "waste", "issue"];

    if (validIncreaseTypes.includes(movementType)) {
      newQty += Number(quantity);
    } else if (validDecreaseTypes.includes(movementType)) {
      if (Number(quantity) > newQty) {
        return res.status(400).json({ error: "Insufficient stock" });
      }
      newQty -= Number(quantity);
    } else if (movementType === "adjustment") {
      newQty = Number(quantity);
    }

    // Update item quantity
    await db.update(inventoryItems)
      .set({ currentQty: newQty.toString() })
      .where(eq(inventoryItems.id, itemId));

    // Build movement description for waste reasons
    const wasteReasons = [
      "printing_error", "cutting_error", "machine_setup", "damaged_material",
      "wrong_measurement", "color_problem", "customer_change", "operator_error", "other"
    ];
    const effectiveReason = movementType === "waste" && wasteReason ?
      `Waste: ${wasteReasons.includes(wasteReason) ? wasteReason.replace(/_/g, " ") : wasteReason}` : reason;

    // Log movement
    const [movement] = await db
      .insert(inventoryMovements)
      .values({
        itemId,
        jobId: jobId || null,
        movementType,
        quantity: quantity.toString(),
        reason: effectiveReason || null,
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

const STAFF_ROLES = ["admin", "sales", "production", "inventory_manager"];
const isStaffUser = (user: any) => STAFF_ROLES.includes(user?.role);

app.get("/api/chat/threads", authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const threads = isStaffUser(user)
      ? await db.select().from(chatThreads)
      : await db
          .select()
          .from(chatThreads)
          .where(eq(chatThreads.customerId, user.userId));
    res.json(threads);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch threads" });
  }
});

app.post("/api/chat/threads", authMiddleware, async (req, res) => {
  try {
    const { jobId, isInternal } = req.body;
    const user = (req as any).user;
    const isCustomer = !isStaffUser(user);
    const [thread] = await db
      .insert(chatThreads)
      .values({
        // Customers can only open support threads about themselves — never
        // link internal jobs or staff-only threads.
        jobId: isCustomer ? null : jobId || null,
        isInternal: isCustomer ? false : isInternal || false,
        customerId: isCustomer ? user.userId : null,
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
    const user = (req as any).user;
    const [thread] = await db
      .select()
      .from(chatThreads)
      .where(eq(chatThreads.id, threadId));
    if (!thread) return res.status(404).json({ error: "Thread not found" });
    // Customers may only read their own support threads.
    if (!isStaffUser(user) && thread.customerId !== user.userId) {
      return res.status(403).json({ error: "Not your conversation" });
    }
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
    if (!body?.trim()) return res.status(400).json({ error: "Message is required" });
    const [thread] = await db
      .select()
      .from(chatThreads)
      .where(eq(chatThreads.id, threadId));
    if (!thread) return res.status(404).json({ error: "Thread not found" });
    if (!isStaffUser(user) && thread.customerId !== user.userId) {
      return res.status(403).json({ error: "Not your conversation" });
    }
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

app.get("/api/orders", authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    // Customers only ever see their own requests; staff see everything.
    const base = db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        quoteId: orders.quoteId,
        customerId: orders.customerId,
        status: orders.status,
        total: orders.total,
        paymentMethod: orders.paymentMethod,
        items: orders.items,
        notes: orders.notes,
        createdAt: orders.createdAt,
        customerName: users.fullName,
      })
      .from(orders)
      .leftJoin(users, eq(orders.customerId, users.id));
    const rows = isStaffUser(user)
      ? await base.orderBy(sql`${orders.createdAt} desc`)
      : await base
          .where(eq(orders.customerId, user.userId))
          .orderBy(sql`${orders.createdAt} desc`);
    res.json(rows);
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

    // Calculate total from items (price is 0 for open client requests — the
    // team confirms the exact price for the client's specification).
    const total = items?.reduce((sum: number, item: any) => sum + (Number(item.price) * Number(item.quantity)), 0) || 0;

    const [order] = await db
      .insert(orders)
      .values({
        orderNumber,
        quoteId: quoteId || null,
        customerId: user.userId,
        total,
        paymentMethod: paymentMethod || 'cash',
        status: 'pending',
        items: items || [],
        notes: notes || null,
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
    const user = (req as any).user;
    if (!isStaffUser(user)) {
      return res.status(403).json({ error: "Only staff can update orders" });
    }
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

app.get("/api/chat/threads-with-users", authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    // Customers only see their own support conversations — never staff
    // threads or other customers' chats.
    const threads = isStaffUser(user)
      ? await db.select().from(chatThreads)
      : await db
          .select()
          .from(chatThreads)
          .where(eq(chatThreads.customerId, user.userId));
    const threadsWithInfo = await Promise.all(
      threads.map(async (thread) => {
        let jobInfo = null;
        if (thread.jobId) {
          const [job] = await db.select().from(jobs).where(eq(jobs.id, thread.jobId));
          jobInfo = job;
        }
        let customerName: string | null = null;
        if (thread.customerId) {
          const [customer] = await db
            .select({ fullName: users.fullName })
            .from(users)
            .where(eq(users.id, thread.customerId));
          customerName = customer?.fullName || null;
        }
        const msgs = await db.select().from(chatMessages).where(eq(chatMessages.threadId, thread.id));
        const lastMessage = msgs[msgs.length - 1] || null;
        return { ...thread, customerName, jobInfo, lastMessage, messageCount: msgs.length };
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

// ── Admin: User Management ────────────────────────────────────────────────

app.get("/api/users", authMiddleware, async (_req, res) => {
  try {
    const allUsers = await db.select({
      id: users.id,
      fullName: users.fullName,
      email: users.email,
      phone: users.phone,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
    }).from(users);
    res.json(allUsers);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

app.put("/api/users/:id", authMiddleware, async (req, res) => {
  try {
    const id = req.params.id as string;
    const { fullName, email, phone, role, isActive } = req.body;
    const [updated] = await db.update(users)
      .set({ fullName, email, phone, role, isActive })
      .where(eq(users.id, id))
      .returning();
    if (!updated) return res.status(404).json({ error: "User not found" });
    res.json({ id: updated.id, fullName: updated.fullName, email: updated.email, phone: updated.phone, role: updated.role, isActive: updated.isActive });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
});

app.delete("/api/users/:id", authMiddleware, async (req, res) => {
  try {
    const id = req.params.id as string;
    await db.delete(users).where(eq(users.id, id));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete user" });
  }
});

// ── Admin: Category CRUD ───────────────────────────────────────────────────

app.post("/api/categories", authMiddleware, async (req, res) => {
  try {
    const { name, slug, icon, parentId, sortOrder, internalOnly } = req.body;
    if (!name || !slug) return res.status(400).json({ error: "Name and slug are required" });
    const [cat] = await db.insert(categories).values({ name, slug, icon: icon || null, parentId: parentId || null, sortOrder: sortOrder || 0, internalOnly: internalOnly || false }).returning();
    res.status(201).json(cat);
  } catch (error: any) {
    console.error("Create category error:", error);
    res.status(500).json({ error: error.message || "Failed to create category" });
  }
});

app.put("/api/categories/:id", authMiddleware, async (req, res) => {
  try {
    const id = req.params.id as string;
    const { name, slug, icon, parentId, sortOrder, internalOnly } = req.body;
    const [updated] = await db.update(categories).set({ name, slug, icon, parentId, sortOrder, internalOnly }).where(eq(categories.id, id)).returning();
    if (!updated) return res.status(404).json({ error: "Category not found" });
    res.json(updated);
  } catch (error: any) {
    console.error("Update category error:", error);
    res.status(500).json({ error: error.message || "Failed to update category" });
  }
});

app.delete("/api/categories/:id", authMiddleware, async (req, res) => {
  try {
    const id = req.params.id as string;
    await db.delete(categories).where(eq(categories.id, id));
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to delete category" });
  }
});

// ── Admin: Product CRUD ────────────────────────────────────────────────────

app.post("/api/products", authMiddleware, async (req, res) => {
  try {
    const { name, slug, description, categoryId, pricingModel, baseUnit, minOrderQty, leadTimeDays, isActive, isShopVisible, images } = req.body;
    if (!name || !slug || !categoryId || !pricingModel) return res.status(400).json({ error: "Name, slug, category, and pricing model are required" });
    const [product] = await db.insert(products).values({
      name, slug, description: description || null, categoryId, pricingModel,
      baseUnit: baseUnit || null, minOrderQty: minOrderQty || 1, leadTimeDays: leadTimeDays || null,
      isActive: isActive !== false, isShopVisible: isShopVisible !== false,
      images: images || [],
    }).returning();
    res.status(201).json(product);
  } catch (error: any) {
    console.error("Create product error:", error);
    res.status(500).json({ error: error.message || "Failed to create product" });
  }
});

app.put("/api/products/:id", authMiddleware, async (req, res) => {
  try {
    const id = req.params.id as string;
    const { name, slug, description, categoryId, pricingModel, baseUnit, minOrderQty, leadTimeDays, isActive, isShopVisible, images } = req.body;
    const updateData: Record<string, any> = {
      name, slug, description, categoryId, pricingModel, baseUnit, minOrderQty, leadTimeDays, isActive, isShopVisible,
    };
    if (images !== undefined) updateData.images = images;
    const [updated] = await db.update(products).set(updateData).where(eq(products.id, id)).returning();
    if (!updated) return res.status(404).json({ error: "Product not found" });
    res.json(updated);
  } catch (error: any) {
    console.error("Update product error:", error);
    res.status(500).json({ error: error.message || "Failed to update product" });
  }
});

app.delete("/api/products/:id", authMiddleware, async (req, res) => {
  try {
    const id = req.params.id as string;
    await db.delete(products).where(eq(products.id, id));
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to delete product" });
  }
});

// ── Admin: Inventory CRUD ──────────────────────────────────────────────────

app.post("/api/inventory", authMiddleware, async (req, res) => {
  try {
    const { name, sku, unit, category, currentQty, reorderLevel, unitCost, supplier, imageUrl } = req.body;
    if (!name || !unit) return res.status(400).json({ error: "Name and unit are required" });
    const [item] = await db.insert(inventoryItems).values({
      name, sku: sku || null, unit, category: category || null, currentQty: String(currentQty || 0), reorderLevel: String(reorderLevel || 0), unitCost: unitCost || null, supplier: supplier || null, imageUrl: imageUrl || null,
    }).returning();
    res.status(201).json(item);
  } catch (error: any) {
    console.error("Create inventory item error:", error);
    res.status(500).json({ error: error.message || "Failed to create inventory item" });
  }
});

app.put("/api/inventory/:id", authMiddleware, async (req, res) => {
  try {
    const id = req.params.id as string;
    const { name, sku, unit, category, currentQty, reorderLevel, unitCost, supplier, imageUrl } = req.body;
    const [updated] = await db.update(inventoryItems).set({
      name, sku, unit, category, currentQty: String(currentQty), reorderLevel: String(reorderLevel), unitCost, supplier, imageUrl: imageUrl || null,
    }).where(eq(inventoryItems.id, id)).returning();
    if (!updated) return res.status(404).json({ error: "Inventory item not found" });
    res.json(updated);
  } catch (error: any) {
    console.error("Update inventory item error:", error);
    res.status(500).json({ error: error.message || "Failed to update inventory item" });
  }
});

app.delete("/api/inventory/:id", authMiddleware, async (req, res) => {
  try {
    const id = req.params.id as string;
    await db.delete(inventoryItems).where(eq(inventoryItems.id, id));
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to delete inventory item" });
  }
});

// ── Delete Quote ───────────────────────────────────────────────────────────

app.delete("/api/quotes/:id", authMiddleware, async (req, res) => {
  try {
    const id = req.params.id as string;
    await db.delete(quoteLines).where(eq(quoteLines.quoteId, id));
    await db.delete(quotes).where(eq(quotes.id, id));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete quote" });
  }
});

// ── Delete Job ─────────────────────────────────────────────────────────────

app.delete("/api/jobs/:id", authMiddleware, async (req, res) => {
  try {
    const id = req.params.id as string;
    await db.delete(jobStatusHistory).where(eq(jobStatusHistory.jobId, id));
    await db.delete(jobFiles).where(eq(jobFiles.jobId, id));
    await db.delete(jobs).where(eq(jobs.id, id));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete job" });
  }
});

// ── Delete Order ───────────────────────────────────────────────────────────

app.delete("/api/orders/:id", authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    if (!isStaffUser(user)) {
      return res.status(403).json({ error: "Only staff can delete orders" });
    }
    const id = req.params.id as string;
    await db.delete(orders).where(eq(orders.id, id));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete order" });
  }
});

// ── Delete Chat Thread ─────────────────────────────────────────────────────

app.delete("/api/chat/threads/:id", authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const id = req.params.id as string;
    const [thread] = await db.select().from(chatThreads).where(eq(chatThreads.id, id));
    if (!thread) return res.status(404).json({ error: "Thread not found" });
    if (!isStaffUser(user) && thread.customerId !== user.userId) {
      return res.status(403).json({ error: "Not your conversation" });
    }
    await db.delete(chatMessages).where(eq(chatMessages.threadId, id));
    await db.delete(chatThreads).where(eq(chatThreads.id, id));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete chat thread" });
  }
});

// ── Price Rules CRUD ─────────────────────────────────────────────────────────

app.get("/api/price-rules", authMiddleware, async (req, res) => {
  try {
    const rules = await db
      .select({
        id: priceRules.id,
        productId: priceRules.productId,
        pricingModel: priceRules.pricingModel,
        optionFilter: priceRules.optionFilter,
        markupPercent: priceRules.markupPercent,
        minCharge: priceRules.minCharge,
        currency: priceRules.currency,
        isInternalCost: priceRules.isInternalCost,
        activeFrom: priceRules.activeFrom,
        activeTo: priceRules.activeTo,
        createdAt: priceRules.createdAt,
        productName: products.name,
        productSlug: products.slug,
        categoryName: categories.name,
      })
      .from(priceRules)
      .leftJoin(products, eq(priceRules.productId, products.id))
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .orderBy(products.name, priceRules.createdAt);

    // Attach bands to each rule
    const ruleIds = rules.map((r: any) => r.id);
    let allBands: any[] = [];
    if (ruleIds.length > 0) {
      allBands = await db.select().from(priceBands).where(
        sql`${priceBands.priceRuleId} IN ${ruleIds}`
      );
    }
    const bandsByRule = new Map<string, any[]>();
    for (const band of allBands) {
      const list = bandsByRule.get(band.priceRuleId) || [];
      list.push(band);
      bandsByRule.set(band.priceRuleId, list);
    }
    const result = rules.map((r: any) => ({ ...r, bands: bandsByRule.get(r.id) || [] }));
    res.json(result);
  } catch (error) {
    console.error("Fetch price rules error:", error);
    res.status(500).json({ error: "Failed to fetch price rules" });
  }
});

app.post("/api/price-rules", authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const { productId, pricingModel, optionFilter, markupPercent, minCharge, currency, isInternalCost, bands } = req.body;
    if (!productId || !pricingModel) return res.status(400).json({ error: "Product and pricing model are required" });

    const [rule] = await db.insert(priceRules).values({
      productId,
      pricingModel,
      optionFilter: optionFilter || {},
      markupPercent: markupPercent != null ? String(markupPercent) : null,
      minCharge: minCharge || null,
      currency: currency || "TZS",
      isInternalCost: isInternalCost || false,
      createdBy: user.userId,
    }).returning();

    // Insert bands
    if (bands && bands.length > 0) {
      const bandRows = bands.map((b: any, i: number) => ({
        priceRuleId: rule.id,
        qtyMin: b.qtyMin != null ? Number(b.qtyMin) : null,
        qtyMax: b.qtyMax != null ? Number(b.qtyMax) : null,
        areaMin: b.areaMin != null ? String(b.areaMin) : null,
        areaMax: b.areaMax != null ? String(b.areaMax) : null,
        unitPriceMin: Number(b.unitPriceMin) || 0,
        unitPriceMax: b.unitPriceMax != null ? Number(b.unitPriceMax) : null,
        sideCount: b.sideCount != null ? Number(b.sideCount) : null,
        leafCount: b.leafCount != null ? Number(b.leafCount) : null,
        sortOrder: b.sortOrder ?? i,
      }));
      await db.insert(priceBands).values(bandRows);
    }

    res.status(201).json(rule);
  } catch (error: any) {
    console.error("Create price rule error:", error);
    res.status(500).json({ error: error.message || "Failed to create price rule" });
  }
});

app.put("/api/price-rules/:id", authMiddleware, async (req, res) => {
  try {
    const id = req.params.id as string;
    const { productId, pricingModel, optionFilter, markupPercent, minCharge, currency, isInternalCost, bands } = req.body;

    const [updated] = await db.update(priceRules).set({
      productId,
      pricingModel,
      optionFilter: optionFilter || {},
      markupPercent: markupPercent != null ? String(markupPercent) : null,
      minCharge: minCharge || null,
      currency: currency || "TZS",
      isInternalCost: isInternalCost || false,
    }).where(eq(priceRules.id, id)).returning();

    if (!updated) return res.status(404).json({ error: "Price rule not found" });

    // Replace bands: delete old, insert new
    if (bands !== undefined) {
      await db.delete(priceBands).where(eq(priceBands.priceRuleId, id));
      if (bands.length > 0) {
        const bandRows = bands.map((b: any, i: number) => ({
          priceRuleId: id,
          qtyMin: b.qtyMin != null ? Number(b.qtyMin) : null,
          qtyMax: b.qtyMax != null ? Number(b.qtyMax) : null,
          areaMin: b.areaMin != null ? String(b.areaMin) : null,
          areaMax: b.areaMax != null ? String(b.areaMax) : null,
          unitPriceMin: Number(b.unitPriceMin) || 0,
          unitPriceMax: b.unitPriceMax != null ? Number(b.unitPriceMax) : null,
          sideCount: b.sideCount != null ? Number(b.sideCount) : null,
          leafCount: b.leafCount != null ? Number(b.leafCount) : null,
          sortOrder: b.sortOrder ?? i,
        }));
        await db.insert(priceBands).values(bandRows);
      }
    }

    res.json(updated);
  } catch (error: any) {
    console.error("Update price rule error:", error);
    res.status(500).json({ error: error.message || "Failed to update price rule" });
  }
});

app.delete("/api/price-rules/:id", authMiddleware, async (req, res) => {
  try {
    const id = req.params.id as string;
    await db.delete(priceBands).where(eq(priceBands.priceRuleId, id));
    await db.delete(priceRules).where(eq(priceRules.id, id));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete price rule" });
  }
});

// ── Finishing Options CRUD ───────────────────────────────────────────────────

app.post("/api/finishing-options", authMiddleware, async (req, res) => {
  try {
    const { name, unit, price } = req.body;
    if (!name || !unit || price == null) return res.status(400).json({ error: "Name, unit, and price are required" });
    const [fo] = await db.insert(finishingOptions).values({ name, unit, price: Number(price) }).returning();
    res.status(201).json(fo);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to create finishing option" });
  }
});

app.put("/api/finishing-options/:id", authMiddleware, async (req, res) => {
  try {
    const id = req.params.id as string;
    const { name, unit, price } = req.body;
    const [updated] = await db.update(finishingOptions).set({ name, unit, price: Number(price) }).where(eq(finishingOptions.id, id)).returning();
    if (!updated) return res.status(404).json({ error: "Finishing option not found" });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to update finishing option" });
  }
});

app.delete("/api/finishing-options/:id", authMiddleware, async (req, res) => {
  try {
    const id = req.params.id as string;
    await db.delete(finishingOptions).where(eq(finishingOptions.id, id));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete finishing option" });
  }
});

app.get("/api/finishing-options", authMiddleware, async (req, res) => {
  try {
    const results = await db.select().from(finishingOptions);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch finishing options" });
  }
});

// ── Projects (completed work showcase) ─────────────────────────────────────

// In-memory projects store (no separate table needed for MVP showcase)
const projectsStore: Array<{
  id: string;
  title: string;
  description: string;
  clientName: string;
  category: string;
  images: string[];
  completedDate: string;
  featured: boolean;
  createdBy: string;
  createdAt: string;
}> = [];

app.get("/api/projects", async (_req, res) => {
  try {
    res.json(projectsStore.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

app.post("/api/projects", authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const { title, description, clientName, category, images, completedDate, featured } = req.body;
    if (!title) return res.status(400).json({ error: "Title is required" });
    const project = {
      id: `proj-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title,
      description: description || "",
      clientName: clientName || "",
      category: category || "",
      images: images || [],
      completedDate: completedDate || new Date().toISOString().split("T")[0],
      featured: featured || false,
      createdBy: user.userId,
      createdAt: new Date().toISOString(),
    };
    projectsStore.push(project);
    res.status(201).json(project);
  } catch (error) {
    console.error("Create project error:", error);
    res.status(500).json({ error: "Failed to create project" });
  }
});

app.put("/api/projects/:id", authMiddleware, async (req, res) => {
  try {
    const id = req.params.id as string;
    const idx = projectsStore.findIndex((p) => p.id === id);
    if (idx === -1) return res.status(404).json({ error: "Project not found" });
    const { title, description, clientName, category, images, completedDate, featured } = req.body;
    projectsStore[idx] = {
      ...projectsStore[idx],
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(clientName !== undefined && { clientName }),
      ...(category !== undefined && { category }),
      ...(images !== undefined && { images }),
      ...(completedDate !== undefined && { completedDate }),
      ...(featured !== undefined && { featured }),
    };
    res.json(projectsStore[idx]);
  } catch (error) {
    console.error("Update project error:", error);
    res.status(500).json({ error: "Failed to update project" });
  }
});

app.delete("/api/projects/:id", authMiddleware, async (req, res) => {
  try {
    const id = req.params.id as string;
    const idx = projectsStore.findIndex((p) => p.id === id);
    if (idx === -1) return res.status(404).json({ error: "Project not found" });
    projectsStore.splice(idx, 1);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete project" });
  }
});

// ── Direct Job Creation (admin creates jobs after client conversation) ────

app.post("/api/jobs", authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const { title, priority, dueDate, assignedTo, notes } = req.body;
    if (!title) return res.status(400).json({ error: "Title is required" });

    const year = new Date().getFullYear();
    const jobNumber = `JOB-${year}-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`;

    const [job] = await db
      .insert(jobs)
      .values({
        jobNumber,
        title,
        status: "confirmed",
        assignedTo: assignedTo || null,
        priority: priority || "normal",
        dueDate: dueDate || null,
      })
      .returning();

    await db.insert(jobStatusHistory).values({
      jobId: job.id,
      fromStatus: null,
      toStatus: "confirmed",
      changedBy: user.userId,
      note: notes || `Created by ${user.role}`,
    });

    res.status(201).json(job);
  } catch (error) {
    console.error("Create job error:", error);
    res.status(500).json({ error: "Failed to create job" });
  }
});

// ── Public projects (no auth required) ─────────────────────────────────────
app.get("/api/projects/public", async (_req, res) => {
  try {
    res.json(projectsStore.filter((p) => p.featured).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

// ── Contact form (public) ──────────────────────────────────────────────────

app.post("/api/contact", async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    const cleanName = typeof name === "string" ? name.trim() : "";
    const cleanEmail = typeof email === "string" ? email.trim() : "";
    const cleanSubject = typeof subject === "string" ? subject.trim() : "";
    const cleanMessage = typeof message === "string" ? message.trim() : "";

    if (!cleanName || !cleanEmail || !cleanSubject || !cleanMessage) {
      return res.status(400).json({ error: "Name, email, subject, and message are required" });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({ error: "Please provide a valid email address" });
    }
    if (cleanMessage.length > 5000) {
      return res.status(400).json({ error: "Message is too long (max 5000 characters)" });
    }

    const [created] = await db
      .insert(contactMessages)
      .values({
        name: cleanName.slice(0, 120),
        email: cleanEmail.slice(0, 160),
        phone: phone ? String(phone).trim().slice(0, 40) : null,
        subject: cleanSubject.slice(0, 200),
        message: cleanMessage.slice(0, 5000),
      })
      .returning();

    res.status(201).json(created);
  } catch (error) {
    console.error("Create contact message error:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
});

// ── Contact messages inbox (admin) ──────────────────────────────────────────

function isAdminUser(user: any): boolean {
  return user && user.role === "admin";
}

app.get("/api/contact-messages", authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    if (!isAdminUser(user)) return res.status(403).json({ error: "Admin access required" });
    const messages = await db
      .select()
      .from(contactMessages)
      .orderBy(sql`${contactMessages.createdAt} DESC NULLS LAST`);
    res.json(messages);
  } catch (error) {
    console.error("Fetch contact messages error:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

app.patch("/api/contact-messages/:id", authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    if (!isAdminUser(user)) return res.status(403).json({ error: "Admin access required" });
    const { status } = req.body;
    if (status !== "new" && status !== "read") {
      return res.status(400).json({ error: "Status must be 'new' or 'read'" });
    }
    const id = req.params.id as string;
    const [updated] = await db
      .update(contactMessages)
      .set({ status })
      .where(eq(contactMessages.id, id))
      .returning();
    if (!updated) return res.status(404).json({ error: "Message not found" });
    res.json(updated);
  } catch (error) {
    console.error("Update contact message error:", error);
    res.status(500).json({ error: "Failed to update message" });
  }
});

app.delete("/api/contact-messages/:id", authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    if (!isAdminUser(user)) return res.status(403).json({ error: "Admin access required" });
    const id = req.params.id as string;
    await db.delete(contactMessages).where(eq(contactMessages.id, id));
    res.json({ success: true });
  } catch (error) {
    console.error("Delete contact message error:", error);
    res.status(500).json({ error: "Failed to delete message" });
  }
});

// ── Admin: DB Migration endpoint ──────────────────────────────────────────
// GET /api/admin/migrate?key=<MIGRATE_KEY>  — opens in browser to trigger
// Copies all rows from SOURCE_DATABASE_URL (old DB) into DATABASE_URL (new DB).

app.get("/api/admin/migrate", async (req, res) => {
  try {
    const sourceUrl = process.env.SOURCE_DATABASE_URL;
    const targetUrl = process.env.DATABASE_URL;
    const migrateKey = process.env.MIGRATE_KEY;

    if (!migrateKey || req.query.key !== migrateKey) {
      return res.status(403).json({ error: "Invalid or missing MIGRATE_KEY. Add it to Vercel env vars and pass ?key=..." });
    }

    if (!sourceUrl) {
      return res.status(400).json({ error: "SOURCE_DATABASE_URL env var is not set. Add it in Vercel → Settings → Environment Variables." });
    }
    if (!targetUrl) {
      return res.status(400).json({ error: "DATABASE_URL env var is not set." });
    }

    // Dynamic imports to keep the rest of the bundle light
    const postgresMod = await import("postgres");
    const drizzleMod = await import("drizzle-orm/postgres-js");
    const schemaMod = await import("../db/schema");
    const bootstrapMod = await import("../db/bootstrap");
    const { count } = await import("drizzle-orm");

    const opts = { ssl: "require", max: 1, connect_timeout: 15, idle_timeout: 10 } as const;
    const source = postgresMod.default(sourceUrl, opts);
    const target = postgresMod.default(targetUrl, opts);
    const sourceDb = drizzleMod.drizzle(source, { schema: schemaMod });
    const targetDb = drizzleMod.drizzle(target, { schema: schemaMod });

    // 1. Migrate target schema
    await bootstrapMod.ensureSchemaWith(targetDb);

    // 2. Check if target already has data
    const force = req.query.force === 'true';
    const [existing] = await targetDb.select({ n: count() }).from(schemaMod.users);
    if ((existing?.n ?? 0) > 0 && !force) {
      await source.end();
      await target.end();
      return res.status(409).json({ error: "Target database already has users — aborting to avoid duplicates. Use ?force=true to overwrite, or create a fresh empty DB." });
    }

    // 2b. If force=true, truncate all tables in reverse FK order
    if (force && (existing?.n ?? 0) > 0) {
      const TRUNCATE_ORDER = [
        'chat_messages', 'chat_threads', 'contact_messages',
        'job_status_history', 'job_files', 'jobs',
        'orders', 'quote_lines', 'quotes',
        'inventory_movements', 'inventory_items',
        'price_bands', 'price_rules',
        'product_finishing_options', 'finishing_options',
        'product_option_values', 'product_options',
        'products', 'categories', 'users',
      ];
      for (const t of TRUNCATE_ORDER) {
        await targetDb.execute((await import('drizzle-orm')).sql.raw(`TRUNCATE TABLE ${t} CASCADE`));
      }
    }

    // 3. Foreign-key-safe copy order
    const TABLES: [string, any][] = [
      ["users", schemaMod.users],
      ["categories", schemaMod.categories],
      ["products", schemaMod.products],
      ["product_options", schemaMod.productOptions],
      ["product_option_values", schemaMod.productOptionValues],
      ["finishing_options", schemaMod.finishingOptions],
      ["product_finishing_options", schemaMod.productFinishingOptions],
      ["price_rules", schemaMod.priceRules],
      ["price_bands", schemaMod.priceBands],
      ["quotes", schemaMod.quotes],
      ["quote_lines", schemaMod.quoteLines],
      ["orders", schemaMod.orders],
      ["jobs", schemaMod.jobs],
      ["job_status_history", schemaMod.jobStatusHistory],
      ["job_files", schemaMod.jobFiles],
      ["inventory_items", schemaMod.inventoryItems],
      ["inventory_movements", schemaMod.inventoryMovements],
      ["chat_threads", schemaMod.chatThreads],
      ["chat_messages", schemaMod.chatMessages],
      ["contact_messages", schemaMod.contactMessages],
    ];

    const results: Record<string, { rows: number; error?: string }> = {};
    const BATCH = 200;

    for (const [tableName, tableSchema] of TABLES) {
      try {
        const rows: any[] = await sourceDb.select().from(tableSchema);
        if (rows.length === 0) { results[tableName] = { rows: 0 }; continue; }

        // Categories need topological insert (self-referencing parent_id)
        if (tableName === "categories") {
          const remaining = [...rows];
          const copiedIds = new Set<string>();
          let totalCopied = 0;
          while (remaining.length > 0) {
            const ready = remaining.filter(
              (r: any) => r.parentId === null || r.parentId === undefined || copiedIds.has(r.parentId),
            );
            if (ready.length === 0) break;
            for (let i = 0; i < ready.length; i += BATCH) {
              await targetDb.insert(tableSchema).values(ready.slice(i, i + BATCH));
            }
            totalCopied += ready.length;
            ready.forEach((r: any) => copiedIds.add(r.id));
            for (const r of ready) {
              const idx = remaining.findIndex((x: any) => x.id === r.id);
              if (idx !== -1) remaining.splice(idx, 1);
            }
          }
          results[tableName] = { rows: totalCopied, error: remaining.length > 0 ? `${remaining.length} orphaned` : undefined };
          continue;
        }

        for (let i = 0; i < rows.length; i += BATCH) {
          await targetDb.insert(tableSchema).values(rows.slice(i, i + BATCH));
        }
        results[tableName] = { rows: rows.length };
      } catch (err: any) {
        results[tableName] = { rows: 0, error: err.message?.slice(0, 200) || "unknown error" };
      }
    }

    await source.end();
    await target.end();

    const total = Object.values(results).reduce((s, r) => s + r.rows, 0);
    const errors = Object.entries(results).filter(([, r]) => r.error);

    res.json({ success: true, total, tables: results, errors: errors.length > 0 ? errors : undefined });
  } catch (error: any) {
    console.error("Migration error:", error);
    res.status(500).json({ error: error.message || "Migration failed" });
  }
});

// ── Inventory Dashboard Stats ─────────────────────────────────────────────

app.get("/api/inventory/dashboard", authMiddleware, async (_req, res) => {
  try {
    const allItems = await db.select().from(inventoryItems);
    const totalItems = allItems.length;
    const totalStockValue = allItems.reduce((sum: number, item: any) => sum + (item.unitCost || 0) * Number(item.currentQty), 0);
    const lowStockItems = allItems.filter((item: any) => Number(item.currentQty) <= Number(item.reorderLevel));
    const outOfStockItems = allItems.filter((item: any) => Number(item.currentQty) === 0);

    const categoryBreakdown: Record<string, { count: number; value: number }> = {};
    for (const item of allItems) {
      const cat = (item as any).category || "general";
      if (!categoryBreakdown[cat]) categoryBreakdown[cat] = { count: 0, value: 0 };
      categoryBreakdown[cat].count++;
      categoryBreakdown[cat].value += ((item as any).unitCost || 0) * Number((item as any).currentQty);
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentMovements = await db.select().from(inventoryMovements).where(sql`${inventoryMovements.createdAt} >= ${thirtyDaysAgo}`);

    const monthlyPurchases = recentMovements.filter((m: any) => m.movementType === "in").reduce((sum: number, m: any) => {
      const item = allItems.find((i: any) => i.id === m.itemId);
      return sum + ((item as any)?.unitCost || 0) * Number(m.quantity);
    }, 0);

    const monthlyUsage = recentMovements.filter((m: any) => m.movementType === "out" || m.movementType === "issue").reduce((sum: number, m: any) => {
      const item = allItems.find((i: any) => i.id === m.itemId);
      return sum + ((item as any)?.unitCost || 0) * Number(m.quantity);
    }, 0);

    const monthlyWaste = recentMovements.filter((m: any) => m.movementType === "waste").reduce((sum: number, m: any) => {
      const item = allItems.find((i: any) => i.id === m.itemId);
      return sum + ((item as any)?.unitCost || 0) * Number(m.quantity);
    }, 0);

    res.json({
      totalItems, totalStockValue,
      lowStockCount: lowStockItems.length,
      outOfStockCount: outOfStockItems.length,
      categoryBreakdown, monthlyPurchases, monthlyUsage, monthlyWaste,
      wastePercentage: monthlyUsage > 0 ? Math.round((monthlyWaste / (monthlyUsage + monthlyWaste)) * 100) : 0,
    });
  } catch (error) {
    console.error("Inventory dashboard error:", error);
    res.status(500).json({ error: "Failed to fetch inventory dashboard" });
  }
});

// ── Suppliers CRUD ──────────────────────────────────────────────────────────

// ── Material Categories CRUD ────────────────────────────────────────────────

app.get("/api/material-categories", authMiddleware, async (_req, res) => {
  try {
    const cats = await db.select().from(materialCategories).orderBy(sql`${materialCategories.sortOrder} ASC`);
    res.json(cats);
  } catch (error) {
    console.error("Fetch material categories error:", error);
    res.status(500).json({ error: "Failed to fetch material categories" });
  }
});

app.post("/api/material-categories", authMiddleware, async (req, res) => {
  try {
    const { name, value, color, icon, sortOrder } = req.body;
    if (!name || !value) return res.status(400).json({ error: "Name and value are required" });
    const [cat] = await db.insert(materialCategories).values({
      name, value: value.toLowerCase().replace(/\s+/g, "_"),
      color: color || null, icon: icon || null, sortOrder: sortOrder || 0,
    }).returning();
    res.status(201).json(cat);
  } catch (error: any) {
    console.error("Create material category error:", error);
    res.status(500).json({ error: error.message || "Failed to create category" });
  }
});

app.put("/api/material-categories/:id", authMiddleware, async (req, res) => {
  try {
    const id = req.params.id as string;
    const { name, value, color, icon, sortOrder, isActive } = req.body;
    const [updated] = await db.update(materialCategories).set({
      name, value: value?.toLowerCase().replace(/\s+/g, "_"),
      color, icon, sortOrder, isActive,
    }).where(eq(materialCategories.id, id)).returning();
    if (!updated) return res.status(404).json({ error: "Category not found" });
    res.json(updated);
  } catch (error: any) {
    console.error("Update material category error:", error);
    res.status(500).json({ error: error.message || "Failed to update category" });
  }
});

app.delete("/api/material-categories/:id", authMiddleware, async (req, res) => {
  try {
    const id = req.params.id as string;
    await db.delete(materialCategories).where(eq(materialCategories.id, id));
    res.json({ success: true });
  } catch (error) {
    console.error("Delete material category error:", error);
    res.status(500).json({ error: "Failed to delete category" });
  }
});


app.get("/api/suppliers", authMiddleware, async (_req, res) => {
  try {
    const allSuppliers = await db.select().from(suppliers).orderBy(sql`${suppliers.createdAt} DESC`);
    res.json(allSuppliers);
  } catch (error) {
    console.error("Fetch suppliers error:", error);
    res.status(500).json({ error: "Failed to fetch suppliers" });
  }
});

app.post("/api/suppliers", authMiddleware, async (req, res) => {
  try {
    const { name, contactPerson, email, phone, address, notes } = req.body;
    if (!name) return res.status(400).json({ error: "Name is required" });
    const [supplier] = await db.insert(suppliers).values({
      name, contactPerson: contactPerson || null, email: email || null,
      phone: phone || null, address: address || null, notes: notes || null,
    }).returning();
    res.status(201).json(supplier);
  } catch (error: any) {
    console.error("Create supplier error:", error);
    res.status(500).json({ error: error.message || "Failed to create supplier" });
  }
});

app.put("/api/suppliers/:id", authMiddleware, async (req, res) => {
  try {
    const id = req.params.id as string;
    const { name, contactPerson, email, phone, address, notes, isActive } = req.body;
    const [updated] = await db.update(suppliers).set({
      name, contactPerson, email, phone, address, notes, isActive,
    }).where(eq(suppliers.id, id)).returning();
    if (!updated) return res.status(404).json({ error: "Supplier not found" });
    res.json(updated);
  } catch (error: any) {
    console.error("Update supplier error:", error);
    res.status(500).json({ error: error.message || "Failed to update supplier" });
  }
});

app.delete("/api/suppliers/:id", authMiddleware, async (req, res) => {
  try {
    const id = req.params.id as string;
    await db.delete(suppliers).where(eq(suppliers.id, id));
    res.json({ success: true });
  } catch (error) {
    console.error("Delete supplier error:", error);
    res.status(500).json({ error: "Failed to delete supplier" });
  }
});

// ── Purchase Orders CRUD ────────────────────────────────────────────────────

app.get("/api/purchase-orders", authMiddleware, async (_req, res) => {
  try {
    const allOrders = await db.select({
      id: purchaseOrders.id, orderNumber: purchaseOrders.orderNumber,
      supplierId: purchaseOrders.supplierId, status: purchaseOrders.status,
      totalAmount: purchaseOrders.totalAmount, notes: purchaseOrders.notes,
      expectedDate: purchaseOrders.expectedDate, receivedDate: purchaseOrders.receivedDate,
      createdBy: purchaseOrders.createdBy, createdAt: purchaseOrders.createdAt,
      supplierName: suppliers.name,
    }).from(purchaseOrders).leftJoin(suppliers, eq(purchaseOrders.supplierId, suppliers.id))
      .orderBy(sql`${purchaseOrders.createdAt} DESC`);
    res.json(allOrders);
  } catch (error) {
    console.error("Fetch purchase orders error:", error);
    res.status(500).json({ error: "Failed to fetch purchase orders" });
  }
});

app.get("/api/purchase-orders/:id", authMiddleware, async (req, res) => {
  try {
    const id = req.params.id as string;
    const [order] = await db.select({
      id: purchaseOrders.id, orderNumber: purchaseOrders.orderNumber,
      supplierId: purchaseOrders.supplierId, status: purchaseOrders.status,
      totalAmount: purchaseOrders.totalAmount, notes: purchaseOrders.notes,
      expectedDate: purchaseOrders.expectedDate, receivedDate: purchaseOrders.receivedDate,
      createdBy: purchaseOrders.createdBy, createdAt: purchaseOrders.createdAt,
      supplierName: suppliers.name,
    }).from(purchaseOrders).leftJoin(suppliers, eq(purchaseOrders.supplierId, suppliers.id))
      .where(eq(purchaseOrders.id, id));
    if (!order) return res.status(404).json({ error: "Purchase order not found" });
    const items = await db.select({
      id: purchaseOrderItems.id, inventoryItemId: purchaseOrderItems.inventoryItemId,
      quantity: purchaseOrderItems.quantity, unitCost: purchaseOrderItems.unitCost,
      totalCost: purchaseOrderItems.totalCost, itemName: inventoryItems.name, itemUnit: inventoryItems.unit,
    }).from(purchaseOrderItems).leftJoin(inventoryItems, eq(purchaseOrderItems.inventoryItemId, inventoryItems.id))
      .where(eq(purchaseOrderItems.purchaseOrderId, id));
    res.json({ ...order, items });
  } catch (error) {
    console.error("Fetch purchase order error:", error);
    res.status(500).json({ error: "Failed to fetch purchase order" });
  }
});

app.post("/api/purchase-orders", authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const { supplierId, notes, expectedDate, items } = req.body;
    if (!supplierId) return res.status(400).json({ error: "Supplier is required" });
    const year = new Date().getFullYear();
    const orderNumber = `PO-${year}-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`;
    const totalAmount = items?.reduce((sum: number, item: any) => sum + (Number(item.unitCost) * Number(item.quantity)), 0) || 0;
    const [order] = await db.insert(purchaseOrders).values({
      orderNumber, supplierId, notes: notes || null,
      expectedDate: expectedDate || null, totalAmount, createdBy: user.userId,
    }).returning();
    if (items && items.length > 0) {
      await db.insert(purchaseOrderItems).values(items.map((item: any) => ({
        purchaseOrderId: order.id, inventoryItemId: item.inventoryItemId,
        quantity: String(item.quantity), unitCost: Number(item.unitCost),
        totalCost: Number(item.unitCost) * Number(item.quantity),
      })));
    }
    res.status(201).json(order);
  } catch (error: any) {
    console.error("Create purchase order error:", error);
    res.status(500).json({ error: error.message || "Failed to create purchase order" });
  }
});

app.patch("/api/purchase-orders/:id/status", authMiddleware, async (req, res) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;
    const updates: Record<string, any> = { status };
    if (status === "received") updates.receivedDate = new Date().toISOString().split("T")[0];
    const [updated] = await db.update(purchaseOrders).set(updates).where(eq(purchaseOrders.id, id)).returning();
    if (!updated) return res.status(404).json({ error: "Purchase order not found" });
    res.json(updated);
  } catch (error) {
    console.error("Update purchase order status error:", error);
    res.status(500).json({ error: "Failed to update status" });
  }
});

app.delete("/api/purchase-orders/:id", authMiddleware, async (req, res) => {
  try {
    const id = req.params.id as string;
    await db.delete(purchaseOrderItems).where(eq(purchaseOrderItems.purchaseOrderId, id));
    await db.delete(purchaseOrders).where(eq(purchaseOrders.id, id));
    res.json({ success: true });
  } catch (error) {
    console.error("Delete purchase order error:", error);
    res.status(500).json({ error: "Failed to delete purchase order" });
  }
});

// ── Material Issuances (job-linked) ────────────────────────────────────────

app.get("/api/material-issuances", authMiddleware, async (req, res) => {
  try {
    const jobId = req.query.jobId as string;
    let query = db.select({
      id: materialIssuances.id, jobId: materialIssuances.jobId,
      inventoryItemId: materialIssuances.inventoryItemId,
      quantityIssued: materialIssuances.quantityIssued,
      quantityUsed: materialIssuances.quantityUsed,
      quantityReturned: materialIssuances.quantityReturned,
      quantityWaste: materialIssuances.quantityWaste,
      wasteReason: materialIssuances.wasteReason,
      status: materialIssuances.status, issuedBy: materialIssuances.issuedBy,
      issuedAt: materialIssuances.issuedAt, returnedAt: materialIssuances.returnedAt,
      notes: materialIssuances.notes,
      itemName: inventoryItems.name, itemUnit: inventoryItems.unit,
      jobTitle: jobs.title, jobNumber: jobs.jobNumber,
      issuedByName: users.fullName,
    }).from(materialIssuances)
      .leftJoin(inventoryItems, eq(materialIssuances.inventoryItemId, inventoryItems.id))
      .leftJoin(jobs, eq(materialIssuances.jobId, jobs.id))
      .leftJoin(users, eq(materialIssuances.issuedBy, users.id));
    if (jobId) query = query.where(eq(materialIssuances.jobId, jobId)) as any;
    const result = await query.orderBy(sql`${materialIssuances.issuedAt} DESC`);
    res.json(result);
  } catch (error) {
    console.error("Fetch material issuances error:", error);
    res.status(500).json({ error: "Failed to fetch material issuances" });
  }
});

app.post("/api/material-issuances", authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const { jobId, inventoryItemId, quantityIssued, notes } = req.body;
    if (!jobId || !inventoryItemId || !quantityIssued) return res.status(400).json({ error: "Job, item, and quantity are required" });
    const [item] = await db.select().from(inventoryItems).where(eq(inventoryItems.id, inventoryItemId));
    if (!item) return res.status(404).json({ error: "Inventory item not found" });
    if (Number(quantityIssued) > Number((item as any).currentQty)) return res.status(400).json({ error: "Insufficient stock" });
    const newQty = Number((item as any).currentQty) - Number(quantityIssued);
    await db.update(inventoryItems).set({ currentQty: newQty.toString() }).where(eq(inventoryItems.id, inventoryItemId));
    await db.insert(inventoryMovements).values({
      itemId: inventoryItemId, jobId, movementType: "issue",
      quantity: quantityIssued.toString(), reason: notes || "Material issued to job",
      createdBy: user.userId,
    });
    const [issuance] = await db.insert(materialIssuances).values({
      jobId, inventoryItemId, quantityIssued: quantityIssued.toString(),
      issuedBy: user.userId, notes: notes || null,
    }).returning();
    res.status(201).json(issuance);
  } catch (error) {
    console.error("Create material issuance error:", error);
    res.status(500).json({ error: "Failed to create material issuance" });
  }
});

app.patch("/api/material-issuances/:id/return", authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const id = req.params.id as string;
    const { quantityReturned, quantityUsed, quantityWaste, wasteReason } = req.body;
    const [issuance] = await db.select().from(materialIssuances).where(eq(materialIssuances.id, id));
    if (!issuance) return res.status(404).json({ error: "Issuance not found" });
    const returned = Number(quantityReturned || 0);
    const used = Number(quantityUsed || 0);
    const waste = Number(quantityWaste || 0);
    const newStatus = returned > 0 && used > 0 ? "partial_return" : returned >= Number(issuance.quantityIssued) ? "returned" : "consumed";
    await db.update(materialIssuances).set({
      quantityReturned: String(returned), quantityUsed: String(used),
      quantityWaste: String(waste), wasteReason: wasteReason || null,
      status: newStatus, returnedAt: new Date(),
    }).where(eq(materialIssuances.id, id));
    if (returned > 0) {
      const [item] = await db.select().from(inventoryItems).where(eq(inventoryItems.id, issuance.inventoryItemId));
      if (item) {
        await db.update(inventoryItems).set({ currentQty: (Number((item as any).currentQty) + returned).toString() }).where(eq(inventoryItems.id, issuance.inventoryItemId));
        await db.insert(inventoryMovements).values({
          itemId: issuance.inventoryItemId, jobId: issuance.jobId,
          movementType: "return_to_stock", quantity: String(returned),
          reason: "Material returned from job", createdBy: user.userId,
        });
      }
    }
    if (waste > 0) {
      await db.insert(inventoryMovements).values({
        itemId: issuance.inventoryItemId, jobId: issuance.jobId,
        movementType: "waste", quantity: String(waste),
        reason: wasteReason || "Production waste", wasteReason: wasteReason || null,
        createdBy: user.userId,
      });
    }
    res.json({ success: true, status: newStatus });
  } catch (error) {
    console.error("Return material error:", error);
    res.status(500).json({ error: "Failed to process return" });
  }
});

// ── Job Material Cost Summary ───────────────────────────────────────────────

app.get("/api/jobs/:id/material-cost", authMiddleware, async (req, res) => {
  try {
    const jobId = req.params.id as string;
    const issuances = await db.select({
      id: materialIssuances.id, inventoryItemId: materialIssuances.inventoryItemId,
      quantityIssued: materialIssuances.quantityIssued,
      quantityUsed: materialIssuances.quantityUsed,
      quantityReturned: materialIssuances.quantityReturned,
      quantityWaste: materialIssuances.quantityWaste,
      itemName: inventoryItems.name, itemUnit: inventoryItems.unit,
      unitCost: inventoryItems.unitCost,
    }).from(materialIssuances)
      .leftJoin(inventoryItems, eq(materialIssuances.inventoryItemId, inventoryItems.id))
      .where(eq(materialIssuances.jobId, jobId));
    let totalMaterialCost = 0;
    let totalWasteCost = 0;
    const breakdown = issuances.map((iss: any) => {
      const unitCost = iss.unitCost || 0;
      const waste = Number(iss.quantityWaste || 0);
      const issued = Number(iss.quantityIssued);
      const cost = unitCost * issued;
      const wasteCost = unitCost * waste;
      totalMaterialCost += cost;
      totalWasteCost += wasteCost;
      return { ...iss, cost, wasteCost };
    });
    res.json({ jobId, totalMaterialCost, totalWasteCost, netCost: totalMaterialCost - totalWasteCost, items: breakdown });
  } catch (error) {
    console.error("Fetch job material cost error:", error);
    res.status(500).json({ error: "Failed to fetch material cost" });
  }
});

// ── Start Server ────────────────────────────────────────────────────────────

const PORT = process.env.API_PORT || 3001;

// Full idempotent schema bootstrap (enums → tables → indexes → additive
// columns). Mirrors src/db/schema.ts and is safe to run on every start — a
// brand-new database is brought fully up to date, an existing one is a no-op.
// On Vercel it is deliberately NOT run at cold start: the schema is migrated
// once per deploy during the build (vercel.json buildCommand runs
// db:migrate:auto), and repeating ~60 DDL statements inside every serverless
// cold start would grab the instance's only connection and add connection
// pressure.
if (process.env.VERCEL) {
  console.log("PrintHub API running as a Vercel serverless function");
} else {
  ensureSchema()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`PrintHub API server running on port ${PORT}`);
      });
    })
    .catch((error) => {
      console.error("Schema bootstrap failed — API will not start:", error);
      process.exit(1);
    });
}

export default app;
