import { atom } from 'jotai'

/** "최신 뉴스" 새로고침으로 방금 추가된 뉴스 id 목록 — NEW 배지 표시용, 세션 메모리 전용 */
export const newlyAddedNewsIdsAtom = atom<number[]>([])
