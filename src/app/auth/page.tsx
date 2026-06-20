import React from "react";
import AuthForm from "@/components/AuthForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Identity Gateway — BioForce Atlas",
  description: "Đăng nhập hoặc đăng ký tài khoản để bình chọn trận đấu.",
};

export default function AuthPage() {
  return (
    <div className="max-w-xl mx-auto px-6 py-20">
      <div className="text-center mb-10">
        <h1 
          className="text-3xl font-bold text-[var(--text-primary)] mb-2"
          style={{ fontFamily: "Share Tech Mono, monospace" }}
        >
          IDENTITY PROTOCOL
        </h1>
        <p className="text-xs text-[var(--text-secondary)]">
          Xác thực danh tính để tham gia dự đoán các trận chiến đấu trong đấu trường Matchup Arena.
        </p>
      </div>
      
      <AuthForm />
    </div>
  );
}
