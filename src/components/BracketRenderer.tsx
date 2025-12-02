import React, { useEffect, useState } from 'react';
import TournamentBracketPemula from './TournamentBracketPemula';
import TournamentBracketPrestasi from './TournamentBracketPrestasi';

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
  const containerRef = React.useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} style={{ position: 'absolute', left: '-9999px', top: 0, width: '1920px' }}>
      {isPemula ? (
        <TournamentBracketPemula
          kelasData={kelasData}
          apiBaseUrl={import.meta.env.VITE_API_URL || '/api'}
          onRenderComplete={onRenderComplete}
        />
      ) : (
        <TournamentBracketPrestasi
          kelasData={kelasData}
          apiBaseUrl={import.meta.env.VITE_API_URL || '/api'}
          onRenderComplete={onRenderComplete}
        />
      )}
    </div>
  );
};

export default BracketRenderer;