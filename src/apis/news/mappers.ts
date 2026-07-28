import type { NewsListItem, NewsListPage } from '#/types/news'

/**
 * docs/KOSLINK_API.md §1 GET /news 응답과 같은 wire 타입 + 프론트 도메인 타입(camelCase)
 * 으로의 변환 함수. apis/news/mock.ts(목 데이터)와 mocks/news/handlers.ts는 이 wire 타입
 * 그대로를 다루고, apis/news/queries.ts의 fetch 함수가 여기를 거쳐 컴포넌트에 camelCase
 * 도메인 타입을 넘긴다. 실 백엔드가 붙을 때도 이 매퍼만 유지하면 컴포넌트 쪽은 손댈
 * 필요가 없다.
 */

export interface NewsListItemWire {
  newsId: number
  title: string
  press: string
  publishedAt: string
  url: string
}

export interface NewsListPageWire {
  news: NewsListItemWire[]
  hasNext: boolean
  lastCursorId: number | null
}

export function mapNewsListPage(wire: NewsListPageWire): NewsListPage {
  return {
    items: wire.news.map(
      (item): NewsListItem => ({
        id: item.newsId,
        title: item.title,
        press: item.press,
        publishedAt: item.publishedAt,
        url: item.url,
      }),
    ),
    // 프론트 무한 스크롤(useInfiniteQuery)은 opaque string cursor 관례를 쓰므로,
    // 서버의 숫자 커서(lastCursorId)를 문자열로 감싸 nextCursor로 되돌린다.
    nextCursor:
      wire.hasNext && wire.lastCursorId != null
        ? String(wire.lastCursorId)
        : null,
  }
}
