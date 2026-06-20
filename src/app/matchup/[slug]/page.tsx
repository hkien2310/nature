import { getDBCreatureById, getMatchupVotes } from "@/lib/db";
import { creatures, getTierColor, getStatLabel } from "@/data/creatures";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { headers } from "next/headers";
import MatchupVoteSection from "@/components/MatchupVoteSection";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [aId, bId] = slug.split("-vs-");
  const a = await getDBCreatureById(aId);
  const b = await getDBCreatureById(bId);
  if (!a || !b) return { title: "Not Found" };
  return {
    title: `${a.name} vs ${b.name} — BioForce Atlas`,
    description: `Nếu ${a.name} và ${b.name} cùng cân nặng, ai sẽ thắng? Phân tích pound-for-pound.`,
  };
}

export default async function MatchupDetailPage({ params }: Props) {
  const { slug } = await params;
  const [aId, bId] = slug.split("-vs-");
  const a = await getDBCreatureById(aId);
  const b = await getDBCreatureById(bId);
  if (!a || !b) notFound();

  const reqHeaders = await headers();
  const user_ip = reqHeaders.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
  const matchupVotes = await getMatchupVotes(slug, { user_ip });

  const aColor = getTierColor(a.tier);
  const bColor = getTierColor(b.tier);
  const winner = a.p4pScore >= b.p4pScore ? a : b;
  const loser = a.p4pScore >= b.p4pScore ? b : a;
  const diff = Math.abs(a.p4pScore - b.p4pScore);


  const statKeys = Object.keys(a.stats) as (keyof typeof a.stats)[];

  const verdict =
    diff <= 5
      ? "Cực kỳ sát nút. Kết quả phụ thuộc vào địa hình và tình huống cụ thể."
      : diff <= 15
      ? `${winner.name} có lợi thế nhẹ về mặt sinh học, nhưng ${loser.name} không phải đối thủ dễ xử.`
      : `${winner.name} chiếm ưu thế rõ ràng. Khoảng cách ${diff} điểm P4P là đáng kể.`;

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-8 text-xs text-[var(--text-muted)]" style={{ fontFamily: "Share Tech Mono, monospace" }}>
        <Link href="/" className="hover:text-[var(--red-primary)] transition-colors cursor-pointer">HOME</Link>
        <span>/</span>
        <Link href="/matchup" className="hover:text-[var(--red-primary)] transition-colors cursor-pointer">MATCHUP</Link>
        <span>/</span>
        <span className="text-[var(--text-secondary)]">{a.name} VS {b.name}</span>
      </div>

      {/* ── VS HEADER ─────────────────────────────── */}
      <div
        className="relative overflow-hidden border border-[var(--border)] mb-8"
        style={{ background: "var(--bg-card)" }}
      >
        {/* Top gradient */}
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{ background: `linear-gradient(90deg, ${aColor}, var(--bg-card) 50%, ${bColor})` }}
        />

        {/* Corner label */}
        <div
          className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-1 z-10"
          style={{
            background: "var(--red-primary)",
            fontFamily: "Share Tech Mono, monospace",
            fontSize: "10px",
            letterSpacing: "0.3em",
            color: "#fff",
          }}
        >
          POUND FOR POUND
        </div>

        <div className="grid grid-cols-2 mt-8">
          {[a, b].map((creature, idx) => {
            const color = idx === 0 ? aColor : bColor;
            const isWinner = creature.id === winner.id;
            return (
              <div
                key={creature.id}
                className="p-8 md:p-10 relative"
                style={{ borderRight: idx === 0 ? "1px solid var(--border)" : "none" }}
              >
                {isWinner && (
                  <div
                    className="absolute top-4 text-[10px] tracking-widest px-2 py-0.5"
                    style={{
                      fontFamily: "Share Tech Mono, monospace",
                      color: "#fff",
                      background: color,
                      left: idx === 0 ? "1.5rem" : "auto",
                      right: idx === 1 ? "1.5rem" : "auto",
                    }}
                  >
                    ★ WINNER
                  </div>
                )}

                <div className={`flex flex-col ${idx === 1 ? "items-end" : ""}`}>
                  <div
                    className="text-xs tracking-widest mb-2"
                    style={{ fontFamily: "Share Tech Mono, monospace", color: "var(--text-muted)" }}
                  >
                    {idx === 0 ? "CHALLENGER A" : "CHALLENGER B"}
                  </div>
                  <h2
                    className="text-2xl md:text-3xl font-bold mb-1"
                    style={{
                      fontFamily: "Share Tech Mono, monospace",
                      color: isWinner ? color : "var(--text-primary)",
                      textShadow: isWinner ? `0 0 20px ${color}66` : "none",
                    }}
                  >
                    {creature.name}
                  </h2>
                  <p className="text-xs text-[var(--text-muted)] italic mb-3">{creature.scientificName}</p>
                  <div className="flex items-center gap-3" style={{ flexDirection: idx === 1 ? "row-reverse" : "row" }}>
                    <span
                      className="text-3xl font-bold"
                      style={{ fontFamily: "Share Tech Mono, monospace", color }}
                    >
                      {creature.p4pScore}
                    </span>
                    <div>
                      <div className="text-[10px] text-[var(--text-muted)]">P4P SCORE</div>
                      <div
                        className="text-xs font-bold"
                        style={{ fontFamily: "Share Tech Mono, monospace", color }}
                      >
                        TIER {creature.tier}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <MatchupVoteSection
        matchupSlug={slug}
        creatureA={a}
        creatureB={b}
        initialVotesA={matchupVotes.votes_a}
        initialVotesB={matchupVotes.votes_b}
        initialUserVotedFor={matchupVotes.user_voted_for}
        aColor={aColor}
        bColor={bColor}
      />

      {/* ── STAT COMPARISON ──────────────────────────── */}
      <div className="border border-[var(--border)] p-6 mb-6" style={{ background: "var(--bg-card)" }}>
        <div
          className="text-[10px] tracking-widest text-[var(--text-muted)] mb-6"
          style={{ fontFamily: "Share Tech Mono, monospace" }}
        >
          // STAT COMPARISON
        </div>

        <div className="space-y-5">
          {statKeys.map((key) => {
            const aVal = a.stats[key];
            const bVal = b.stats[key];
            const aWins = aVal > bVal;
            const bWins = bVal > aVal;
            return (
              <div key={key}>
                <div className="flex justify-between items-center mb-2">
                  <span
                    className="text-sm font-bold"
                    style={{
                      fontFamily: "Share Tech Mono, monospace",
                      color: aWins ? aColor : "var(--text-secondary)",
                    }}
                  >
                    {aVal}
                    {aWins && <span className="text-[10px] ml-1">▲</span>}
                  </span>
                  <span className="text-xs text-[var(--text-muted)] tracking-wider">{getStatLabel(key)}</span>
                  <span
                    className="text-sm font-bold"
                    style={{
                      fontFamily: "Share Tech Mono, monospace",
                      color: bWins ? bColor : "var(--text-secondary)",
                    }}
                  >
                    {bWins && <span className="text-[10px] mr-1">▲</span>}
                    {bVal}
                  </span>
                </div>
                {/* Dual bar */}
                <div className="flex gap-1">
                  <div className="flex-1 stat-bar" style={{ direction: "rtl" }}>
                    <div
                      className="stat-bar-fill"
                      style={{
                        width: `${aVal}%`,
                        background: `linear-gradient(270deg, ${aColor}88, ${aColor})`,
                        direction: "ltr",
                      }}
                    />
                  </div>
                  <div className="w-px bg-[var(--border)]" />
                  <div className="flex-1 stat-bar">
                    <div
                      className="stat-bar-fill"
                      style={{
                        width: `${bVal}%`,
                        background: `linear-gradient(90deg, ${bColor}88, ${bColor})`,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── VERDICT ───────────────────────────────── */}
      <div
        className="border p-6 mb-8"
        style={{
          background: "var(--bg-card)",
          borderColor: `${getTierColor(winner.tier)}44`,
          boxShadow: `0 0 30px ${getTierColor(winner.tier)}11`,
        }}
      >
        <div
          className="text-[10px] tracking-widest mb-4"
          style={{ fontFamily: "Share Tech Mono, monospace", color: getTierColor(winner.tier) }}
        >
          // VERDICT — POUND FOR POUND
        </div>

        <div className="flex items-start gap-6">
          <div>
            <div className="text-xs text-[var(--text-muted)] mb-1">KẾT QUẢ</div>
            <div
              className="text-2xl font-bold"
              style={{
                fontFamily: "Share Tech Mono, monospace",
                color: getTierColor(winner.tier),
                textShadow: `0 0 15px ${getTierColor(winner.tier)}66`,
              }}
            >
              {winner.name}
            </div>
            <div className="text-xs text-[var(--text-muted)] mt-0.5">
              {diff <= 5 ? "Thắng sát" : diff <= 15 ? "Thắng rõ" : "Áp đảo"}
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{verdict}</p>
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex gap-4">
          <Link
            href={`/creatures/${a.id}`}
            className="text-xs tracking-widest cursor-pointer transition-colors duration-200 hover:text-[var(--red-primary)]"
            style={{ fontFamily: "Share Tech Mono, monospace", color: "var(--text-muted)" }}
          >
            → HỒ SƠ {a.name.toUpperCase()}
          </Link>
          <Link
            href={`/creatures/${b.id}`}
            className="text-xs tracking-widest cursor-pointer transition-colors duration-200 hover:text-[var(--red-primary)]"
            style={{ fontFamily: "Share Tech Mono, monospace", color: "var(--text-muted)" }}
          >
            → HỒ SƠ {b.name.toUpperCase()}
          </Link>
        </div>
        <Link
          href="/matchup"
          className="text-xs tracking-widest cursor-pointer transition-colors duration-200 hover:text-[var(--red-primary)]"
          style={{ fontFamily: "Share Tech Mono, monospace", color: "var(--text-muted)" }}
        >
          ← BACK TO ARENA
        </Link>
      </div>
    </div>
  );
}
