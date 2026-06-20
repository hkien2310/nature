"use client";

import React, { useState, useEffect } from "react";
import { Creature } from "@/data/creatures";
import { Battle } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

interface BattleArenaProps {
  initialBattles: Battle[];
  allCreatures: Creature[];
  filter?: "active" | "concluded";
}

export default function BattleArena({ initialBattles, allCreatures, filter }: BattleArenaProps) {
  const router = useRouter();
  const [battles, setBattles] = useState<Battle[]>(initialBattles);

  // User session
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [username, setUsername] = useState<string | undefined>(undefined);

  useEffect(() => {
    const checkSession = () => {
      const stored = localStorage.getItem("user_session");
      if (stored) {
        try {
          const user = JSON.parse(stored);
          setUserId(user.id);
          setUsername(user.username);
        } catch (e) {
          setUserId(undefined);
          setUsername(undefined);
        }
      } else {
        setUserId(undefined);
        setUsername(undefined);
      }
    };

    checkSession();
    window.addEventListener("storage", checkSession);

    return () => {
      window.removeEventListener("storage", checkSession);
    };
  }, []);

  // Sync battles when initialBattles changes
  useEffect(() => {
    setBattles(initialBattles);
  }, [initialBattles]);

  const handleVote = async (battleId: string, creatureId: string) => {
    try {
      const res = await fetch("/api/battles/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          battleId,
          voteFor: creatureId,
          userId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Bình chọn thất bại.");
        return;
      }

      router.refresh();
    } catch (err: any) {
      alert("Đã xảy ra lỗi kết nối.");
    }
  };

  // Divide battles into active and concluded
  const now = new Date();
  const activeBattles = battles.filter(b => new Date(b.ends_at) > now);
  const concludedBattles = battles.filter(b => new Date(b.ends_at) <= now);

  const showActive = !filter || filter === "active";
  const showConcluded = !filter || filter === "concluded";

  return (
    <div className="space-y-12">

      {/* Active Battles Section */}
      {showActive && (
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6 border-b border-[var(--border)] pb-2" style={{ fontFamily: "Share Tech Mono, monospace" }}>
            // ĐANG DIỄN RA (ACTIVE WARS)
          </h2>

          {activeBattles.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-[var(--border)] rounded-md text-xs text-[var(--text-muted)]">
              Không có trận đấu nào đang hoạt động.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
            {activeBattles.map(battle => {
              const totalVotes = battle.votes_a + battle.votes_b;
              const pctA = totalVotes > 0 ? Math.round((battle.votes_a / totalVotes) * 100) : 50;
              const pctB = totalVotes > 0 ? Math.round((battle.votes_b / totalVotes) * 100) : 50;
              const isVoted = battle.user_voted_for !== undefined;

              return (
                <div 
                  key={battle.id}
                  className="p-6 border border-[var(--border)] rounded-md backdrop-blur-sm"
                  style={{ background: "rgba(18, 18, 24, 0.6)" }}
                >
                  <div className="flex justify-between items-center mb-6 border-b border-[var(--border)] pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-[#00f0ff]" style={{ fontFamily: "Share Tech Mono, monospace" }}>
                        {battle.title || "TRẬN CHIẾN SINH TỒN PHÂN HẠNG"}
                      </h3>
                      <div className="text-[10px] text-[var(--text-muted)] mt-1">
                        Khởi chạy: {new Date(battle.created_at).toLocaleDateString("vi-VN")}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-yellow-500 font-bold" style={{ fontFamily: "Share Tech Mono, monospace" }}>
                        COUNTDOWN: {Math.max(0, Math.ceil((new Date(battle.ends_at).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))} NGÀY NỮA
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-7 gap-6 items-center">
                    {/* Creature A */}
                    <div className="col-span-3 text-center border p-4 border-[var(--border)] bg-black/30 rounded-sm">
                      <h4 className="text-lg font-bold text-[var(--text-primary)]" style={{ fontFamily: "Share Tech Mono, monospace" }}>{battle.creature_a.name}</h4>
                      <p className="text-[10px] text-[var(--text-muted)] italic">{battle.creature_a.scientificName}</p>
                      <div className="mt-3 text-xs text-[var(--text-secondary)]">P4P Score: {battle.creature_a.p4pScore}</div>

                      {!isVoted ? (
                        <button
                          onClick={() => handleVote(battle.id, battle.creature_a_id)}
                          className="mt-4 px-4 py-1.5 border border-[#00f0ff]/40 text-[#00f0ff] hover:bg-[#00f0ff]/10 text-xs font-semibold rounded-sm tracking-wider"
                          style={{ fontFamily: "Share Tech Mono, monospace" }}
                        >
                          DỰ ĐOÁN THẮNG
                        </button>
                      ) : (
                        <div className="mt-4 text-xs font-bold">
                          {battle.user_voted_for === battle.creature_a_id ? (
                            <span className="text-green-400">✓ BẠN ĐÃ BÌNH CHỌN</span>
                          ) : (
                            <span className="text-[var(--text-muted)]">—</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* VS divider */}
                    <div className="col-span-1 text-center font-bold text-lg text-red-500" style={{ fontFamily: "Share Tech Mono, monospace" }}>
                      VS
                    </div>

                    {/* Creature B */}
                    <div className="col-span-3 text-center border p-4 border-[var(--border)] bg-black/30 rounded-sm">
                      <h4 className="text-lg font-bold text-[var(--text-primary)]" style={{ fontFamily: "Share Tech Mono, monospace" }}>{battle.creature_b.name}</h4>
                      <p className="text-[10px] text-[var(--text-muted)] italic">{battle.creature_b.scientificName}</p>
                      <div className="mt-3 text-xs text-[var(--text-secondary)]">P4P Score: {battle.creature_b.p4pScore}</div>

                      {!isVoted ? (
                        <button
                          onClick={() => handleVote(battle.id, battle.creature_b_id)}
                          className="mt-4 px-4 py-1.5 border border-[#00f0ff]/40 text-[#00f0ff] hover:bg-[#00f0ff]/10 text-xs font-semibold rounded-sm tracking-wider"
                          style={{ fontFamily: "Share Tech Mono, monospace" }}
                        >
                          DỰ ĐOÁN THẮNG
                        </button>
                      ) : (
                        <div className="mt-4 text-xs font-bold">
                          {battle.user_voted_for === battle.creature_b_id ? (
                            <span className="text-green-400">✓ BẠN ĐÃ BÌNH CHỌN</span>
                          ) : (
                            <span className="text-[var(--text-muted)]">—</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Voting stats visual bar */}
                  <div className="mt-6 space-y-2">
                    <div className="flex justify-between text-xs text-[var(--text-secondary)]" style={{ fontFamily: "Share Tech Mono, monospace" }}>
                      <span>{battle.creature_a.name}: {pctA}% ({battle.votes_a} phiếu)</span>
                      <span>{battle.creature_b.name}: {pctB}% ({battle.votes_b} phiếu)</span>
                    </div>
                    <div className="w-full h-2.5 bg-black/60 rounded-full overflow-hidden flex border border-[var(--border)]">
                      <div className="h-full bg-cyan-500 transition-all duration-500" style={{ width: `${pctA}%` }} />
                      <div className="h-full bg-red-500 transition-all duration-500" style={{ width: `${pctB}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      )}

      {/* Concluded Battles Section */}
      {showConcluded && (
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6 border-b border-[var(--border)] pb-2" style={{ fontFamily: "Share Tech Mono, monospace" }}>
            // KẾT THÚC (PAST RESULTS)
          </h2>

        {concludedBattles.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-[var(--border)] rounded-md text-xs text-[var(--text-muted)]">
            Chưa có trận đấu nào kết thúc.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {concludedBattles.map(battle => {
              const totalVotes = battle.votes_a + battle.votes_b;
              const pctA = totalVotes > 0 ? Math.round((battle.votes_a / totalVotes) * 100) : 50;
              const pctB = totalVotes > 0 ? Math.round((battle.votes_b / totalVotes) * 100) : 50;
              
              const winner = battle.votes_a > battle.votes_b 
                ? battle.creature_a 
                : battle.votes_b > battle.votes_a 
                ? battle.creature_b 
                : null;

              return (
                <div 
                  key={battle.id}
                  className="p-5 border border-[var(--border)] rounded-md relative overflow-hidden"
                  style={{ background: "rgba(10, 10, 12, 0.8)" }}
                >
                  {/* Concluded tag */}
                  <div 
                    className="absolute top-2 right-2 px-1.5 py-0.5 border border-red-500/40 text-red-500 text-[8px] font-bold rounded-sm tracking-widest uppercase"
                    style={{ fontFamily: "Share Tech Mono, monospace", background: "rgba(255, 0, 0, 0.05)" }}
                  >
                    BẢN TIN KẾT THÚC
                  </div>

                  <div className="text-xs text-[var(--text-muted)] mb-3" style={{ fontFamily: "Share Tech Mono, monospace" }}>
                    {battle.title || "TRẬN CHIẾN KẾT THÚC"}
                  </div>

                  <div className="flex justify-between items-center gap-4 py-2 border-b border-[var(--border)]/40 mb-4">
                    <div className="flex-1 text-center">
                      <div className="text-sm font-bold text-[var(--text-primary)]">{battle.creature_a.name}</div>
                      <div className="text-xs text-[#00f0ff] font-semibold mt-1">{pctA}%</div>
                    </div>
                    <div className="text-xs text-red-500 font-bold" style={{ fontFamily: "Share Tech Mono, monospace" }}>VS</div>
                    <div className="flex-1 text-center">
                      <div className="text-sm font-bold text-[var(--text-primary)]">{battle.creature_b.name}</div>
                      <div className="text-xs text-red-400 font-semibold mt-1">{pctB}%</div>
                    </div>
                  </div>

                  {/* Announcement Banner */}
                  <div className="text-center py-2 px-3 bg-cyan-950/20 border border-cyan-500/20 text-xs text-[var(--text-primary)] rounded-sm">
                    {winner ? (
                      <span>
                        🏆 CHIẾN THẮNG: <span className="font-bold text-[#00f0ff]">{winner.name}</span> (Lợi thế do cộng đồng bình chọn)
                      </span>
                    ) : (
                      <span>⚖️ HÒA NHAU (Phiếu bầu bằng nhau)</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      )}
    </div>
  );
}
