import type {FC} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {BG, GOLD, Sfx, Stage, prog} from './common';

export const FEB_FRAMES = 180;
const STEPS = ['Capture', 'Reply', 'Book'];

export const FuturEdgeBuildsIt: FC = () => {
  const f = useCurrentFrame();
  const merge = prog(f, 30, 60);
  const logo = prog(f, 56, 80);
  const tag = prog(f, 90, 110);
  const glow = Math.max(0, 1 - Math.abs(f - 62) / 18);
  return (
    <Stage total={FEB_FRAMES} fadeOut={1}>
      <Sfx file="Impact.mp3" at={58} frames={60} volume={0.7} />
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
        {STEPS.map((s, i) => (
          <div key={s} style={{
            position: 'absolute', width: 760, height: 150, borderRadius: 26, background: '#1A1D27', border: '3px solid #2A2E3B',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 60, fontWeight: 800,
            transform: `translateY(${(i - 1) * 190 * (1 - merge)}px) scale(${1 - merge * 0.5})`, opacity: 1 - merge,
          }}>{s}</div>
        ))}
        <div style={{
          position: 'absolute', padding: '60px 70px', borderRadius: 32, background: GOLD, color: BG, textAlign: 'center',
          fontSize: 92, fontWeight: 900, lineHeight: 1.05, opacity: logo, transform: `scale(${0.8 + logo * 0.2})`,
          boxShadow: `0 0 ${40 + glow * 140}px rgba(212,165,55,${0.35 + glow * 0.5})`,
        }}>FuturEdge<br />Strategies</div>
        <div style={{position: 'absolute', top: 1180, color: '#fff', fontSize: 64, fontWeight: 700, opacity: tag, transform: `translateY(${(1 - tag) * 30}px)`}}>
          builds it for you.
        </div>
      </AbsoluteFill>
    </Stage>
  );
};
