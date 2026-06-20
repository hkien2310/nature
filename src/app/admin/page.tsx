import React from "react";
import { getDBCreatures } from "@/lib/db";
import AdminDashboard from "@/components/AdminDashboard";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Panel — BioForce Atlas",
  description: "Trang quản trị hệ thống BioForce Atlas.",
};

export default async function AdminPage() {
  const creatures = await getDBCreatures();

  return (
    <div className="max-w-6xl mx-auto px-6 py-20">
      <div className="mb-10">
        <div className="hud-line mb-4">
          <span
            className="text-[10px] text-[var(--text-muted)] tracking-[0.3em]"
            style={{ fontFamily: "Share Tech Mono, monospace" }}
          >
            BIOFORCE ATLAS // SYSTEM CONTROL
          </span>
        </div>
        <h1
          className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-3"
          style={{ fontFamily: "Share Tech Mono, monospace" }}
        >
          ADMIN PANEL
        </h1>
        <p className="text-sm text-[var(--text-secondary)] max-w-lg">
          Trang quản lý nội dung video tài liệu, sao chép ID sinh vật phục vụ AI video, và thiết lập các trận đấu phân hạng mới.
        </p>
      </div>

      <AdminDashboard allCreatures={creatures} />
    </div>
  );
}
