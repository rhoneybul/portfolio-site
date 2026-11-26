import type {CSSProperties} from 'react'
import {onAccent} from '@/app-builder/options'
import {iconMarkCss, type Style} from '@/app-builder/prototype-doc'

/**
 * The visitor's app's icon: its mark on a square of its colour, as the prototype draws it
 * (prototype-doc.ts, iconMarkCss). Until Claude has chosen the icon, the name's first letter.
 */
export function AppIcon({name, accent, icon, size = 56}: {name: string; accent: string; icon?: Style['icon']; size?: number}) {
  const mark = icon ?? {shape: 'monogram' as const, letters: name.replace(/[^A-Za-z0-9]/g, '').charAt(0).toUpperCase() || 'A'}
  const key = `app-icon--${mark.shape}-${mark.letters.replace(/[^A-Za-z0-9]/g, '')}`
  const box = {width: size, height: size, fontSize: size, borderRadius: Math.round(size * 0.24), background: accent, color: onAccent(accent)} as CSSProperties
  return (
    <span className={`app-icon ${key}`} style={box} aria-hidden>
      <style>{iconMarkCss(`.${key}::after`, mark)}</style>
    </span>
  )
}
