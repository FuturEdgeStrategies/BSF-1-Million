import type {CSSProperties, FC, ReactNode} from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame, Easing} from 'remotion';

export const GOLD = '#D4A537';
export const BG = '#0E1016';
export const FONT = 'Helvetica, Arial, sans-serif';

export const Sfx: FC<{file: string; at: number; frames?: number; volume?: number}> = ({file, at, frames = 45, volume = 0.7}) => (
  <Sequence from={at} durationInFrames={frames}>
    <Audio src={staticFile(`sounds/${file}`)} volume={volume} />
  </Sequence>
);

export const Stage: FC<{children: ReactNode; fadeIn?: number; fadeOut?: number; total: number}> = ({children, fadeIn = 8, fadeOut = 8, total}) => {
  const f = useCurrentFrame();
  const opacity = interpolate(f, [0, fadeIn, total - fadeOut, total], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT, opacity}}>
      <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 30%, rgba(212,165,55,0.14), rgba(14,16,22,0) 60%)'}} />
      {children}
    </AbsoluteFill>
  );
};

export const ease = Easing.out(Easing.cubic);
export const prog = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});

export const headline: CSSProperties = {color: '#fff', fontWeight: 800, fontSize: 84, lineHeight: 1.1, letterSpacing: -1};
