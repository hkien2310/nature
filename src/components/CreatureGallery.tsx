"use client";

import React, { useState, useEffect } from "react";
import { CldImage } from "next-cloudinary";

interface CreatureGalleryProps {
  images?: string[];
  tierColor: string;
}

export default function CreatureGallery({ images, tierColor }: CreatureGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Close modal on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedImage(null);
      }
    };
    if (selectedImage) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedImage]);

  if (!images || images.length === 0) {
    return null;
  }

  return (
    <div className="border border-[var(--border)] p-6 md:p-8" style={{ background: "var(--bg-card)" }}>
      <div
        className="text-[10px] tracking-widest text-[var(--text-muted)] mb-4"
        style={{ fontFamily: "Share Tech Mono, monospace" }}
      >
        // VISUAL ARCHIVE
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {images.map((img, i) => (
          <div 
            key={i} 
            className="relative aspect-square overflow-hidden border cursor-pointer group"
            style={{ borderColor: "var(--border)" }}
            onClick={() => setSelectedImage(img)}
          >
            <CldImage
              src={img}
              alt={`Archive Image ${i + 1}`}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              sizes="(max-width: 768px) 50vw, 33vw"
            />
            {/* Hover overlay with crosshair */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={tierColor} strokeWidth="1.5">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 md:p-8 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative w-full h-full max-w-6xl max-h-[85vh] flex items-center justify-center border" style={{ borderColor: tierColor }}>
            <CldImage
              src={selectedImage}
              alt="Enlarged Archive Image"
              fill
              className="object-contain"
              sizes="100vw"
            />
            {/* Close button */}
            <button 
              className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-white font-mono text-sm tracking-widest z-50 px-3 py-1 border border-[var(--border)] bg-black/50 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImage(null);
              }}
            >
              [ ESC_CLOSE ]
            </button>
            {/* Corner decorations */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2" style={{ borderColor: tierColor }}></div>
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2" style={{ borderColor: tierColor }}></div>
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2" style={{ borderColor: tierColor }}></div>
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2" style={{ borderColor: tierColor }}></div>
          </div>
        </div>
      )}
    </div>
  );
}
