import { motion } from "motion/react";
import { ArrowRight, BookMarked, Users, Shield, BarChart3, Layers } from "lucide-react";
import { F, M, dotGrid, type Screen } from "./shared";
import { Link } from "react-router";

// ─── For Campuses page ───────────────────────────────────────────────────────
// NOTE: All copy on this page is PLACEHOLDER content aimed at institutional
// decision-makers (deans, student affairs offices). Search "placeholder" to
// find sections that need final copy review.

const navLinkCls =
  "text-sm text-[#6B6355] hover:text-[#1E1B16] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E2A23B] focus-visible:ring-offset-2 rounded-[4px] transition-colors duration-150";

/* placeholder */ const VALUE_PROPS = [
  {
    icon: Users,
    title: "Bulk Student Onboarding",
    description:
      "Import entire rosters at once. Students get instant access — no individual sign-ups required. Works with CSV exports from any registrar system.",
  },
  {
    icon: Layers,
    title: "SIS / Roster Integration Ready",
    description:
      "Designed to connect with your Student Information System. Map departments, cohorts, and enrollment status directly into Fieldbook's permission model.",
  },
  {
    icon: Shield,
    title: "Audit-Ready Certificate Records",
    description:
      "Every certificate issued carries a cryptographic signature and timestamp. Export compliance-ready reports for accreditation, institutional review, or student appeals.",
  },
  {
    icon: BarChart3,
    title: "Multi-Department Admin Oversight",
    description:
      "A single admin dashboard spans all organizers and departments. Set policies, approve events, and monitor campus-wide engagement from one place.",
  },
] as const;

export function ForCampusesPage({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  return (
    <div className="bg-[#F6F1E7] text-[#1E1B16] min-h-screen" style={dotGrid}>

      {/* ══ Nav ═══════════════════════════════════════════════════════════ */}
      <nav className="sticky top-0 z-50 bg-[#F6F1E7] border-b border-[#1E1B16]/12">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-14">
          <Link to="/" className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E2A23B] rounded-[4px]">
            <BookMarked size={16} className="text-[#E2A23B]" strokeWidth={1.75} />
            <span className="text-[#1E1B16] text-base font-semibold tracking-tight" style={F}>Fieldbook</span>
          </Link>
          <div className="hidden md:flex items-center gap-7">
            <a href="/#features" className={navLinkCls}>Features</a>
            <Link to="/campuses" className={`${navLinkCls} text-[#1E1B16] font-medium`}>For Campuses</Link>
            <Link to="/pricing" className={navLinkCls}>Pricing</Link>
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
        {/* ══ Hero ════════════════════════════════════════════════════════ */}
        <section className="max-w-6xl mx-auto px-6 pt-24 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="max-w-[600px]"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#FCFAF3] border border-[#DCD4C2] rounded-full mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2E6B4C]" />
              <span className="text-[10px] text-[#6B6355] tracking-widest uppercase" style={M}>For Institutions</span>
            </div>

            {/* placeholder */}
            <h1
              className="text-5xl lg:text-[3.6rem] font-semibold leading-[1.06] tracking-tight text-[#1E1B16] mb-6"
              style={F}
            >
              The Official Record<br />for Your Entire<br /><em className="text-[#6B6355]">Campus.</em>
            </h1>

            {/* placeholder */}
            <p className="text-[#6B6355] text-lg leading-relaxed mb-10 max-w-[480px]">
              Give your student affairs office a single source of truth for event participation, verified attendance, and institutional certificates — across every department.
            </p>

            <div className="flex items-center gap-4 flex-wrap">
              <a
                href="mailto:noreply@orgs.social?subject=Fieldbook%20for%20Our%20Campus"
                className="flex items-center gap-2 px-6 py-3 bg-[#E2A23B] text-[#1E1B16] text-sm font-semibold rounded-[7px] border border-[#1E1B16]/15 hover:bg-[#CC8F28] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E2A23B] focus-visible:ring-offset-2 transition-colors"
              >
                Talk to Us <ArrowRight size={14} />
              </a>
              <Link
                to="/pricing"
                className="flex items-center gap-2 px-6 py-3 text-[#1E1B16] text-sm font-medium border border-[#1E1B16]/25 rounded-[7px] hover:border-[#1E1B16]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E2A23B] focus-visible:ring-offset-2 transition-colors"
              >
                See Pricing
              </Link>
            </div>
          </motion.div>
        </section>

        {/* ══ Value Props ═════════════════════════════════════════════════ */}
        <section className="border-t border-[#DCD4C2] bg-[#FCFAF3]">
          <div className="max-w-6xl mx-auto px-6 py-20">
            <div className="mb-12">
              <p className="text-[10px] tracking-widest uppercase text-[#6B6355] mb-2" style={M}>
                Why Fieldbook
              </p>
              <h2 className="text-3xl font-semibold text-[#1E1B16] leading-snug" style={F}>
                Built for how institutions<br />actually operate.
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {VALUE_PROPS.map((prop, index) => {
                const Icon = prop.icon;
                return (
                  <motion.div
                    key={prop.title}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.07 }}
                    className="bg-[#FCFAF3] border border-[#1E1B16]/20 rounded-[8px] p-6"
                  >
                    <div className="w-10 h-10 border border-[#DCD4C2] rounded-[6px] flex items-center justify-center mb-5">
                      <Icon size={17} strokeWidth={1.5} className="text-[#6B6355]" />
                    </div>
                    <h3 className="text-lg font-semibold text-[#1E1B16] mb-2 leading-snug" style={F}>
                      {prop.title}
                    </h3>
                    {/* placeholder */}
                    <p className="text-sm text-[#6B6355] leading-relaxed">
                      {prop.description}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ══ CTA ═════════════════════════════════════════════════════════ */}
        <section className="border-t border-[#DCD4C2]">
          <div className="max-w-xl mx-auto px-6 py-24 text-center">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: "easeOut", delay: 0.15 }}
            >
              {/* placeholder */}
              <h2 className="text-3xl font-semibold text-[#1E1B16] mb-5 leading-snug" style={F}>
                Ready to bring Fieldbook<br />to your campus?
              </h2>
              <p className="text-sm text-[#6B6355] leading-relaxed mb-10 max-w-md mx-auto">
                We'll walk you through setup, integration options, and how other institutions are using Fieldbook to formalize campus participation. No commitment required.
              </p>
              <a
                href="mailto:noreply@orgs.social?subject=Fieldbook%20Campus%20Demo%20Request"
                className="inline-flex items-center gap-2 px-7 py-3 bg-[#E2A23B] text-[#1E1B16] text-sm font-semibold rounded-[7px] border border-[#1E1B16]/15 hover:bg-[#CC8F28] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E2A23B] focus-visible:ring-offset-2 transition-colors"
              >
                Schedule a Conversation <ArrowRight size={14} />
              </a>
            </motion.div>
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
