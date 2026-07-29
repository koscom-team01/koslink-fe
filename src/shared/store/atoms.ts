import { atom } from 'jotai'

/**
 * 여러 도메인이 같이 쓰는 UI 상태 atom 모음. 서버성 데이터는 여기 넣지 않는다 —
 * apis/에서 직접 읽는다. 세션 메모리 전용이며 localStorage 등 영속 저장은 쓰지 않는다.
 */

export const viewAtom = atom<'network' | 'map' | 'verify'>('map')

/** 현재 선택된 뉴스 id — news/graph/analysis/scrap 도메인이 공유한다 */
export const selectedNewsIdAtom = atom<number | null>(null)

/** 커버 화면 → /app 진입 시 전체 관계망 인트로(자동 하이라이트+줌)를 재생했는지 — 세션당 1회만 */
export const introPlayedAtom = atom(false)

/** 모바일 바텀시트(≤1080px) 개폐 */
export const newsSheetOpenAtom = atom(false)
