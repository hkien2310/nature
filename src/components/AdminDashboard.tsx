"use client";

import React, { useState, useEffect, useMemo } from "react";
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

  // Filter & Search States
  const [adminSearchInput, setAdminSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTier, setSelectedTier] = useState("ALL");
  const [selectedDoc, setSelectedDoc] = useState("ALL");
  const [sortBy, setSortBy] = useState("p4p-desc");

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  useEffect(() => {
    const stored = localStorage.getItem("user_session");
    // Defer state updates to avoid synchronous setState warnings in useEffect
    setTimeout(() => {
      if (stored) {
        try {
          const user = JSON.parse(stored);
          setUserId(user.id);
          setRole(user.role);
          setUsername(user.username);
        } catch (err) {
          console.error("Failed to parse user session:", err);
        }
      }
      setLoading(false);
    }, 0);
  }, []);

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
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setBattleError(errorMsg);
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
      console.error("Error toggling documentary:", err);
      alert("Lỗi kết nối.");
    }
  };

  const handleCopy = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Apply filters and sorting
  const processedCreatures = useMemo(() => {
    let result = [...allCreatures];

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        c =>
          c.name.toLowerCase().includes(q) ||
          c.scientificName.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q)
      );
    }

    // Filter by tier
    if (selectedTier !== "ALL") {
      result = result.filter(c => (c.aiTier || c.tier) === selectedTier);
    }

    // Filter by documentary status
    if (selectedDoc !== "ALL") {
      const hasDoc = selectedDoc === "YES";
      result = result.filter(c => (c.hasDocumentary || false) === hasDoc);
    }

    // Apply sorting
    if (sortBy === "name-asc") {
      result.sort((a, b) => a.name.localeCompare(b.name, "vi"));
    } else if (sortBy === "name-desc") {
      result.sort((a, b) => b.name.localeCompare(a.name, "vi"));
    } else if (sortBy === "p4p-desc") {
      result.sort((a, b) => (b.aiP4pScore || 50) - (a.aiP4pScore || 50));
    } else if (sortBy === "p4p-asc") {
      result.sort((a, b) => (a.aiP4pScore || 50) - (b.aiP4pScore || 50));
    } else if (sortBy === "grading-desc") {
      result.sort((a, b) => (b.gradingCount || 0) - (a.gradingCount || 0));
    } else if (sortBy === "grading-asc") {
      result.sort((a, b) => (a.gradingCount || 0) - (b.gradingCount || 0));
    }

    return result;
  }, [allCreatures, searchQuery, selectedTier, selectedDoc, sortBy]);

  // Pagination calculations
  const totalItems = processedCreatures.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedCreatures = useMemo(() => {
    return processedCreatures.slice(startIndex, startIndex + pageSize);
  }, [processedCreatures, startIndex, pageSize]);

  const handleAdminSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(adminSearchInput);
    setCurrentPage(1);
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
      {/* Grid: Table on the left (lg:col-span-2), Sidebar on the right (lg:col-span-1) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left column: Creatures Table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="border border-[var(--border)] rounded-md" style={{ background: "var(--bg-card)" }}>
            <div className="p-4 border-b border-[var(--border)] bg-black/20 flex justify-between items-center rounded-t-md">
              <span className="text-[10px] text-[var(--text-muted)] tracking-wider font-bold" style={{ fontFamily: "Share Tech Mono, monospace" }}>
                {"// DANH SÁCH SINH VẬT & ĐỒNG BỘ VIDEO"}
              </span>
            </div>

            {/* Filter and sorting controls */}
            <div className="p-4 border-b border-[var(--border)] bg-black/20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              {/* Search Input */}
              <form onSubmit={handleAdminSearchSubmit} className="flex flex-col gap-1.5 w-full">
                <label className="text-[10px] text-red-500/70 uppercase tracking-wider font-mono font-semibold">Tìm kiếm</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Tìm tên, tên khoa học hoặc ID..."
                    value={adminSearchInput}
                    onChange={(e) => setAdminSearchInput(e.target.value)}
                    className="px-3 py-2 text-xs border border-red-500/20 text-[var(--text-primary)] rounded-sm bg-black/60 placeholder-[var(--text-muted)] focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/30 hover:border-red-500/50 transition-all duration-300 flex-1 min-w-0"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs border border-red-500/40 text-red-400 hover:border-red-500 hover:bg-red-500/10 hover:shadow-[0_0_12px_rgba(255,45,45,0.35)] bg-red-950/20 rounded-sm font-mono transition-all duration-300 cursor-pointer uppercase tracking-wider font-bold"
                    style={{ fontFamily: "Share Tech Mono, monospace" }}
                  >
                    FIND
                  </button>
                </div>
              </form>
              
              {/* Tier Filter */}
              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-[10px] text-red-500/70 uppercase tracking-wider font-mono font-semibold">Xếp hạng (Tier)</label>
                <div className="relative w-full">
                  <select
                    value={selectedTier}
                    onChange={(e) => {
                      setSelectedTier(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full appearance-none px-3 py-2 pr-8 text-xs border border-red-500/20 text-[var(--text-primary)] rounded-sm bg-black/60 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/30 hover:border-red-500/50 transition-all duration-300 cursor-pointer"
                  >
                    <option value="ALL" className="bg-neutral-900 text-white">Tất cả Tiers</option>
                    <option value="S" className="bg-neutral-900 text-white">Tier S</option>
                    <option value="A" className="bg-neutral-900 text-white">Tier A</option>
                    <option value="B" className="bg-neutral-900 text-white">Tier B</option>
                    <option value="C" className="bg-neutral-900 text-white">Tier C</option>
                    <option value="D" className="bg-neutral-900 text-white">Tier D</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-red-500/50">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Video Status Filter */}
              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-[10px] text-red-500/70 uppercase tracking-wider font-mono font-semibold">Trạng thái Video</label>
                <div className="relative w-full">
                  <select
                    value={selectedDoc}
                    onChange={(e) => {
                      setSelectedDoc(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full appearance-none px-3 py-2 pr-8 text-xs border border-red-500/20 text-[var(--text-primary)] rounded-sm bg-black/60 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/30 hover:border-red-500/50 transition-all duration-300 cursor-pointer"
                  >
                    <option value="ALL" className="bg-neutral-900 text-white">Tất cả Video</option>
                    <option value="YES" className="bg-neutral-900 text-white">Đã làm video</option>
                    <option value="NO" className="bg-neutral-900 text-white">Chưa làm video</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-red-500/50">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Sorter */}
              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-[10px] text-red-500/70 uppercase tracking-wider font-mono font-semibold">Sắp xếp</label>
                <div className="relative w-full">
                  <select
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full appearance-none px-3 py-2 pr-8 text-xs border border-red-500/20 text-[var(--text-primary)] rounded-sm bg-black/60 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/30 hover:border-red-500/50 transition-all duration-300 cursor-pointer"
                  >
                    <option value="default" className="bg-neutral-900 text-white">Mặc định</option>
                    <option value="name-asc" className="bg-neutral-900 text-white">Tên (A-Z)</option>
                    <option value="name-desc" className="bg-neutral-900 text-white">Tên (Z-A)</option>
                    <option value="p4p-desc" className="bg-neutral-900 text-white">P4P Score (Cao → Thấp)</option>
                    <option value="p4p-asc" className="bg-neutral-900 text-white">P4P Score (Thấp → Cao)</option>
                    <option value="grading-desc" className="bg-neutral-900 text-white">Lần chấm (Nhiều → Ít)</option>
                    <option value="grading-asc" className="bg-neutral-900 text-white">Lần chấm (Ít → Nhiều)</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-red-500/50">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Table wrapper with horizontal overflow on mobile and visible on desktop for sticky headers */}
            <div className="overflow-x-auto lg:overflow-visible">
              {paginatedCreatures.length === 0 ? (
                <div className="text-center py-12 text-[var(--text-muted)] font-mono text-xs">
                  NO CREATURES FOUND MATCHING CRITERIA
                </div>
              ) : (
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
                    {paginatedCreatures.map((creature) => (
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
              )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-[var(--border)] bg-black/20 flex flex-wrap items-center justify-between gap-4 rounded-b-md">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="text-xs text-[var(--text-secondary)] font-mono">
                    Hiển thị <span className="text-[var(--text-primary)] font-bold">{startIndex + 1}</span> - <span className="text-[var(--text-primary)] font-bold">{Math.min(startIndex + pageSize, totalItems)}</span> trong số <span className="text-[var(--text-primary)] font-bold">{totalItems}</span> sinh vật
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] font-mono">
                    <span>Cỡ trang:</span>
                    <div className="relative">
                      <select
                        value={pageSize}
                        onChange={(e) => {
                          setPageSize(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="appearance-none pl-2 pr-6 py-0.5 border border-red-500/20 text-[var(--text-primary)] rounded-sm bg-black/60 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/30 hover:border-red-500/50 transition-all duration-300 cursor-pointer"
                      >
                        <option value={10} className="bg-neutral-900 text-white">10</option>
                        <option value={20} className="bg-neutral-900 text-white">20</option>
                        <option value={50} className="bg-neutral-900 text-white">50</option>
                        <option value={100} className="bg-neutral-900 text-white">100</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-1.5 pointer-events-none text-red-500/50">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-2.5 py-1.5 border border-[var(--border)] rounded-sm text-xs font-mono text-[var(--text-secondary)] hover:text-white hover:border-[#00f0ff] disabled:opacity-30 disabled:hover:text-[var(--text-secondary)] disabled:hover:border-[var(--border)] transition-all cursor-pointer"
                  >
                    &lt; PREV
                  </button>

                  {/* Render page numbers */}
                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const pageNum = idx + 1;
                    const isCurrent = pageNum === currentPage;
                    
                    if (
                      pageNum === 1 ||
                      pageNum === totalPages ||
                      Math.abs(pageNum - currentPage) <= 1
                    ) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-1.5 border rounded-sm text-xs font-mono transition-all cursor-pointer ${
                            isCurrent
                              ? "bg-red-950/20 border-red-500 text-red-400 font-bold"
                              : "border-[var(--border)] text-[var(--text-secondary)] hover:text-white hover:border-[#00f0ff]"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    }
                    if (
                      (pageNum === 2 && currentPage > 3) ||
                      (pageNum === totalPages - 1 && currentPage < totalPages - 2)
                    ) {
                      return (
                        <span key={pageNum} className="px-1 text-[var(--text-muted)] font-mono text-xs">
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-2.5 py-1.5 border border-[var(--border)] rounded-sm text-xs font-mono text-[var(--text-secondary)] hover:text-white hover:border-[#00f0ff] disabled:opacity-30 disabled:hover:text-[var(--text-secondary)] disabled:hover:border-[var(--border)] transition-all cursor-pointer"
                  >
                    NEXT &gt;
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right column: Battle Construct (Sidebar) */}
        <div className="lg:col-span-1 sticky top-20 z-30">
          <div 
            className="p-6 border border-red-500/20 rounded-md"
            style={{ background: "rgba(20, 10, 10, 0.8)", backdropFilter: "blur(8px)" }}
          >
            <form onSubmit={handleCreateBattle} className="space-y-4">
              <div className="text-[10px] text-red-500 tracking-[0.2em] font-bold" style={{ fontFamily: "Share Tech Mono, monospace" }}>
                {"// KHỞI TẠO BATTLE ARENA (CONSTRUCT)"}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-red-500/70 uppercase tracking-wider font-mono font-semibold" style={{ fontFamily: "Share Tech Mono, monospace" }}>Sinh vật A</label>
                <div className="relative w-full">
                  <select
                    value={creatureAId}
                    onChange={(e) => setCreatureAId(e.target.value)}
                    className="w-full appearance-none px-3 py-2 pr-8 text-xs border border-red-500/20 text-[var(--text-primary)] rounded-sm bg-black/60 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/30 hover:border-red-500/50 transition-all duration-300 cursor-pointer"
                  >
                    {allCreatures.map(c => (
                      <option key={c.id} value={c.id} className="bg-neutral-900 text-white">{c.name}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-red-500/50">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-red-500/70 uppercase tracking-wider font-mono font-semibold" style={{ fontFamily: "Share Tech Mono, monospace" }}>Sinh vật B</label>
                <div className="relative w-full">
                  <select
                    value={creatureBId}
                    onChange={(e) => setCreatureBId(e.target.value)}
                    className="w-full appearance-none px-3 py-2 pr-8 text-xs border border-red-500/20 text-[var(--text-primary)] rounded-sm bg-black/60 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/30 hover:border-red-500/50 transition-all duration-300 cursor-pointer"
                  >
                    {allCreatures.map(c => (
                      <option key={c.id} value={c.id} className="bg-neutral-900 text-white">{c.name}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-red-500/50">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-red-500/70 uppercase tracking-wider font-mono font-semibold" style={{ fontFamily: "Share Tech Mono, monospace" }}>Thời hạn (Ngày)</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  required
                  value={durationDays}
                  onChange={(e) => setDurationDays(Number(e.target.value))}
                  className="px-3 py-2 text-xs border border-red-500/20 text-[var(--text-primary)] rounded-sm bg-black/60 placeholder-[var(--text-muted)] focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/30 hover:border-red-500/50 transition-all duration-300 w-full"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-red-500/70 uppercase tracking-wider font-mono font-semibold" style={{ fontFamily: "Share Tech Mono, monospace" }}>Tiêu đề trận đấu (Tùy chọn)</label>
                <input
                  type="text"
                  placeholder="ví dụ: Trận chiến kinh điển..."
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="px-3 py-2 text-xs border border-red-500/20 text-[var(--text-primary)] rounded-sm bg-black/60 placeholder-[var(--text-muted)] focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/30 hover:border-red-500/50 transition-all duration-300 w-full"
                />
              </div>

              {battleError && <div className="text-[10px] text-red-400 font-bold font-mono">{battleError}</div>}
              {battleSuccess && <div className="text-[10px] text-green-400 font-bold font-mono">{battleSuccess}</div>}

              <button
                type="submit"
                disabled={battleSubmitting}
                className="w-full py-2.5 bg-red-950/20 border border-red-500/40 text-red-400 hover:border-red-500 hover:bg-red-500/10 hover:shadow-[0_0_12px_rgba(255,45,45,0.35)] text-xs font-bold rounded-sm tracking-widest transition-all duration-300 disabled:opacity-50 cursor-pointer uppercase"
                style={{ fontFamily: "Share Tech Mono, monospace" }}
              >
                {battleSubmitting ? "[ CREATING... ]" : "[ THIẾT LẬP TRẬN ĐẤU ]"}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}

