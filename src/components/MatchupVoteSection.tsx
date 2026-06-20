"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Creature } from "@/data/creatures";

interface MatchupVoteSectionProps {
  matchupSlug: string;
  creatureA: Creature;
  creatureB: Creature;
  initialVotesA: number;
  initialVotesB: number;
  initialUserVotedFor?: string;
  aColor: string;
  bColor: string;
}

export default function MatchupVoteSection({
  matchupSlug,
  creatureA,
  creatureB,
  initialVotesA,
  initialVotesB,
  initialUserVotedFor,
  aColor,
  bColor,
}: MatchupVoteSectionProps) {
  const router = useRouter();
  const [votesA, setVotesA] = useState(initialVotesA);
  const [votesB, setVotesB] = useState(initialVotesB);
  const [userVotedFor, setUserVotedFor] = useState<string | undefined>(initialUserVotedFor);
  const [submitting, setSubmitting] = useState(false);

  // User session
  const [userId, setUserId] = useState<string | undefined>(undefined);

  useEffect(() => {
    const stored = localStorage.getItem("user_session");
    if (stored) {
      try {
        const user = JSON.parse(stored);
        setUserId(user.id);
      } catch (e) {}
    }
  }, []);

  const handleVote = async (creatureId: string) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/matchup/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchupSlug,
          voteFor: creatureId,
          userId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Bình chọn thất bại.");
        return;
      }

      setUserVotedFor(creatureId);
      if (creatureId === creatureA.id) {
        setVotesA(prev => prev + 1);
      } else {
        setVotesB(prev => prev + 1);
      }
      router.refresh();
    } catch (err) {
      alert("Đã xảy ra lỗi kết nối.");
    } finally {
      setSubmitting(false);
    }
  };

  const totalVotes = votesA + votesB;
  const pctA = totalVotes > 0 ? Math.round((votesA / totalVotes) * 100) : 50;
  const pctB = totalVotes > 0 ? Math.round((votesB / totalVotes) * 100) : 50;

  return (
    <div className="border border-[var(--border)] p-6 mb-6" style={{ background: "var(--bg-card)" }}>
      <div
        className="text-[10px] tracking-widest text-[var(--text-muted)] mb-4"
        style={{ fontFamily: "Share Tech Mono, monospace" }}
      >
        // DỰ ĐOÁN TỪ CỘNG ĐỒNG (COMMUNITY PREDICTIONS)
      </div>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          {/* Challenger A Vote Column */}
          <div className="text-center flex-1">
            <span className="text-xs text-[var(--text-muted)] block mb-1">Dự đoán cho</span>
            <div className="text-sm font-bold text-[var(--text-primary)]" style={{ color: aColor }}>
              {creatureA.name}
            </div>
            
            {!userVotedFor ? (
              <button
                disabled={submitting}
                onClick={() => handleVote(creatureA.id)}
                className="mt-3 px-4 py-1.5 border text-xs font-bold transition-all hover:bg-opacity-20 cursor-pointer disabled:opacity-50"
                style={{
                  borderColor: aColor,
                  color: aColor,
                  background: `${aColor}10`,
                  fontFamily: "Share Tech Mono, monospace",
                }}
              >
                VOTE {creatureA.name.toUpperCase()}
              </button>
            ) : (
              <div className="mt-3 text-xs font-bold min-h-[30px] flex items-center justify-center">
                {userVotedFor === creatureA.id ? (
                  <span style={{ color: aColor }}>✓ ĐÃ BÌNH CHỌN</span>
                ) : (
                  <span className="text-[var(--text-muted)]">—</span>
                )}
              </div>
            )}
          </div>

          <div className="text-xs font-bold text-red-500 font-mono">VS</div>

          {/* Challenger B Vote Column */}
          <div className="text-center flex-1">
            <span className="text-xs text-[var(--text-muted)] block mb-1">Dự đoán cho</span>
            <div className="text-sm font-bold text-[var(--text-primary)]" style={{ color: bColor }}>
              {creatureB.name}
            </div>

            {!userVotedFor ? (
              <button
                disabled={submitting}
                onClick={() => handleVote(creatureB.id)}
                className="mt-3 px-4 py-1.5 border text-xs font-bold transition-all hover:bg-opacity-20 cursor-pointer disabled:opacity-50"
                style={{
                  borderColor: bColor,
                  color: bColor,
                  background: `${bColor}10`,
                  fontFamily: "Share Tech Mono, monospace",
                }}
              >
                VOTE {creatureB.name.toUpperCase()}
              </button>
            ) : (
              <div className="mt-3 text-xs font-bold min-h-[30px] flex items-center justify-center">
                {userVotedFor === creatureB.id ? (
                  <span style={{ color: bColor }}>✓ ĐÃ BÌNH CHỌN</span>
                ) : (
                  <span className="text-[var(--text-muted)]">—</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Visual progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-[var(--text-secondary)] font-mono">
            <span>{pctA}% ({votesA} phiếu)</span>
            <span className="text-[var(--text-muted)]">{totalVotes} phiếu bầu tổng cộng</span>
            <span>{pctB}% ({votesB} phiếu)</span>
          </div>
          <div className="w-full h-3 bg-black/60 rounded-full overflow-hidden flex border border-[var(--border)]">
            <div className="h-full transition-all duration-500" style={{ width: `${pctA}%`, backgroundColor: aColor }} />
            <div className="h-full transition-all duration-500" style={{ width: `${pctB}%`, backgroundColor: bColor }} />
          </div>
        </div>
      </div>
    </div>
  );
}
