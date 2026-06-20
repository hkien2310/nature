"use client";

import { useState } from "react";

interface VoteFormProps {
  creatureId: string;
  imageColor: string;
}

const statsConfig = [
  { key: "strength", label: "Sức Mạnh" },
  { key: "durability", label: "Độ Bền" },
  { key: "speed", label: "Tốc Độ" },
  { key: "weaponry", label: "Vũ Khí" },
  { key: "special", label: "Đặc Biệt" },
  { key: "lethality", label: "Sát Thương" },
];

export default function VoteForm({ creatureId, imageColor }: VoteFormProps) {
  const [stats, setStats] = useState<Record<string, number>>({
    strength: 50,
    durability: 50,
    speed: 50,
    weaponry: 50,
    special: 50,
    lethality: 50,
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (key: string, value: number) => {
    setStats((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch(`/api/creatures/${creatureId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(stats),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gửi vote thất bại.");
      }

      setSuccess(true);
      // Reload page to update average values
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-[var(--border)] p-6 md:p-8 space-y-6"
      style={{ background: "var(--bg-card)" }}
    >
      <div>
        <div
          className="text-[10px] tracking-widest text-[var(--text-muted)] mb-2"
          style={{ fontFamily: "Share Tech Mono, monospace" }}
        >
          // USER ASSESSMENT ARENA
        </div>
        <h3 className="text-lg font-bold text-[var(--text-primary)]" style={{ fontFamily: "Share Tech Mono, monospace" }}>
          ĐÁNH GIÁ SỨC MẠNH
        </h3>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Kéo thanh trượt để bình chọn chỉ số chiến đấu thực tế theo phân tích của bạn.
        </p>
      </div>

      <div className="space-y-4">
        {statsConfig.map(({ key, label }) => (
          <div key={key} className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[var(--text-secondary)]">{label}</span>
              <span className="font-bold text-[var(--red-primary)]" style={{ fontFamily: "Share Tech Mono, monospace" }}>
                {stats[key]} / 100
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="100"
              value={stats[key]}
              onChange={(e) => handleChange(key, parseInt(e.target.value))}
              className="w-full h-1 bg-[var(--border)] appearance-none cursor-pointer rounded-sm accent-[var(--red-primary)]"
              style={{
                outline: "none",
              }}
            />
          </div>
        ))}
      </div>

      {error && <div className="text-xs text-[var(--red-primary)] font-mono">// LỖI: {error}</div>}
      {success && (
        <div className="text-xs text-green-500 font-mono">
          // THÀNH CÔNG: Đã ghi nhận bình chọn của bạn. Đang cập nhật dữ liệu...
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3 text-xs font-bold tracking-widest cursor-pointer transition-all duration-300 disabled:opacity-50"
        style={{
          fontFamily: "Share Tech Mono, monospace",
          background: submitting ? "var(--border)" : "var(--red-primary)",
          color: "#fff",
          clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))",
        }}
      >
        {submitting ? "ĐANG GỬI DỮ LIỆU..." : "GỬI ĐÁNH GIÁ CỦA BẠN"}
      </button>
    </form>
  );
}
