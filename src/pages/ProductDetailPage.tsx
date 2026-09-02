import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Calculator, Clock, Package, Tag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useFetch } from "@/hooks/useApi";

const categoryColors: Record<string, string> = {
  "digital-printing": "from-blue-500 to-blue-600",
  "offset-printing": "from-purple-500 to-purple-600",
  "large-format": "from-green-500 to-green-600",
  "flat-bed-rigid": "from-orange-500 to-orange-600",
  signage: "from-red-500 to-red-600",
  "photo-canvas": "from-pink-500 to-pink-600",
  "cards-small-format": "from-teal-500 to-teal-600",
  "books-stationery": "from-indigo-500 to-indigo-600",
  "promotional-merch": "from-amber-500 to-amber-600",
  "apparel-digitization": "from-cyan-500 to-cyan-600",
  "design-services": "from-violet-500 to-violet-600",
  calendars: "from-rose-500 to-rose-600",
};

export default function ProductDetailPage() {
  const { categoryName } = useParams<{ categoryName: string }>();
  const { data: result, loading } = useFetch<{ category: any; products: any[] }>(
    categoryName ? `/api/products-by-category/${categoryName}` : ""
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 rounded-[var(--radius-md)] bg-[var(--glass-fill-subtle)] animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 rounded-[var(--radius-lg)] bg-[var(--glass-fill-subtle)] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="text-center py-20">
        <p className="text-subhead text-[var(--text-tertiary)]">Category not found</p>
        <Link to="/catalog">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Catalog
          </Button>
        </Link>
      </div>
    );
  }

  const { category, products } = result;
  const colorClass = categoryColors[category.slug] || "from-gray-500 to-gray-600";

  return (
    <div className="space-y-6">
      {/* Back nav */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Link
          to="/catalog"
          className="inline-flex items-center gap-1.5 text-subhead text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Catalog
        </Link>
      </motion.div>

      {/* Category header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
      >
        <Card variant="strong">
          <CardContent className="flex items-center gap-5 p-6">
            <div
              className={`w-16 h-16 rounded-[var(--radius-lg)] bg-gradient-to-br ${colorClass} flex items-center justify-center flex-shrink-0`}
            >
              <span className="text-white font-bold text-2xl">
                {category.name.charAt(0)}
              </span>
            </div>
            <div>
              <h1 className="text-title-1 font-bold text-[var(--text-primary)]">
                {category.name}
              </h1>
              <p className="text-body text-[var(--text-secondary)] mt-1">
                {category.icon || "📁"} {products.length} product{products.length !== 1 ? "s" : ""} available
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Products grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product: any, index: number) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
          >
            <Card className="h-full hover:shadow-[var(--glass-shadow)] transition-all duration-200 hover:scale-[0.98]">
              {/* Product image placeholder */}
              <div
                className={`h-36 rounded-t-[var(--radius-lg)] bg-gradient-to-br ${colorClass} flex items-center justify-center opacity-90`}
              >
                <span className="text-4xl opacity-80">🖨️</span>
              </div>

              <CardContent className="p-4 flex flex-col gap-3">
                <div>
                  <h3 className="text-subhead font-semibold text-[var(--text-primary)]">
                    {product.name}
                  </h3>
                  {product.description && (
                    <p className="text-caption text-[var(--text-tertiary)] mt-1 line-clamp-2">
                      {product.description}
                    </p>
                  )}
                </div>

                {/* Meta badges */}
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="secondary" className="text-[10px]">
                    <Tag className="w-3 h-3 mr-1" />
                    {product.pricingModel?.replace(/_/g, " ")}
                  </Badge>
                  {product.baseUnit && (
                    <Badge variant="secondary" className="text-[10px]">
                      <Package className="w-3 h-3 mr-1" />
                      per {product.baseUnit}
                    </Badge>
                  )}
                  {product.minOrderQty && product.minOrderQty > 1 && (
                    <Badge variant="secondary" className="text-[10px]">
                      Min {product.minOrderQty}
                    </Badge>
                  )}
                  {product.leadTimeDays && (
                    <Badge variant="secondary" className="text-[10px]">
                      <Clock className="w-3 h-3 mr-1" />
                      {product.leadTimeDays}d lead
                    </Badge>
                  )}
                </div>

                {/* CTA */}
                <Link to={`/calculator?product=${product.id}`} className="mt-auto">
                  <Button className="w-full" size="sm">
                    <Calculator className="w-4 h-4 mr-1.5" />
                    Calculate Price
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {products.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="w-10 h-10 text-[var(--text-tertiary)] mx-auto mb-3" />
            <p className="text-subhead text-[var(--text-tertiary)]">
              No products in this category yet.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
