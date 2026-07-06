"use client";

import React, { useState, useEffect } from "react";
import { WhatIfQuestion, WhatIfAnswer } from "@/lib/db";

interface WhatIfSectionProps {
  creatureId: string;
  slug: string;
}

export default function WhatIfSection({ creatureId, slug }: WhatIfSectionProps) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [whatIfs, setWhatIfs] = useState<Array<WhatIfQuestion & { answers: WhatIfAnswer[] }>>([]);
  const [loading, setLoading] = useState(true);
  const [activeAnswerId, setActiveAnswerId] = useState<Record<string, string>>({});

  useEffect(() => {
    // Check if user is admin on mount
    const stored = localStorage.getItem("user_session");
    if (stored) {
      try {
        const user = JSON.parse(stored);
        if (user.role === "admin" || user.username === "admin") {
          setIsAdmin(true);
          fetchWhatIfData();
          return;
        }
      } catch (err) {
        console.error("Failed to parse user session:", err);
      }
    }
    setLoading(false);
  }, []);

  const fetchWhatIfData = async () => {
    try {
      const res = await fetch(`/api/creatures/${slug}/what-if`);
      const data = await res.json();
      if (res.ok && data.success) {
        setWhatIfs(data.whatIfs || []);
        
        // Initialize active answer tab for each question
        const initialActive: Record<string, string> = {};
        data.whatIfs.forEach((q: any) => {
          if (q.answers && q.answers.length > 0) {
            initialActive[q.id] = q.answers[0].id;
          }
        });
        setActiveAnswerId(initialActive);
      }
    } catch (err) {
      console.error("Error fetching What-If data:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) return null;

  if (loading) {
    return (
      <div className="border border-red-500/20 p-6 bg-red-950/5 text-center text-xs text-[var(--text-muted)] font-mono animate-pulse">
        [DECRYPTING WHAT-IF SCENARIOS...]
      </div>
    );
  }

  if (whatIfs.length === 0) {
    return (
      <div className="border border-red-500/20 p-8 bg-red-950/5 text-center rounded-sm">
        <div className="text-red-500 font-bold mb-2 font-mono text-sm tracking-wider">
          ⚠️ WHAT-IF PROTOCOL DEPLOYED // NO DATA
        </div>
        <p className="text-xs text-[var(--text-secondary)]">
          Hệ thống giả lập What-If đã được kích hoạt cho sinh vật này nhưng chưa có dữ liệu kịch bản phóng to.
          Hãy gửi tin nhắn <span className="font-mono text-red-400 bg-red-950/30 px-1.5 py-0.5 rounded">"Làm giàu What-If"</span> cho AI để tự động nghiên cứu sinh dữ liệu.
        </p>
      </div>
    );
  }

  const getPerspectiveLabel = (type: string) => {
    switch (type) {
      case "classic_scaling":
        return "Cơ Học Lý Thuyết";
      case "biological_reality":
        return "Sinh Học Thực Tế";
      case "evolutionary_mutation":
        return "Đột Biến Thích Nghi";
      case "gauntlet":
        return "Scaling Gauntlet ⚔️";
      default:
        return "Góc Nhìn Khác";
    }
  };

  const getPerspectiveBadgeColor = (type: string) => {
    switch (type) {
      case "classic_scaling":
        return "text-cyan-400 border-cyan-500/30 bg-cyan-950/20";
      case "biological_reality":
        return "text-red-400 border-red-500/30 bg-red-950/20";
      case "evolutionary_mutation":
        return "text-emerald-400 border-emerald-500/30 bg-emerald-950/20";
      case "gauntlet":
        return "text-purple-400 border-purple-500/30 bg-purple-950/20 shadow-[0_0_10px_rgba(168,85,247,0.2)]";
      default:
        return "text-amber-400 border-amber-500/30 bg-amber-950/20";
    }
  };

  return (
    <div className="space-y-8 border border-red-500/30 bg-red-950/5 p-6 md:p-8 rounded-sm relative overflow-hidden">
      {/* Background Warning Watermark */}
      <div className="absolute top-0 right-0 w-92 h-92 opacity-5 pointer-events-none" style={{
        background: "radial-gradient(circle, #ff2d2d, transparent 70%)",
        transform: "translate(30%, -30%)"
      }} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-red-500/20 pb-4">
        <div>
          <span className="text-[9px] text-red-500 tracking-[0.3em] font-mono font-bold block mb-1 uppercase">
            WARNING // CLASSIFIED SIMULATION PROTOCOL
          </span>
          <h2 className="text-xl md:text-2xl font-bold text-red-400" style={{ fontFamily: "Share Tech Mono, monospace" }}>
            WHAT-IF SIMULATOR
          </h2>
        </div>
        <div className="mt-2 sm:mt-0 px-3 py-1 border border-red-500/40 bg-red-950/30 text-red-400 text-[10px] font-mono font-bold tracking-widest uppercase rounded-sm animate-pulse">
          ADMIN ACCESS ACTIVE
        </div>
      </div>

      {whatIfs.map((q) => {
        const activeAns = q.answers.find((a) => a.id === activeAnswerId[q.id]) || q.answers[0];
        
        return (
          <div key={q.id} className="space-y-6">
            {/* Question Title */}
            <div className="bg-red-950/20 border-l-4 border-red-500 p-4 rounded-r-sm">
              <span className="text-[10px] text-red-500 font-mono font-bold tracking-wider uppercase block mb-1">
                KỊCH BẢN GIẢ THUYẾT:
              </span>
              <h3 className="text-base md:text-lg font-bold text-[var(--text-primary)] font-mono leading-relaxed">
                {q.title}
              </h3>
              {q.description && (
                <p className="text-xs text-[var(--text-secondary)] mt-2 italic">
                  {q.description}
                </p>
              )}
            </div>

            {/* Answer Selector Tabs */}
            {q.answers.length > 0 && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2 border-b border-[var(--border)] pb-2">
                  {q.answers.map((ans) => {
                    const isActive = activeAnswerId[q.id] === ans.id;
                    const perspectiveColor = getPerspectiveBadgeColor(ans.perspective_type);
                    
                    return (
                      <button
                        key={ans.id}
                        onClick={() => setActiveAnswerId({ ...activeAnswerId, [q.id]: ans.id })}
                        className={`px-3 py-2 text-xs border font-mono transition-all duration-300 rounded-sm cursor-pointer ${
                          isActive
                            ? "bg-red-900/35 border-red-500 text-red-400 shadow-[0_0_8px_rgba(239,68,68,0.2)]"
                            : "border-[var(--border)] text-[var(--text-muted)] hover:border-red-500/50 hover:text-red-400"
                        }`}
                      >
                        {getPerspectiveLabel(ans.perspective_type)}
                      </button>
                    );
                  })}
                </div>

                {/* Active Answer Content */}
                {activeAns && (
                  <div className="grid lg:grid-cols-3 gap-6 items-start animate-fadeIn">
                    
                    {/* Left & Middle Column - Narrative analysis */}
                    <div className="lg:col-span-2 space-y-4">
                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-0.5 text-[9px] border font-mono rounded-full font-bold uppercase ${getPerspectiveBadgeColor(activeAns.perspective_type)}`}>
                          {activeAns.perspective_type}
                        </span>
                        <h4 className="text-sm font-bold text-[var(--text-primary)] font-mono">
                          {activeAns.title}
                        </h4>
                      </div>

                      {activeAns.summary && (
                        <p className="text-xs font-semibold text-red-300/90 font-mono bg-red-950/20 p-3 border border-red-900/10 rounded-sm leading-relaxed">
                          ⚡ QUICK IN INTEL: {activeAns.summary}
                        </p>
                      )}

                      <div className="text-xs text-[var(--text-secondary)] leading-relaxed space-y-3 whitespace-pre-wrap font-sans">
                        {activeAns.content}
                      </div>

                      {/* Formulas and data analysis table */}
                      {activeAns.formulas_and_data && (
                        <div className="border border-[var(--border)] bg-black/30 p-4 rounded-sm space-y-3">
                          <span className="text-[10px] text-[var(--text-muted)] tracking-wider font-mono font-bold block">
                            // PHÂN TÍCH VẬT LÝ HỌC & CÔNG THỨC SCALING
                          </span>
                          
                          {/* Key values grid */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[11px] border-b border-[var(--border)] pb-3 mb-3">
                            {activeAns.formulas_and_data.scaling_factor && (
                              <div>
                                <span className="text-[var(--text-muted)] block">Tỷ Lệ Scale</span>
                                <span className="text-[var(--text-secondary)] font-mono font-bold">x{activeAns.formulas_and_data.scaling_factor}</span>
                              </div>
                            )}
                            {activeAns.formulas_and_data.mass_g_original && (
                              <div>
                                <span className="text-[var(--text-muted)] block">Cân Nặng Gốc</span>
                                <span className="text-[var(--text-secondary)] font-mono">{activeAns.formulas_and_data.mass_g_original}g</span>
                              </div>
                            )}
                            {activeAns.formulas_and_data.mass_kg_scaled && (
                              <div>
                                <span className="text-[var(--text-muted)] block">Cân Nặng Scaled</span>
                                <span className="text-[var(--text-secondary)] font-mono font-bold">{activeAns.formulas_and_data.mass_kg_scaled}kg</span>
                              </div>
                            )}
                            {activeAns.formulas_and_data.striking_force_n_scaled && (
                              <div>
                                <span className="text-[var(--text-muted)] block">Lực Đập Scaled</span>
                                <span className="text-[var(--text-secondary)] font-mono text-red-400 font-bold">{activeAns.formulas_and_data.striking_force_n_scaled.toLocaleString()} N</span>
                              </div>
                            )}
                          </div>

                          {/* Formulas list */}
                          {activeAns.formulas_and_data.formulas && activeAns.formulas_and_data.formulas.length > 0 ? (
                            <div className="overflow-x-auto">
                              <table className="w-full text-left border-collapse text-[10px] font-mono">
                                <thead>
                                  <tr className="border-b border-[var(--border)] text-[var(--text-muted)]">
                                    <th className="pb-1.5 font-semibold">Tên công thức</th>
                                    <th className="pb-1.5 font-semibold">Phương trình</th>
                                    <th className="pb-1.5 font-semibold text-right">Kết quả tính toán</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {activeAns.formulas_and_data.formulas.map((form: any, idx: number) => (
                                    <tr key={idx} className="border-b border-[var(--border)]/50 hover:bg-white/5 transition-all">
                                      <td className="py-2 text-[var(--text-secondary)] pr-2">{form.name}</td>
                                      <td className="py-2 text-[var(--text-muted)] font-mono">{form.equation}</td>
                                      <td className="py-2 text-right text-red-400 font-bold">{form.result}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <span className="text-[10px] text-[var(--text-muted)] italic">Không có danh sách công thức cụ thể. Dữ liệu thô lưu trong JSONB.</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Right Column - Hypo score and Tier */}
                    <div className="lg:col-span-1 border border-red-500/20 bg-red-950/15 p-6 rounded-sm flex flex-col items-center gap-4 text-center justify-center">
                      <span className="text-[9px] text-red-400 tracking-widest font-mono font-bold">
                        HYPOTHETICAL INDEX
                      </span>

                      {/* Score Badge */}
                      <div className="flex flex-col items-center">
                        <span className="text-4xl font-bold font-mono text-red-400" style={{ fontFamily: "Share Tech Mono, monospace" }}>
                          {activeAns.p4p_score_scaled}
                        </span>
                        <span className="text-[9px] text-[var(--text-muted)] font-mono uppercase tracking-wider mt-1">
                          Scaled P4P Score
                        </span>
                      </div>

                      {/* Tier Badge */}
                      <div
                        className="w-12 h-12 flex items-center justify-center text-xl font-bold font-mono"
                        style={{
                          color: "var(--red-primary)",
                          borderColor: "var(--red-primary)",
                          border: "2px solid var(--red-primary)",
                          clipPath: "polygon(15% 0%, 85% 0%, 100% 15%, 100% 85%, 85% 100%, 15% 100%, 0% 85%, 0% 15%)",
                          background: "rgba(255, 45, 45, 0.15)",
                          boxShadow: "0 0 10px rgba(255, 45, 45, 0.25)",
                        }}
                      >
                        {activeAns.tier_scaled}
                      </div>

                      {/* Scientific Sources list */}
                      {activeAns.sources && activeAns.sources.length > 0 && (
                        <div className="w-full text-left pt-4 border-t border-red-500/20 space-y-1.5">
                          <span className="text-[8px] text-[var(--text-muted)] font-mono font-bold tracking-wider block uppercase">
                            Scientific Context:
                          </span>
                          {activeAns.sources.map((src: any, idx: number) => (
                            <a
                              key={idx}
                              href={src.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[9px] text-red-400/80 hover:text-red-400 font-mono block overflow-hidden text-ellipsis whitespace-nowrap cursor-pointer hover:underline"
                            >
                              🚀 {src.label}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
