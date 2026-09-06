import { db } from "../db/index";
import { products, categories } from "../db/schema";
import { eq, and } from "drizzle-orm";

/**
 * Lightweight catalog products list for billing line-item pickers.
 * Returns active products with name, description, baseUnit, pricingModel,
 * and category name — everything a billing form needs to auto-fill a line.
 */
export default function registerBillingProductsRoute(app: any, authMiddleware: any) {
  app.get("/api/billing-products", authMiddleware, async (_req: any, res: any) => {
    try {
      const rows = await db
        .select({
          id: products.id,
          name: products.name,
          description: products.description,
          baseUnit: products.baseUnit,
          pricingModel: products.pricingModel,
          categoryName: categories.name,
        })
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .where(eq(products.isActive, true))
        .orderBy(products.name);
      res.json(rows);
    } catch (error) {
      console.error("Fetch billing products error:", error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });
}
