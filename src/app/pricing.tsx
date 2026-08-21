import { motion } from "motion/react";
import { Check, ArrowRight, BookMarked } from "lucide-react";
import { F, M, dotGrid, type Screen } from "./shared";
import { useNavigate, Link } from "react-router";

// ─── Pricing page ────────────────────────────────────────────────────────────
// NOTE: All pricing figures are PROVISIONAL PLACEHOLDERS pending real usage
// data and business decisions. Search "placeholder" in this file to find them.

const navLinkCls =
  "text-sm text-[#6B6355] hover:text-[#1E1B16] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E2A23B] focus-visible:ring-offset-2 rounded-[4px] transition-colors duration-150";

/* placeholder */ const TIERS = [
  {
    name: "Free / Starter",
    price: "₹0",
    period: "/month",
    description: "For clubs and small-scale organizers getting started.",
    cta: "Get Started",
    highlighted: false,
    features: [
      "Up to 2 events/month",
      "Up to 100 attendees/event",
      "Basic certificate templates",
      "Community support",
      "QR attendance tracking",
    ],
  },
  {
    name: "Campus",
    price: "₹4,999–7,999",
    period: "/month",
    description: "For institutions running events at scale across departments.",
    cta: "Start Free Trial",
    highlighted: true,
    badge: "Most Popular",
    features: [
      "Unlimited events",
      "Up to 2,000 attendees/month",
      "Custom certificate branding",
      "Admin & organizer roles",
      "Analytics dashboard",
      "Email support",
      "Annual option: ₹49,999/year",
    ],
  },
  {
    name: "Institution / Enterprise",
    price: "Custom",
    period: "",
    description: "For large universities needing full control and compliance.",
    cta: "Contact Sales",
    highlighted: false,
    features: [
      "SSO / SIS integration",
      "Bulk student onboarding",
      "Audit & compliance logs",
      "Dedicated account manager",
      "SLA-backed uptime",
      "Custom contract terms",
    ],
  },
] as const;

export function PricingPage({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const navigate = useNavigate();

  return (
    <div className="bg-[#F6F1E7] text-[#1E1B16] min-h-screen" style={dotGrid}>

      {/* ══ Nav (shared with landing — lightweight duplicate for now) ══════ */}
      <nav className="sticky top-0 z-50 bg-[#F6F1E7] border-b border-[#1E1B16]/12">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-14">
          <Link to="/" className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E2A23B] rounded-[4px]">
            <BookMarked size={16} className="text-[#E2A23B]" strokeWidth={1.75} />
            <span className="text-[#1E1B16] text-base font-semibold tracking-tight" style={F}>Fieldbook</span>
          </Link>
          <div className="hidden md:flex items-center gap-7">
            <a href="/#features" className={navLinkCls}>Features</a>
            <Link to="/campuses" className={navLinkCls}>For Campuses</Link>
            <Link to="/pricing" className={`${navLinkCls} text-[#1E1B16] font-medium`}>Pricing</Link>
            <button
              onClick={() => onNavigate("admin-login")}
              className={navLinkCls}
            >
              Sign in
            </button>
          </div>
          <button
            onClick={() => onNavigate("admin-login")}
            className="px-4 py-1.5 bg-[#E2A23B] text-[#1E1B16] text-sm font-semibold rounded-[7px] border border-[#1E1B16]/15 hover:bg-[#CC8F28] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E2A23B] focus-visible:ring-offset-2 transition-colors"
          >
            Get Started
          </button>
        </div>
      </nav>

      <main>
        {/* ══ Header ══════════════════════════════════════════════════════ */}
        <section className="max-w-6xl mx-auto px-6 pt-20 pb-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <p className="text-[10px] tracking-widest uppercase text-[#6B6355] mb-3" style={M}>
              Pricing
            </p>
            <h1
              className="text-5xl lg:text-[3.6rem] font-semibold leading-[1.06] tracking-tight text-[#1E1B16] mb-5"
              style={F}
            >
              Simple, transparent pricing.
            </h1>
            {/* placeholder */}
            <p className="text-[#6B6355] text-lg leading-relaxed max-w-lg mx-auto">
              Start free, scale when you're ready. No hidden fees, no per-scan charges.
            </p>
          </motion.div>
        </section>

        {/* ══ Tier Cards ══════════════════════════════════════════════════ */}
        <section className="max-w-6xl mx-auto px-6 py-14">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TIERS.map((tier, index) => (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.07 }}
                className={`rounded-[8px] border p-6 flex flex-col ${
                  tier.highlighted
                    ? "bg-[#1E1B16] border-[#1E1B16]"
                    : "bg-[#FCFAF3] border-[#1E1B16]/20"
                }`}
              >
                {/* Badge */}
                {tier.highlighted && (
                  <div className="inline-flex self-start items-center gap-1.5 px-2.5 py-0.5 border border-[#E2A23B] rounded-full mb-4">
                    <span className="w-1 h-1 rounded-full bg-[#E2A23B]" />
                    <span className="text-[8px] text-[#E2A23B] tracking-widest uppercase" style={M}>
                      {tier.badge}
                    </span>
                  </div>
                )}

                {/* Name */}
                <h3
                  className={`text-lg font-semibold leading-snug mb-1 ${
                    tier.highlighted ? "text-[#F6F1E7]" : "text-[#1E1B16]"
                  }`}
                  style={F}
                >
                  {tier.name}
                </h3>

                {/* Price */}
                <div className="flex items-baseline gap-1 mb-3">
                  <span
                    className={`text-3xl font-semibold ${
                      tier.highlighted ? "text-[#F6F1E7]" : "text-[#1E1B16]"
                    }`}
                    style={F}
                  >
                    {tier.price}
                  </span>
                  {tier.period && (
                    <span
                      className={`text-sm ${tier.highlighted ? "text-[#9A9080]" : "text-[#6B6355]"}`}
                    >
                      {tier.period}
                    </span>
                  )}
                </div>

                {/* Description */}
                {/* placeholder */}
                <p
                  className={`text-sm leading-relaxed mb-6 ${
                    tier.highlighted ? "text-[#9A9080]" : "text-[#6B6355]"
                  }`}
                >
                  {tier.description}
                </p>

                {/* Features */}
                <ul className="space-y-2.5 mb-8 flex-1">
                  {tier.features.map((f) => (
                    <li
                      key={f}
                      className={`flex items-start gap-2.5 text-sm ${
                        tier.highlighted ? "text-[#DCD4C2]" : "text-[#1E1B16]"
                      }`}
                    >
                      <Check
                        size={12}
                        strokeWidth={2}
                        className="mt-0.5 flex-shrink-0"
                        style={{ color: tier.highlighted ? "#E2A23B" : "#2E6B4C" }}
                      />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  onClick={() => {
                    if (tier.name === "Institution / Enterprise") {
                      window.location.href = "mailto:noreply@orgs.social?subject=Fieldbook%20Enterprise%20Inquiry";
                    } else {
                      onNavigate("admin-login");
                    }
                  }}
                  className={`w-full flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold rounded-[7px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E2A23B] focus-visible:ring-offset-2 ${
                    tier.highlighted
                      ? "bg-[#E2A23B] text-[#1E1B16] border border-[#1E1B16]/15 hover:bg-[#CC8F28]"
                      : "text-[#1E1B16] border border-[#1E1B16]/25 hover:border-[#1E1B16]/50"
                  }`}
                >
                  {tier.cta} <ArrowRight size={13} />
                </button>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ══ FAQ / Footnote ══════════════════════════════════════════════ */}
        <section className="border-t border-[#DCD4C2] bg-[#FCFAF3]">
          <div className="max-w-xl mx-auto px-6 py-16 text-center">
            {/* placeholder */}
            <p className="text-[10px] tracking-widest uppercase text-[#6B6355] mb-3" style={M}>
              Questions?
            </p>
            <h2 className="text-2xl font-semibold text-[#1E1B16] mb-4" style={F}>
              Need help choosing a plan?
            </h2>
            <p className="text-sm text-[#6B6355] leading-relaxed mb-8">
              Every campus is different. Reach out and we'll help you find the right fit — no sales pitch, just an honest conversation about what you need.
            </p>
            <a
              href="mailto:noreply@orgs.social?subject=Fieldbook%20Pricing%20Question"
              className="inline-flex items-center gap-2 px-6 py-3 text-[#1E1B16] text-sm font-medium border border-[#1E1B16]/25 rounded-[7px] hover:border-[#1E1B16]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E2A23B] focus-visible:ring-offset-2 transition-colors"
            >
              Contact us <ArrowRight size={13} />
            </a>
          </div>
        </section>
      </main>

      {/* ══ Footer ═══════════════════════════════════════════════════════ */}
      <footer className="border-t border-[#DCD4C2]">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <BookMarked size={12} className="text-[#E2A23B]" strokeWidth={1.75} />
              <span className="text-xs font-semibold text-[#1E1B16]" style={F}>Fieldbook</span>
            </div>
            <p className="text-[9px] text-[#6B6355]" style={M}>© 2024 Fieldbook Systems, Inc. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
