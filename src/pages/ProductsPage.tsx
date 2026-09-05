import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search,
  Package,
  SlidersHorizontal,
  X,
  MessageCircle,
  Phone,
  Mail,
  MapPin,
  ShoppingCart,
  ArrowRight,
  Clock,
  Tag,
  Sparkles,
  ClipboardList,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { STAFF_ROLES } from "@/components/RequireAuth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ImageSlideshow from "@/components/ui/ImageSlideshow";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { SITE } from "@/lib/site-content";

const CATEGORY_COLORS: Record<string, string> = {
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

const PRICING_LABEL: Record<string, string> = {
  qty_band_per_unit: "Quantity-based pricing",
  area_based_range: "Area-based pricing",
  coverage_qty_band: "Coverage-based pricing",
  sheet_qty_tier_markup: "Sheet pricing with tiered markup",
  imposition_sheet_based: "Booklet / imposition pricing",
  flat_fixed_per_unit_band: "Flat rate per unit",
  flat_fixed_service_fee: "Flat service fee",
  percentage_markup_on_material: "Material markup pricing",
  package_tier_flat_fee: "Package pricing",
  per_page_band: "Per-page pricing",
  per_page_plus_design_fee: "Per-page + design fee",
  range_service_fee: "Range-based service fee",
  area_qty_band: "Area + quantity pricing",
  qty_band_by_leaf_count: "Priced by size & quantity",
  flat_fixed_range_per_unit: "Fixed range per unit",
  signage_engrave_cut_formula: "Custom engrave & cut pricing",
};

function pricingLabel(model?: string | null): string {
  if (!model) return "Custom quote";
  return PRICING_LABEL[model] || model.replace(/_/g, " ");
}

export default function ProductsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { itemCount } = useCart();
  const isStaff = !!user && STAFF_ROLES.includes(user.role);
  const [searchParams, setSearchParams] = useSearchParams();

  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedCats, setSelectedCats] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState("newest");

  // Detail dialog
  const [selected, setSelected] = useState<any | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [catsRes, prodsRes] = await Promise.all([
          fetch("/api/categories"),
          fetch("/api/products"),
        ]);
        if (cancelled) return;
        if (catsRes.ok) setCategories(await catsRes.json());
        if (prodsRes.ok) setProducts(await prodsRes.json());
        setError(false);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Deep-link support: /products?product=<id> opens the detail dialog.
  // &request=1 additionally opens the order-request form (after a client signs in).
  const productParam = searchParams.get("product");
  const requestParam = searchParams.get("request");
  useEffect(() => {
    if (!productParam || loading) return;
    const found = products.find((p) => p.id === productParam);
    if (found) {
      setSelected(found);
      if (requestParam === "1") {
        startOrderRequest(found);
      }
    } else {
      setSelected(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productParam, requestParam, loading, products]);

  const catById = useMemo(() => {
    const map: Record<string, any> = {};
    (categories || []).forEach((c) => (map[c.id] = c));
    return map;
  }, [categories]);

  const catSlugById = useMemo(() => {
    const map: Record<string, string> = {};
    (categories || []).forEach((c) => (map[c.id] = c.slug));
    return map;
  }, [categories]);

  // Ancestor chain of a category (parent, grandparent…)
  const ancestorsOf = useMemo(() => {
    const cache = new Map<string, string[]>();
    const resolve = (catId: string): string[] => {
      const hit = cache.get(catId);
      if (hit) return hit;
      const chain: string[] = [catId];
      let cur = catById[catId];
      let guard = 0;
      while (cur?.parentId && cur.parentId !== catId && guard < 10) {
        chain.push(cur.parentId);
        cur = catById[cur.parentId];
        guard += 1;
      }
      cache.set(catId, chain);
      return chain;
    };
    return resolve;
  }, [catById]);

  // Only shop-visible, active products
  const shopProducts = useMemo(
    () =>
      (products || []).filter(
        (p) => p.isActive !== false && p.isShopVisible !== false,
      ),
    [products],
  );

  // Product count per category (children counted inside their parent)
  const countForCat = useMemo(() => {
    const own: Record<string, number> = {};
    shopProducts.forEach((p) => {
      own[p.categoryId] = (own[p.categoryId] || 0) + 1;
    });
    const total: Record<string, number> = { ...own };
    (categories || []).forEach((cat) => {
      const chain = ancestorsOf(cat.id);
      chain.slice(1).forEach((parentId) => {
        total[parentId] = (total[parentId] || 0) + (own[cat.id] || 0);
      });
    });
    return total;
  }, [shopProducts, categories, ancestorsOf]);

  const toggleCat = (id: string) => {
    setSelectedCats((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearFilters = () => {
    setSearch("");
    setSelectedCats(new Set());
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = shopProducts.filter((p) => {
      if (q) {
        const cat = catById[p.categoryId];
        const hay = `${p.name} ${p.description || ""} ${cat?.name || ""} ${p.slug}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (selectedCats.size > 0) {
        const chain = ancestorsOf(p.categoryId);
        const hit = chain.some((id) => selectedCats.has(id));
        if (!hit) return false;
      }
      return true;
    });
    if (sort === "name-asc") {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === "name-desc") {
      list = [...list].sort((a, b) => b.name.localeCompare(a.name));
    } else {
      list = [...list].sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
      );
    }
    return list;
  }, [shopProducts, search, selectedCats, sort, catById, ancestorsOf]);

  // Filter sidebar categories: top-level first (with children beneath)
  const sidebarCats = useMemo(() => {
    const visible = (catId: string) =>
      catById[catId] && (countForCat[catId] || 0) > 0;
    const parents = (categories || [])
      .filter((c) => !c.parentId)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    const rows: { cat: any; depth: number }[] = [];
    parents.forEach((parent) => {
      if (!visible(parent.id)) return;
      rows.push({ cat: parent, depth: 0 });
      (categories || [])
        .filter((c) => c.parentId === parent.id)
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
        .forEach((child) => {
          if (visible(child.id)) rows.push({ cat: child, depth: 1 });
        });
    });
    return rows;
  }, [categories, catById, countForCat]);

  const categoryColorFor = (product: any) =>
    CATEGORY_COLORS[catSlugById[product.categoryId]] || "from-gray-500 to-gray-600";
  const categoryIconFor = (product: any) =>
    catById[product.categoryId]?.icon || "📦";

  // Clients/guests use their client-area chat; only platform users land in
  // the staff messaging inbox.
  const chatUrlFor = (product: any) =>
    isStaff
      ? `/chat?open=1&product=${encodeURIComponent(product.id)}&name=${encodeURIComponent(product.name)}`
      : `/client/chat?open=1&product=${encodeURIComponent(product.id)}&name=${encodeURIComponent(product.name)}`;

  const openChat = (product: any) => {
    navigate(chatUrlFor(product));
  };

  // ── Order-request flow — the public product button only places an order,
  // then invites the customer to chat. It never deep-links to the staff
  // calculator/admin panel (that tool lives in the staff nav). ───────────────
  const [orderProduct, setOrderProduct] = useState<any | null>(null);
  const [orderStep, setOrderStep] = useState<"form" | "done" | null>(null);
  const [orderQty, setOrderQty] = useState(1);
  const [orderNotes, setOrderNotes] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);
  const [placedOrderNumber, setPlacedOrderNumber] = useState("");
  const [orderError, setOrderError] = useState("");

  const closeDetail = () => {
    setSelected(null);
    setOrderStep(null);
    setOrderProduct(null);
    setOrderError("");
  };

  const startOrderRequest = (product: any) => {
    setSelected(product);
    setOrderProduct(product);
    setOrderStep("form");
    setOrderQty(
      product.minOrderQty && product.minOrderQty > 1 ? product.minOrderQty : 1,
    );
    setOrderNotes("");
    setPlacedOrderNumber("");
    setOrderError("");
  };

  const requestOrderFor = (product: any) => {
    if (!user) {
      // Sign in first, then land back on this product with the request form open.
      navigate("/auth", {
        state: {
          from: {
            pathname: "/products",
            search: `?product=${encodeURIComponent(product.id)}&request=1`,
          },
        },
      });
      return;
    }
    startOrderRequest(product);
  };

  const goToMyRequests = () => {
    if (!user) {
      navigate("/auth", { state: { from: { pathname: "/client" } } });
      return;
    }
    navigate("/client");
  };

  const submitOrderRequest = async () => {
    if (!orderProduct || !user) return;
    setPlacingOrder(true);
    setOrderError("");
    try {
      const token = localStorage.getItem("printhub_token");
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: [
            {
              productId: orderProduct.id,
              name: orderProduct.name,
              price: 0, // exact price is confirmed by our team from the spec
              quantity: orderQty,
            },
          ],
          notes:
            orderNotes.trim() ||
            `Request for ${orderProduct.name} — quantity ${orderQty}.`,
          paymentMethod: "cash",
        }),
      });
      if (res.ok) {
        const order = await res.json();
        setPlacedOrderNumber(order.orderNumber);
        setOrderStep("done");
      } else {
        const err = await res.json().catch(() => ({}));
        setOrderError(
          err.error || "Could not place your request — please try again.",
        );
      }
    } catch {
      setOrderError("Could not place your request — please try again.");
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="relative overflow-hidden h-[600px] max-w-[1500px] mx-auto mb-10">
        {/* Background image - full bleed */}
        <div className="absolute inset-0 -z-10">
          <img src="/images_new/hero-1.png" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/50" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 lg:px-8 py-12 lg:py-16">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5"
          >
            <div>
              <div className="inline-flex items-center gap-2 glass-card-subtle px-4 py-2 rounded-pill mb-4">
                <Package className="w-4 h-4 text-[var(--accent-primary)]" />
                <span className="text-caption font-medium text-white/90" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>
                  Our Product Catalogue
                </span>
              </div>
              <h1 className="text-large-title lg:text-[44px] font-bold text-white leading-tight" style={{ textShadow: "0 2px 12px rgba(0,0,0,0.8)" }}>
                Shop our{" "}
                <span className="bg-gradient-to-r from-[var(--accent-primary)] to-[#E84530] bg-clip-text text-transparent">
                  products
                </span>
              </h1>
              <p className="text-body text-white/90 mt-3 max-w-2xl" style={{ textShadow: "0 1px 8px rgba(0,0,0,0.7)" }}>
                Browse our full range — every item is priced to your exact
                specification (size, material, quantity) with an instant quote.
              </p>
            </div>
            {isStaff ? (
              <Link to="/cart">
                <Button variant="outline" size="lg" className="w-full lg:w-auto border-white/30 text-white hover:bg-white/10">
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Cart ({itemCount})
                </Button>
              </Link>
            ) : (
              <Button
                variant="outline"
                size="lg"
                className="w-full lg:w-auto border-white/30 text-white hover:bg-white/10"
                onClick={goToMyRequests}
              >
                <ClipboardList className="w-5 h-5 mr-2" />
                My Dashboard
                {!user && (
                  <span className="ml-2 text-caption opacity-70">· sign in</span>
                )}
              </Button>
            )}
          </motion.div>
        </div>
        <div className="absolute top-10 right-10 w-72 h-72 bg-[var(--accent-tertiary)] opacity-[0.04] rounded-full blur-[100px]" />
      </section>

      {/* Catalogue body: products left, filters right */}
      <section className="px-4 lg:px-8 pb-10">
        <div className="max-w-6xl mx-auto lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-6">
          {/* Filters (right sidebar on desktop, top on mobile) */}
          <aside className="lg:order-2 mb-6 lg:mb-0">
            <div className="space-y-4 lg:sticky lg:top-24">
              <Card variant="strong">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <SlidersHorizontal className="w-4 h-4 text-[var(--accent-primary)]" />
                    <h2 className="text-headline font-semibold">Filters</h2>
                    {(search || selectedCats.size > 0) && (
                      <button
                        onClick={clearFilters}
                        className="ml-auto text-caption text-[var(--accent-primary)] hover:underline flex items-center gap-1"
                      >
                        <X className="w-3 h-3" /> Clear all
                      </button>
                    )}
                  </div>

                  {/* Search */}
                  <div className="space-y-2 mb-5">
                    <label className="text-caption font-medium text-[var(--text-secondary)]">
                      Search
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
                      <Input
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search products…"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Categories */}
                  <div className="space-y-1">
                    <p className="text-caption font-medium text-[var(--text-secondary)] mb-2">
                      Category
                    </p>
                    <button
                      onClick={() => setSelectedCats(new Set())}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-[var(--radius-sm)] text-subhead text-left transition-colors ${
                        selectedCats.size === 0
                          ? "bg-[rgba(255,90,60,0.1)] text-[var(--accent-primary)] font-semibold"
                          : "text-[var(--text-secondary)] hover:bg-[var(--glass-fill)]"
                      }`}
                    >
                      <span>All products</span>
                      <Badge variant="secondary" className="text-[10px]">
                        {shopProducts.length}
                      </Badge>
                    </button>
                    {sidebarCats.map(({ cat, depth }) => {
                      const active = selectedCats.has(cat.id);
                      return (
                        <button
                          key={cat.id}
                          onClick={() => toggleCat(cat.id)}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-[var(--radius-sm)] text-subhead text-left transition-colors ${
                            depth === 1 ? "pl-7" : ""
                          } ${
                            active
                              ? "bg-[rgba(255,90,60,0.1)] text-[var(--accent-primary)] font-semibold"
                              : "text-[var(--text-secondary)] hover:bg-[var(--glass-fill)]"
                          }`}
                        >
                          <span className="flex-1 truncate">
                            {cat.icon && <span className="mr-1.5">{cat.icon}</span>}
                            {cat.name}
                          </span>
                          {countForCat[cat.id] > 0 && (
                            <Badge variant="secondary" className="text-[10px]">
                              {countForCat[cat.id]}
                            </Badge>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Contact card */}
              <Card variant="subtle">
                <CardContent className="p-5">
                  <p className="text-caption font-semibold uppercase tracking-wide text-[var(--text-tertiary)] mb-3">
                    Talk to us
                  </p>
                  <div className="space-y-2 text-subhead">
                    <a
                      href={`tel:${SITE.contact.phone.replace(/\s/g, "")}`}
                      className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors"
                    >
                      <Phone className="w-4 h-4 text-[var(--accent-primary)]" />
                      {SITE.contact.phone}
                    </a>
                    <a
                      href={`mailto:${SITE.contact.email}`}
                      className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors"
                    >
                      <Mail className="w-4 h-4 text-[var(--accent-primary)]" />
                      {SITE.contact.email}
                    </a>
                    <p className="flex items-center gap-2 text-[var(--text-secondary)]">
                      <MapPin className="w-4 h-4 text-[var(--accent-primary)]" />
                      {SITE.contact.location}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </aside>

          {/* Product grid */}
          <div className="lg:order-1">
            <div className="flex items-center justify-between gap-3 mb-5">
              <p className="text-subhead text-[var(--text-secondary)]">
                {loading
                  ? "Loading products…"
                  : `${filtered.length} product${filtered.length !== 1 ? "s" : ""}`}
                {search && (
                  <span className="text-caption text-[var(--text-tertiary)]">
                    {" "}
                    for “{search}”
                  </span>
                )}
              </p>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="glass-input text-caption w-auto py-2 min-h-0 cursor-pointer"
                aria-label="Sort products"
              >
                <option value="newest">Newest first</option>
                <option value="name-asc">Name A–Z</option>
                <option value="name-desc">Name Z–A</option>
              </select>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="h-72 rounded-[var(--radius-lg)] bg-[var(--glass-fill-subtle)] animate-pulse"
                  />
                ))}
              </div>
            ) : error ? (
              <Card>
                <CardContent className="text-center py-16">
                  <Package className="w-10 h-10 text-[var(--text-tertiary)] mx-auto mb-3" />
                  <p className="text-subhead text-[var(--text-tertiary)]">
                    Couldn't load the catalogue
                  </p>
                  <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
                    Retry
                  </Button>
                </CardContent>
              </Card>
            ) : filtered.length === 0 ? (
              <Card>
                <CardContent className="text-center py-16">
                  <Search className="w-10 h-10 text-[var(--text-tertiary)] mx-auto mb-3" />
                  <p className="text-subhead font-semibold text-[var(--text-secondary)] mb-1">
                    No products found
                  </p>
                  <p className="text-caption text-[var(--text-tertiary)] mb-5">
                    Try a different search term or category.
                  </p>
                  <Button variant="outline" onClick={clearFilters}>
                    Clear filters
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {filtered.map((product, index) => {
                  const colorClass = categoryColorFor(product);
                  const hasImages = product.images && product.images.length > 0;
                  return (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: Math.min(index, 8) * 0.04 }}
                      className="h-full"
                    >
                      <Card className="h-full overflow-hidden flex flex-col hover:shadow-[var(--glass-shadow)] hover:scale-[0.99] transition-all duration-300 group">
                        <button
                          type="button"
                          onClick={() => setSelected(product)}
                          className="relative w-full block text-left cursor-pointer"
                          aria-label={`View ${product.name}`}
                        >
                          {hasImages ? (
                            <ImageSlideshow
                              images={product.images}
                              alt={product.name}
                              className="h-44"
                              showDots={product.images.length > 1}
                              showArrows={product.images.length > 1}
                              autoPlayInterval={20000}
                            />
                          ) : (
                            <div
                              className={`h-44 bg-gradient-to-br ${colorClass} flex items-center justify-center`}
                            >
                              <span className="text-6xl opacity-80 drop-shadow-sm">
                                {categoryIconFor(product)}
                              </span>
                            </div>
                          )}
                          <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/30 backdrop-blur-sm text-white text-[10px] font-medium">
                            <Sparkles className="w-3 h-3" />
                            Custom quote
                          </span>
                        </button>

                        <CardContent className="p-4 flex flex-col flex-1 min-h-0 overflow-hidden">
                          <p className="text-[10px] uppercase tracking-wide font-semibold text-[var(--text-tertiary)] mb-1">
                            {catById[product.categoryId]?.name || "Products"}
                          </p>
                          <button
                            type="button"
                            onClick={() => setSelected(product)}
                            className="text-left"
                          >
                            <h3 className="text-headline font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors truncate">
                              {product.name}
                            </h3>
                          </button>
                          {product.description && (
                            <p className="text-caption text-[var(--text-tertiary)] mt-1 line-clamp-2">
                              {product.description}
                            </p>
                          )}

                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {product.baseUnit && (
                              <Badge variant="secondary" className="text-[10px]">
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
                                {product.leadTimeDays}d
                              </Badge>
                            )}
                          </div>

                          <div className="flex gap-2 mt-4 pt-3 border-t border-[rgba(60,60,67,0.1)] mt-auto flex-shrink-0">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={() => setSelected(product)}
                            >
                              Details
                            </Button>
                            <Button
                              size="sm"
                              className="flex-1"
                              onClick={() => requestOrderFor(product)}
                            >
                              <ShoppingCart className="w-4 h-4 mr-1" />
                              Request
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Office contact strip */}
      <section className="px-4 lg:px-8 pb-16">
        <div className="max-w-6xl mx-auto">
          <Card variant="subtle">
            <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[rgba(255,90,60,0.1)] flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5 text-[var(--accent-primary)]" />
                </div>
                <div>
                  <p className="text-headline font-semibold text-[var(--text-primary)]">
                    Need help choosing?
                  </p>
                  <p className="text-caption text-[var(--text-secondary)]">
                    Call {SITE.contact.phone} or email {SITE.contact.email} — we
                    reply within one business day.
                  </p>
                </div>
              </div>
              <Link to="/contact">
                <Button variant="outline">
                  Contact us
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Product detail dialog */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && closeDetail()}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="sr-only">{selected.name}</DialogTitle>
              </DialogHeader>

              <div className="flex items-center gap-2 flex-wrap mb-3 pr-8">
                <button
                  onClick={() => setSelected(null)}
                  className="text-caption text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors"
                >
                  ← Back to products
                </button>
                <span className="text-caption text-[var(--text-tertiary)]">/</span>
                <span className="text-caption text-[var(--accent-primary)] font-medium">
                  {catById[selected.categoryId]?.icon}{" "}
                  {catById[selected.categoryId]?.name || "Products"}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Gallery */}
                <div>
                  {selected.images && selected.images.length > 0 ? (
                    <ImageSlideshow
                      images={selected.images}
                      alt={selected.name}
                      className="h-64 md:h-72 rounded-[var(--radius-lg)]"
                      showDots={selected.images.length > 1}
                      showArrows={selected.images.length > 1}
                      autoPlayInterval={20000}
                    />
                  ) : (
                    <div
                      className={`h-64 md:h-72 rounded-[var(--radius-lg)] bg-gradient-to-br ${categoryColorFor(selected)} flex items-center justify-center`}
                    >
                      <span className="text-8xl opacity-80">
                        {categoryIconFor(selected)}
                      </span>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1.5 mt-4">
                    <Badge variant="secondary" className="text-[10px]">
                      <Tag className="w-3 h-3 mr-1" />
                      {pricingLabel(selected.pricingModel)}
                    </Badge>
                    {selected.baseUnit && (
                      <Badge variant="secondary" className="text-[10px]">
                        per {selected.baseUnit}
                      </Badge>
                    )}
                    {selected.minOrderQty && selected.minOrderQty > 1 && (
                      <Badge variant="secondary" className="text-[10px]">
                        Minimum order: {selected.minOrderQty}
                      </Badge>
                    )}
                    {selected.leadTimeDays && (
                      <Badge variant="secondary" className="text-[10px]">
                        <Clock className="w-3 h-3 mr-1" />
                        Approx. {selected.leadTimeDays} day
                        {selected.leadTimeDays > 1 ? "s" : ""} lead time
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Order / chat side */}
                <div className="flex flex-col">
                  <h2 className="text-title-1 font-bold text-[var(--text-primary)] mb-2">
                    {selected.name}
                  </h2>
                  <p className="text-body text-[var(--text-secondary)] mb-5">
                    {selected.description ||
                      "Custom print product — tell us your specifications and we'll produce it to the highest standard."}
                  </p>

                  <div className="glass-card-subtle rounded-[var(--radius-md)] p-4 mb-5">
                    <p className="text-caption font-semibold uppercase tracking-wide text-[var(--text-tertiary)] mb-1">
                      Pricing
                    </p>
                    <p className="text-headline font-bold text-[var(--text-primary)]">
                      Quoted to your specification
                    </p>
                    <p className="text-caption text-[var(--text-secondary)] mt-1.5">
                      Send your request with the exact specification and our
                      team confirms your price — typically within one business
                      day.
                    </p>
                  </div>

                  <div className="space-y-2.5 mt-auto">
                    {orderStep === "done" &&
                    orderProduct?.id === selected.id ? (
                      <div className="glass-card-subtle rounded-[var(--radius-md)] p-5 space-y-3 border border-[rgba(52,199,89,0.35)]">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-[rgba(52,199,89,0.12)] flex items-center justify-center flex-shrink-0">
                            <CheckCircle2 className="w-5 h-5 text-[var(--accent-success)]" />
                          </div>
                          <div>
                            <p className="text-headline font-bold text-[var(--text-primary)]">
                              Request received
                            </p>
                            <p className="text-caption text-[var(--text-secondary)] mt-1">
                              <span className="font-semibold">{placedOrderNumber}</span>{" "}
                              — our team will review your specification and
                              confirm the exact price. Chat with us now to speed
                              things up.
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={() =>
                              navigate(
                                chatUrlFor(orderProduct) +
                                  `&order=${encodeURIComponent(placedOrderNumber)}`,
                              )
                            }
                          >
                            <MessageCircle className="w-4 h-4 mr-1" />
                            Chat with customer service
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => navigate("/client")}
                          >
                            <ClipboardList className="w-4 h-4 mr-1" />
                            My dashboard
                          </Button>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="w-full"
                          onClick={() => setOrderStep(null)}
                        >
                          Keep browsing
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Button
                          size="lg"
                          className="w-full"
                          onClick={() => requestOrderFor(selected)}
                        >
                          <ShoppingCart className="w-5 h-5 mr-2" />
                          {user
                            ? "Place Order Request"
                            : "Sign in & Place Order Request"}
                        </Button>
                        <Button
                          size="lg"
                          variant="outline"
                          className="w-full"
                          onClick={() => openChat(selected)}
                        >
                          <MessageCircle className="w-5 h-5 mr-2" />
                          Chat with our team
                        </Button>
                      </>
                    )}

                    {orderStep === "form" && orderProduct?.id === selected.id && (
                        <div className="glass-card-subtle rounded-[var(--radius-md)] p-4 space-y-3 border-t-2 border-t-[var(--accent-primary)]">
                          <div>
                            <p className="text-headline font-semibold text-[var(--text-primary)]">
                              Tell us what you need
                            </p>
                            <p className="text-caption text-[var(--text-secondary)] mt-0.5">
                              Add a quantity plus any size, material or design
                              details. Our team confirms the exact price after
                              you submit — usually within one business day.
                            </p>
                          </div>
                          <div className="space-y-2">
                            <Label
                              htmlFor="request-qty"
                              className="text-caption font-medium text-[var(--text-secondary)]"
                            >
                              Quantity
                            </Label>
                            <Input
                              id="request-qty"
                              type="number"
                              min={1}
                              value={orderQty}
                              onChange={(e) =>
                                setOrderQty(
                                  Math.max(1, Number(e.target.value) || 1),
                                )
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label
                              htmlFor="request-notes"
                              className="text-caption font-medium text-[var(--text-secondary)]"
                            >
                              Your specifications (optional)
                            </Label>
                            <textarea
                              id="request-notes"
                              rows={3}
                              value={orderNotes}
                              onChange={(e) => setOrderNotes(e.target.value)}
                              placeholder="e.g. 3m × 1m banner, single sided, with grommets…"
                              className="glass-input w-full resize-y text-subhead min-h-[70px]"
                            />
                          </div>
                          {orderError && (
                            <p className="text-caption text-[var(--accent-danger)]">
                              {orderError}
                            </p>
                          )}
                          <div className="flex gap-2">
                            <Button
                              className="flex-1"
                              size="sm"
                              disabled={placingOrder || orderQty < 1}
                              onClick={submitOrderRequest}
                            >
                              {placingOrder ? "Submitting…" : "Submit request"}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setOrderStep(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}

                    {!user && (
                      <p className="text-caption text-[var(--text-tertiary)] text-center pt-1">
                        You'll use your free client account — we'll ask you to
                        sign in first.
                      </p>
                    )}
                  </div>

                  {/* Office contact */}
                  <div className="mt-5 pt-4 border-t border-[rgba(60,60,67,0.12)] space-y-2">
                    <p className="text-caption font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
                      Or reach our office directly
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                      <a
                        href={`tel:${SITE.contact.phone.replace(/\s/g, "")}`}
                        className="flex items-center gap-2 text-subhead text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors"
                      >
                        <Phone className="w-4 h-4 text-[var(--accent-primary)]" />
                        {SITE.contact.phone}
                      </a>
                      <a
                        href={`mailto:${SITE.contact.email}`}
                        className="flex items-center gap-2 text-subhead text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors truncate"
                      >
                        <Mail className="w-4 h-4 text-[var(--accent-primary)]" />
                        {SITE.contact.email}
                      </a>
                      <p className="flex items-center gap-2 text-subhead text-[var(--text-secondary)]">
                        <MapPin className="w-4 h-4 text-[var(--accent-primary)]" />
                        {SITE.contact.location}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
