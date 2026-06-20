import { getDBCreatures } from "@/lib/db";
import CreatureCard from "@/components/CreatureCard";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const creatures = await getDBCreatures();
  const topCreatures = [...creatures].sort((a, b) => b.p4pScore - a.p4pScore).slice(0, 3);
  const featuredMatchup = { a: creatures[0], b: creatures[1] }; // Bullet Ant vs Mantis Shrimp

  return (
    <div className="max-w-6xl mx-auto px-6">
      {/* ── HERO ─────────────────────────────────────── */}
      <section className="flex flex-col justify-start pt-32 pb-24">
        {/* Grid background decoration */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="relative z-10">
          {/* System label */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-2 h-2 rounded-full bg-[var(--red-primary)]" style={{ animation: "pulse-red 2s infinite" }} />
            <span
              className="text-[10px] text-[var(--text-muted)] tracking-[0.3em]"
              style={{ fontFamily: "Share Tech Mono, monospace" }}
            >
              BIOFORCE ATLAS // CREATURE COMBAT DATABASE // v1.0
            </span>
          </div>

          {/* Main title */}
          <h1
            className="text-5xl md:text-7xl font-bold leading-none mb-2 glitch"
            data-text="NẾU CÙNG CÂN,"
            style={{ fontFamily: "Share Tech Mono, monospace", color: "var(--text-primary)" }}
          >
            NẾU CÙNG CÂN,
          </h1>
          <h1
            className="text-5xl md:text-7xl font-bold leading-none mb-6"
            style={{
              fontFamily: "Share Tech Mono, monospace",
              color: "var(--red-primary)",
              textShadow: "0 0 30px rgba(255,45,45,0.4)",
            }}
          >
            AI SẼ THẮNG?
          </h1>

          <p className="text-sm text-[var(--text-secondary)] max-w-xl leading-relaxed mb-3">
            Hồ sơ chiến đấu sinh vật dựa trên dữ liệu khoa học thực tế.
            Pound-for-pound combat analysis — quy về cùng cân nặng, so sánh thuần túy sinh học.
          </p>
          <p className="text-xs text-[var(--text-muted)] mb-10 italic">
            // Inspired by Terra Formars. Not responsible for nightmares.
          </p>

          {/* CTA */}
          <div className="flex flex-wrap gap-4">
            <Link
              href="/creatures"
              className="inline-flex items-center gap-3 px-6 py-3 text-sm font-bold tracking-widest cursor-pointer transition-all duration-300 hover:gap-4"
              style={{
                fontFamily: "Share Tech Mono, monospace",
                background: "var(--red-primary)",
                color: "#fff",
                clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 6h16M4 10h16M4 14h10" />
              </svg>
              XEM DATABASE
            </Link>
            <Link
              href="/matchup"
              className="inline-flex items-center gap-3 px-6 py-3 text-sm tracking-widest cursor-pointer transition-all duration-300 hover:border-[var(--red-primary)] hover:text-[var(--red-primary)]"
              style={{
                fontFamily: "Share Tech Mono, monospace",
                color: "var(--text-secondary)",
                border: "1px solid var(--border)",
                clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20M2 12h20" />
              </svg>
              SO SÁNH 1v1
            </Link>
          </div>
        </div>

        {/* Stats bar at bottom */}
        <div className="mt-24 grid grid-cols-3 gap-px border border-[var(--border)]">
          {[
            { label: "SINH VẬT", value: creatures.length },
            { label: "TIER S", value: creatures.filter((c) => c.tier === "S").length },
            { label: "MAX P4P", value: Math.max(...creatures.map((c) => c.p4pScore)) },
          ].map((stat) => (
            <div key={stat.label} className="bg-[var(--bg-card)] px-6 py-4">
              <div
                className="text-2xl font-bold text-[var(--red-primary)]"
                style={{ fontFamily: "Share Tech Mono, monospace" }}
              >
                {stat.value}
              </div>
              <div className="text-[10px] text-[var(--text-muted)] tracking-widest mt-1">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURED MATCHUP ─────────────────────────── */}
      <section className="py-24">
        <div className="hud-line mb-8">
          <h2
            className="text-xs tracking-[0.3em] text-[var(--text-muted)]"
            style={{ fontFamily: "Share Tech Mono, monospace" }}
          >
            FEATURED MATCHUP
          </h2>
        </div>

        <div
          className="relative overflow-hidden border border-[var(--border)]"
          style={{ background: "var(--bg-card)" }}
        >
          {/* VS line */}
          <div
            className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2"
            style={{ background: "linear-gradient(to bottom, transparent, var(--red-primary), transparent)" }}
          />
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 px-3 py-2"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--red-primary)",
              fontFamily: "Share Tech Mono, monospace",
              color: "var(--red-primary)",
              fontSize: "1.2rem",
              fontWeight: "bold",
            }}
          >
            VS
          </div>

          <div className="grid grid-cols-2">
            {[featuredMatchup.a, featuredMatchup.b].map((creature, i) => (
              <div
                key={creature.id}
                className="p-8 md:p-12"
                style={{ background: i === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}
              >
                <div
                  className="text-[10px] tracking-widest mb-3"
                  style={{
                    fontFamily: "Share Tech Mono, monospace",
                    color: "var(--text-muted)",
                    textAlign: i === 0 ? "left" : "right",
                  }}
                >
                  {i === 0 ? "CHALLENGER A" : "CHALLENGER B"}
                </div>

                <div className={`flex items-start gap-4 ${i === 1 ? "flex-row-reverse" : ""}`}>
                  <div
                    className="w-16 h-16 rounded-sm flex items-center justify-center flex-shrink-0"
                    style={{ background: `${creature.imageColor}33`, border: `1px solid ${creature.imageColor}66` }}
                  >
                    <span
                      className="text-2xl font-bold"
                      style={{ fontFamily: "Share Tech Mono, monospace", color: creature.imageColor }}
                    >
                      {creature.name[0]}
                    </span>
                  </div>
                  <div className={i === 1 ? "text-right" : ""}>
                    <div
                      className="text-xl font-bold text-[var(--text-primary)] leading-tight"
                      style={{ fontFamily: "Share Tech Mono, monospace" }}
                    >
                      {creature.name}
                    </div>
                    <div className="text-xs text-[var(--text-muted)] italic mt-0.5">{creature.scientificName}</div>
                    <div className="mt-2 flex items-center gap-2" style={{ justifyContent: i === 1 ? "flex-end" : "flex-start" }}>
                      <span
                        className="text-sm font-bold"
                        style={{ color: getTierColor(creature.tier) }}
                      >
                        TIER {creature.tier}
                      </span>
                      <span className="text-xs text-[var(--text-muted)]">P4P: {creature.p4pScore}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-[var(--border)] p-4 flex justify-center">
            <Link
              href={`/matchup/${featuredMatchup.a.id}-vs-${featuredMatchup.b.id}`}
              className="text-xs tracking-widest cursor-pointer transition-colors duration-200 hover:text-[var(--red-primary)]"
              style={{
                fontFamily: "Share Tech Mono, monospace",
                color: "var(--text-muted)",
              }}
            >
              XEM PHÂN TÍCH ĐẦY ĐỦ →
            </Link>
          </div>
        </div>
      </section>

      {/* ── TOP RANKED ───────────────────────────────── */}
      <section className="py-24">
        <div className="flex items-center justify-between mb-8">
          <div className="hud-line">
            <h2
              className="text-xs tracking-[0.3em] text-[var(--text-muted)]"
              style={{ fontFamily: "Share Tech Mono, monospace" }}
            >
              TOP P4P RANKING
            </h2>
          </div>
          <Link
            href="/creatures"
            className="text-[10px] tracking-widest text-[var(--text-muted)] hover:text-[var(--red-primary)] transition-colors cursor-pointer"
            style={{ fontFamily: "Share Tech Mono, monospace" }}
          >
            VIEW ALL →
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {topCreatures.map((creature, i) => (
            <CreatureCard key={creature.id} creature={creature} index={i} />
          ))}
        </div>
      </section>
    </div>
  );
}

function getTierColor(tier: string): string {
  const colors: Record<string, string> = {
    S: "#FF2D2D", A: "#FF8C00", B: "#FFD700", C: "#4CAF50", D: "#9E9E9E",
  };
  return colors[tier] || "#9E9E9E";
}
