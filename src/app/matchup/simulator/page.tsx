import { getDBCreatures } from "@/lib/db";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Giả Lập 1v1 — BioForce Atlas",
  description: "So sánh 1v1 hai sinh vật cùng cân nặng. Ai sẽ thắng?",
};

export default async function MatchupSimulatorPage() {
  const creatures = await getDBCreatures();
  return (
    <div className="max-w-6xl mx-auto px-6 py-20">
      <div className="mb-8">
        <div className="hud-line mb-4">
          <span
            className="text-[10px] text-[var(--text-muted)] tracking-[0.3em]"
            style={{ fontFamily: "Share Tech Mono, monospace" }}
          >
            BIOFORCE ATLAS // MATCHUP ARENA
          </span>
        </div>
        <h1
          className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-3"
          style={{ fontFamily: "Share Tech Mono, monospace" }}
        >
          MATCHUP ARENA
        </h1>
        <p className="text-sm text-[var(--text-secondary)] max-w-lg mb-6">
          Chọn 2 sinh vật để so sánh pound-for-pound. Cùng cân nặng — ai có lợi thế sinh học hơn?
        </p>

        {/* Navigation tabs */}
        <div className="flex flex-wrap gap-4 border-b border-[var(--border)] pb-3" style={{ fontFamily: "Share Tech Mono, monospace" }}>
          <Link href="/matchup" className="text-xs tracking-widest text-[var(--text-secondary)] hover:text-[#00f0ff] transition-colors">[ ĐANG DIỄN RA ]</Link>
          <Link href="/matchup/history" className="text-xs tracking-widest text-[var(--text-secondary)] hover:text-[#00f0ff] transition-colors">[ LỊCH SỬ KẾT QUẢ ]</Link>
          <Link href="/matchup/simulator" className="text-xs tracking-widest text-[var(--red-primary)] font-bold">[ GIẢ LẬP 1V1 ]</Link>
        </div>
      </div>

      {/* Matchup grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {creatures.flatMap((a, i) =>
          creatures.slice(i + 1).map((b) => {
            const diff = Math.abs(a.p4pScore - b.p4pScore);
            return (
              <Link
                key={`${a.id}-vs-${b.id}`}
                href={`/matchup/${a.id}-vs-${b.id}`}
                className="block cursor-pointer group"
              >
                <div
                  className="card-glow p-6 md:p-8 relative overflow-hidden transition-all duration-300"
                  style={{ background: "var(--bg-card)" }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-center flex-1">
                      <div
                        className="text-sm font-bold text-[var(--text-primary)] leading-tight"
                        style={{ fontFamily: "Share Tech Mono, monospace" }}
                      >
                        {a.name}
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)]">P4P {a.p4pScore}</div>
                    </div>
                    <div
                      className="px-3 py-1 text-xs font-bold"
                      style={{
                        fontFamily: "Share Tech Mono, monospace",
                        color: "var(--red-primary)",
                        border: "1px solid var(--red-primary)",
                      }}
                    >
                      VS
                    </div>
                    <div className="text-center flex-1">
                      <div
                        className="text-sm font-bold text-[var(--text-primary)] leading-tight"
                        style={{ fontFamily: "Share Tech Mono, monospace" }}
                      >
                        {b.name}
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)]">P4P {b.p4pScore}</div>
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-[10px] text-[var(--text-muted)] mb-1">
                      {diff <= 5 ? "⚡ Sát nút" : diff <= 15 ? "Lợi thế nhẹ" : "Cách biệt rõ"}
                    </div>
                    <div
                      className="text-xs tracking-widest text-[var(--red-primary)] group-hover:translate-x-1 transition-transform inline-block"
                      style={{ fontFamily: "Share Tech Mono, monospace" }}
                    >
                      PHÂN TÍCH & VOTE →
                    </div>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
