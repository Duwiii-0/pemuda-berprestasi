import React from 'react';
import TournamentBracketPemula from './TournamentBracketPemula';
import TournamentBracketPrestasi from './TournamentBracketPrestasi';
import { Match } from '../types'; // Assuming Match type is defined in types/index.ts

interface BracketRendererProps {
  kelasData: any;
  isPemula: boolean;
  initialMatches?: Match[];
  onRenderComplete?: (element: HTMLElement) => void;
}

const BracketRenderer: React.FC<BracketRendererProps> = ({
  kelasData,
  isPemula,
  initialMatches,
  onRenderComplete,
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  // This outer div is just for positioning the component off-screen
  return (
    <div ref={containerRef} style={{ position: 'absolute', left: '-9999px', top: 0, background: 'white' }}>
      {isPemula ? (
        <TournamentBracketPemula
          kelasData={kelasData}
          initialMatches={initialMatches}
          onRenderComplete={onRenderComplete}
        />
      ) : (
        <TournamentBracketPrestasi
          kelasData={kelasData}
          initialMatches={initialMatches}
          onRenderComplete={onRenderComplete}
        />
      )}
    </div>
  );
};

export default BracketRenderer;