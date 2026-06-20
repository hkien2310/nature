import { Creature, getTierColor, getStatLabel } from "@/data/creatures";
import Link from "next/link";

interface CreatureCardProps {
  creature: Creature;
  index?: number;
}

export default function CreatureCard({ creature, index = 0 }: CreatureCardProps) {
  const tierColor = getTierColor(creature.tier);
  const topStat = Object.entries(creature.stats).reduce((a, b) =>
    creature.stats[a[0] as keyof typeof creature.stats] >
    creature.stats[b[0] as keyof typeof creature.stats]
      ? a
      : b
  );

  return (
    <Link href={`/creatures/${creature.id}`} className="block cursor-pointer">
      <div
        className="card-glow corner-brackets group relative overflow-hidden transition-all duration-300"
        style={{
          background: "var(--bg-card)",
          animationDelay: `${index * 0.1}s`,
        }}
      >
        {/* Top color bar */}
        <div
          className="h-1 w-full"
          style={{ background: `linear-gradient(90deg, ${creature.imageColor}, transparent)` }}
        />

        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              {/* Tier + ID */}
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="tier-badge text-xs"
                  style={{ color: tierColor, borderColor: tierColor }}
                >
                  {creature.tier}
                </div>
                <span className="text-[10px] text-[var(--text-muted)] tracking-widest" style={{ fontFamily: "Share Tech Mono, monospace" }}>
                  #{String(index + 1).padStart(3, "0")}
                </span>
              </div>

              {/* Name */}
              <h3
                className="text-base font-bold text-[var(--text-primary)] leading-tight truncate"
                style={{ fontFamily: "Share Tech Mono, monospace" }}
              >
                {creature.name}
              </h3>
              <p className="text-[10px] text-[var(--text-muted)] italic mt-0.5 truncate">
                {creature.scientificName}
              </p>
            </div>

            {/* P4P Score */}
            <div className="ml-3 flex flex-col items-center">
              <svg width="52" height="52" viewBox="0 0 52 52" style={{ overflow: "visible" }}>
                <circle cx="26" cy="26" r="22" fill="none" stroke="var(--border)" strokeWidth="3" />
                <circle
                  cx="26"
                  cy="26"
                  r="22"
                  fill="none"
                  stroke={tierColor}
                  strokeWidth="3"
                  strokeDasharray="138.2"
                  strokeDashoffset={138.2 - (138.2 * creature.p4pScore) / 100}
                  strokeLinecap="round"
                  transform="rotate(-90 26 26)"
                  style={{ filter: `drop-shadow(0 0 4px ${tierColor}66)` }}
                />
                <text
                  x="26"
                  y="26"
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={tierColor}
                  fontSize="11"
                  fontFamily="Share Tech Mono, monospace"
                  fontWeight="bold"
                >
                  {creature.p4pScore}
                </text>
              </svg>
              <span className="text-[9px] text-[var(--text-muted)] tracking-wider mt-0.5">P4P</span>
            </div>
          </div>

          {/* Short description */}
          <p className="text-xs text-[var(--text-secondary)] mb-4 line-clamp-2 leading-relaxed">
            {creature.shortDescription}
          </p>

          {/* Top 3 stats */}
          <div className="space-y-2">
            {Object.entries(creature.stats)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 3)
              .map(([key, value]) => (
                <div key={key}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] text-[var(--text-muted)] tracking-wider">
                      {getStatLabel(key as keyof typeof creature.stats)}
                    </span>
                    <span className="text-[10px] font-mono" style={{ color: value >= 90 ? tierColor : "var(--text-secondary)" }}>
                      {value}
                    </span>
                  </div>
                  <div className="stat-bar">
                    <div
                      className="stat-bar-fill"
                      style={{
                        width: `${value}%`,
                        background: `linear-gradient(90deg, ${creature.imageColor}88, ${tierColor})`,
                      }}
                    />
                  </div>
                </div>
              ))}
          </div>

          {/* Footer */}
          <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-between">
            <span className="text-[10px] text-[var(--text-muted)]">{creature.taxonomy.class}</span>
            <span
              className="text-[10px] text-[var(--red-primary)] tracking-wider group-hover:translate-x-1 transition-transform duration-200"
              style={{ fontFamily: "Share Tech Mono, monospace" }}
            >
              VIEW PROFILE →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
