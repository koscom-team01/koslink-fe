import { NEWS_RECORDS, pullRefreshBatch } from '#/mocks/news/data'
import type { NewsListPageWire } from './mappers'
import { paginate } from '#/shared/apis/paginate'

/**
 * `docs/KOSLINK_API.md` §1 GET /news 명세와 같은 시그니처를 갖는 헬퍼 모음.
 * 지금은 백엔드가 없어 mocks/news/data.ts를 동기적으로 가공해 반환한다. 반환 모양은
 * 실 백엔드가 내려줄 wire 그대로다(이 엔드포인트는 wire도 camelCase) — mocks/news/handlers.ts가
 * 이 함수들을 그대로 HttpResponse.json()으로 흘려보내고, apis/news/queries.ts가
 * apis/news/mappers.ts를 거쳐 도메인 타입으로 바꾼다. 실 API가 준비되면 이 함수들의
 * 본문만 fetch 호출로 바꾸면 되고, 매퍼·호출부는 그대로 둘 수 있다.
 */

export interface GetNewsParams {
  /** 이전 응답의 lastCursorId. 첫 페이지는 생략한다. */
  cursorId?: number
  size?: number
}

const DEFAULT_NEWS_SIZE = 20

export function getNews({
  cursorId,
  size = DEFAULT_NEWS_SIZE,
}: GetNewsParams = {}): NewsListPageWire {
  const { page, nextCursor } = paginate(
    NEWS_RECORDS,
    cursorId != null ? String(cursorId) : undefined,
    size,
    (n) => String(n.id),
  )

  return {
    news: page.map((n) => ({
      newsId: n.id,
      title: n.title,
      press: n.press,
      publishedAt: n.publishedAt,
      url: n.url,
    })),
    hasNext: nextCursor !== null,
    lastCursorId: page.at(-1)?.id ?? null,
  }
}

/**
 * "최신 뉴스 새로고침" 데모용 — 실 백엔드가 없어 pullRefreshBatch()로 몇 건을
 * 새 뉴스로 뽑아 NEWS_RECORDS 맨 앞에 끼워 넣고, 그 id 목록을 돌려준다.
 * 호출부(NewsPanel)는 이 id로 새로 추가된 카드에 NEW 배지를 붙이고 몇 건이
 * 들어왔는지 안내한다.
 */
export function refreshNews(): { addedIds: number[] } {
  const added = pullRefreshBatch()
  return { addedIds: added.map((n) => n.id) }
}
