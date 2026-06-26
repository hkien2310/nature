"use client";

import React, { useState, useEffect } from "react";
import { HumanSplice } from "@/lib/db";

interface HumanSpliceSectionProps {
  creatureId: string;
  slug: string;
}

export default function HumanSpliceSection({ creatureId, slug }: HumanSpliceSectionProps) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [splices, setSplices] = useState<HumanSplice[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSpliceId, setActiveSpliceId] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("user_session");
    if (stored) {
      try {
        const user = JSON.parse(stored);
        if (user.role === "admin" || user.username === "admin") {
          setIsAdmin(true);
          fetchSpliceData();
          return;
        }
      } catch (err) {
        console.error("Failed to parse user session:", err);
      }
    }
    setLoading(false);
  }, []);

  const fetchSpliceData = async () => {
    try {
      const res = await fetch(`/api/creatures/${slug}/human-splice`);
      const data = await res.json();
      if (res.ok && data.success) {
        setSplices(data.splices || []);
        if (data.splices && data.splices.length > 0) {
          setActiveSpliceId(data.splices[0].id);
        }
      }
    } catch (err) {
      console.error("Error fetching Human-Splice data:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) return null;

  if (loading) {
    return (
      <div className="border border-amber-500/20 p-6 bg-amber-950/5 text-center text-xs text-[var(--text-muted)] font-mono animate-pulse">
        [INITIALIZING GENETIC SYNTHESIS SIMULATOR...]
      </div>
    );
  }

  if (splices.length === 0) {
    return (
      <div className="border border-amber-500/20 p-8 bg-amber-950/5 text-center rounded-sm">
        <div className="text-amber-500 font-bold mb-2 font-mono text-sm tracking-wider">
          ⚠️ GENETIC LAB DEPLOYED // NO SPLICED TRAITS
        </div>
        <p className="text-xs text-[var(--text-secondary)]">
          Phòng thí nghiệm cấy ghép gen người đã được thiết lập nhưng chưa có cấu hình gen lai nào được xây dựng.
          Hãy gửi tin nhắn <span className="font-mono text-amber-400 bg-amber-950/30 px-1.5 py-0.5 rounded">"Làm giàu Ghép Gen"</span> cho AI để tự động nghiên cứu sinh dữ liệu ghép gen.
        </p>
      </div>
    );
  }

  const activeSplice = splices.find((s) => s.id === activeSpliceId) || splices[0];

  const getStatLabel = (statKey: string) => {
    const labels: Record<string, string> = {
      strength: "Sức Mạnh (STR)",
      durability: "Độ Bền (DEF)",
      speed: "Tốc Độ (SPD)",
      weaponry: "Hiệu Suất Vũ Khí",
      special: "Khả Năng Thích Nghi",
      lethality: "Mức Nguy Hiểm"
    };
    return labels[statKey] || statKey;
  };

  return (
    <div className="space-y-8 border border-amber-500/30 bg-amber-950/5 p-6 md:p-8 rounded-sm relative overflow-hidden">
      {/* Background Biohazard Watermark */}
      <div className="absolute top-0 right-0 w-92 h-92 opacity-5 pointer-events-none" style={{
        background: "radial-gradient(circle, #f59e0b, transparent 70%)",
        transform: "translate(30%, -30%)"
      }} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-amber-500/20 pb-4">
        <div>
          <span className="text-[9px] text-amber-500 tracking-[0.3em] font-mono font-bold block mb-1 uppercase">
            SECURE ACCESS // GENETIC SPLICING LABORATORY
          </span>
          <h2 className="text-xl md:text-2xl font-bold text-amber-500" style={{ fontFamily: "Share Tech Mono, monospace" }}>
            MOSAIC ORGANISM SIMULATOR
          </h2>
        </div>
        <div className="mt-2 sm:mt-0 px-3 py-1 border border-amber-500/40 bg-amber-950/30 text-amber-500 text-[10px] font-mono font-bold tracking-widest uppercase rounded-sm animate-pulse">
          BIOHAZARD PROTOCOL ACTIVE
        </div>
      </div>

      {/* Spliced Trait Selection Tabs */}
      {splices.length > 1 && (
        <div className="flex flex-wrap gap-2 border-b border-[var(--border)] pb-2">
          {splices.map((s) => {
            const isActive = s.id === activeSpliceId;
            return (
              <button
                key={s.id}
                onClick={() => setActiveSpliceId(s.id)}
                className={`px-3 py-2 text-xs border font-mono transition-all duration-300 rounded-sm cursor-pointer ${
                  isActive
                    ? "bg-amber-900/35 border-amber-500 text-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.2)]"
                    : "border-[var(--border)] text-[var(--text-muted)] hover:border-amber-500/50 hover:text-amber-400"
                }`}
              >
                🧬 {s.trait_name}
              </button>
            );
          })}
        </div>
      )}

      {/* Spliced Trait Details */}
      {activeSplice && (
        <div className="space-y-6">
          <div className="bg-amber-950/20 border-l-4 border-amber-500 p-4 rounded-r-sm">
            <span className="text-[10px] text-amber-500 font-mono font-bold tracking-wider uppercase block mb-1">
              BẢN ĐỒ GEN LAI GHÉP: {activeSplice.trait_name.toUpperCase()}
            </span>
            <h3 className="text-base md:text-lg font-bold text-[var(--text-primary)] font-mono leading-relaxed">
              {activeSplice.title}
            </h3>
            {activeSplice.summary && (
              <p className="text-xs text-amber-300/80 mt-2 font-mono leading-relaxed">
                ⚡ TÓM TẮT THÍ NGHIỆM: {activeSplice.summary}
              </p>
            )}
          </div>

          <div className="grid lg:grid-cols-3 gap-6 items-start">
            {/* Left Col: Description & Narrative */}
            <div className="lg:col-span-2 space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                {/* Hype */}
                <div className="border border-amber-500/20 bg-amber-950/10 p-4 rounded-sm">
                  <span className="text-[10px] text-amber-400 font-mono font-bold tracking-wider block mb-2">
                    // HYPE MODE (CƯỜNG HÓA SCI-FI)
                  </span>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed italic">
                    "{activeSplice.sci_fi_hype}"
                  </p>
                </div>

                {/* Reality Check */}
                <div className="border border-red-500/20 bg-red-950/10 p-4 rounded-sm">
                  <span className="text-[10px] text-red-400 font-mono font-bold tracking-wider block mb-2">
                    // REALITY CHECK (SINH HỌC THÍCH NGHI)
                  </span>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    {activeSplice.scientific_reality}
                  </p>
                </div>
              </div>

              {/* Physical specifications and formulas */}
              {activeSplice.formulas_and_data && (
                <div className="border border-[var(--border)] bg-black/30 p-4 rounded-sm space-y-3">
                  <span className="text-[10px] text-[var(--text-muted)] tracking-wider font-mono font-bold block">
                    // PHÂN TÍCH THÔNG SỐ VẬT LÝ VÀ CHỈ SỐ LAI GHÉP
                  </span>

                  {/* Calculations grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[11px] border-b border-[var(--border)] pb-3 mb-3">
                    {activeSplice.formulas_and_data.human_mass_kg && (
                      <div>
                        <span className="text-[var(--text-muted)] block">Khối Lượng Người</span>
                        <span className="text-[var(--text-secondary)] font-mono">{activeSplice.formulas_and_data.human_mass_kg} kg</span>
                      </div>
                    )}
                    {activeSplice.formulas_and_data.grafted_weight_g && (
                      <div>
                        <span className="text-[var(--text-muted)] block">TL Bộ Phận Ghép</span>
                        <span className="text-[var(--text-secondary)] font-mono">{activeSplice.formulas_and_data.grafted_weight_g} g</span>
                      </div>
                    )}
                    {activeSplice.formulas_and_data.punch_velocity_ms && (
                      <div>
                        <span className="text-[var(--text-muted)] block">Tốc Độ Đòn Đánh</span>
                        <span className="text-[var(--text-secondary)] font-mono text-amber-400 font-bold">{activeSplice.formulas_and_data.punch_velocity_ms} m/s</span>
                      </div>
                    )}
                    {activeSplice.formulas_and_data.impact_force_n && (
                      <div>
                        <span className="text-[var(--text-muted)] block">Lực Va Chạm Ghép</span>
                        <span className="text-[var(--text-secondary)] font-mono text-amber-400 font-bold">{(activeSplice.formulas_and_data.impact_force_n / 1000).toFixed(1)} kN</span>
                      </div>
                    )}
                  </div>

                  {/* Formulas list */}
                  {activeSplice.formulas_and_data.formulas && activeSplice.formulas_and_data.formulas.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-[10px] font-mono">
                        <thead>
                          <tr className="border-b border-[var(--border)] text-[var(--text-muted)]">
                            <th className="pb-1.5 font-semibold">Tên phép tính</th>
                            <th className="pb-1.5 font-semibold">Công thức vật lý</th>
                            <th className="pb-1.5 font-semibold text-right">Kết quả lý thuyết</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activeSplice.formulas_and_data.formulas.map((form: any, idx: number) => (
                            <tr key={idx} className="border-b border-[var(--border)]/50 hover:bg-white/5 transition-all">
                              <td className="py-2 text-[var(--text-secondary)] pr-2">{form.name}</td>
                              <td className="py-2 text-[var(--text-muted)] font-mono">{form.equation}</td>
                              <td className="py-2 text-right text-amber-400 font-bold">{form.result}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <span className="text-[10px] text-[var(--text-muted)] italic">Không có công thức toán/lý cụ thể được đăng ký.</span>
                  )}
                </div>
              )}
            </div>

            {/* Right Col: Radar chart / stats list */}
            <div className="lg:col-span-1 border border-amber-500/20 bg-amber-950/15 p-6 rounded-sm flex flex-col justify-between h-full gap-4">
              <div>
                <span className="text-[10px] text-amber-500 font-mono font-bold tracking-widest block text-center mb-4 uppercase">
                  SPLICED COMBAT STATS
                </span>

                <div className="space-y-4">
                  {Object.entries(activeSplice.spliced_stats).map(([key, value]) => (
                    <div key={key}>
                      <div className="flex justify-between mb-1.5 text-[11px] font-mono">
                        <span className="text-[var(--text-secondary)]">{getStatLabel(key)}</span>
                        <span className="text-amber-400 font-bold">{value}/100</span>
                      </div>
                      <div className="h-1.5 bg-black/50 border border-amber-500/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-600 to-amber-400"
                          style={{ width: `${value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Security Alert Badge */}
              <div className="border border-amber-500/30 bg-amber-950/40 p-3 text-center rounded-sm">
                <span className="text-[8px] text-amber-400 font-mono font-bold tracking-widest block uppercase animate-pulse mb-1">
                  WARNING // DNA CONTAMINATION
                </span>
                <p className="text-[10px] text-[var(--text-muted)] font-mono leading-relaxed">
                  Tỷ lệ tương thích cơ học đạt {activeSplice.spliced_stats.special}%. Có nguy cơ đào thải nếu không duy trì kháng sinh tế bào.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
