import { useEffect, useRef, useState } from 'react'
import { useIsFetching, useQueryClient } from '@tanstack/react-query'
import type { InfiniteData } from '@tanstack/react-query'
import { useAtom, useSetAtom } from 'jotai'
import { RefreshCw } from 'lucide-react'
import { cn } from '#/shared/utils/cn'
import { newsSheetOpenAtom } from '#/shared/store/atoms'
import { newlyAddedNewsIdsAtom } from '#/store/news/atoms'
import { refreshNews } from '#/apis/news/mock'
import { newsKeys } from '#/apis/news/queries'
import type { NewsListPage } from '#/types/news'
import NewsList from './NewsList'

const REFRESH_TOAST_MS = 4500

/**
 * 데스크탑 3분할에서는 일반 패널, ≤1080px에서는 CSS(.col-news)가 이 섹션을
 * 그대로 바텀시트로 바꾼다. MobileNewsBar의 "현재뉴스" 버튼이 newsSheetOpenAtom을
 * 켜면 이 컴포넌트에 .open이 붙는다.
 */
export default function NewsPanel() {
  const [sheetOpen, setSheetOpen] = useAtom(newsSheetOpenAtom)
  const setNewlyAdded = useSetAtom(newlyAddedNewsIdsAtom)
  const queryClient = useQueryClient()
  const isRefreshing = useIsFetching({ queryKey: newsKeys.all() }) > 0
  const [toastCount, setToastCount] = useState<number | null>(null)
  const toastTimerRef = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(toastTimerRef.current), [])

  function handleRefresh() {
    // mock 데이터 계층에서 데모용 새 뉴스 몇 건을 먼저 끼워 넣는다.
    const { addedIds, addedItems } = refreshNews()

    // 임시 처리(TODO): 새로고침 시 쿼리를 다시 받아오는 대신, 방금 받아온 항목을
    // 캐시 첫 페이지 맨 앞에 직접 끼워 넣는다 — 선택된 뉴스(selectedNewsIdAtom)는
    // 이 쿼리 캐시와 무관해 그대로 유지된다. 실 API 연동 시 아래처럼 재조회로
    // 되돌리면 된다.
    // await queryClient.resetQueries({ queryKey: newsKeys.all() })
    if (addedItems.length > 0) {
      queryClient.setQueryData<InfiniteData<NewsListPage, string | undefined>>(
        newsKeys.all(),
        (old) => {
          if (!old) return old
          const [firstPage, ...restPages] = old.pages
          return {
            ...old,
            pages: [
              { ...firstPage, items: [...addedItems, ...firstPage.items] },
              ...restPages,
            ],
          }
        },
      )
    }

    setNewlyAdded(addedIds)
    setToastCount(addedIds.length)
    window.clearTimeout(toastTimerRef.current)
    toastTimerRef.current = window.setTimeout(() => {
      setToastCount(null)
      setNewlyAdded([])
    }, REFRESH_TOAST_MS)
  }

  return (
    <section className={cn('panel col-news', sheetOpen && 'open')}>
      <div className="sheet-grab" />
      <div className="phead">
        <h2>최신 뉴스</h2>
        <p>뉴스를 선택하면 영향받는 종목이 나타납니다</p>
        <button
          type="button"
          className="phead-refresh"
          onClick={handleRefresh}
          disabled={isRefreshing}
          aria-label="최신 뉴스 새로고침"
        >
          <RefreshCw size={15} className={cn(isRefreshing && 'animate-spin')} />
        </button>
        <button
          type="button"
          className="sheet-x"
          onClick={() => setSheetOpen(false)}
          aria-label="뉴스 목록 닫기"
        >
          ×
        </button>
      </div>
      {toastCount !== null && (
        <div className="news-refresh-toast" role="status">
          {toastCount > 0
            ? `새 뉴스 ${toastCount}건이 도착했습니다`
            : '새 뉴스가 없습니다'}
        </div>
      )}
      <NewsList />
    </section>
  )
}
