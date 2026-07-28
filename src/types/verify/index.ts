import type { Direction } from '#/shared/types'

export interface VerifyItem {
  name: string
  predicted: Direction
  actualReturn: number
  hit: boolean
  pathLabel: string
}

export interface VerifyEntry {
  newsId: string
  date: string
  sector: string
  title: string
  items: VerifyItem[]
}

export interface VerifyDaily {
  date: string
  hitRate: number
}

/** 예측 검증 탭 데이터 — 실 백엔드에 해당 API가 없어 verify.json을 클라이언트에서
 * 직접 페이징해 이 모양으로 반환한다. news는 커서 기반 페이지, daily는 필터와
 * 무관한 전체 추이라 페이징하지 않는다. */
export interface VerifyResponse {
  daily: VerifyDaily[]
  news: VerifyEntry[]
  nextCursor: string | null
}
