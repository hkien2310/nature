import { getDBCreatureById } from "@/lib/db";
import { creatures, getTierColor, getStatLabel } from "@/data/creatures";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import VoteForm from "@/components/VoteForm";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const creature = await getDBCreatureById(slug);
  if (!creature) return { title: "Not Found" };
  return {
    title: `${creature.name} (${creature.scientificName}) — BioForce Atlas`,
    description: creature.shortDescription,
  };
}

export default async function CreatureProfilePage({ params }: Props) {
  const { slug } = await params;
  const creature = await getDBCreatureById(slug);
  if (!creature) notFound();

  const tierColor = getTierColor(creature.tier);
  const statEntries = Object.entries(creature.stats) as [keyof typeof creature.stats, number][];
  const maxStat = Math.max(...statEntries.map(([, v]) => v));

  // Radar chart points (hexagon layout)
  const radarPoints = statEntries.map(([, value], i) => {
    const angle = (i * Math.PI * 2) / statEntries.length - Math.PI / 2;
    const r = (value / 100) * 80;
    return { x: 100 + r * Math.cos(angle), y: 100 + r * Math.sin(angle), value };
  });
  const polygonPoints = radarPoints.map((p) => `${p.x},${p.y}`).join(" ");

  // Grid lines for radar
  const gridLevels = [20, 40, 60, 80, 100];

  return (
    <div className="max-w-6xl mx-auto px-6 py-20">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-8 text-xs text-[var(--text-muted)]" style={{ fontFamily: "Share Tech Mono, monospace" }}>
        <Link href="/" className="hover:text-[var(--red-primary)] transition-colors cursor-pointer">HOME</Link>
        <span>/</span>
        <Link href="/creatures" className="hover:text-[var(--red-primary)] transition-colors cursor-pointer">DATABASE</Link>
        <span>/</span>
        <span style={{ color: tierColor }}>{creature.name.toUpperCase()}</span>
      </div>

      {/* ── HERO SECTION ──────────────────────────────── */}
      <div
        className="relative overflow-hidden border border-[var(--border)] mb-8"
        style={{ background: "var(--bg-card)" }}
      >
        {/* Color accent bar */}
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{ background: `linear-gradient(90deg, ${creature.imageColor}, ${tierColor}, transparent)` }}
        />

        {/* Background glow */}
        <div
          className="absolute top-0 right-0 w-96 h-96 opacity-10 pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${tierColor}, transparent 70%)`,
            transform: "translate(30%, -30%)",
          }}
        />

        <div className="relative p-8 md:p-12">
          <div className="flex flex-col md:flex-row md:items-start gap-8">
            {/* Left — Identity */}
            <div className="flex-1">
              {/* Classification path */}
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <span
                  className="text-[10px] tracking-widest text-[var(--text-muted)]"
                  style={{ fontFamily: "Share Tech Mono, monospace" }}
                >
                  {creature.taxonomy.class} › {creature.taxonomy.order} › {creature.taxonomy.family}
                </span>
              </div>

              {/* Name */}
              <h1
                className="text-4xl md:text-6xl font-bold leading-none mb-1"
                style={{
                  fontFamily: "Share Tech Mono, monospace",
                  color: "var(--text-primary)",
                }}
              >
                {creature.name.toUpperCase()}
              </h1>
              <p
                className="text-sm text-[var(--text-muted)] italic mb-6"
                style={{ fontFamily: "Fira Code, monospace" }}
              >
                {creature.scientificName}
              </p>

              {/* Short desc */}
              <p className="text-base text-[var(--text-secondary)] mb-6 leading-relaxed max-w-xl">
                {creature.shortDescription}
              </p>

              {/* Meta tags */}
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 border border-[var(--border)] text-xs" style={{ background: "var(--bg-secondary)" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
                    <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  <span className="text-[var(--text-muted)]">{creature.habitat}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 border border-[var(--border)] text-xs" style={{ background: "var(--bg-secondary)" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 8v4l3 3"/>
                  </svg>
                  <span className="text-[var(--text-muted)]">Cân nặng thật: {creature.realWeight}</span>
                </div>
              </div>
            </div>

            {/* Right — P4P Score + Tier */}
            <div className="flex flex-col items-center gap-4">
              {/* Big P4P ring */}
              <div className="relative">
                <svg width="140" height="140" viewBox="0 0 140 140" style={{ overflow: "visible" }}>
                  {/* Background rings */}
                  <circle cx="70" cy="70" r="60" fill="none" stroke="var(--border)" strokeWidth="8" />
                  <circle cx="70" cy="70" r="60" fill="none" stroke={tierColor} strokeWidth="8"
                    strokeDasharray="376.8"
                    strokeDashoffset={376.8 - (376.8 * creature.p4pScore) / 100}
                    strokeLinecap="round"
                    transform="rotate(-90 70 70)"
                    style={{ filter: `drop-shadow(0 0 8px ${tierColor})` }}
                  />
                  {/* Inner content */}
                  <text x="70" y="58" textAnchor="middle" fill={tierColor} fontSize="28" fontFamily="Share Tech Mono" fontWeight="bold">
                    {creature.p4pScore}
                  </text>
                  <text x="70" y="76" textAnchor="middle" fill="var(--text-muted)" fontSize="9" fontFamily="Share Tech Mono">
                    P4P SCORE
                  </text>
                  <text x="70" y="92" textAnchor="middle" fill="var(--text-muted)" fontSize="8" fontFamily="Share Tech Mono">
                    /100
                  </text>
                </svg>
              </div>

              {/* Tier badge large */}
              <div>
                <div
                  className="w-16 h-16 flex items-center justify-center text-2xl font-bold"
                  style={{
                    color: tierColor,
                    borderColor: tierColor,
                    border: `2px solid ${tierColor}`,
                    clipPath: "polygon(15% 0%, 85% 0%, 100% 15%, 100% 85%, 85% 100%, 15% 100%, 0% 85%, 0% 15%)",
                    background: `${tierColor}11`,
                    fontFamily: "Share Tech Mono, monospace",
                    boxShadow: `0 0 20px ${tierColor}33`,
                  }}
                >
                  {creature.tier}
                </div>
                <div className="text-center text-[10px] text-[var(--text-muted)] mt-1 tracking-widest" style={{ fontFamily: "Share Tech Mono, monospace" }}>
                  TIER
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT GRID ─────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-8">

        {/* Left col — Stats + Radar */}
        <div className="lg:col-span-1 space-y-8">

          {/* Combat Stats */}
          <div className="border border-[var(--border)] p-6 md:p-8" style={{ background: "var(--bg-card)" }}>
            <div
              className="text-[10px] tracking-widest text-[var(--text-muted)] mb-5"
              style={{ fontFamily: "Share Tech Mono, monospace" }}
            >
              // COMBAT STATS
            </div>
            <div className="space-y-4">
              {statEntries.map(([key, value]) => (
                <div key={key}>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-xs text-[var(--text-secondary)]">{getStatLabel(key)}</span>
                    <span
                      className="text-xs font-bold"
                      style={{
                        fontFamily: "Share Tech Mono, monospace",
                        color: value === maxStat ? tierColor : value >= 80 ? "var(--text-primary)" : "var(--text-secondary)",
                      }}
                    >
                      {value === maxStat && (
                        <span className="text-[10px] mr-1" style={{ color: tierColor }}>★</span>
                      )}
                      {value}
                    </span>
                  </div>
                  <div className="stat-bar">
                    <div
                      className="stat-bar-fill"
                      style={{
                        width: `${value}%`,
                        background: value >= 90
                          ? `linear-gradient(90deg, ${creature.imageColor}88, ${tierColor})`
                          : `linear-gradient(90deg, var(--border), var(--text-muted))`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Radar Chart */}
          <div className="border border-[var(--border)] p-6 md:p-8" style={{ background: "var(--bg-card)" }}>
            <div
              className="text-[10px] tracking-widest text-[var(--text-muted)] mb-4"
              style={{ fontFamily: "Share Tech Mono, monospace" }}
            >
              // RADAR CHART
            </div>
            <svg viewBox="0 0 200 200" className="w-full max-w-[200px] mx-auto">
              {/* Grid hexagons */}
              {gridLevels.map((level) => {
                const pts = statEntries.map((_, i) => {
                  const angle = (i * Math.PI * 2) / statEntries.length - Math.PI / 2;
                  const r = (level / 100) * 80;
                  return `${100 + r * Math.cos(angle)},${100 + r * Math.sin(angle)}`;
                }).join(" ");
                return (
                  <polygon
                    key={level}
                    points={pts}
                    fill="none"
                    stroke="var(--border)"
                    strokeWidth="0.5"
                  />
                );
              })}
              {/* Axis lines */}
              {statEntries.map((_, i) => {
                const angle = (i * Math.PI * 2) / statEntries.length - Math.PI / 2;
                return (
                  <line
                    key={i}
                    x1="100" y1="100"
                    x2={100 + 80 * Math.cos(angle)}
                    y2={100 + 80 * Math.sin(angle)}
                    stroke="var(--border)"
                    strokeWidth="0.5"
                  />
                );
              })}
              {/* Data polygon */}
              <polygon
                points={polygonPoints}
                fill={`${tierColor}22`}
                stroke={tierColor}
                strokeWidth="1.5"
                style={{ filter: `drop-shadow(0 0 4px ${tierColor}66)` }}
              />
              {/* Data points */}
              {radarPoints.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r="3" fill={tierColor} />
              ))}
              {/* Labels */}
              {statEntries.map(([key], i) => {
                const angle = (i * Math.PI * 2) / statEntries.length - Math.PI / 2;
                const r = 95;
                const x = 100 + r * Math.cos(angle);
                const y = 100 + r * Math.sin(angle);
                return (
                  <text
                    key={key}
                    x={x}
                    y={y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="var(--text-muted)"
                    fontSize="7"
                    fontFamily="Share Tech Mono"
                  >
                    {getStatLabel(key).split(" ")[0].toUpperCase().slice(0, 4)}
                  </text>
                );
              })}
            </svg>
          </div>

          {/* Vote Form */}
          <VoteForm creatureId={creature.id} imageColor={creature.imageColor} />
        </div>

        <div className="lg:col-span-2 space-y-8">

          {/* Description */}
          <div className="border border-[var(--border)] p-6 md:p-8" style={{ background: "var(--bg-card)" }}>
            <div
              className="text-[10px] tracking-widest text-[var(--text-muted)] mb-4"
              style={{ fontFamily: "Share Tech Mono, monospace" }}
            >
              // PHÂN TÍCH
            </div>
            <p className="text-sm text-[var(--text-secondary)] leading-loose">{creature.description}</p>
          </div>

          {/* Raw Data Section */}
          <div className="border border-[var(--border)] p-6 md:p-8 space-y-6" style={{ background: "var(--bg-card)" }}>
            <div
              className="text-[10px] tracking-widest text-[var(--text-muted)]"
              style={{ fontFamily: "Share Tech Mono, monospace" }}
            >
              // RAW DATA (THÔNG TIN THỰC TẾ THÔ)
            </div>
            
            <div className="grid sm:grid-cols-2 gap-6 text-sm">
              <div className="space-y-4">
                <div>
                  <span className="text-[var(--text-muted)] block text-[10px] tracking-wider mb-0.5">KÍCH THƯỚC</span>
                  <span className="text-[var(--text-secondary)] font-mono">{creature.size}</span>
                </div>
                <div>
                  <span className="text-[var(--text-muted)] block text-[10px] tracking-wider mb-0.5">MÔI TRƯỜNG SỐNG</span>
                  <span className="text-[var(--text-secondary)]">{creature.habitat}</span>
                </div>
                <div>
                  <span className="text-[var(--text-muted)] block text-[10px] tracking-wider mb-0.5">PHÂN BỐ ĐỊA LÝ</span>
                  <span className="text-[var(--text-secondary)]">{creature.location}</span>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <span className="text-[var(--text-muted)] block text-[10px] tracking-wider mb-0.5">ĐẶC ĐIỂM CƠ THỂ</span>
                  <p className="text-[var(--text-secondary)] text-xs leading-relaxed">{creature.characteristics}</p>
                </div>
                <div>
                  <span className="text-[var(--text-muted)] block text-[10px] tracking-wider mb-0.5">CÁCH THỨC SINH TỒN</span>
                  <p className="text-[var(--text-secondary)] text-xs leading-relaxed">{creature.survival_method}</p>
                </div>
                <div>
                  <span className="text-[var(--text-muted)] block text-[10px] tracking-wider mb-0.5">ĐIỂM ĐẶC BIỆT</span>
                  <p className="text-[var(--text-secondary)] text-xs leading-relaxed">{creature.unique_traits}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Strengths & Weaknesses */}
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="border p-6 md:p-8" style={{ background: "var(--bg-card)", borderColor: "#22C55E33" }}>
              <div
                className="text-[10px] tracking-widest mb-4 flex items-center gap-2"
                style={{ fontFamily: "Share Tech Mono, monospace", color: "#22C55E" }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 13l4 4L19 7"/>
                </svg>
                ĐIỂM MẠNH
              </div>
              <ul className="space-y-2">
                {creature.strengths.map((s, i) => (
                  <li key={i} className="text-xs text-[var(--text-secondary)] flex gap-2">
                    <span style={{ color: "#22C55E", flexShrink: 0 }}>›</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            <div className="border p-6 md:p-8" style={{ background: "var(--bg-card)", borderColor: "#EF444433" }}>
              <div
                className="text-[10px] tracking-widest mb-4 flex items-center gap-2"
                style={{ fontFamily: "Share Tech Mono, monospace", color: "#EF4444" }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 18L18 6M6 6l12 12"/>
                </svg>
                ĐIỂM YẾU
              </div>
              <ul className="space-y-2">
                {creature.weaknesses.map((w, i) => (
                  <li key={i} className="text-xs text-[var(--text-secondary)] flex gap-2">
                    <span style={{ color: "#EF4444", flexShrink: 0 }}>›</span>
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Fun Facts */}
          <div className="border border-[var(--border)] p-6 md:p-8" style={{ background: "var(--bg-card)" }}>
            <div
              className="text-[10px] tracking-widest text-[var(--text-muted)] mb-4"
              style={{ fontFamily: "Share Tech Mono, monospace" }}
            >
              // CLASSIFIED INTEL
            </div>
            <div className="space-y-4">
              {creature.funFacts.map((fact, i) => (
                <div key={i} className="flex gap-4">
                  <div
                    className="text-xs font-bold flex-shrink-0 w-6 h-6 flex items-center justify-center border"
                    style={{
                      fontFamily: "Share Tech Mono, monospace",
                      color: tierColor,
                      borderColor: `${tierColor}44`,
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{fact}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Sources */}
          <div className="border border-[var(--border)] p-6 md:p-8" style={{ background: "var(--bg-card)" }}>
            <div
              className="text-[10px] tracking-widest text-[var(--text-muted)] mb-3"
              style={{ fontFamily: "Share Tech Mono, monospace" }}
            >
              // SCIENTIFIC SOURCES
            </div>
            <div className="space-y-2">
              {creature.sources.map((src, i) => (
                <a
                  key={i}
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs cursor-pointer transition-colors duration-200 hover:text-[var(--red-primary)]"
                  style={{ color: "var(--text-muted)", fontFamily: "Fira Code, monospace" }}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                  </svg>
                  {src.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── NAVIGATION ─────────────────────────────── */}
      <div className="mt-10 pt-8 border-t border-[var(--border)] flex justify-between">
        <Link
          href="/creatures"
          className="flex items-center gap-2 text-xs tracking-widest cursor-pointer transition-colors duration-200 hover:text-[var(--red-primary)]"
          style={{ fontFamily: "Share Tech Mono, monospace", color: "var(--text-muted)" }}
        >
          ← BACK TO DATABASE
        </Link>
        <Link
          href={`/matchup`}
          className="flex items-center gap-2 text-xs tracking-widest cursor-pointer transition-colors duration-200 hover:text-[var(--red-primary)]"
          style={{ fontFamily: "Share Tech Mono, monospace", color: "var(--text-muted)" }}
        >
          COMPARE IN MATCHUP →
        </Link>
      </div>
    </div>
  );
}
