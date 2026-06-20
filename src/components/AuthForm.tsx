"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [user, setUser] = useState<{ id: string; username: string } | null>(null);

  useEffect(() => {
    // Check local session
    const stored = localStorage.getItem("user_session");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (e) {
        localStorage.removeItem("user_session");
      }
    }
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Đã xảy ra lỗi.");

      if (isLogin) {
        localStorage.setItem("user_session", JSON.stringify(data.user));
        setUser(data.user);
        // Trigger navbar update
        window.dispatchEvent(new Event("storage"));
        router.refresh();
      } else {
        setSuccessMsg("Đăng ký tài khoản thành công! Vui lòng đăng nhập.");
        setIsLogin(true);
        setPassword("");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Lỗi xác thực.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem("user_session");
    setUser(null);
    window.dispatchEvent(new Event("storage"));
    router.refresh();
  };

  if (user) {
    return (
      <div 
        className="p-8 border border-[var(--border)] max-w-md mx-auto text-center backdrop-blur-md rounded-md"
        style={{ background: "rgba(18, 18, 24, 0.7)", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5)" }}
      >
        <div className="text-[10px] text-[#00f0ff] tracking-[0.3em] mb-4" style={{ fontFamily: "Share Tech Mono, monospace" }}>
          // IDENTITY MATRIX VERIFIED
        </div>
        <p className="text-sm text-[var(--text-secondary)] mb-6">
          Tên tài khoản: <br/>
          <span className="font-bold text-[var(--text-primary)] text-sm uppercase">{user.username}</span>
        </p>

        {user.username === "admin" && (
          <div className="mb-6 p-2 border border-red-500/30 bg-red-950/20 text-red-400 text-xs rounded-sm" style={{ fontFamily: "Share Tech Mono, monospace" }}>
            ADMIN ACCESS GRANTED // READY TO CONSTRUCT BATTLES
          </div>
        )}

        <button
          onClick={handleSignOut}
          className="w-full py-2 border border-[var(--border)] text-xs font-semibold rounded-sm tracking-widest hover:bg-red-500/20 hover:border-red-500/50 text-[var(--text-primary)] transition-all"
          style={{ fontFamily: "Share Tech Mono, monospace" }}
        >
          [ ĐĂNG XUẤT ]
        </button>
      </div>
    );
  }

  return (
    <div 
      className="p-8 border border-[var(--border)] max-w-md mx-auto backdrop-blur-md rounded-md"
      style={{ background: "rgba(18, 18, 24, 0.7)", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5)" }}
    >
      <div className="text-[10px] text-[var(--text-muted)] tracking-[0.3em] mb-6 text-center" style={{ fontFamily: "Share Tech Mono, monospace" }}>
        {isLogin ? "// IDENTITY ACCESS PORTAL" : "// CRADLE CREATION UTILITY"}
      </div>

      <form onSubmit={handleAuth} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider" style={{ fontFamily: "Share Tech Mono, monospace" }}>Username / Nickname</label>
          <input
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="px-3 py-2 text-xs border border-[var(--border)] text-[var(--text-primary)] rounded-sm focus:outline-none focus:border-[var(--glow-color,rgba(0,240,255,0.5))]"
            style={{ background: "rgba(10, 10, 12, 0.8)" }}
            placeholder="nhap ten tai khoan..."
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider" style={{ fontFamily: "Share Tech Mono, monospace" }}>Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="px-3 py-2 text-xs border border-[var(--border)] text-[var(--text-primary)] rounded-sm focus:outline-none focus:border-[var(--glow-color,rgba(0,240,255,0.5))]"
            style={{ background: "rgba(10, 10, 12, 0.8)" }}
            placeholder="nhap mat khau..."
          />
        </div>

        {errorMsg && (
          <div className="text-xs text-red-400 py-1" style={{ fontFamily: "Share Tech Mono, monospace" }}>
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="text-xs text-green-400 py-1" style={{ fontFamily: "Share Tech Mono, monospace" }}>
            {successMsg}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-2 border.5 bg-sky-950/20 border border-[#00f0ff]/40 text-[#00f0ff] hover:bg-[#00f0ff]/10 hover:border-[#00f0ff] text-xs font-semibold rounded-sm tracking-widest transition-all disabled:opacity-50"
          style={{ fontFamily: "Share Tech Mono, monospace" }}
        >
          {loading ? "[ INITIALIZING... ]" : isLogin ? "[ ĐĂNG NHẬP ]" : "[ ĐĂNG KÝ ]"}
        </button>
      </form>

      <div className="mt-6 text-center text-xs border-t border-[var(--border)] pt-4">
        <button
          onClick={() => {
            setIsLogin(!isLogin);
            setErrorMsg("");
            setSuccessMsg("");
          }}
          className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all"
        >
          {isLogin ? "Chưa có tài khoản? Đăng ký ngay" : "Đã có tài khoản? Đăng nhập"}
        </button>
      </div>
    </div>
  );
}
