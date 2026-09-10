import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import {length, stateAt} from './timing.mjs';

// Studio full timeline, isolated shot previews and MP4 renders all use this component.
// Typography does not stretch with a morphing shell. Output scaling is uniform.
export function Shot({shot, variant}) {
  const frame = useCurrentFrame();
  const state = stateAt(frame, shot, variant);
  return <AbsoluteFill style={{background: '#161719', color: '#f4f4f4', fontFamily: 'Arial, sans-serif', justifyContent: 'center', padding: 140}}>
    <div style={{position: 'absolute', top: 70, left: 140, fontSize: 24, color: '#b7b9bd'}}>ILLUSTRATIVE STARTER</div>
    <div style={{opacity: state.opacity, transform: `translateY(${state.y}px)`, filter: `blur(${state.blur}px)`}}>
      <h1 style={{fontSize: 80, fontWeight: 600, lineHeight: 1.15, margin: '0 0 32px', maxWidth: 1500}}>{variant.title}</h1>
      <p style={{fontSize: 36, lineHeight: 1.4, margin: 0, color: '#b7b9bd'}}>{variant.subtitle}</p>
    </div>
  </AbsoluteFill>;
}
export function Film({board}) {
  let start = 0;
  return <AbsoluteFill>{board.shots.map((shot) => {
    const from = start;
    start += length(shot);
    return <Sequence key={shot.id} from={from} durationInFrames={length(shot)}>
      <Shot shot={shot} variant={shot.variants.find((v) => v.id === shot.selected)}/>
    </Sequence>;
  })}</AbsoluteFill>;
}
