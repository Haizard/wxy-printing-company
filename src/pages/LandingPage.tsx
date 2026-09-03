import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  Zap,
  ArrowUpRight,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SITE, FAMILIES, STANDARDS } from "@/lib/site-content";

const stats = [
  { value: "04", label: "Core Divisions" },
  { value: "18+", label: "Product Lines" },
  { value: "09+", label: "Materials & Finishes" },
  { value: "100%", label: "In-House Production" },
];

const heroSlides = [
  {
    kicker: "Signage & Visual Communication",
    title: "Your brand deserves to be",
    highlight: "seen, remembered & respected",
    subtitle:
      "From 2D wall branding to illuminated 3D letters, LED signage and digital displays — we design and manufacture signage that captivates day or night.",
    gradient: "from-[var(--accent-primary)] to-[#E84530]",
  },
  {
    kicker: "Fabrication & Structural Branding",
    title: "Built strong.",
    highlight: "Designed bold.",
    subtitle:
      "Complete branding systems for fuel stations, ATMs, exhibitions and outdoor landmarks — structures that stand out and stand the test of time.",
    gradient: "from-[var(--accent-tertiary)] to-[#7C3AED]",
  },
  {
    kicker: "Promotional Materials",
    title: "Tangible branding that",
    highlight: "travels, connects & converts",
    subtitle:
      "Stationery, BrandWear merchandise, marketing collateral and event materials that reinforce your identity in every single interaction.",
    gradient: "from-[var(--accent-secondary)] to-[#FF8C00]",
  },
  {
    kicker: "Printing & Production",
    title: "Where technology meets",
    highlight: "craftsmanship",
    subtitle:
      "Digital, offset, large-format MegaPrint and DTF VaaPrint production — flawless results, quick turnaround, from one in-house factory.",
    gradient: "from-[var(--accent-success)] to-[#1B8A4A]",
  },
];

export default function LandingPage() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="glass-chrome border-b border-[var(--glass-border)] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img src="/wxy-logo.svg" alt={SITE.logoAlt} className="h-10 w-auto" />
          </Link>
          <div className="hidden sm:flex items-center gap-2">
            <Link to="/about">
              <Button variant="ghost" size="sm">About</Button>
            </Link>
            <Link to="/products">
              <Button variant="ghost" size="sm">Products</Button>
            </Link>
            <Link to="/our-work">
              <Button variant="ghost" size="sm">Our Work</Button>
            </Link>
            <Link to="/contact">
              <Button variant="ghost" size="sm">Contact</Button>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/auth">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="sm">
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero with sliding banner */}
      <section className="relative overflow-hidden px-4 lg:px-8 pt-16 lg:pt-24 pb-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Sliding hero banner */}
          <div className="relative min-h-[430px] lg:min-h-[460px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, x: 60 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -60 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="absolute inset-0"
              >
                <div className="inline-flex items-center gap-2 glass-card-subtle px-4 py-2 rounded-pill mb-6">
                  <Sparkles className="w-4 h-4 text-[var(--accent-secondary)]" />
                  <span className="text-caption font-medium text-[var(--text-secondary)]">
                    {SITE.tagline}
                  </span>
                </div>

                <h1 className="text-large-title lg:text-[56px] font-bold text-[var(--text-primary)] mb-5 leading-tight">
                  {heroSlides[currentSlide].title}{" "}
                  <span className={`bg-gradient-to-r ${heroSlides[currentSlide].gradient} bg-clip-text text-transparent`}>
                    {heroSlides[currentSlide].highlight}
                  </span>
                </h1>

                <p className="text-caption font-semibold uppercase tracking-widest text-[var(--accent-primary)] mb-3">
                  {heroSlides[currentSlide].kicker}
                </p>

                <p className="text-body lg:text-title-3 text-[var(--text-secondary)] max-w-2xl mx-auto mb-8">
                  {heroSlides[currentSlide].subtitle}
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link to="/products">
                    <Button size="lg" className="w-full sm:w-auto">
                      Explore Our Capabilities
                      <ArrowRight className="w-5 h-5" />
                    </Button>
                  </Link>
                  <Link to="/contact">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto">
                      Request a Quote
                    </Button>
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Slide indicators */}
          <div className="flex items-center justify-center gap-2 mt-6">
            {heroSlides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === currentSlide
                    ? "w-8 h-2 bg-[var(--accent-primary)]"
                    : "w-2 h-2 bg-[var(--text-tertiary)] hover:bg-[var(--text-secondary)]"
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-14"
          >
            {stats.map((stat) => (
              <Card key={stat.label} variant="subtle" className="text-center">
                <div className="text-title-1 lg:text-title-2 font-bold text-[var(--accent-primary)]">
                  {stat.value}
                </div>
                <div className="text-caption text-[var(--text-secondary)] mt-1">
                  {stat.label}
                </div>
              </Card>
            ))}
          </motion.div>
        </div>

        {/* Decorative gradient orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-[var(--accent-primary)] opacity-[0.04] rounded-full blur-[100px]" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-[var(--accent-tertiary)] opacity-[0.04] rounded-full blur-[120px]" />
      </section>

      {/* Core divisions */}
      <section className="px-4 lg:px-8 py-20">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <p className="text-caption font-semibold uppercase tracking-widest text-[var(--accent-primary)] mb-3">
              What we do
            </p>
            <h2 className="text-title-1 lg:text-title-2 font-bold text-[var(--text-primary)] mb-4">
              Everything your brand needs — from one in-house factory
            </h2>
            <p className="text-body text-[var(--text-secondary)] max-w-xl mx-auto">
              {SITE.mission}. {SITE.descriptor}.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {FAMILIES.map((family, index) => (
              <motion.div
                key={family.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="h-full"
              >
                <Card className="h-full overflow-hidden hover:shadow-[var(--glass-shadow)] transition-all duration-300 flex flex-col">
                  <div className={`h-1.5 bg-gradient-to-r ${family.gradient}`} />
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-[var(--radius-md)] bg-[rgba(255,90,60,0.1)] flex items-center justify-center">
                          <family.icon className="w-6 h-6 text-[var(--accent-primary)]" />
                        </div>
                        <div>
                          <p className="text-caption font-semibold text-[var(--text-tertiary)]">
                            {family.num}
                          </p>
                          <h3 className="text-headline font-semibold">
                            {family.title}
                          </h3>
                        </div>
                      </div>
                      <ArrowUpRight className="w-5 h-5 text-[var(--text-tertiary)] flex-shrink-0" />
                    </div>
                    <p className="text-caption text-[var(--text-secondary)] mb-4">
                      {family.tagline}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-auto">
                      {family.groups.map((group) => (
                        <span
                          key={group.label}
                          className="px-2.5 py-1 rounded-pill bg-[var(--glass-fill-subtle)] text-caption font-medium text-[var(--text-secondary)]"
                        >
                          {group.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link to="/products">
              <Button variant="outline" size="lg">
                View the full catalogue
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* The standard we deliver */}
      <section className="px-4 lg:px-8 py-20 bg-[var(--glass-fill-subtle)]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <p className="text-caption font-semibold uppercase tracking-widest text-[var(--accent-primary)] mb-3">
              The standard we deliver
            </p>
            <h2 className="text-title-1 lg:text-title-2 font-bold text-[var(--text-primary)] mb-4">
              Everything under one roof. Zero compromises.
            </h2>
            <p className="text-body text-[var(--text-secondary)] max-w-xl mx-auto">
              We are defined by precision, driven by performance and upheld
              through consistency.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {STANDARDS.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                className="h-full"
              >
                <Card className="h-full text-center">
                  <div className="p-5">
                    <div className="w-12 h-12 rounded-[var(--radius-md)] bg-[rgba(255,90,60,0.1)] flex items-center justify-center mx-auto mb-3">
                      <item.icon className="w-6 h-6 text-[var(--accent-primary)]" />
                    </div>
                    <h3 className="text-subhead font-semibold mb-2">
                      {item.title}
                    </h3>
                    <p className="text-caption text-[var(--text-secondary)]">
                      {item.description}
                    </p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 lg:px-8 py-20">
        <div className="max-w-3xl mx-auto">
          <Card variant="strong" className="text-center p-8 lg:p-12">
            <Zap className="w-12 h-12 text-[var(--accent-primary)] mx-auto mb-4" />
            <h2 className="text-title-1 font-bold text-[var(--text-primary)] mb-4">
              Let's work together
            </h2>
            <p className="text-body text-[var(--text-secondary)] mb-8 max-w-lg mx-auto">
              Whether you're launching a business, hosting an event, rebranding
              or need a reliable print partner — {SITE.name} is ready to bring
              your ideas to life.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/contact">
                <Button size="lg">
                  Get in Touch
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link to="/our-work">
                <Button variant="outline" size="lg">
                  See Our Work
                </Button>
              </Link>
            </div>
            <div className="flex items-center justify-center gap-6 mt-8 flex-wrap text-caption text-[var(--text-tertiary)]">
              {["Concept to completion", "In-house manufacturing", "Nationwide delivery"].map(
                (point) => (
                  <span key={point} className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[var(--accent-success)]" />
                    {point}
                  </span>
                ),
              )}
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="glass-chrome border-t border-[var(--glass-border)] px-4 lg:px-8 py-8">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/wxy-logo.svg" alt={SITE.logoAlt} className="h-8 w-auto" />
            <span className="text-subhead font-medium">{SITE.name}</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/about" className="text-caption text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors">About</Link>
            <Link to="/products" className="text-caption text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors">Products</Link>
            <Link to="/our-work" className="text-caption text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors">Our Work</Link>
            <Link to="/contact" className="text-caption text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors">Contact</Link>
            <Link to="/auth" className="text-caption text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors">Sign In</Link>
          </div>
          <p className="text-caption text-[var(--text-tertiary)]">
            © {SITE.copyrightYear} {SITE.name}. {SITE.tagline}.
          </p>
        </div>
      </footer>
    </div>
  );
}
