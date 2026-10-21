import type {FC} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {GOLD, Sfx, Stage, headline, prog} from './common';

const TEXT = 'Most small businesses lose leads they already paid for.';
const NAMES = ['New website form', 'Missed call', 'Facebook message', 'Email inquiry'];
export const LEADS_FRAMES = 180;

export const LeadsSlippingAway: FC = () => {
  const f = useCurrentFrame();
  const chars = Math.floor(prog(f, 4, 56) * TEXT.length);
  return (
    <Stage total={LEADS_FRAMES}>
      <Sfx file="Typing.mp3" at={4} frames={52} volume={0.5} />
      <AbsoluteFill style={{padding: '170px 80px 0'}}>
        <div style={headline}>{TEXT.slice(0, chars)}<span style={{color: GOLD, opacity: f % 16 < 8 ? 1 : 0}}>|</span></div>
      </AbsoluteFill>
      <AbsoluteFill style={{padding: '720px 80px 0'}}>
        {NAMES.map((n, i) => {
          const inP = prog(f, 66 + i * 12, 78 + i * 12);
          const outP = prog(f, 126 + i * 9, 150 + i * 9);
          return (
            <div key={n} style={{
              height: 130, marginBottom: 28, borderRadius: 24, background: '#1A1D27', border: '2px solid #2A2E3B',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px',
              transform: `translate(${outP * 1100}px, ${(1 - inP) * -120}px)`, opacity: inP * (1 - outP),
            }}>
              <span style={{color: '#fff', fontSize: 44, fontWeight: 700}}>{n}</span>
              <span style={{background: '#1FA463', color: '#fff', fontSize: 28, fontWeight: 800, padding: '10px 22px', borderRadius: 999}}>NEW LEAD</span>
            </div>
          );
        })}
      </AbsoluteFill>
      {NAMES.map((_, i) => <Sfx key={i} file="Pop.mp3" at={66 + i * 12} frames={20} volume={0.6} />)}
    </Stage>
  );
};
