import { atom } from 'jotai'

/** 전체 관계망에서 배치를 유지한 채 특정 노드 기점으로 제자리 강조할 때의 대상 */
export const highlightedNodeAtom = atom<string | null>(null)
