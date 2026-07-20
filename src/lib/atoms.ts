import { atom } from 'jotai'
import type { BriefingResult } from '#/types'

/**
 * UI 상태와 관심종목 메모리만 담당하는 Jotai atom 모음.
 * 뉴스/그래프/분석/검증 같은 서버성 데이터는 여기 넣지 않는다 — lib/api.ts에서 직접 읽는다.
 * 세션 메모리 전용이며 localStorage 등 영속 저장은 쓰지 않는다.
 */

export const viewAtom = atom<'map' | 'verify'>('map')

export const selectedNewsIdAtom = atom<string | null>(null)

export const graphModeAtom = atom<'focus' | 'all' | 'node'>('focus')

/** 전체 관계망에서 배치를 유지한 채 특정 노드 기점으로 제자리 강조할 때의 대상 */
export const highlightedNodeAtom = atom<string | null>(null)

export const backToAtom = atom<'focus' | 'all' | 'reset'>('focus')

export const sectorFilterAtom = atom<string>('전체')

export const verifyContextAtom = atom<{
  label: string
  names: string[]
} | null>(null)

/** 모바일 바텀시트(≤1080px) 개폐 */
export const newsSheetOpenAtom = atom(false)

// 관심종목 브리핑 — 메모리 전용, 새로고침하면 사라진다
export const briefingTickersAtom = atom<string[]>([])
export const briefingResultAtom = atom<BriefingResult | null>(null)
export const briefingRanAtAtom = atom<string | null>(null)
