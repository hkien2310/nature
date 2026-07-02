import React from "react";
import { getDBBattles, getDBCreatures } from "@/lib/db";
import BattleArena from "@/components/BattleArena";
import { headers } from "next/headers";
import Link from "next/link";
import type { Metadata } from "next";



export const metadata: Metadata = {
  title: "Lịch Sử Kết Quả — BioForce Atlas",
  description: "Lịch sử các trận đấu đã kết thúc và kết quả bình chọn từ cộng đồng.",
};

export default async function MatchupHistoryPage() {
  const reqHeaders = await headers();
  const user_ip = reqHeaders.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";

  const battles = await getDBBattles({ user_ip });
  const creatures = await getDBCreatures();

  return (
    <div className="max-w-6xl mx-auto px-6 py-20">
      <div className="mb-8">
        <div className="hud-line mb-4">
          <span
            className="text-[10px] text-[var(--text-muted)] tracking-[0.3em]"
            style={{ fontFamily: "Share Tech Mono, monospace" }}
          >
            BIOFORCE ATLAS // PAST WARS
          </span>
        </div>
        <h1
          className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-3"
          style={{ fontFamily: "Share Tech Mono, monospace" }}
        >
          MATCHUP HISTORY
        </h1>
        <p className="text-sm text-[var(--text-secondary)] max-w-lg mb-6">
          Lịch sử các trận đấu đã kết thúc. Xem loài sinh vật nào đã chiếm ưu thế theo bình chọn của cộng đồng.
        </p>

        {/* Navigation tabs */}
        <div className="flex flex-wrap gap-4 border-b border-[var(--border)] pb-3" style={{ fontFamily: "Share Tech Mono, monospace" }}>
          <Link href="/matchup" className="text-xs tracking-widest text-[var(--text-secondary)] hover:text-[#00f0ff] transition-colors">[ ĐANG DIỄN RA ]</Link>
          <Link href="/matchup/history" className="text-xs tracking-widest text-[var(--red-primary)] font-bold">[ LỊCH SỬ KẾT QUẢ ]</Link>
        </div>
      </div>

      <BattleArena initialBattles={battles} allCreatures={creatures} filter="concluded" />
    </div>
  );
}
