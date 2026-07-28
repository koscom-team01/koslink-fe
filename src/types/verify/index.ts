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

/** GET /api/verify 응답. news는 커서 기반 페이지, daily는 필터와 무관한 전체 추이라 페이징하지 않는다. */
export interface VerifyResponse {
  daily: VerifyDaily[]
  news: VerifyEntry[]
  nextCursor: string | null
}
