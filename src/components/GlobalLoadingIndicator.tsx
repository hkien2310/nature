"use client";

import { useEffect, useState } from "react";

export default function GlobalLoadingIndicator() {
  const [activeRequests, setActiveRequests] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const originalFetch = window.fetch;
    
    // Intercept all window.fetch calls globally to show loading indicator
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      setActiveRequests((prev) => prev + 1);
      try {
        return await originalFetch(input, init);
      } finally {
        setActiveRequests((prev) => Math.max(0, prev - 1));
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  if (activeRequests === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-black/40 overflow-hidden">
      <div 
        className="h-full bg-[var(--red-primary)] shadow-[0_0_10px_rgba(255,45,45,0.8)] w-full origin-left"
        style={{
          animation: "global-loading 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite",
        }}
      />
    </div>
  );
}
