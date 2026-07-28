import { atom } from 'jotai'

/** 스크랩(저장) 뉴스 id 목록 — 메모리 전용, 새로고침하면 사라진다 */
export const scrappedNewsIdsAtom = atom<number[]>([])
