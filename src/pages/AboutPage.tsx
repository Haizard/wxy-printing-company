import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Award,
  ArrowRight,
  MapPin,
  Phone,
  Mail,
  Factory,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SITE, FAMILIES, STANDARDS } from "@/lib/site-content";

const stats = [
  { value: "04", label: "Core Divisions" },
  { value: "18+", label: "Product Lines" },
  { value: "09+", label: "Materials & Finishes" },
  { value: "100%", label: "In-House Production" },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 lg:px-8 pt-16 lg:pt-24 pb-20">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 glass-card-subtle px-4 py-2 rounded-pill mb-6">
              <Factory className="w-4 h-4 text-[var(--accent-primary)]" />
              <span className="text-caption font-medium text-[var(--text-secondary)]">
                About {SITE.name}
              </span>
            </div>

            <h1 className="text-large-title lg:text-[56px] font-bold text-[var(--text-primary)] mb-6 leading-tight">
              Where creativity{" "}
              <span className="bg-gradient-to-r from-[var(--accent-primary)] to-[#E84530] bg-clip-text text-transparent">
                meets impact
              </span>{" "}
              across Tanzania
            </h1>

            <p className="text-body lg:text-title-3 text-[var(--text-secondary)] max-w-2xl mx-auto mb-8">
              {SITE.name} is a modern manufacturing and printing powerhouse —
              an {SITE.descriptor} based in {SITE.contact.location}.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/products">
                <Button size="lg" className="w-full sm:w-auto">
                  Explore Capabilities
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link to="/our-work">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  See Our Work
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Decorative orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-[var(--accent-primary)] opacity-[0.04] rounded-full blur-[100px]" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-[var(--accent-tertiary)] opacity-[0.04] rounded-full blur-[120px]" />
      </section>

      {/* Stats */}
      <section className="px-4 lg:px-8 py-12">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <Card className="text-center">
                  <CardContent className="py-6">
                    <div className="text-title-1 lg:text-title-2 font-bold text-[var(--accent-primary)]">
                      {stat.value}
                    </div>
                    <div className="text-caption text-[var(--text-secondary)] mt-1">
                      {stat.label}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Company overview */}
      <section className="px-4 lg:px-8 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-caption font-semibold uppercase tracking-widest text-[var(--accent-primary)] mb-3">
                Company overview
              </p>
              <h2 className="text-title-1 lg:text-title-2 font-bold text-[var(--text-primary)] mb-6">
                {SITE.tagline}
              </h2>
              <div className="space-y-4 text-body text-[var(--text-secondary)]">
                {SITE.overview.map((paragraph) => (
                  <p key={paragraph.slice(0, 32)}>{paragraph}</p>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <Card className="overflow-hidden">
                <div className="bg-gradient-to-br from-[var(--accent-primary)] to-[#E84530] p-8 text-white">
                  <Award className="w-14 h-14 mb-5 opacity-90" />
                  <p className="text-title-2 font-bold leading-snug">
                    {SITE.mission}
                  </p>
                  <p className="text-body opacity-90 mt-3">
                    From concept to completion, we transform ideas into powerful,
                    real-world brand experiences.
                  </p>
                </div>
                <CardContent className="p-6">
                  <p className="text-caption font-semibold uppercase tracking-wide text-[var(--text-tertiary)] mb-3">
                    Materials & finishes we master
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {SITE.materials.map((material) => (
                      <span
                        key={material}
                        className="px-2.5 py-1 rounded-pill bg-[var(--glass-fill-subtle)] text-caption font-medium text-[var(--text-secondary)]"
                      >
                        {material}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* The standard we deliver */}
      <section className="px-4 lg:px-8 py-16 bg-[var(--glass-fill-subtle)]">
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
              Excellence is our standard
            </h2>
            <p className="text-body text-[var(--text-secondary)] max-w-xl mx-auto">
              We are defined by precision, driven by performance and upheld
              through consistency — our standards shape every project we execute.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {STANDARDS.map((standard, index) => (
              <motion.div
                key={standard.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="h-full"
              >
                <Card className="h-full">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-[var(--radius-md)] bg-[rgba(255,90,60,0.1)] flex items-center justify-center mb-4">
                      <standard.icon className="w-6 h-6 text-[var(--accent-primary)]" />
                    </div>
                    <h3 className="text-headline font-semibold mb-2">
                      {standard.title}
                    </h3>
                    <p className="text-caption text-[var(--text-secondary)]">
                      {standard.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Core divisions */}
      <section className="px-4 lg:px-8 py-16">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-title-1 lg:text-title-2 font-bold text-[var(--text-primary)] mb-4">
              What we do
            </h2>
            <p className="text-body text-[var(--text-secondary)] max-w-xl mx-auto">
              Four divisions, one integrated manufacturing hub
            </p>
          </motion.div>

          <div className="space-y-3">
            {FAMILIES.map((family, index) => (
              <motion.div
                key={family.id}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Link to="/products" className="block">
                  <Card className="hover:shadow-[var(--glass-shadow)] transition-all duration-200 group">
                    <CardContent className="py-4 px-5 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[rgba(255,90,60,0.1)] flex items-center justify-center flex-shrink-0">
                        <family.icon className="w-5 h-5 text-[var(--accent-primary)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-subhead font-semibold">{family.title}</p>
                        <p className="text-caption text-[var(--text-secondary)] truncate">
                          {family.tagline}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-[var(--text-tertiary)] group-hover:text-[var(--accent-primary)] group-hover:translate-x-1 transition-all flex-shrink-0" />
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="px-4 lg:px-8 py-16">
        <div className="max-w-3xl mx-auto">
          <Card variant="strong" className="text-center p-8 lg:p-12">
            <h2 className="text-title-1 font-bold text-[var(--text-primary)] mb-4">
              Ready to start your project?
            </h2>
            <p className="text-body text-[var(--text-secondary)] mb-8 max-w-lg mx-auto">
              Whether you're launching a business, hosting an event, rebranding
              or need a reliable print partner — our team is ready to bring your
              vision to life.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="flex items-center justify-center gap-2">
                <MapPin className="w-4 h-4 text-[var(--accent-primary)] flex-shrink-0" />
                <span className="text-subhead">{SITE.contact.location}</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Phone className="w-4 h-4 text-[var(--accent-primary)] flex-shrink-0" />
                <span className="text-subhead">{SITE.contact.phone}</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Mail className="w-4 h-4 text-[var(--accent-primary)] flex-shrink-0" />
                <span className="text-subhead">{SITE.contact.email}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/contact">
                <Button size="lg">
                  Get in Touch
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link to="/products">
                <Button variant="outline" size="lg">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  View Capabilities
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
