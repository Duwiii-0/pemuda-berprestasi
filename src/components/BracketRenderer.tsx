import React, { useEffect, useState } from "react";
import TournamentBracketPemula from "./TournamentBracketPemula";
import TournamentBracketPrestasi from "./TournamentBracketPrestasi";

interface BracketRendererProps {
  kelasData: any;
  isPemula: boolean;
  onRenderComplete?: (element: HTMLElement) => void;
}

const BracketRenderer: React.FC<BracketRendererProps> = ({
  kelasData,
  isPemula,
  onRenderComplete,
}) => {
  const [mounted, setMounted] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && containerRef.current && onRenderComplete) {
      setTimeout(() => {
        if (containerRef.current) {
          const bracketElement = containerRef.current.querySelector(
            ".tournament-layout"
          ) as HTMLElement;
          if (bracketElement) {
            console.log("✅ Bracket rendered, calling onRenderComplete");
            onRenderComplete(bracketElement);
          }
        }
      }, 3000);
    }
  }, [mounted, onRenderComplete]);

  if (!mounted) return null;

  return (
    <div
      ref={containerRef}
      style={{ position: "absolute", left: "-9999px", top: 0, width: "1920px" }}
    >
      {isPemula ? (
        <TournamentBracketPemula
          kelasData={kelasData}
          apiBaseUrl={import.meta.env.VITE_API_URL || "/api"}
        />
      ) : (
        <TournamentBracketPrestasi
          kelasData={kelasData}
          apiBaseUrl={import.meta.env.VITE_API_URL || "/api"}
        />
      )}
    </div>
  );
};

export default BracketRenderer;
