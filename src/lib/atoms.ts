import { atom } from 'jotai'

/**
 * UI 상태와 관심종목 메모리만 담당하는 Jotai atom 모음.
 * 뉴스/그래프/분석/검증 같은 서버성 데이터는 여기 넣지 않는다 — lib/api.ts에서 직접 읽는다.
 * 세션 메모리 전용이며 localStorage 등 영속 저장은 쓰지 않는다.
 */

export const viewAtom = atom<'network' | 'map' | 'verify'>('network')

export const selectedNewsIdAtom = atom<number | null>(null)

/** 전체 관계망에서 배치를 유지한 채 특정 노드 기점으로 제자리 강조할 때의 대상 */
export const highlightedNodeAtom = atom<string | null>(null)

export const verifyContextAtom = atom<{
  label: string
  names: string[]
} | null>(null)

/** 모바일 바텀시트(≤1080px) 개폐 */
export const newsSheetOpenAtom = atom(false)

/** 스크랩(저장) 뉴스 id 목록 — 메모리 전용, 새로고침하면 사라진다 */
export const scrappedNewsIdsAtom = atom<number[]>([])
