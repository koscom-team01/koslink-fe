import type { NewsListItem, NewsListPage } from '#/types/news'

/**
 * 실 백엔드가 내려줄 wire(snake_case) 응답 타입 + 프론트 도메인 타입(camelCase)으로의
 * 변환 함수 모음. apis/news/mock.ts(목 데이터)와 mocks/news/handlers.ts는 이 wire 타입
 * 그대로를 다루고, apis/news/queries.ts의 fetch 함수가 여기를 거쳐 컴포넌트에 camelCase
 * 도메인 타입을 넘긴다. 실 백엔드가 붙을 때도 이 매퍼만 유지하면 컴포넌트 쪽은 손댈
 * 필요가 없다.
 */

export interface NewsListItemWire {
  news_id: number
  title: string
  press: string
  published_at: string
}

export interface NewsListPageWire {
  items: NewsListItemWire[]
  nextCursor: string | null
}

export function mapNewsListPage(wire: NewsListPageWire): NewsListPage {
  return {
    items: wire.items.map(
      (item): NewsListItem => ({
        id: item.news_id,
        title: item.title,
        press: item.press,
        publishedAt: item.published_at,
      }),
    ),
    nextCursor: wire.nextCursor,
  }
}
