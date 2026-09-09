import { db } from "../db/index";
import {
  customerProfiles,
  serviceItems,
  estimates,
  estimateLines,
  invoices,
  invoiceLines,
  payments,
  recurringInvoices,
  invoiceSettings,
  users,
  quotes,
  quoteLines,
  orders,
} from "../db/schema";
import { eq, sql, and } from "drizzle-orm";

function isStaffUser(user: any): boolean {
  return ["admin", "sales", "production", "inventory_manager"].includes(user?.role);
}

export default function registerBillingRoutes(app: any, authMiddleware: any) {
  // ── Customer Profiles ──────────────────────────────────────────────────────

  app.get("/api/customer-profiles", authMiddleware, async (_req: any, res: any) => {
    try {
      const profiles = await db.select({
        id: customerProfiles.id, userId: customerProfiles.userId,
        businessName: customerProfiles.businessName, billingAddress: customerProfiles.billingAddress,
        shippingAddress: customerProfiles.shippingAddress, taxId: customerProfiles.taxId,
        paymentTerms: customerProfiles.paymentTerms, creditLimit: customerProfiles.creditLimit,
        currency: customerProfiles.currency, notes: customerProfiles.notes, createdAt: customerProfiles.createdAt,
        userName: users.fullName, userEmail: users.email, userPhone: users.phone,
      }).from(customerProfiles).leftJoin(users, eq(customerProfiles.userId, users.id));
      res.json(profiles);
    } catch (error) { console.error("Fetch customer profiles error:", error); res.status(500).json({ error: "Failed" }); }
  });

  app.get("/api/customer-profiles/:id", authMiddleware, async (req: any, res: any) => {
    try {
      const [profile] = await db.select({
        id: customerProfiles.id, userId: customerProfiles.userId,
        businessName: customerProfiles.businessName, billingAddress: customerProfiles.billingAddress,
        shippingAddress: customerProfiles.shippingAddress, taxId: customerProfiles.taxId,
        paymentTerms: customerProfiles.paymentTerms, creditLimit: customerProfiles.creditLimit,
        currency: customerProfiles.currency, notes: customerProfiles.notes, createdAt: customerProfiles.createdAt,
        userName: users.fullName, userEmail: users.email, userPhone: users.phone,
      }).from(customerProfiles).leftJoin(users, eq(customerProfiles.userId, users.id))
        .where(eq(customerProfiles.id, req.params.id));
      if (!profile) return res.status(404).json({ error: "Profile not found" });
      res.json(profile);
    } catch (error) { console.error("Fetch customer profile error:", error); res.status(500).json({ error: "Failed" }); }
  });

  app.post("/api/customer-profiles", authMiddleware, async (req: any, res: any) => {
    try {
      const { userId, businessName, billingAddress, shippingAddress, taxId, paymentTerms, creditLimit, currency, notes } = req.body;
      if (!userId) return res.status(400).json({ error: "userId is required" });
      const [existing] = await db.select().from(customerProfiles).where(eq(customerProfiles.userId, userId));
      if (existing) return res.status(409).json({ error: "Profile already exists" });
      const [profile] = await db.insert(customerProfiles).values({ userId, businessName, billingAddress, shippingAddress, taxId, paymentTerms: paymentTerms || 30, creditLimit, currency: currency || "TZS", notes }).returning();
      res.status(201).json(profile);
    } catch (error: any) { console.error("Create customer profile error:", error); res.status(500).json({ error: error.message || "Failed" }); }
  });

  // Create a new customer user + profile in one step
  app.post("/api/customer-profiles/create-customer", authMiddleware, async (req: any, res: any) => {
    try {
      const { fullName, email, phone, businessName, billingAddress, shippingAddress, taxId, paymentTerms, creditLimit, currency, notes } = req.body;
      if (!fullName) return res.status(400).json({ error: "Full name is required" });
      if (!email && !phone) return res.status(400).json({ error: "Email or phone is required" });
      // Check for duplicate email/phone
      if (email) {
        const [emailExists] = await db.select().from(users).where(eq(users.email, email));
        if (emailExists) return res.status(409).json({ error: "A user with this email already exists" });
      }
      if (phone) {
        const [phoneExists] = await db.select().from(users).where(eq(users.phone, phone));
        if (phoneExists) return res.status(409).json({ error: "A user with this phone already exists" });
      }
      // Create the user with role "customer"
      const [newUser] = await db.insert(users).values({
        fullName,
        email: email || null,
        phone: phone || null,
        role: "customer",
        isActive: true,
      }).returning();
      // Create the billing profile linked to the new user
      const [profile] = await db.insert(customerProfiles).values({
        userId: newUser.id,
        businessName: businessName || fullName,
        billingAddress: billingAddress || "",
        shippingAddress: shippingAddress || "",
        taxId: taxId || null,
        paymentTerms: paymentTerms || 30,
        creditLimit: creditLimit || 0,
        currency: currency || "TZS",
        notes: notes || null,
      }).returning();
      res.status(201).json({ user: { id: newUser.id, fullName: newUser.fullName, email: newUser.email, phone: newUser.phone }, profile });
    } catch (error: any) {
      console.error("Create customer error:", error);
      res.status(500).json({ error: error.message || "Failed to create customer" });
    }
  });

  app.put("/api/customer-profiles/:id", authMiddleware, async (req: any, res: any) => {
    try {
      const { businessName, billingAddress, shippingAddress, taxId, paymentTerms, creditLimit, currency, notes } = req.body;
      const [updated] = await db.update(customerProfiles).set({ businessName, billingAddress, shippingAddress, taxId, paymentTerms, creditLimit, currency, notes }).where(eq(customerProfiles.id, req.params.id)).returning();
      if (!updated) return res.status(404).json({ error: "Not found" });
      res.json(updated);
    } catch (error) { console.error("Update customer profile error:", error); res.status(500).json({ error: "Failed" }); }
  });

  app.delete("/api/customer-profiles/:id", authMiddleware, async (req: any, res: any) => {
    try {
      await db.delete(customerProfiles).where(eq(customerProfiles.id, req.params.id));
      res.json({ success: true });
    } catch (error) { console.error("Delete customer profile error:", error); res.status(500).json({ error: "Failed" }); }
  });

  // ── Service Items ───────────────────────────────────────────────────────────

  app.get("/api/service-items", authMiddleware, async (_req: any, res: any) => {
    try {
      const items = await db.select().from(serviceItems).orderBy(serviceItems.name);
      res.json(items);
    } catch (error) { console.error("Fetch service items error:", error); res.status(500).json({ error: "Failed" }); }
  });

  app.get("/api/service-items/:id", authMiddleware, async (req: any, res: any) => {
    try {
      const [item] = await db.select().from(serviceItems).where(eq(serviceItems.id, req.params.id));
      if (!item) return res.status(404).json({ error: "Not found" });
      res.json(item);
    } catch (error) { console.error("Fetch service item error:", error); res.status(500).json({ error: "Failed" }); }
  });

  app.post("/api/service-items", authMiddleware, async (req: any, res: any) => {
    try {
      const { name, description, unitPrice, costPrice, taxRate, type, unit, linkedProductId } = req.body;
      if (!name) return res.status(400).json({ error: "Name is required" });
      const [item] = await db.insert(serviceItems).values({ name, description, unitPrice: unitPrice || 0, costPrice: costPrice || 0, taxRate: taxRate || "0", type: type || "product", unit: unit || "piece", linkedProductId: linkedProductId || null }).returning();
      res.status(201).json(item);
    } catch (error: any) { console.error("Create service item error:", error); res.status(500).json({ error: error.message || "Failed" }); }
  });

  app.put("/api/service-items/:id", authMiddleware, async (req: any, res: any) => {
    try {
      const { name, description, unitPrice, costPrice, taxRate, type, unit, isActive, linkedProductId } = req.body;
      const [updated] = await db.update(serviceItems).set({ name, description, unitPrice, costPrice, taxRate, type, unit, isActive, linkedProductId }).where(eq(serviceItems.id, req.params.id)).returning();
      if (!updated) return res.status(404).json({ error: "Not found" });
      res.json(updated);
    } catch (error) { console.error("Update service item error:", error); res.status(500).json({ error: "Failed" }); }
  });

  app.delete("/api/service-items/:id", authMiddleware, async (req: any, res: any) => {
    try {
      await db.delete(serviceItems).where(eq(serviceItems.id, req.params.id));
      res.json({ success: true });
    } catch (error) { console.error("Delete service item error:", error); res.status(500).json({ error: "Failed" }); }
  });

  // ── Estimates ───────────────────────────────────────────────────────────────

  app.get("/api/estimates", authMiddleware, async (req: any, res: any) => {
    try {
      const user = req.user;
      let base = db.select({
        id: estimates.id, estimateNumber: estimates.estimateNumber, customerId: estimates.customerId,
        status: estimates.status, validUntil: estimates.validUntil,
        subtotal: estimates.subtotal, taxTotal: estimates.taxTotal, total: estimates.total,
        notes: estimates.notes, terms: estimates.terms, createdAt: estimates.createdAt,
        customerName: users.fullName, customerEmail: users.email,
      }).from(estimates).leftJoin(users, eq(estimates.customerId, users.id));
      if (!isStaffUser(user)) base = base.where(eq(estimates.customerId, user.userId)) as any;
      const rows = await base.orderBy(sql`${estimates.createdAt} DESC`);
      const estimateIds = rows.map((r: any) => r.id);
      let allLines: any[] = [];
      if (estimateIds.length > 0) allLines = await db.select().from(estimateLines).where(sql`${estimateLines.estimateId} IN ${estimateIds}`);
      const linesByEstimate = new Map<string, any[]>();
      for (const line of allLines) { const list = linesByEstimate.get(line.estimateId) || []; list.push(line); linesByEstimate.set(line.estimateId, list); }
      res.json(rows.map((r: any) => ({ ...r, lines: linesByEstimate.get(r.id) || [] })));
    } catch (error) { console.error("Fetch estimates error:", error); res.status(500).json({ error: "Failed" }); }
  });

  app.get("/api/estimates/:id", authMiddleware, async (req: any, res: any) => {
    try {
      const [estimate] = await db.select({
        id: estimates.id, estimateNumber: estimates.estimateNumber, customerId: estimates.customerId,
        status: estimates.status, validUntil: estimates.validUntil,
        subtotal: estimates.subtotal, taxTotal: estimates.taxTotal, total: estimates.total,
        notes: estimates.notes, terms: estimates.terms, createdAt: estimates.createdAt,
        customerName: users.fullName, customerEmail: users.email,
      }).from(estimates).leftJoin(users, eq(estimates.customerId, users.id)).where(eq(estimates.id, req.params.id));
      if (!estimate) return res.status(404).json({ error: "Not found" });
      const lines = await db.select().from(estimateLines).where(eq(estimateLines.estimateId, req.params.id));
      res.json({ ...estimate, lines });
    } catch (error) { console.error("Fetch estimate error:", error); res.status(500).json({ error: "Failed" }); }
  });

  app.post("/api/estimates", authMiddleware, async (req: any, res: any) => {
    try {
      const user = req.user;
      const { customerId, validUntil, notes, terms, lines } = req.body;
      if (!customerId) return res.status(400).json({ error: "Customer is required" });
      const year = new Date().getFullYear();
      const estimateNumber = `EST-${year}-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`;
      let subtotal = 0, taxTotal = 0;
      if (lines && lines.length > 0) { for (const line of lines) { const lt = (line.quantity || 1) * (line.unitPrice || 0); subtotal += lt; taxTotal += Math.round(lt * (parseFloat(line.taxRate || "0") / 100)); } }
      const total = subtotal + taxTotal;
      const [estimate] = await db.insert(estimates).values({ estimateNumber, customerId, createdBy: user.userId, status: "draft", validUntil: validUntil || null, subtotal, taxTotal, total, notes, terms }).returning();
      if (lines && lines.length > 0) await db.insert(estimateLines).values(lines.map((l: any, i: number) => ({ estimateId: estimate.id, serviceItemId: l.serviceItemId || null, productId: l.productId || null, description: l.description, quantity: l.quantity || 1, unitPrice: l.unitPrice || 0, taxRate: l.taxRate || "0", lineTotal: (l.quantity || 1) * (l.unitPrice || 0), sortOrder: i })));
      res.status(201).json(estimate);
    } catch (error: any) { console.error("Create estimate error:", error); res.status(500).json({ error: error.message || "Failed" }); }
  });

  app.put("/api/estimates/:id", authMiddleware, async (req: any, res: any) => {
    try {
      const { customerId, status, validUntil, notes, terms, lines } = req.body;
      let subtotal = 0, taxTotal = 0;
      if (lines && lines.length > 0) { for (const line of lines) { const lt = (line.quantity || 1) * (line.unitPrice || 0); subtotal += lt; taxTotal += Math.round(lt * (parseFloat(line.taxRate || "0") / 100)); } }
      const total = subtotal + taxTotal;
      const [updated] = await db.update(estimates).set({ customerId, status, validUntil, notes, terms, subtotal, taxTotal, total }).where(eq(estimates.id, req.params.id)).returning();
      if (!updated) return res.status(404).json({ error: "Not found" });
      if (lines !== undefined) { await db.delete(estimateLines).where(eq(estimateLines.estimateId, req.params.id)); if (lines.length > 0) await db.insert(estimateLines).values(lines.map((l: any, i: number) => ({ estimateId: req.params.id, serviceItemId: l.serviceItemId || null, productId: l.productId || null, description: l.description, quantity: l.quantity || 1, unitPrice: l.unitPrice || 0, taxRate: l.taxRate || "0", lineTotal: (l.quantity || 1) * (l.unitPrice || 0), sortOrder: i }))); }
      res.json(updated);
    } catch (error) { console.error("Update estimate error:", error); res.status(500).json({ error: "Failed" }); }
  });

  app.delete("/api/estimates/:id", authMiddleware, async (req: any, res: any) => {
    try {
      await db.delete(estimateLines).where(eq(estimateLines.estimateId, req.params.id));
      await db.delete(estimates).where(eq(estimates.id, req.params.id));
      res.json({ success: true });
    } catch (error) { console.error("Delete estimate error:", error); res.status(500).json({ error: "Failed" }); }
  });

  app.post("/api/estimates/:id/convert-to-invoice", authMiddleware, async (req: any, res: any) => {
    try {
      const user = req.user;
      const [estimate] = await db.select().from(estimates).where(eq(estimates.id, req.params.id));
      if (!estimate) return res.status(404).json({ error: "Not found" });
      if (estimate.status === "invoiced") return res.status(400).json({ error: "Already invoiced" });
      const year = new Date().getFullYear();
      const invoiceNumber = `INV-${year}-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`;
      const { paymentTerms } = req.body;
      const dueDate = new Date(); dueDate.setDate(dueDate.getDate() + (paymentTerms || 30));
      const [invoice] = await db.insert(invoices).values({ invoiceNumber, customerId: estimate.customerId, createdBy: user.userId, estimateId: estimate.id, status: "draft", subtotal: estimate.subtotal, taxTotal: estimate.taxTotal, total: estimate.total, amountPaid: 0, dueDate: dueDate.toISOString().split("T")[0], paymentTerms: paymentTerms || 30, notes: estimate.notes, terms: estimate.terms }).returning();
      const estLines = await db.select().from(estimateLines).where(eq(estimateLines.estimateId, req.params.id));
      if (estLines.length > 0) await db.insert(invoiceLines).values(estLines.map((l, i) => ({ invoiceId: invoice.id, serviceItemId: l.serviceItemId, productId: l.productId, description: l.description, quantity: l.quantity, unitPrice: l.unitPrice, taxRate: l.taxRate, lineTotal: l.lineTotal, sortOrder: i })));
      await db.update(estimates).set({ status: "invoiced" }).where(eq(estimates.id, req.params.id));
      res.status(201).json(invoice);
    } catch (error: any) { console.error("Convert estimate error:", error); res.status(500).json({ error: error.message || "Failed" }); }
  });

  // ── Invoices ────────────────────────────────────────────────────────────────

  app.get("/api/invoices", authMiddleware, async (req: any, res: any) => {
    try {
      const user = req.user;
      // Auto-update overdue: mark invoices past due date as 'overdue' if still in draft/sent/viewed status
      const today = new Date().toISOString().split("T")[0];
      await db.update(invoices).set({ status: "overdue" }).where(sql`${invoices.dueDate} < ${today} AND ${invoices.status} IN ('draft','sent','viewed') AND ${invoices.amountPaid} < ${invoices.total}`);
      let base = db.select({
        id: invoices.id, invoiceNumber: invoices.invoiceNumber, customerId: invoices.customerId,
        estimateId: invoices.estimateId, orderId: invoices.orderId, quoteId: invoices.quoteId, jobId: invoices.jobId,
        status: invoices.status, subtotal: invoices.subtotal, taxTotal: invoices.taxTotal, total: invoices.total,
        amountPaid: invoices.amountPaid, dueDate: invoices.dueDate, paymentTerms: invoices.paymentTerms,
        notes: invoices.notes, terms: invoices.terms, createdAt: invoices.createdAt,
        customerName: users.fullName, customerEmail: users.email,
      }).from(invoices).leftJoin(users, eq(invoices.customerId, users.id));
      if (!isStaffUser(user)) base = base.where(eq(invoices.customerId, user.userId)) as any;
      const rows = await base.orderBy(sql`${invoices.createdAt} DESC`);
      const invoiceIds = rows.map((r: any) => r.id);
      let allLines: any[] = [];
      if (invoiceIds.length > 0) allLines = await db.select().from(invoiceLines).where(sql`${invoiceLines.invoiceId} IN ${invoiceIds}`);
      const linesByInvoice = new Map<string, any[]>();
      for (const line of allLines) { const list = linesByInvoice.get(line.invoiceId) || []; list.push(line); linesByInvoice.set(line.invoiceId, list); }
      res.json(rows.map((r: any) => ({ ...r, lines: linesByInvoice.get(r.id) || [] })));
    } catch (error) { console.error("Fetch invoices error:", error); res.status(500).json({ error: "Failed" }); }
  });

  app.get("/api/invoices/:id", authMiddleware, async (req: any, res: any) => {
    try {
      const [invoice] = await db.select({
        id: invoices.id, invoiceNumber: invoices.invoiceNumber, customerId: invoices.customerId,
        estimateId: invoices.estimateId, orderId: invoices.orderId, quoteId: invoices.quoteId, jobId: invoices.jobId,
        status: invoices.status, subtotal: invoices.subtotal, taxTotal: invoices.taxTotal, total: invoices.total,
        amountPaid: invoices.amountPaid, dueDate: invoices.dueDate, paymentTerms: invoices.paymentTerms,
        notes: invoices.notes, terms: invoices.terms, createdAt: invoices.createdAt,
        customerName: users.fullName, customerEmail: users.email,
      }).from(invoices).leftJoin(users, eq(invoices.customerId, users.id)).where(eq(invoices.id, req.params.id));
      if (!invoice) return res.status(404).json({ error: "Not found" });
      const lines = await db.select().from(invoiceLines).where(eq(invoiceLines.invoiceId, req.params.id));
      const invoicePayments = await db.select().from(payments).where(eq(payments.invoiceId, req.params.id));
      res.json({ ...invoice, lines, payments: invoicePayments });
    } catch (error) { console.error("Fetch invoice error:", error); res.status(500).json({ error: "Failed" }); }
  });

  app.post("/api/invoices", authMiddleware, async (req: any, res: any) => {
    try {
      const user = req.user;
      const { customerId, estimateId, orderId, quoteId, jobId, dueDate, paymentTerms, notes, terms, lines } = req.body;
      if (!customerId) return res.status(400).json({ error: "Customer is required" });
      const year = new Date().getFullYear();
      const invoiceNumber = `INV-${year}-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`;
      let subtotal = 0, taxTotal = 0;
      if (lines && lines.length > 0) { for (const line of lines) { const lt = (line.quantity || 1) * (line.unitPrice || 0); subtotal += lt; taxTotal += Math.round(lt * (parseFloat(line.taxRate || "0") / 100)); } }
      const total = subtotal + taxTotal;
      const [invoice] = await db.insert(invoices).values({ invoiceNumber, customerId, createdBy: user.userId, estimateId: estimateId || null, orderId: orderId || null, quoteId: quoteId || null, jobId: jobId || null, status: "draft", subtotal, taxTotal, total, amountPaid: 0, dueDate: dueDate || null, paymentTerms: paymentTerms || 30, notes, terms }).returning();
      if (lines && lines.length > 0) await db.insert(invoiceLines).values(lines.map((l: any, i: number) => ({ invoiceId: invoice.id, serviceItemId: l.serviceItemId || null, productId: l.productId || null, description: l.description, quantity: l.quantity || 1, unitPrice: l.unitPrice || 0, taxRate: l.taxRate || "0", lineTotal: (l.quantity || 1) * (l.unitPrice || 0), sortOrder: i })));
      res.status(201).json(invoice);
    } catch (error: any) { console.error("Create invoice error:", error); res.status(500).json({ error: error.message || "Failed" }); }
  });

  app.put("/api/invoices/:id", authMiddleware, async (req: any, res: any) => {
    try {
      const { status, dueDate, paymentTerms, notes, terms, lines } = req.body;
      let subtotal = 0, taxTotal = 0;
      if (lines && lines.length > 0) { for (const line of lines) { const lt = (line.quantity || 1) * (line.unitPrice || 0); subtotal += lt; taxTotal += Math.round(lt * (parseFloat(line.taxRate || "0") / 100)); } }
      const total = subtotal + taxTotal;
      const [updated] = await db.update(invoices).set({ status, dueDate, paymentTerms, notes, terms, subtotal, taxTotal, total }).where(eq(invoices.id, req.params.id)).returning();
      if (!updated) return res.status(404).json({ error: "Not found" });
      if (lines !== undefined) { await db.delete(invoiceLines).where(eq(invoiceLines.invoiceId, req.params.id)); if (lines.length > 0) await db.insert(invoiceLines).values(lines.map((l: any, i: number) => ({ invoiceId: req.params.id, serviceItemId: l.serviceItemId || null, productId: l.productId || null, description: l.description, quantity: l.quantity || 1, unitPrice: l.unitPrice || 0, taxRate: l.taxRate || "0", lineTotal: (l.quantity || 1) * (l.unitPrice || 0), sortOrder: i }))); }
      res.json(updated);
    } catch (error) { console.error("Update invoice error:", error); res.status(500).json({ error: "Failed" }); }
  });

  app.delete("/api/invoices/:id", authMiddleware, async (req: any, res: any) => {
    try {
      await db.delete(payments).where(eq(payments.invoiceId, req.params.id));
      await db.delete(invoiceLines).where(eq(invoiceLines.invoiceId, req.params.id));
      await db.delete(invoices).where(eq(invoices.id, req.params.id));
      res.json({ success: true });
    } catch (error) { console.error("Delete invoice error:", error); res.status(500).json({ error: "Failed" }); }
  });

  // ── Payments ────────────────────────────────────────────────────────────────

  app.post("/api/invoices/:id/payments", authMiddleware, async (req: any, res: any) => {
    try {
      const user = req.user;
      const [invoice] = await db.select().from(invoices).where(eq(invoices.id, req.params.id));
      if (!invoice) return res.status(404).json({ error: "Not found" });
      const { amount, paymentMethod, reference, notes } = req.body;
      if (!amount || amount <= 0) return res.status(400).json({ error: "Valid amount required" });
      const [payment] = await db.insert(payments).values({ invoiceId: req.params.id, amount, paymentMethod: paymentMethod || "cash", reference, notes, createdBy: user.userId }).returning();
      const newAmountPaid = (invoice.amountPaid || 0) + amount;
      await db.update(invoices).set({ amountPaid: newAmountPaid, status: newAmountPaid >= invoice.total ? "paid" : "partially_paid" }).where(eq(invoices.id, req.params.id));
      res.status(201).json(payment);
    } catch (error: any) { console.error("Record payment error:", error); res.status(500).json({ error: error.message || "Failed" }); }
  });

  app.get("/api/invoices/:id/payments", authMiddleware, async (req: any, res: any) => {
    try {
      res.json(await db.select().from(payments).where(eq(payments.invoiceId, req.params.id)));
    } catch (error) { console.error("Fetch payments error:", error); res.status(500).json({ error: "Failed" }); }
  });

  // ── Recurring Invoices ──────────────────────────────────────────────────────

  app.get("/api/recurring-invoices", authMiddleware, async (req: any, res: any) => {
    try {
      const user = req.user;
      let base = db.select({
        id: recurringInvoices.id, customerId: recurringInvoices.customerId, name: recurringInvoices.name,
        description: recurringInvoices.description, frequency: recurringInvoices.frequency,
        subtotal: recurringInvoices.subtotal, taxTotal: recurringInvoices.taxTotal, total: recurringInvoices.total,
        startDate: recurringInvoices.startDate, endDate: recurringInvoices.endDate,
        nextDueDate: recurringInvoices.nextDueDate, lastInvoiceDate: recurringInvoices.lastInvoiceDate,
        status: recurringInvoices.status, notes: recurringInvoices.notes, createdAt: recurringInvoices.createdAt,
        customerName: users.fullName,
      }).from(recurringInvoices).leftJoin(users, eq(recurringInvoices.customerId, users.id));
      if (!isStaffUser(user)) base = base.where(eq(recurringInvoices.customerId, user.userId)) as any;
      res.json(await base.orderBy(sql`${recurringInvoices.createdAt} DESC`));
    } catch (error) { console.error("Fetch recurring error:", error); res.status(500).json({ error: "Failed" }); }
  });

  app.post("/api/recurring-invoices", authMiddleware, async (req: any, res: any) => {
    try {
      const user = req.user;
      const { customerId, name, description, frequency, subtotal, taxTotal, total, startDate, endDate, notes } = req.body;
      if (!customerId || !name || !startDate) return res.status(400).json({ error: "Customer, name, and start date required" });
      const [recurring] = await db.insert(recurringInvoices).values({ customerId, createdBy: user.userId, name, description, frequency: frequency || "monthly", subtotal: subtotal || 0, taxTotal: taxTotal || 0, total: total || 0, startDate, endDate: endDate || null, nextDueDate: startDate, status: "active", notes }).returning();
      res.status(201).json(recurring);
    } catch (error: any) { console.error("Create recurring error:", error); res.status(500).json({ error: error.message || "Failed" }); }
  });

  app.put("/api/recurring-invoices/:id", authMiddleware, async (req: any, res: any) => {
    try {
      const { name, description, frequency, subtotal, taxTotal, total, startDate, endDate, nextDueDate, status, notes } = req.body;
      const [updated] = await db.update(recurringInvoices).set({ name, description, frequency, subtotal, taxTotal, total, startDate, endDate, nextDueDate, status, notes }).where(eq(recurringInvoices.id, req.params.id)).returning();
      if (!updated) return res.status(404).json({ error: "Not found" });
      res.json(updated);
    } catch (error) { console.error("Update recurring error:", error); res.status(500).json({ error: "Failed" }); }
  });

  app.delete("/api/recurring-invoices/:id", authMiddleware, async (req: any, res: any) => {
    try {
      await db.delete(recurringInvoices).where(eq(recurringInvoices.id, req.params.id));
      res.json({ success: true });
    } catch (error) { console.error("Delete recurring error:", error); res.status(500).json({ error: "Failed" }); }
  });

  // ── Customer Statements (computed) ──────────────────────────────────────────

  app.get("/api/statements/:customerId", authMiddleware, async (req: any, res: any) => {
    try {
      const customerId = req.params.customerId;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      const [customer] = await db.select({ id: users.id, name: users.fullName, email: users.email }).from(users).where(eq(users.id, customerId));
      if (!customer) return res.status(404).json({ error: "Customer not found" });
      const invoiceConditions = [eq(invoices.customerId, customerId)];
      if (startDate) invoiceConditions.push(sql`${invoices.createdAt} >= ${startDate}`);
      if (endDate) invoiceConditions.push(sql`${invoices.createdAt} <= ${endDate}`);
      const customerInvoices = await db.select().from(invoices).where(and(...invoiceConditions)).orderBy(sql`${invoices.createdAt} DESC`);
      const invoiceIds = customerInvoices.map((i: any) => i.id);
      let customerPayments: any[] = [];
      if (invoiceIds.length > 0) customerPayments = await db.select().from(payments).where(sql`${payments.invoiceId} IN ${invoiceIds}`);
      const totalInvoiced = customerInvoices.reduce((sum: number, inv: any) => sum + (inv.total || 0), 0);
      const totalPaid = customerPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
      res.json({ customer, invoices: customerInvoices, payments: customerPayments, summary: { totalInvoiced, totalPaid, balance: totalInvoiced - totalPaid } });
    } catch (error) { console.error("Fetch statement error:", error); res.status(500).json({ error: "Failed" }); }
  });

  // ── Quote → Estimate Conversion ──────────────────────────────────────────

  app.post("/api/quotes/:id/convert-to-estimate", authMiddleware, async (req: any, res: any) => {
    try {
      const user = req.user;
      const [quote] = await db.select().from(quotes).where(eq(quotes.id, req.params.id));
      if (!quote) return res.status(404).json({ error: "Quote not found" });
      const year = new Date().getFullYear();
      const estimateNumber = `EST-${year}-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`;
      const [estimate] = await db.insert(estimates).values({
        estimateNumber, customerId: quote.customerId, createdBy: user.userId,
        status: "draft", validUntil: quote.expiresAt ? new Date(quote.expiresAt).toISOString().split("T")[0] : null,
        subtotal: quote.subtotal, taxTotal: 0, total: quote.total,
        notes: quote.notes, terms: "Payment due within 30 days of acceptance",
      }).returning();
      // Copy quote lines as estimate lines
      const qLines = await db.select().from(quoteLines).where(eq(quoteLines.quoteId, quote.id));
      if (qLines.length > 0) {
        await db.insert(estimateLines).values(qLines.map((l: any, i: number) => ({
          estimateId: estimate.id, serviceItemId: null, productId: l.productId,
          description: `Print item - qty ${l.quantity}`, quantity: l.quantity,
          unitPrice: l.computedUnitPrice, taxRate: "0", lineTotal: l.lineTotal, sortOrder: i,
        })));
      }
      // Mark quote as converted
      await db.update(quotes).set({ status: "converted" }).where(eq(quotes.id, quote.id));
      res.status(201).json(estimate);
    } catch (error: any) { console.error("Quote→Estimate error:", error); res.status(500).json({ error: error.message || "Failed" }); }
  });

  // ── Order → Invoice Generation ────────────────────────────────────────────

  app.post("/api/orders/:id/generate-invoice", authMiddleware, async (req: any, res: any) => {
    try {
      const user = req.user;
      const [order] = await db.select().from(orders).where(eq(orders.id, req.params.id));
      if (!order) return res.status(404).json({ error: "Order not found" });
      // Check if invoice already exists for this order
      const [existingInvoice] = await db.select().from(invoices).where(eq(invoices.orderId, order.id));
      if (existingInvoice) return res.status(409).json({ error: "Invoice already exists for this order", invoiceId: existingInvoice.id });
      const year = new Date().getFullYear();
      const invoiceNumber = `INV-${year}-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`;
      const { paymentTerms } = req.body;
      const dueDate = new Date(); dueDate.setDate(dueDate.getDate() + (paymentTerms || 30));
      const [invoice] = await db.insert(invoices).values({
        invoiceNumber, customerId: order.customerId, createdBy: user.userId,
        orderId: order.id, quoteId: order.quoteId, status: "draft",
        subtotal: order.total, taxTotal: 0, total: order.total, amountPaid: 0,
        dueDate: dueDate.toISOString().split("T")[0], paymentTerms: paymentTerms || 30,
        notes: order.notes, terms: "Payment due within 30 days of invoice date",
      }).returning();
      // Copy order items as invoice lines
      const orderItems = (order.items as any[]) || [];
      if (orderItems.length > 0) {
        await db.insert(invoiceLines).values(orderItems.map((item: any, i: number) => ({
          invoiceId: invoice.id, serviceItemId: null, productId: null,
          description: item.description || item.name || "Order item",
          quantity: item.quantity || 1, unitPrice: item.unitPrice || item.price || 0,
          taxRate: "0", lineTotal: (item.quantity || 1) * (item.unitPrice || item.price || 0),
          sortOrder: i,
        })));
      } else {
        // Single-line fallback: use order total as one line
        await db.insert(invoiceLines).values({
          invoiceId: invoice.id, description: `Order ${order.orderNumber}`,
          quantity: 1, unitPrice: order.total, taxRate: "0",
          lineTotal: order.total, sortOrder: 0,
        });
      }
      res.status(201).json(invoice);
    } catch (error: any) { console.error("Order→Invoice error:", error); res.status(500).json({ error: error.message || "Failed" }); }
  });

  // ── Invoice Template Settings ────────────────────────────────────────────

  app.get("/api/invoice-settings", authMiddleware, async (_req: any, res: any) => {
    try {
      const [settings] = await db.select().from(invoiceSettings).limit(1);
      if (!settings) {
        // Auto-create default settings
        const [created] = await db.insert(invoiceSettings).values({}).returning();
        return res.json(created);
      }
      res.json(settings);
    } catch (error) { console.error("Fetch invoice settings error:", error); res.status(500).json({ error: "Failed to fetch settings" }); }
  });

  app.put("/api/invoice-settings", authMiddleware, async (req: any, res: any) => {
    try {
      const user = (req as any).user;
      if (!user || user.role !== "admin") return res.status(403).json({ error: "Admin access required" });
      const [existing] = await db.select().from(invoiceSettings).limit(1);
      if (!existing) {
        const [created] = await db.insert(invoiceSettings).values({ ...req.body, updatedAt: new Date() }).returning();
        return res.json(created);
      }
      const [updated] = await db.update(invoiceSettings)
        .set({ ...req.body, updatedAt: new Date() })
        .where(eq(invoiceSettings.id, existing.id))
        .returning();
      res.json(updated);
    } catch (error) { console.error("Update invoice settings error:", error); res.status(500).json({ error: "Failed to update settings" }); }
  });
}
