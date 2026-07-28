import { useInfiniteQuery } from '@tanstack/react-query'
import { http } from '#/shared/apis/http'
import { getNews } from './mock'
import { mapNewsListPage } from './mappers'
import type { NewsListPageWire } from './mappers'
import type { NewsListPage } from '#/types/news'

export const newsKeys = {
  all: () => ['news'] as const,
}

async function fetchNews(cursor?: string): Promise<NewsListPage> {
  const searchParams: Record<string, string> = {}
  if (cursor) searchParams.cursorId = cursor
  const wire = await http
    .get('news', { searchParams })
    .json<NewsListPageWire>()
  return mapNewsListPage(wire)
}

/** 뉴스 목록 — 무한 스크롤용 커서 기반 페이징. `data.pages.flatMap(p => p.items)`로 펼쳐 쓴다. */
export function useNewsQuery() {
  return useInfiniteQuery({
    queryKey: newsKeys.all(),
    queryFn: ({ pageParam }) => fetchNews(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    placeholderData: () => ({
      pages: [mapNewsListPage(getNews())],
      pageParams: [undefined],
    }),
  })
}
