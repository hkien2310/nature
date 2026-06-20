"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const navLinks = [
  { href: "/", label: "HOME" },
  { href: "/creatures", label: "DATABASE" },
  { href: "/matchup", label: "MATCHUP" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<{ id: string; username: string; role?: string } | null>(null);

  useEffect(() => {
    const checkSession = () => {
      const stored = localStorage.getItem("user_session");
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch (e) {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };

    checkSession();
    window.addEventListener("storage", checkSession);
    return () => {
      window.removeEventListener("storage", checkSession);
    };
  }, []);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 h-16"
      style={{
        background: "rgba(10,10,10,0.95)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div className="max-w-6xl mx-auto h-full px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div
            className="w-8 h-8 flex items-center justify-center"
            style={{
              background: "var(--red-primary)",
              clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2L4 7v10l8 5 8-5V7L12 2z"
                stroke="white"
                strokeWidth="1.5"
                fill="none"
              />
              <circle cx="12" cy="12" r="3" fill="white" />
            </svg>
          </div>
          <div>
            <div
              className="text-sm font-bold text-[var(--text-primary)] leading-none tracking-widest"
              style={{ fontFamily: "Share Tech Mono, monospace" }}
            >
              BIOFORCE
            </div>
            <div className="text-[10px] text-[var(--text-muted)] tracking-widest leading-none mt-0.5">
              ATLAS v1.0
            </div>
          </div>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className="relative px-4 py-2 text-xs tracking-widest transition-all duration-200 cursor-pointer"
                style={{
                  fontFamily: "Share Tech Mono, monospace",
                  color: isActive ? "var(--red-primary)" : "var(--text-secondary)",
                }}
              >
                {isActive && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-px"
                    style={{ background: "var(--red-primary)" }}
                  />
                )}
                <span className="hover:text-[var(--text-primary)] transition-colors duration-200">
                  {link.label}
                </span>
              </Link>
            );
          })}
        </div>

        {/* User state & Status indicator */}
        <div className="hidden md:flex items-center gap-6">
          {user && (user.role === "admin" || user.username === "admin") && (
            <Link 
              href="/admin" 
              className="text-[10px] text-red-500 border border-red-500/30 px-2.5 py-1 rounded-sm hover:bg-red-500/10 transition-all font-semibold"
              style={{ fontFamily: "Share Tech Mono, monospace" }}
            >
              ADMIN PANEL
            </Link>
          )}

          {user ? (
            <Link 
              href="/auth" 
              className="text-[10px] text-[#00f0ff] border border-[#00f0ff]/30 px-2.5 py-1 rounded-sm hover:bg-[#00f0ff]/10 transition-all font-semibold"
              style={{ fontFamily: "Share Tech Mono, monospace" }}
            >
              {user.username === "admin" ? "ADMIN" : user.username.toUpperCase()}
            </Link>
          ) : (
            <Link 
              href="/auth" 
              className="text-[10px] text-[var(--text-muted)] border border-[var(--border)] px-2.5 py-1 rounded-sm hover:border-[var(--text-primary)] hover:text-[var(--text-primary)] transition-all"
              style={{ fontFamily: "Share Tech Mono, monospace" }}
            >
               IDENTITY [INACTIVE]
            </Link>
          )}

          <div className="flex items-center gap-2">
            <div
              className="w-1.5 h-1.5 rounded-full bg-[var(--red-primary)]"
              style={{ animation: "pulse-red 2s infinite" }}
            />
            <span className="text-[10px] text-[var(--text-muted)] tracking-widest" style={{ fontFamily: "Share Tech Mono, monospace" }}>
              LIVE DATABASE
            </span>
          </div>
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden flex flex-col gap-1 cursor-pointer p-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="block w-5 h-px transition-all duration-300"
              style={{
                background: "var(--text-secondary)",
                transform:
                  menuOpen
                    ? i === 0
                      ? "rotate(45deg) translate(2px, 2px)"
                      : i === 2
                      ? "rotate(-45deg) translate(2px, -2px)"
                      : "scaleX(0)"
                    : "none",
              }}
            />
          ))}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="md:hidden border-t"
          style={{
            background: "rgba(10,10,10,0.98)",
            borderColor: "var(--border)",
          }}
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="block px-6 py-4 text-xs tracking-widest border-b cursor-pointer"
              style={{
                fontFamily: "Share Tech Mono, monospace",
                color: pathname === link.href ? "var(--red-primary)" : "var(--text-secondary)",
                borderColor: "var(--border)",
              }}
            >
              {link.label}
            </Link>
          ))}
          {user && (user.role === "admin" || user.username === "admin") && (
            <Link
              href="/admin"
              onClick={() => setMenuOpen(false)}
              className="block px-6 py-4 text-xs tracking-widest border-b cursor-pointer font-bold"
              style={{
                fontFamily: "Share Tech Mono, monospace",
                color: "var(--red-primary)",
                borderColor: "var(--border)",
              }}
            >
              ADMIN PANEL
            </Link>
          )}

          <Link
            href="/auth"
            onClick={() => setMenuOpen(false)}
            className="block px-6 py-4 text-xs tracking-widest border-b cursor-pointer"
            style={{
              fontFamily: "Share Tech Mono, monospace",
              color: "#00f0ff",
              borderColor: "var(--border)",
            }}
          >
            {user ? `IDENTITY [${user.username.toUpperCase()}]` : "IDENTITY [INACTIVE]"}
          </Link>
        </div>
      )}
    </nav>
  );
}
