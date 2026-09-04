import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  ArrowUpRight,
  Star,
  Quote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SITE, FAMILIES, STANDARDS } from "@/lib/site-content";

const testimonials = [
  {
    name: "Emmanuel Mwangoka",
    role: "Marketing Director, Vodacom Tanzania",
    rating: 5,
    quote:
      "WXY completely transformed our retail store branding across 12 branches. The quality of signage, speed of delivery and attention to detail exceeded every expectation.",
  },
  {
    name: "Sarah Kimaro",
    role: "Founder, Kilimanjaro Breweries",
    rating: 5,
    quote:
      "From concept to installation, their team handled our entire product launch campaign. The banners, POS materials and branded merchandise were absolutely stunning.",
  },
  {
    name: "David Mushi",
    role: "Operations Manager, Taifa Gas",
    rating: 5,
    quote:
      "We have used WXY for our fuel station branding across 40+ stations. Consistent quality, competitive pricing and they always meet tight deadlines.",
  },
  {
    name: "Grace Lobulu",
    role: "Creative Director, Twiga Foods Tanzania",
    rating: 4,
    quote:
      "Professional, reliable and creative. WXY handles all our event signage, trade show booths and promotional materials. They understand brand identity inside out.",
  },
  {
    name: "John Makamba",
    role: "CEO, Johnnie Walker Distributors",
    rating: 5,
    quote:
      "The illuminated signage they installed at our flagship showroom is world-class. Their fabrication team is incredibly skilled and the project was delivered ahead of schedule.",
  },
  {
    name: "Amina Hassan",
    role: "Events Manager, Serengeti Plaza",
    rating: 5,
    quote:
      "Every event we host features WXY work — from large format backdrops to branded lanyards and bags. Their turnaround time is unmatched in the industry.",
  },
];

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
  const [testimonialPage, setTestimonialPage] = useState(0);
  const testimonialPages = Math.ceil(testimonials.length / 3);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTestimonialPage((prev) => (prev + 1) % testimonialPages);
    }, 6000);
    return () => clearInterval(timer);
  }, [testimonialPages]);

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

          {/* Featured layout: 1 large left + 3 stacked right */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Left: featured large card */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="h-full"
            >
              <Link to="/products" className="block h-full">
                <div className="relative h-full min-h-[400px] lg:min-h-[460px] rounded-[var(--radius-lg)] overflow-hidden group cursor-pointer">
                  {/* Background image */}
                  {FAMILIES[0].image && <img src={FAMILIES[0].image} alt="" className="absolute inset-0 w-full h-full object-cover" />}
                  <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-black/70" />
                  {/* Decorative pattern */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-8 right-8 w-40 h-40 border-2 border-white rounded-full" />
                    <div className="absolute bottom-12 left-12 w-24 h-24 border-2 border-white rounded-full" />
                    <div className="absolute top-1/2 left-1/3 w-16 h-16 border border-white rounded-full" />
                  </div>
                  {/* Content */}
                  <div className="relative z-10 h-full flex flex-col justify-between p-8 text-white">
                    <div>
                      <span className="inline-block text-caption font-bold uppercase tracking-widest bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-pill mb-5">
                        {FAMILIES[0].num} Division
                      </span>
                      <h3 className="text-title-1 lg:text-large-title font-bold mb-3 leading-tight">
                        {FAMILIES[0].title}
                      </h3>
                      <p className="text-body text-white/80 max-w-md">
                        {FAMILIES[0].tagline}
                      </p>
                    </div>
                    <div>
                      <div className="flex flex-wrap gap-2 mb-6">
                        {FAMILIES[0].groups.map((group) => (
                          <span
                            key={group.label}
                            className="px-3 py-1.5 rounded-pill bg-white/15 backdrop-blur-sm text-caption font-medium text-white/90 border border-white/20"
                          >
                            {group.label}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 text-white/90 group-hover:text-white transition-colors">
                        <span className="text-subhead font-semibold">Explore Division</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Right: 3 stacked cards */}
            <div className="flex flex-col gap-5">
              {FAMILIES.slice(1).map((family, index) => (
                <motion.div
                  key={family.id}
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.12 }}
                  className="flex-1"
                >
                  <Link to="/products" className="block h-full">
                    <div className="relative h-full rounded-[var(--radius-lg)] overflow-hidden group cursor-pointer min-h-[130px]">
                      {/* Background image */}
                      {family.image && <img src={family.image} alt="" className="absolute inset-0 w-full h-full object-cover" />}
                      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/60" />
                      {/* Content */}
                      <div className="relative z-10 h-full flex items-center gap-6 p-6 text-white">
                        <div className="w-16 h-16 rounded-[var(--radius-md)] bg-white/15 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                          <family.icon className="w-8 h-8 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-caption font-bold uppercase tracking-widest text-white/60">
                              {family.num}
                            </span>
                          </div>
                          <h3 className="text-headline font-bold mb-1 truncate">
                            {family.title}
                          </h3>
                          <p className="text-caption text-white/70 line-clamp-2">
                            {family.tagline}
                          </p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all flex-shrink-0" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="text-center mt-10">
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

      {/* Testimonials */}
      <section className="px-4 lg:px-8 py-20">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <p className="text-caption font-semibold uppercase tracking-widest text-[var(--accent-primary)] mb-3">
              Trusted by brands across Tanzania
            </p>
            <h2 className="text-title-1 lg:text-title-2 font-bold text-[var(--text-primary)] mb-4">
              What our clients say about us
            </h2>
            <p className="text-body text-[var(--text-secondary)] max-w-xl mx-auto">
              From startups to established enterprises, we deliver results that speak for themselves.
            </p>
          </motion.div>

          <div className="overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={testimonialPage}
                initial={{ opacity: 0, x: 60 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -60 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
              >
                {testimonials.slice(testimonialPage * 3, testimonialPage * 3 + 3).map((t, index) => (
                  <motion.div
                    key={t.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.12 }}
                    className="h-full"
                  >
                    <Card className="h-full flex flex-col">
                      <div className="p-6 flex flex-col flex-1">
                        <div className="flex items-center gap-1 mb-4">
                          {Array.from({ length: t.rating }).map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-[var(--accent-secondary)] text-[var(--accent-secondary)]" />
                          ))}
                        </div>
                        <Quote className="w-6 h-6 text-[var(--accent-primary)] opacity-30 mb-2" />
                        <p className="text-body text-[var(--text-primary)] mb-5 flex-1">
                          {t.quote}
                        </p>
                        <div className="flex items-center gap-3 mt-auto pt-4 border-t border-[var(--glass-border)]">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-tertiary)] flex items-center justify-center text-white font-bold text-caption">
                            {t.name.split(" ").map((n) => n[0]).join("")}
                          </div>
                          <div>
                            <p className="text-subhead font-semibold text-[var(--text-primary)]">{t.name}</p>
                            <p className="text-caption text-[var(--text-tertiary)]">{t.role}</p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Slide indicators */}
          <div className="flex items-center justify-center gap-2 mt-8">
            {Array.from({ length: testimonialPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setTestimonialPage(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === testimonialPage
                    ? "w-8 h-2 bg-[var(--accent-primary)]"
                    : "w-2 h-2 bg-[var(--text-tertiary)] hover:bg-[var(--text-secondary)]"
                }`}
                aria-label={`Go to testimonial page ${i + 1}`}
              />
            ))}
          </div>

          <div className="text-center mt-10">
            <Link to="/auth">
              <Button size="lg">
                Join Our Clients
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
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
