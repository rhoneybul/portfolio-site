import type {CSSProperties, ReactNode} from 'react'

/**
 * A tiny phone drawn in the look of one of the apps on the look and feel question
 * (app-builder/references.ts): its canvas, its colours and the shape of its home screen, from
 * Mobbin's screens of it. Drawn here, in blocks: none of Mobbin's images is copied.
 */

const box = (s: CSSProperties): CSSProperties => ({position: 'absolute', ...s})
const B = ({s}: {s: CSSProperties}) => <i style={box(s)} />

const SKETCHES: Record<string, {bg: string; parts: ReactNode}> = {
  Runna: {
    bg: '#f1f1f3',
    parts: (
      <>
        <B s={{left: 6, right: 6, top: 10, height: 34, background: '#fff', borderRadius: 6}} />
        <B s={{left: 10, width: 30, top: 14, height: 4, background: '#111', borderRadius: 2}} />
        <B s={{left: 10, right: 10, top: 24, height: 3, background: 'linear-gradient(90deg,#20c997 70%,#ddd 70%)', borderRadius: 2}} />
        <B s={{left: 10, width: 14, top: 32, height: 6, background: '#111', borderRadius: 1}} />
        <B s={{right: 10, width: 18, top: 32, height: 6, background: '#111', borderRadius: 1}} />
        {['#e9b10f,#f08a24', '#f26b3a,#e0453c', '#7b5cc4,#b05fc9', '#2f7a4f,#5aa05a'].map((g, i) => (
          <B key={g} s={{left: i % 2 ? 34 : 6, top: 50 + Math.floor(i / 2) * 24, width: 24, height: 20, background: `linear-gradient(135deg,${g})`, borderRadius: 4}} />
        ))}
      </>
    ),
  },
  Strava: {
    bg: '#fff',
    parts: (
      <>
        <B s={{left: 6, top: 10, width: 8, height: 8, background: '#fc4c02', borderRadius: 2}} />
        <B s={{left: 6, top: 24, width: 10, height: 10, background: '#ccc', borderRadius: 5}} />
        <B s={{left: 20, top: 26, width: 26, height: 4, background: '#111', borderRadius: 2}} />
        {[0, 1, 2].map((i) => (
          <B key={i} s={{left: 6 + i * 18, top: 40, width: 13, height: 6, background: '#111', borderRadius: 1}} />
        ))}
        <B s={{left: 0, right: 0, top: 52, height: 40, background: '#dff0d8'}} />
        <B s={{left: 14, top: 60, width: 30, height: 24, border: '2.5px solid #fc4c02', borderRadius: '40% 10% 50% 20%'}} />
      </>
    ),
  },
  Ladder: {
    bg: '#111',
    parts: (
      <>
        <B s={{left: 0, right: 0, top: 0, height: 74, background: 'radial-gradient(circle at 50% 40%,#5a5a60,#1c1c1f 70%)'}} />
        <B s={{left: 22, top: 18, width: 16, height: 36, background: '#2a2a2e', borderRadius: '8px 8px 2px 2px'}} />
        <B s={{left: 16, top: 70, width: 28, height: 28, border: '3px solid #e5ff3b', borderBottomColor: 'transparent', borderRadius: '50%'}} />
        <B s={{left: 22, top: 80, width: 16, height: 6, background: '#fff', borderRadius: 1}} />
        <B s={{left: 6, top: 104, width: 30, height: 5, background: '#fff', borderRadius: 1}} />
      </>
    ),
  },
  'Gentler Streak': {
    bg: 'linear-gradient(#dbeafe 0 34%,#fff 34%)',
    parts: (
      <>
        <B s={{left: 20, top: 10, width: 22, height: 20, background: '#f0703a', borderRadius: '50% 50% 45% 45%'}} />
        <B s={{left: 8, top: 4, width: 8, height: 8, background: '#fbbf24', borderRadius: 4}} />
        <B s={{left: 6, top: 42, width: 44, height: 6, background: '#111', borderRadius: 2}} />
        <B s={{left: 6, top: 52, width: 50, height: 3, background: '#bbb', borderRadius: 2}} />
        <B s={{left: 6, top: 62, width: 52, height: 4, background: 'linear-gradient(90deg,#ddd 15%,#2ec27e 15% 70%,#e5484d 70%)', borderRadius: 2}} />
        <B s={{left: 6, right: 6, top: 76, height: 30, background: '#f08a3c', borderRadius: 8}} />
      </>
    ),
  },
  Oura: {
    bg: 'linear-gradient(#3b5b7a,#46613f 55%,#24301f)',
    parts: (
      <>
        {[0, 1, 2, 3].map((i) => (
          <B key={i} s={{left: 6 + i * 13, top: 10, width: 9, height: 9, border: '1.5px solid rgba(255,255,255,.7)', borderRadius: 5}} />
        ))}
        <B s={{left: 10, right: 10, top: 30, height: 40, border: '2.5px solid #fff', borderBottom: 0, borderRadius: '40px 40px 0 0'}} />
        <B s={{left: 20, top: 52, width: 20, height: 8, background: '#fff', borderRadius: 1}} />
        <B s={{left: 14, top: 66, width: 32, height: 5, background: '#fff', borderRadius: 1, fontFamily: 'serif'}} />
        <B s={{left: 8, right: 8, top: 100, height: 10, background: 'rgba(20,20,22,.7)', borderRadius: 5}} />
      </>
    ),
  },
  Headspace: {
    bg: '#faf6f1',
    parts: (
      <>
        <B s={{left: 6, top: 10, width: 30, height: 5, background: '#222', borderRadius: 2}} />
        <B s={{left: 8, top: 22, width: 1, height: 80, background: '#d6cfc5'}} />
        {['#2ec27e', '#f97316', '#fff'].map((c, i) => (
          <span key={c}>
            <B s={{left: 5, top: 30 + i * 26, width: 7, height: 7, borderRadius: 4, background: c, border: '1px solid #bbb'}} />
            <B s={{left: 16, right: 6, top: 22 + i * 26, height: 22, background: '#f1ebe3', borderRadius: 6}} />
            <B s={{right: 9, top: 25 + i * 26, width: 16, height: 16, background: ['#facc15', '#3b82f6', '#fb923c'][i], borderRadius: 3}} />
          </span>
        ))}
      </>
    ),
  },
  Calm: {
    bg: 'linear-gradient(#7fa7d1,#a7bfd8 30%,#5b6f86 45%,#2a4f86 60%,#1d3b6b)',
    parts: (
      <>
        <B s={{left: -6, width: 44, top: 18, height: 26, background: '#6d7d90', clipPath: 'polygon(50% 0,100% 100%,0 100%)'}} />
        <B s={{left: 26, width: 42, top: 24, height: 20, background: '#8393a4', clipPath: 'polygon(50% 0,100% 100%,0 100%)'}} />
        <B s={{left: 20, top: 50, width: 20, height: 20, border: '3px solid #a5c8ff', borderRadius: 10, background: 'rgba(20,40,90,.6)'}} />
        {[0, 1, 2, 3, 4].map((i) => (
          <B key={i} s={{left: 9 + i * 9, top: 76, width: 6, height: 6, borderRadius: 3, background: 'rgba(255,255,255,.35)'}} />
        ))}
        <B s={{left: 6, right: 6, top: 88, height: 14, background: 'rgba(255,255,255,.22)', borderRadius: 6}} />
      </>
    ),
  },
  Duolingo: {
    bg: '#fff',
    parts: (
      <>
        <B s={{left: 4, right: 4, top: 8, height: 14, background: '#58cc02', borderRadius: 5}} />
        {[22, 34, 22, 10, 22].map((x, i) => (
          <B key={i} s={{left: x + 4, top: 30 + i * 16, width: 14, height: 12, background: i < 3 ? '#58cc02' : '#e5e5e5', borderRadius: '50%', boxShadow: `0 2px 0 ${i < 3 ? '#46a302' : '#cfcfcf'}`}} />
        ))}
      </>
    ),
  },
  Headway: {
    bg: '#fff6f0',
    parts: (
      <>
        <B s={{left: 6, top: 8, width: 26, height: 5, background: '#111', borderRadius: 2}} />
        {['#ec4899', '#1e3a8a', '#2563eb'].map((c, i) => (
          <B key={c} s={{left: 6 + i * 20, top: 20, width: 16, height: 26, background: c, borderRadius: 3}} />
        ))}
        <B s={{left: 6, right: 6, top: 54, height: 40, background: '#1e3a8a', borderRadius: 6}} />
        <B s={{left: 12, top: 62, width: 26, height: 4, background: '#fff', borderRadius: 2}} />
        <B s={{left: 6, right: 6, top: 100, height: 10, background: '#fff', borderRadius: 5, boxShadow: '0 1px 4px rgba(0,0,0,.15)'}} />
      </>
    ),
  },
}

/** A blank phone, for an app we haven't drawn, while its App Store screens come (or if they don't). */
const BLANK = {bg: '#ececef', parts: null}

/** The sketch for one reference: its own, or a blank phone for an app we haven't drawn. */
export function RefSketch({name}: {name: string}) {
  const s = SKETCHES[name] ?? BLANK
  return (
    <span className="ref-sketch" style={{background: s.bg}} aria-hidden>
      {s.parts}
    </span>
  )
}
