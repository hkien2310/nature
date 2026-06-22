"use client";

import React, { useState, useEffect } from "react";
import { Creature } from "@/data/creatures";
import { useRouter } from "next/navigation";

interface AdminDashboardProps {
  allCreatures: Creature[];
}

export default function AdminDashboard({ allCreatures }: AdminDashboardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [role, setRole] = useState<string | undefined>(undefined);
  const [username, setUsername] = useState<string | undefined>(undefined);

  // Battle Form State
  const [creatureAId, setCreatureAId] = useState(allCreatures[0]?.id || "");
  const [creatureBId, setCreatureBId] = useState(allCreatures[1]?.id || "");
  const [durationDays, setDurationDays] = useState(7);
  const [customTitle, setCustomTitle] = useState("");
  const [battleError, setBattleError] = useState("");
  const [battleSuccess, setBattleSuccess] = useState("");
  const [battleSubmitting, setBattleSubmitting] = useState(false);

  // Copy success feedback state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Auto Grading States
  const [gradingLoading, setGradingLoading] = useState(false);
  const [gradingResult, setGradingResult] = useState<any>(null);
  const [gradingError, setGradingError] = useState("");

  // Calculate Underrated and Overrated species
  const underrated = allCreatures
    .filter(c => (c.aiP4pScore || 50) - c.p4pScore >= 15)
    .sort((a, b) => ((b.aiP4pScore || 50) - b.p4pScore) - ((a.aiP4pScore || 50) - a.p4pScore));

  const overrated = allCreatures
    .filter(c => c.p4pScore - (c.aiP4pScore || 50) >= 15)
    .sort((a, b) => (b.p4pScore - (a.aiP4pScore || 50)) - (a.p4pScore - (b.aiP4pScore || 50)));

  useEffect(() => {
    const stored = localStorage.getItem("user_session");
    if (stored) {
      try {
        const user = JSON.parse(stored);
        setUserId(user.id);
        setRole(user.role);
        setUsername(user.username);
      } catch (e) {}
    }
    setLoading(false);
  }, []);

  const handleTriggerGrading = async () => {
    setGradingLoading(true);
    setGradingError("");
    setGradingResult(null);

    try {
      const res = await fetch("/api/admin/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi khởi động chấm điểm tự động.");

      setGradingResult(data.details);
      router.refresh();
    } catch (err: any) {
      setGradingError(err.message);
    } finally {
      setGradingLoading(false);
    }
  };

  const handleCreateBattle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (creatureAId === creatureBId) {
      setBattleError("Vui lòng chọn 2 sinh vật khác nhau!");
      return;
    }
    setBattleSubmitting(true);
    setBattleError("");
    setBattleSuccess("");

    try {
      const res = await fetch("/api/battles/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatureAId,
          creatureBId,
          durationDays,
          title: customTitle || undefined,
          userId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi tạo trận đấu.");

      setBattleSuccess("Tạo trận đấu thành công!");
      setCustomTitle("");
      router.refresh();
    } catch (err: any) {
      setBattleError(err.message);
    } finally {
      setBattleSubmitting(false);
    }
  };

  const handleToggleDocumentary = async (creatureId: string, currentStatus: boolean) => {
    try {
      const res = await fetch("/api/admin/creatures/toggle-documentary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatureId,
          hasDocumentary: !currentStatus,
          userId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Không thể cập nhật trạng thái.");
        return;
      }
      router.refresh();
    } catch (err) {
      alert("Lỗi kết nối.");
    }
  };

  const handleCopy = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return (
      <div className="text-center py-20 font-mono text-xs text-[var(--text-muted)]">
        VERIFYING PERMISSIONS...
      </div>
    );
  }

  if (role !== "admin" && username !== "admin") {
    return (
      <div className="max-w-md mx-auto my-20 p-8 border border-red-500/20 bg-red-950/10 rounded text-center">
        <h2 className="text-red-500 font-bold mb-3 font-mono">ACCESS DENIED // 403</h2>
        <p className="text-xs text-[var(--text-secondary)]">
          Bạn không có quyền truy cập trang quản trị này. Vui lòng đăng nhập bằng tài khoản Admin.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* ── AUTO-GRADING SYSTEM CALIBRATION PANEL ── */}
      <div className="border border-[var(--border)] rounded-md p-6 bg-black/40 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-[10px] text-red-500 tracking-[0.2em] font-bold" style={{ fontFamily: "Share Tech Mono, monospace" }}>
              // AUTO CALIBRATION & GRADING CORE
            </div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] mt-1 font-mono">
              Hệ thống Hiệu chuẩn P4P
            </h2>
            <p className="text-xs text-[var(--text-muted)] max-w-xl mt-1">
              So sánh ngẫu nhiên 5 sinh vật cùng lúc dựa trên các tiêu chuẩn sinh học cấu trúc để thiết lập bxh P4P khoa học khách quan.
            </p>
          </div>
          
          <button
            onClick={handleTriggerGrading}
            disabled={gradingLoading}
            className="px-6 py-2.5 bg-red-950/20 border border-red-500/40 text-red-400 hover:border-red-500 hover:bg-red-500/10 text-xs font-semibold rounded-sm tracking-widest transition-all disabled:opacity-50 font-mono"
          >
            {gradingLoading ? "[ ENGINE RUNNING... ]" : "[ KÍCH HOẠT CHẤM ĐIỂM TỰ ĐỘNG ]"}
          </button>
        </div>

        {gradingError && (
          <div className="p-3 border border-red-500/20 bg-red-950/10 text-red-400 text-xs font-mono">
            Error: {gradingError}
          </div>
        )}

        {/* Live Run Result Details */}
        {gradingResult && (
          <div className="p-4 border border-green-500/20 bg-green-950/10 rounded-sm space-y-3">
            <div className="text-[10px] text-green-400 tracking-wider font-bold font-mono">// KẾT QUẢ ĐÁNH GIÁ CHÉO 5 LOÀI MỚI NHẤT:</div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {Object.keys(gradingResult).map((id) => {
                const item = gradingResult[id];
                return (
                  <div key={id} className="border border-green-500/10 bg-black/40 p-3 rounded-sm text-xs space-y-1.5">
                    <div className="font-bold text-[var(--text-primary)]">{item.name}</div>
                    <div className="text-[10px] text-green-400 font-mono">Total P4P: {item.totalScore} ({item.aiTier})</div>
                    <div className="text-[9px] text-[var(--text-muted)] space-y-0.5 font-mono">
                      <div>Exo/Density (RMD): {item.rmd}</div>
                      <div>Weaponry (IAW): {item.iaw}</div>
                      <div>Reflex/Maneu (MRL): {item.mrl}</div>
                      <div>Genetics (MEG): {item.meg}</div>
                      <div>Sensory (SRN): {item.srn}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Underrated & Overrated Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Underrated (Bị đánh giá yếu) */}
          <div className="border border-red-500/10 bg-black/20 p-4 rounded-sm">
            <div className="text-[10px] text-green-400 tracking-wider font-bold font-mono mb-3">
              ▲ LOÀI BỊ ĐÁNH GIÁ YẾU (UNDERRATED) - P4P THỰC TẾ CAO HƠN CỘNG ĐỒNG BÌNH CHỌN
            </div>
            {underrated.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] italic">Chưa phát hiện sinh vật nào bị đánh giá quá yếu.</p>
            ) : (
              <div className="space-y-2">
                {underrated.slice(0, 3).map(c => {
                  const diff = (c.aiP4pScore || 50) - c.p4pScore;
                  return (
                    <div key={c.id} className="flex justify-between items-center text-xs p-2 bg-black/30 border border-[var(--border)] rounded-sm">
                      <span className="font-semibold text-[var(--text-primary)]">{c.name}</span>
                      <span className="font-mono text-green-400">P4P: {c.aiP4pScore} vs Vote: {c.p4pScore} (+{diff})</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Overrated (Bị đánh giá mạnh) */}
          <div className="border border-red-500/10 bg-black/20 p-4 rounded-sm">
            <div className="text-[10px] text-red-400 tracking-wider font-bold font-mono mb-3">
              ▼ LOÀI BỊ ĐÁNH GIÁ MẠNH (OVERRATED) - CỘNG ĐỒNG ĐÁNH GIÁ CAO HƠN THỰC LỰC P4P
            </div>
            {overrated.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] italic">Chưa phát hiện sinh vật nào bị đánh giá quá cao.</p>
            ) : (
              <div className="space-y-2">
                {overrated.slice(0, 3).map(c => {
                  const diff = c.p4pScore - (c.aiP4pScore || 50);
                  return (
                    <div key={c.id} className="flex justify-between items-center text-xs p-2 bg-black/30 border border-[var(--border)] rounded-sm">
                      <span className="font-semibold text-[var(--text-primary)]">{c.name}</span>
                      <span className="font-mono text-red-400">Vote: {c.p4pScore} vs P4P: {c.aiP4pScore} (-{diff})</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grid: 2 columns on large screens */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left column: Battle Construct */}
        <div className="lg:col-span-1">
          <div 
            className="p-6 border border-red-500/20 rounded-md sticky top-20 z-30"
            style={{ background: "rgba(20, 10, 10, 0.8)", backdropFilter: "blur(8px)" }}
          >
            <form onSubmit={handleCreateBattle} className="space-y-4">
              <div className="text-[10px] text-red-500 tracking-[0.2em] font-bold" style={{ fontFamily: "Share Tech Mono, monospace" }}>
                // KHỞI TẠO BATTLE ARENA (CONSTRUCT)
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider" style={{ fontFamily: "Share Tech Mono, monospace" }}>Sinh vật A</label>
                <select
                  value={creatureAId}
                  onChange={(e) => setCreatureAId(e.target.value)}
                  className="px-3 py-1.5 text-xs border border-[var(--border)] text-[var(--text-primary)] rounded-sm bg-black/60"
                >
                  {allCreatures.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider" style={{ fontFamily: "Share Tech Mono, monospace" }}>Sinh vật B</label>
                <select
                  value={creatureBId}
                  onChange={(e) => setCreatureBId(e.target.value)}
                  className="px-3 py-1.5 text-xs border border-[var(--border)] text-[var(--text-primary)] rounded-sm bg-black/60"
                >
                  {allCreatures.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider" style={{ fontFamily: "Share Tech Mono, monospace" }}>Thời hạn (Ngày)</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  required
                  value={durationDays}
                  onChange={(e) => setDurationDays(Number(e.target.value))}
                  className="px-3 py-1.5 text-xs border border-[var(--border)] text-[var(--text-primary)] rounded-sm bg-black/60"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider" style={{ fontFamily: "Share Tech Mono, monospace" }}>Tiêu đề trận đấu (Tùy chọn)</label>
                <input
                  type="text"
                  placeholder="ví dụ: Trận chiến kinh điển..."
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="px-3 py-1.5 text-xs border border-[var(--border)] text-[var(--text-primary)] rounded-sm bg-black/60"
                />
              </div>

              {battleError && <div className="text-[10px] text-red-400 font-bold">{battleError}</div>}
              {battleSuccess && <div className="text-[10px] text-green-400 font-bold">{battleSuccess}</div>}

              <button
                type="submit"
                disabled={battleSubmitting}
                className="w-full py-2 bg-red-950/40 border border-red-500 text-red-400 hover:bg-red-500/20 text-xs font-semibold rounded-sm tracking-widest transition-all disabled:opacity-50"
                style={{ fontFamily: "Share Tech Mono, monospace" }}
              >
                {battleSubmitting ? "[ CREATING... ]" : "[ THIẾT LẬP TRẬN ĐẤU ]"}
              </button>
            </form>
          </div>
        </div>

        {/* Right column: Creatures Table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="border border-[var(--border)] rounded-md overflow-hidden" style={{ background: "var(--bg-card)" }}>
            <div className="p-4 border-b border-[var(--border)] bg-black/20 flex justify-between items-center">
              <span className="text-[10px] text-[var(--text-muted)] tracking-wider font-bold" style={{ fontFamily: "Share Tech Mono, monospace" }}>
                // DANH SÁCH SINH VẬT & ĐỒNG BỘ VIDEO
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-black/40 text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-mono">
                    <th className="p-4 sticky top-16 bg-[var(--bg-card)] z-20" style={{ boxShadow: "0 1px 0 var(--border)" }}>Sinh vật</th>
                    <th className="p-4 text-center sticky top-16 bg-[var(--bg-card)] z-20" style={{ boxShadow: "0 1px 0 var(--border)" }}>P4P (AI)</th>
                    <th className="p-4 text-center sticky top-16 bg-[var(--bg-card)] z-20" style={{ boxShadow: "0 1px 0 var(--border)" }}>Chấm (Lần)</th>
                    <th className="p-4 sticky top-16 bg-[var(--bg-card)] z-20" style={{ boxShadow: "0 1px 0 var(--border)" }}>ID để Query</th>
                    <th className="p-4 text-center sticky top-16 bg-[var(--bg-card)] z-20" style={{ boxShadow: "0 1px 0 var(--border)" }}>Đã làm video?</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)] text-xs">
                  {allCreatures.map((creature) => (
                    <tr key={creature.id} className="hover:bg-black/10 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-[var(--text-primary)]">{creature.name}</div>
                        <div className="text-[10px] text-[var(--text-muted)] italic">{creature.scientificName}</div>
                      </td>
                      <td className="p-4 text-center font-mono text-xs">
                        <span className="text-[var(--text-primary)] font-bold">{creature.aiP4pScore || 50}</span>
                        <span className="text-[10px] text-[var(--text-muted)] ml-1">({creature.aiTier || "C"})</span>
                      </td>
                      <td className="p-4 text-center font-mono text-[10px] text-[var(--text-muted)]">
                        {creature.gradingCount || 0}
                      </td>
                      <td className="p-4 font-mono text-[10px]">
                        <div className="flex items-center gap-2">
                          <code className="bg-black/40 px-2 py-0.5 border border-[var(--border)] text-[#00f0ff]">
                            {creature.id}
                          </code>
                          <button
                            onClick={() => handleCopy(creature.id)}
                            className="text-[10px] text-[var(--text-muted)] hover:text-white px-1.5 py-0.5 border border-[var(--border)] rounded-sm hover:bg-black/40 transition-all font-mono"
                          >
                            {copiedId === creature.id ? "Copied!" : "Copy"}
                          </button>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={creature.hasDocumentary || false}
                          onChange={() => handleToggleDocumentary(creature.id, creature.hasDocumentary || false)}
                          className="w-4 h-4 cursor-pointer accent-[#00f0ff]"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
