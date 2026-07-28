import { atom } from 'jotai'

export const verifyContextAtom = atom<{
  label: string
  names: string[]
} | null>(null)
