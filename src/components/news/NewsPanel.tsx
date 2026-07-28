import { useEffect, useRef, useState } from 'react'
import { useIsFetching, useQueryClient } from '@tanstack/react-query'
import { useAtom, useSetAtom } from 'jotai'
import { RefreshCw } from 'lucide-react'
import { cn } from '#/lib/utils'
import { newlyAddedNewsIdsAtom, newsSheetOpenAtom } from '#/lib/atoms'
import { refreshNews } from '#/lib/api'
import { queryKeys } from '#/lib/queries'
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
  const isRefreshing = useIsFetching({ queryKey: queryKeys.news() }) > 0
  const [toastCount, setToastCount] = useState<number | null>(null)
  const toastTimerRef = useRef<number>()

  useEffect(() => () => window.clearTimeout(toastTimerRef.current), [])

  async function handleRefresh() {
    // mock 데이터 계층에서 데모용 새 뉴스 몇 건을 먼저 끼워 넣은 뒤, 목록 전체를
    // 첫 페이지부터 다시 불러온다 — 스크롤로 더 불러온 뒷페이지는 새로고침 시
    // 버리고 최신순 1페이지로 되돌아간다(실제 뉴스 피드 새로고침과 동일한 동작).
    const { addedIds } = refreshNews()
    await queryClient.resetQueries({ queryKey: queryKeys.news() })

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
