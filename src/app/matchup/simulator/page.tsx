"use client";

import React, { useState, useEffect } from "react";
import { Creature } from "@/data/creatures";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function MatchupSimulatorPage() {
  const router = useRouter();
  const [creatures, setCreatures] = useState<Creature[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatureAId, setCreatureAId] = useState("");
  const [creatureBId, setCreatureBId] = useState("");

  useEffect(() => {
    async function loadCreatures() {
      try {
        // Fetch minimal columns to keep payload small
        const { data, error } = await supabase
          .from("creatures")
          .select("id, name, scientific_name, image_color, ai_p4p_score, ai_tier");
        
        if (!error && data) {
          const mapped: Creature[] = data.map((dbc: any) => ({
            id: dbc.id,
            name: dbc.name,
            scientificName: dbc.scientific_name,
            imageColor: dbc.image_color,
            p4pScore: dbc.ai_p4p_score || 50,
            tier: dbc.ai_tier || "C",
            // Stub other fields for TypeScript compatibility
            taxonomy: { class: "", order: "", family: "" },
            realWeight: "",
            size: "",
            characteristics: "",
            habitat: "",
            location: "",
            survival_method: "",
            unique_traits: "",
            shortDescription: "",
            description: "",
            stats: { strength: 50, durability: 50, speed: 50, weaponry: 50, special: 50, lethality: 50 },
            strengths: [],
            weaknesses: [],
            funFacts: [],
            sources: []
          }));
          setCreatures(mapped);
          if (mapped.length >= 2) {
            setCreatureAId(mapped[0].id);
            setCreatureBId(mapped[1].id);
          }
        }
      } catch (err) {
        console.error("Failed to load creatures:", err);
      } finally {
        setLoading(false);
      }
    }
    loadCreatures();
  }, []);

  const handleSimulate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!creatureAId || !creatureBId) return;
    if (creatureAId === creatureBId) {
      alert("Vui lòng chọn 2 sinh vật khác nhau để giả lập đấu tay đôi!");
      return;
    }
    router.push(`/matchup/${creatureAId}-vs-${creatureBId}`);
  };

  const creatureA = creatures.find(c => c.id === creatureAId);
  const creatureB = creatures.find(c => c.id === creatureBId);

  return (
    <div className="max-w-6xl mx-auto px-6 py-20 min-h-[80vh] flex flex-col justify-start">
      <div className="mb-8">
        <div className="hud-line mb-4">
          <span
            className="text-[10px] text-[var(--text-muted)] tracking-[0.3em]"
            style={{ fontFamily: "Share Tech Mono, monospace" }}
          >
            BIOFORCE ATLAS // SIMULATOR
          </span>
        </div>
        <h1
          className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-3"
          style={{ fontFamily: "Share Tech Mono, monospace" }}
        >
          GIẢ LẬP ĐẤU TAY ĐÔI 1v1
        </h1>
        <p className="text-sm text-[var(--text-secondary)] max-w-lg mb-6">
          Quy đổi về cùng một cân nặng — chọn hai loài sinh vật bất kỳ để khởi động buồng giả lập phân tích tỉ lệ thắng sinh học.
        </p>

        {/* Navigation tabs */}
        <div className="flex flex-wrap gap-4 border-b border-[var(--border)] pb-3" style={{ fontFamily: "Share Tech Mono, monospace" }}>
          <Link href="/matchup" className="text-xs tracking-widest text-[var(--text-secondary)] hover:text-[#00f0ff] transition-colors">[ ĐANG DIỄN RA ]</Link>
          <Link href="/matchup/history" className="text-xs tracking-widest text-[var(--text-secondary)] hover:text-[#00f0ff] transition-colors">[ LỊCH SỬ KẾT QUẢ ]</Link>
          <Link href="/matchup/simulator" className="text-xs tracking-widest text-[var(--red-primary)] font-bold">[ GIẢ LẬP 1V1 ]</Link>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 font-mono text-xs text-[var(--text-muted)]">
          LOADING SIMULATOR DATABASE...
        </div>
      ) : (
        <form onSubmit={handleSimulate} className="max-w-3xl mx-auto w-full border border-[var(--border)] p-8 md:p-12 space-y-8 relative overflow-hidden" style={{ background: "var(--bg-card)" }}>
          {/* Neon scan lines */}
          <div className="absolute top-0 left-0 w-full h-[2px] bg-red-500/20" style={{ animation: "scan 4s linear infinite" }} />
          
          <div className="grid grid-cols-1 md:grid-cols-7 gap-6 items-center">
            {/* Creature A Selector */}
            <div className="md:col-span-3 space-y-4 text-center md:text-left">
              <label className="text-[10px] text-[var(--text-muted)] tracking-widest uppercase block font-mono">Đấu sĩ A (Challenger)</label>
              <select
                value={creatureAId}
                onChange={(e) => setCreatureAId(e.target.value)}
                className="w-full px-4 py-2 text-sm border border-[var(--border)] text-[var(--text-primary)] rounded-sm bg-black/60 font-mono"
              >
                {creatures.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              {creatureA && (
                <div className="p-4 border border-[var(--border)] bg-black/20 rounded text-center">
                  <div className="w-12 h-12 rounded-sm mx-auto flex items-center justify-center mb-2" style={{ background: `${creatureA.imageColor}33`, border: `1px solid ${creatureA.imageColor}66` }}>
                    <span className="text-xl font-bold" style={{ color: creatureA.imageColor }}>{creatureA.name[0]}</span>
                  </div>
                  <div className="font-bold text-xs text-[var(--text-primary)] font-mono">{creatureA.name}</div>
                  <div className="text-[10px] text-[var(--text-muted)] mt-1 font-mono">P4P Score: {creatureA.p4pScore} ({creatureA.tier})</div>
                </div>
              )}
            </div>

            {/* VS Divider */}
            <div className="md:col-span-1 text-center font-bold text-2xl text-red-500 font-mono py-4">
              VS
            </div>

            {/* Creature B Selector */}
            <div className="md:col-span-3 space-y-4 text-center md:text-right">
              <label className="text-[10px] text-[var(--text-muted)] tracking-widest uppercase block font-mono">Đấu sĩ B (Challenger)</label>
              <select
                value={creatureBId}
                onChange={(e) => setCreatureBId(e.target.value)}
                className="w-full px-4 py-2 text-sm border border-[var(--border)] text-[var(--text-primary)] rounded-sm bg-black/60 font-mono text-right"
              >
                {creatures.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              {creatureB && (
                <div className="p-4 border border-[var(--border)] bg-black/20 rounded text-center">
                  <div className="w-12 h-12 rounded-sm mx-auto flex items-center justify-center mb-2" style={{ background: `${creatureB.imageColor}33`, border: `1px solid ${creatureB.imageColor}66` }}>
                    <span className="text-xl font-bold" style={{ color: creatureB.imageColor }}>{creatureB.name[0]}</span>
                  </div>
                  <div className="font-bold text-xs text-[var(--text-primary)] font-mono">{creatureB.name}</div>
                  <div className="text-[10px] text-[var(--text-muted)] mt-1 font-mono">P4P Score: {creatureB.p4pScore} ({creatureB.tier})</div>
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-red-950/40 border border-red-500 text-red-400 hover:bg-red-500/20 text-xs font-semibold rounded-sm tracking-widest transition-all font-mono"
          >
            [ KHỞI ĐỘNG GIẢ LẬP PHÂN TÍCH ]
          </button>
        </form>
      )}
    </div>
  );
}
