import type {FC} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {GOLD, Sfx, Stage, headline, prog} from './common';

const STEPS = ['Capture', 'Reply', 'Book'];
export const CRB_FRAMES = 240;

export const CaptureReplyBook: FC = () => {
  const f = useCurrentFrame();
  const t = prog(f, 0, 20);
  return (
    <Stage total={CRB_FRAMES}>
      <AbsoluteFill style={{padding: '170px 80px 0'}}>
        <div style={{...headline, opacity: t, transform: `translateY(${(1 - t) * 40}px)`}}>A fast follow up system fixes that.</div>
      </AbsoluteFill>
      <AbsoluteFill style={{padding: '620px 80px 0'}}>
        {STEPS.map((s, i) => {
          const start = 70 + i * 50;
          const p = prog(f, start, start + 14);
          const check = prog(f, start + 22, start + 32);
          const line = prog(f, start + 28, start + 48);
          return (
            <div key={s}>
              <div style={{
                height: 190, borderRadius: 28, background: '#1A1D27', border: `3px solid ${check > 0.5 ? GOLD : '#2A2E3B'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 50px',
                opacity: p, transform: `scale(${0.92 + p * 0.08})`,
              }}>
                <span style={{color: '#fff', fontSize: 72, fontWeight: 800}}>{i + 1}. {s}</span>
                <span style={{width: 84, height: 84, borderRadius: 42, background: GOLD, color: '#0E1016', fontSize: 56, fontWeight: 900,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${check})`}}>✓</span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{height: 70, width: 6, marginLeft: 120, background: `linear-gradient(${GOLD} ${line * 100}%, transparent ${line * 100}%)`}} />
              )}
              <Sfx file="Click.mp3" at={start} frames={15} volume={0.6} />
              <Sfx file="Correct.mp3" at={start + 22} frames={30} volume={0.5} />
            </div>
          );
        })}
      </AbsoluteFill>
    </Stage>
  );
};
