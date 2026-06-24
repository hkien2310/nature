import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import GlobalLoadingIndicator from "@/components/GlobalLoadingIndicator";

export const metadata: Metadata = {
  title: "BioForce Atlas — Creature Combat Database",
  description:
    "Hồ sơ chiến đấu sinh vật. Nếu cùng cân nặng, ai sẽ thắng? Dữ liệu khoa học, phân tích pound-for-pound.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>
        <GlobalLoadingIndicator />
        <Navbar />
        <main className="min-h-screen pt-16">{children}</main>
        <footer className="border-t border-[var(--border)] mt-20 py-8 px-6">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-[var(--red-primary)] font-bold" style={{ fontFamily: 'Share Tech Mono, monospace' }}>
                BIOFORCE ATLAS
              </span>
              <span className="text-[var(--text-muted)] text-xs">{"// creature combat database"}</span>
            </div>
            <p className="text-[var(--text-muted)] text-xs">
              Data dựa trên nghiên cứu khoa học. Không đại diện cho hành vi thực tế.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
