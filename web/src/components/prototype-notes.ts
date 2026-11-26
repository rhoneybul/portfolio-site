'use client'

import {useSyncExternalStore} from 'react'

/**
 * The visitor's notes on their prototype, one per screen, as they tap through it: shared by every
 * phone on the page (the reveal's and the deck's) and kept in this tab, then sent with their
 * interest (components/build-dialog.tsx), so Rob reads what they thought of each screen.
 */

export interface ScreenNote {
  title: string
  text: string
}

const KEY = 'fohm-app-builder-notes'
let notes: Record<string, ScreenNote> = {}
const listeners = new Set<() => void>()

try {
  notes = JSON.parse(sessionStorage.getItem(KEY) ?? '{}') as Record<string, ScreenNote>
} catch {
  // No storage on the server or in a locked-down browser: notes live in memory.
}

function emit() {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(notes))
  } catch {
    // Not kept: they still go with this page's interest.
  }
  listeners.forEach((l) => l())
}

export function setNote(id: string, title: string, text: string) {
  const next = {...notes}
  if (text.trim()) next[id] = {title, text: text.slice(0, 600)}
  else delete next[id]
  notes = next
  emit()
}

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}
const EMPTY: Record<string, ScreenNote> = {}

export const useNotes = () => useSyncExternalStore(subscribe, () => notes, () => EMPTY)

/** The notes as Rob reads them: a screen to a line. */
export const notesText = (all: Record<string, ScreenNote>) =>
  Object.values(all)
    .map((n) => `${n.title}: ${n.text.trim()}`)
    .join('\n')
    .slice(0, 4000)
