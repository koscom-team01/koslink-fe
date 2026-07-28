export interface NewsListItem {
  id: number
  title: string
  press: string
  publishedAt: string // ISO
}

/** GET /api/news의 커서 기반 페이지 응답. cursor는 클라이언트가 해석하지 않는 opaque 값이다. */
export interface NewsListPage {
  items: NewsListItem[]
  nextCursor: string | null
}
