import type { Direction } from '#/shared/types'
import type { NewsImpactGraph } from '#/types/graph'

/** 뉴스에 직접 언급된 당사자 종목 (구 main). 배열이라 여러 종목이 동시에 언급된 뉴스도 표현한다. */
export interface OriginStock {
  ticker: string
  name: string
  direction: Direction
  reason: string
}

/** 온톨로지로 파생된 관련 종목. relationPath는 표시용 문자열("SK하이닉스 → 한미반도체")이며 그래프 좌표 계산에는 쓰이지 않는다. */
export interface RelatedStock {
  ticker: string
  name: string
  direction: Direction
  relationLabel: string
  relationPath: string
  propagation: string
}

export interface NewsImpact {
  newsId: number
  newsSummary: string[] // 3줄
  source: {
    press: string
    publishedAt: string
    url: string
  }
  originStocks: OriginStock[]
  relatedStocks: RelatedStock[]
  finalSummary: string
  graph: NewsImpactGraph
}
