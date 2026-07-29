import { describe, expect, it } from 'vitest'
import type { NewsImpactWire } from './mappers'
import { mapNewsImpact } from './mappers'

/** docs/ERROR_EXAMPLE.md와 동일한 형태 — 연관 종목이 없어 graph.nodes/edges가
 * 통째로 빈 배열로 내려오지만 origin_stocks에는 기점 종목이 있다. */
const wire: NewsImpactWire = {
  news_summary: ['요약1', '요약2', '요약3'],
  source: {
    press: '한국경제',
    published_at: '2026-07-29 09:52:00+00:00',
    url: 'https://n.news.naver.com/mnews/article/015/0005315371?sid=101',
  },
  origin_stocks: [
    {
      ticker: '000830',
      name: '삼성물산',
      status: 'up',
      reason: '건설부문 실적 개선',
    },
  ],
  related_stocks: [],
  final_summary: '요약',
  graph: {
    newsId: 498,
    originId: '000830',
    nodes: [],
    edges: [],
  },
}

describe('mapNewsImpact', () => {
  it('graph.nodes에 기점 노드가 없으면 origin_stocks에서 보충한다', () => {
    const result = mapNewsImpact(498, wire)

    expect(result.graph.nodes).toHaveLength(1)
    expect(result.graph.nodes[0]).toMatchObject({
      id: '000830',
      ticker: '000830',
      name: '삼성물산',
      kind: 'STOCK',
      direction: 'UP',
    })
  })
})
