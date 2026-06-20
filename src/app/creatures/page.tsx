import { getDBCreatures } from "@/lib/db";
import CreaturesFilterList from "@/components/CreaturesFilterList";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Creature Database — BioForce Atlas",
  description: "Toàn bộ hồ sơ sinh vật. Xếp hạng pound-for-pound, chỉ số chiến đấu, dữ liệu khoa học.",
};

interface PageProps {
  searchParams: Promise<{
    search?: string;
    tier?: string;
    class?: string;
    habitat?: string;
    sortBy?: string;
    page?: string;
  }>;
}

export default async function CreaturesPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const search = resolvedParams.search || "";
  const tier = resolvedParams.tier || "All";
  const classVal = resolvedParams.class || "All";
  const habitatVal = resolvedParams.habitat || "All";
  const sortBy = resolvedParams.sortBy || "p4p-desc";
  const page = Number(resolvedParams.page) || 1;

  const allCreatures = await getDBCreatures();

  // Extract unique classes and habitats for filters BEFORE filtering the list
  const allClasses = Array.from(new Set(allCreatures.map(c => c.taxonomy?.class).filter(Boolean))) as string[];
  const allHabitats = Array.from(new Set(allCreatures.map(c => c.habitat).filter(Boolean))) as string[];

  // Perform server-side filtering
  let filtered = [...allCreatures];

  if (search.trim() !== "") {
    const term = search.toLowerCase();
    filtered = filtered.filter(
      c =>
        c.name.toLowerCase().includes(term) ||
        c.scientificName.toLowerCase().includes(term) ||
        c.description.toLowerCase().includes(term)
    );
  }

  if (tier !== "All") {
    filtered = filtered.filter(c => c.tier === tier);
  }

  if (classVal !== "All") {
    filtered = filtered.filter(c => c.taxonomy?.class === classVal);
  }

  if (habitatVal !== "All") {
    filtered = filtered.filter(c => c.habitat === habitatVal);
  }

  // Perform server-side sorting
  filtered.sort((a, b) => {
    if (sortBy === "p4p-desc") {
      return b.p4pScore - a.p4pScore;
    }
    if (sortBy === "p4p-asc") {
      return a.p4pScore - b.p4pScore;
    }
    if (sortBy === "name-asc") {
      return a.name.localeCompare(b.name, "vi");
    }
    if (sortBy === "enrichment-desc") {
      return (b.enrichmentCount || 0) - (a.enrichmentCount || 0);
    }
    if (sortBy === "enrichment-asc") {
      return (a.enrichmentCount || 0) - (b.enrichmentCount || 0);
    }
    return 0;
  });

  // Calculate Pagination Slicing
  const pageSize = 9;
  const totalCount = filtered.length;
  const totalPages = Math.ceil(totalCount / pageSize);
  const currentPage = Math.max(1, Math.min(page, totalPages));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedCreatures = filtered.slice(startIndex, endIndex);

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="mb-10">
        <div className="hud-line mb-4">
          <span
            className="text-[10px] text-[var(--text-muted)] tracking-[0.3em]"
            style={{ fontFamily: "Share Tech Mono, monospace" }}
          >
            BIOFORCE ATLAS // CREATURE DATABASE
          </span>
        </div>
        <h1
          className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-3"
          style={{ fontFamily: "Share Tech Mono, monospace" }}
        >
          COMBAT DATABASE
        </h1>
        <p className="text-sm text-[var(--text-secondary)] max-w-lg">
          Hiển thị {filtered.length === allCreatures.length ? `${allCreatures.length}` : `${filtered.length} trên tổng số ${allCreatures.length}`} sinh vật được lập hồ sơ. Xếp hạng Pound-for-Pound và tần suất làm giàu dữ liệu khoa học.
        </p>
      </div>

      {/* Tier explanation */}
      <div
        className="mb-8 p-4 border border-[var(--border)]"
        style={{ background: "var(--bg-card)" }}
      >
        <div
          className="text-[10px] text-[var(--text-muted)] tracking-widest mb-3"
          style={{ fontFamily: "Share Tech Mono, monospace" }}
        >
          // TIER SYSTEM — POUND-FOR-POUND (P4P)
        </div>
        <div className="flex flex-wrap gap-4">
          {[
            { tier: "S", color: "#FF2D2D", desc: "Top 5% — Cực kỳ nguy hiểm, đòn chí mạng" },
            { tier: "A", color: "#FF8C00", desc: "Top 20% — Nguy hiểm cao, vũ khí mạnh" },
            { tier: "B", color: "#FFD700", desc: "Trên trung bình — Đáng gờm, có điểm mạnh rõ ràng" },
            { tier: "C", color: "#4CAF50", desc: "Trung bình — Tồn tại được trong tự nhiên" },
            { tier: "D", color: "#9E9E9E", desc: "Yếu — Ưu thế chủ yếu về số lượng hoặc môi trường" },
          ].map(({ tier, color, desc }) => (
            <div key={tier} className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
              <span
                className="tier-badge text-xs flex-shrink-0"
                style={{ color, borderColor: color, width: "1.5rem", height: "1.5rem", fontSize: "10px" }}
              >
                {tier}
              </span>
              <span>{desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filterable, Sortable, Paginated List Component */}
      <CreaturesFilterList
        creatures={paginatedCreatures}
        allClasses={allClasses}
        allHabitats={allHabitats}
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
      />
    </div>
  );
}
