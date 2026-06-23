"use client";

import React, { useState, useCallback } from "react";
import CreatureCard from "./CreatureCard";
import { Creature } from "@/data/creatures";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

interface CreaturesFilterListProps {
  creatures: Creature[];
  allClasses: string[];
  allHabitats: string[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
}

export const CLASS_TRANSLATIONS: Record<string, string> = {
  Insecta: "Insecta (Côn trùng)",
  Malacostraca: "Malacostraca (Giáp xác)",
  Cephalopoda: "Cephalopoda (Chân đầu)",
  Chilopoda: "Chilopoda (Chân rết)",
  Arachnida: "Arachnida (Hình nhện)",
};

export function getNormalizedHabitat(habitat: string): string {
  const h = habitat.toLowerCase();
  if (h.includes("rừng") || h.includes("rainforest") || h.includes("forest")) return "Rừng mưa";
  if (h.includes("biển") || h.includes("ocean") || h.includes("sea") || h.includes("san hô") || h.includes("vùng biển")) return "Đại dương / Biển";
  if (h.includes("hang") || h.includes("cave")) return "Hang động";
  if (h.includes("sa mạc") || h.includes("desert")) return "Sa mạc";
  if (h.includes("sông") || h.includes("river") || h.includes("hồ") || h.includes("lake")) return "Sông hồ / Ao ngòi";
  return habitat.trim();
}

export default function CreaturesFilterList({
  creatures,
  allClasses,
  allHabitats,
  currentPage,
  totalPages,
  totalCount
}: CreaturesFilterListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Get current filter states from URL search parameters
  const search = searchParams.get("search") || "";
  const tier = searchParams.get("tier") || "All";
  const classVal = searchParams.get("class") || "All";
  const habitatVal = searchParams.get("habitat") || "All";
  const sortBy = searchParams.get("sortBy") || "p4p-desc";

  // Sync local search state when the URL query changes externally (e.g. Reset Filters)
  // using render-time prop adjustment to avoid synchronous useEffect setState cascade
  const [prevSearch, setPrevSearch] = useState(search);
  const [localSearch, setLocalSearch] = useState(search);

  if (search !== prevSearch) {
    setPrevSearch(search);
    setLocalSearch(search);
  }

  // Helper to construct query string
  const createQueryString = useCallback((params: Record<string, string>) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    
    Object.entries(params).forEach(([name, value]) => {
      if (value === "All" || value === "") {
        current.delete(name);
      } else {
        current.set(name, value);
      }
    });

    return current.toString();
  }, [searchParams]);

  const updateFilters = useCallback((updates: Record<string, string>) => {
    // When filters change, always reset back to page 1
    const query = createQueryString({ ...updates, page: "1" });
    router.push(`${pathname}?${query}`);
  }, [createQueryString, pathname, router]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search: localSearch });
  };

  const goToPage = (page: number) => {
    const query = createQueryString({ page: String(page) });
    router.push(`${pathname}?${query}`);
  };

  const resetFilters = () => {
    router.push(pathname);
  };

  return (
    <div>
      {/* Filtering Controls Card */}
      <div
        className="mb-8 p-6 border border-[var(--border)] rounded-md backdrop-blur-md"
        style={{ background: "rgba(18, 18, 24, 0.7)", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5)" }}
      >
        <div
          className="text-[10px] text-[var(--text-muted)] tracking-widest mb-4 uppercase"
          style={{ fontFamily: "Share Tech Mono, monospace" }}
        >
          {"// CONTROL UNIT & FILTER MATRIX (SERVER-SIDE FILTERED)"}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="flex flex-col gap-1.5">
            <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider" style={{ fontFamily: "Share Tech Mono, monospace" }}>Tìm kiếm</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nhập tên, lớp..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="px-3 py-2 text-xs border border-[var(--border)] text-[var(--text-primary)] rounded-sm focus:outline-none focus:border-[var(--glow-color,rgba(0,240,255,0.5))] bg-black/60 flex-1"
              />
              <button
                type="submit"
                className="px-2.5 py-1.5 text-xs border border-[var(--border)] text-[var(--text-primary)] hover:border-[#00f0ff] hover:text-[#00f0ff] bg-black/40 rounded-sm font-mono transition-all cursor-pointer uppercase tracking-wider"
                style={{ fontFamily: "Share Tech Mono, monospace" }}
              >
                Find
              </button>
            </div>
          </form>

          {/* Tier Filter */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider" style={{ fontFamily: "Share Tech Mono, monospace" }}>Xếp Hạng (Tier)</label>
            <select
              value={tier}
              onChange={(e) => updateFilters({ tier: e.target.value })}
              className="px-3 py-2 text-xs border border-[var(--border)] text-[var(--text-primary)] rounded-sm focus:outline-none focus:border-[var(--glow-color,rgba(0,240,255,0.5))]"
              style={{ background: "rgba(10, 10, 12, 0.8)" }}
            >
              <option value="All">Tất cả Tier</option>
              <option value="S">S Tier</option>
              <option value="A">A Tier</option>
              <option value="B">B Tier</option>
              <option value="C">C Tier</option>
              <option value="D">D Tier</option>
            </select>
          </div>

          {/* Class Filter */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider" style={{ fontFamily: "Share Tech Mono, monospace" }}>Chủng Loài (Class)</label>
            <select
              value={classVal}
              onChange={(e) => updateFilters({ class: e.target.value })}
              className="px-3 py-2 text-xs border border-[var(--border)] text-[var(--text-primary)] rounded-sm focus:outline-none focus:border-[var(--glow-color,rgba(0,240,255,0.5))]"
              style={{ background: "rgba(10, 10, 12, 0.8)" }}
            >
              <option value="All">Tất cả lớp</option>
              {allClasses.map(cls => (
                <option key={cls} value={cls}>
                  {CLASS_TRANSLATIONS[cls] || cls}
                </option>
              ))}
            </select>
          </div>

          {/* Habitat Filter */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider" style={{ fontFamily: "Share Tech Mono, monospace" }}>Môi Trường Sống</label>
            <select
              value={habitatVal}
              onChange={(e) => updateFilters({ habitat: e.target.value })}
              className="px-3 py-2 text-xs border border-[var(--border)] text-[var(--text-primary)] rounded-sm focus:outline-none focus:border-[var(--glow-color,rgba(0,240,255,0.5))]"
              style={{ background: "rgba(10, 10, 12, 0.8)" }}
            >
              <option value="All">Tất cả môi trường</option>
              {allHabitats.map(h => (
                <option key={h} value={h}>
                  {getNormalizedHabitat(h)}
                </option>
              ))}
            </select>
          </div>

          {/* Sorter */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider" style={{ fontFamily: "Share Tech Mono, monospace" }}>Sắp Xếp</label>
            <select
              value={sortBy}
              onChange={(e) => updateFilters({ sortBy: e.target.value })}
              className="px-3 py-2 text-xs border border-[var(--border)] text-[var(--text-primary)] rounded-sm focus:outline-none focus:border-[var(--glow-color,rgba(0,240,255,0.5))]"
              style={{ background: "rgba(10, 10, 12, 0.8)" }}
            >
              <option value="p4p-desc">P4P Score (Cao → Thấp)</option>
              <option value="p4p-asc">P4P Score (Thấp → Cao)</option>
              <option value="name-asc">Tên (A-Z)</option>
              <option value="enrichment-desc">Làm Giàu (Nhiều → Ít)</option>
              <option value="enrichment-asc">Làm Giàu (Ít → Nhiều)</option>
            </select>
          </div>
        </div>

        {/* Clear Filters indicator */}
        {(search || tier !== "All" || classVal !== "All" || habitatVal !== "All" || sortBy !== "p4p-desc" || searchParams.has("page")) && (
          <div className="mt-4 flex items-center justify-between text-xs border-t border-[var(--border)] pt-3">
            <span className="text-[var(--text-muted)]">
              Tìm thấy {totalCount} kết quả phù hợp trên hệ thống.
            </span>
            <button
              onClick={resetFilters}
              className="text-[var(--text-primary)] hover:text-red-400 font-medium transition-colors"
              style={{ fontFamily: "Share Tech Mono, monospace" }}
            >
              [ RESET FILTERS ]
            </button>
          </div>
        )}
      </div>

      {/* Grid rendering */}
      {creatures.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-[var(--border)] rounded-md">
          <p className="text-[var(--text-muted)] text-sm mb-2" style={{ fontFamily: "Share Tech Mono, monospace" }}>
            NO RECORDS FOUND MATCHING SELECTION
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            Hãy thử thiết lập lại bộ lọc để tìm sinh vật.
          </p>
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {creatures.map((creature, i) => (
              <div key={creature.id} className="relative group">
                <CreatureCard creature={creature} index={i} />
                
                {/* Enrichment Counter overlay indicator on the UI */}
                <div 
                  className="absolute top-3 right-3 px-1.5 py-0.5 border text-[9px] font-bold rounded-sm tracking-wider"
                  style={{ 
                    fontFamily: "Share Tech Mono, monospace",
                    background: "rgba(0, 0, 0, 0.85)", 
                    borderColor: "rgba(0, 240, 255, 0.4)",
                    color: "#00f0ff",
                    boxShadow: "0 0 6px rgba(0, 240, 255, 0.2)"
                  }}
                  title={`Số lần làm giàu dữ liệu: ${creature.enrichmentCount || 0}`}
                >
                  E-COUNT: {creature.enrichmentCount || 0}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Navigation */}
          {totalPages > 1 && (
            <div 
              className="mt-12 flex justify-center items-center gap-4 py-4 border-t border-[var(--border)]"
              style={{ fontFamily: "Share Tech Mono, monospace" }}
            >
              <button
                disabled={currentPage <= 1}
                onClick={() => goToPage(currentPage - 1)}
                className="px-4 py-2 border border-[var(--border)] text-xs font-semibold rounded-sm tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--border)] text-[var(--text-primary)]"
              >
                [ TRƯỚC ]
              </button>

              <span className="text-xs text-[var(--text-secondary)]">
                TRANG {currentPage} / {totalPages}
              </span>

              <button
                disabled={currentPage >= totalPages}
                onClick={() => goToPage(currentPage + 1)}
                className="px-4 py-2 border border-[var(--border)] text-xs font-semibold rounded-sm tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--border)] text-[var(--text-primary)]"
              >
                [ TIẾP ]
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
