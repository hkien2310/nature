import React from "react";

export default function Loading() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center font-mono text-xs text-[var(--text-secondary)] space-y-4">
      {/* Styled pulsing spinner matching BioForce theme */}
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 border border-red-500/20 rounded-full animate-ping" />
        <div className="absolute inset-2 border-2 border-t-[var(--red-primary)] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
      </div>
      <div className="tracking-[0.2em] animate-pulse uppercase text-[var(--text-muted)]">
        LOADING DATA MATRIX...
      </div>
    </div>
  );
}
