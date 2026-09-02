import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatTZS } from "@/lib/utils";
import { useCategories, useProducts } from "@/hooks/useApi";

const categoryColors = [
  "from-blue-500 to-blue-600",
  "from-purple-500 to-purple-600",
  "from-green-500 to-green-600",
  "from-orange-500 to-orange-600",
  "from-red-500 to-red-600",
  "from-pink-500 to-pink-600",
  "from-teal-500 to-teal-600",
  "from-indigo-500 to-indigo-600",
  "from-amber-500 to-amber-600",
  "from-cyan-500 to-cyan-600",
  "from-violet-500 to-violet-600",
  "from-rose-500 to-rose-600",
];

export default function CatalogPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: categories, loading: catsLoading } = useCategories();
  const { data: products, loading: prodsLoading } = useProducts();

  const filteredCategories = categories?.filter((c: any) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()),
  ) || [];

  const filteredProducts = products?.filter((p: any) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()),
  ) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-title-1 font-bold text-[var(--text-primary)]">
          Catalog
        </h1>
        <p className="text-body text-[var(--text-secondary)] mt-1">
          Browse our full range of printing products and services
        </p>
      </motion.div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
        <input
          type="text"
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="glass-input pl-10"
        />
      </div>

      {/* Categories */}
      <div>
        <h2 className="text-headline font-semibold text-[var(--text-primary)] mb-4">
          Categories
        </h2>
        {catsLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 rounded-[var(--radius-lg)] bg-[var(--glass-fill-subtle)] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredCategories.map((category: any, index: number) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.04 }}
              >
                <Link to={`/catalog/${category.slug}`}>
                  <Card className="cursor-pointer transition-all duration-200 hover:shadow-[var(--glass-shadow)] hover:scale-[0.98]">
                    <CardContent className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-[var(--radius-md)] bg-gradient-to-br ${categoryColors[index % categoryColors.length]} flex items-center justify-center flex-shrink-0`}
                      >
                        <span className="text-white font-bold text-lg">
                          {category.name.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-subhead font-semibold truncate">
                          {category.name}
                        </h3>
                        <p className="text-caption text-[var(--text-tertiary)]">
                          {category.icon || "📁"}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)] flex-shrink-0" />
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Products */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-headline font-semibold text-[var(--text-primary)]">
            All Products ({filteredProducts.length})
          </h2>
        </div>
        {prodsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 rounded-[var(--radius-lg)] bg-[var(--glass-fill-subtle)] animate-pulse" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Search className="w-10 h-10 text-[var(--text-tertiary)] mx-auto mb-3" />
              <p className="text-subhead text-[var(--text-tertiary)]">
                {searchQuery ? "No products match your search" : "No products yet. Seed the database to add products."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((product: any, index: number) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.06 }}
              >
                <Link to="/calculator">
                  <Card className="cursor-pointer transition-all duration-200 hover:shadow-[var(--glass-shadow)] hover:scale-[0.98]">
                    <div className="h-40 rounded-t-[var(--radius-lg)] bg-gradient-to-br from-[var(--bg-gradient-1)] to-[var(--bg-gradient-2)] flex items-center justify-center">
                      <span className="text-4xl">🖨️</span>
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-subhead font-semibold truncate">
                            {product.name}
                          </h3>
                          <p className="text-caption text-[var(--text-tertiary)] mt-1">
                            {product.description || "No description"}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <Badge variant="secondary">
                          {product.pricingModel?.replace(/_/g, " ")}
                        </Badge>
                        <Button size="sm" variant="outline">
                          Calculate
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
