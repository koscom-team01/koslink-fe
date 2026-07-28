import { useRef } from 'react'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import {
  newlyAddedNewsIdsAtom,
  newsSheetOpenAtom,
  selectedNewsIdAtom,
} from '#/lib/atoms'
import { useNewsQuery } from '#/lib/queries'
import { useInfiniteScrollTrigger } from '#/lib/useInfiniteScrollTrigger'
import NewsCard from './NewsCard'

/** 뉴스 카드 목록. 데스크탑 패널과 모바일 바텀시트에서 함께 쓴다. */
export default function NewsList() {
  const [selectedId, setSelectedId] = useAtom(selectedNewsIdAtom)
  const setSheetOpen = useSetAtom(newsSheetOpenAtom)
  const newlyAdded = useAtomValue(newlyAddedNewsIdsAtom)

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useNewsQuery()
  const news = data?.pages.flatMap((p) => p.items) ?? []
  const scrollRootRef = useRef<HTMLDivElement>(null)
  const sentinelRef = useInfiniteScrollTrigger(
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    scrollRootRef,
  )

  return (
    <div className="pbody" ref={scrollRootRef}>
      <div className="flex flex-col gap-1.5 px-3 pt-2 pb-4">
        {news.length === 0 && (
          <p
            className="px-2 py-8 text-center text-sm font-medium"
            style={{ color: 'var(--n-600)' }}
          >
            뉴스가 없습니다
          </p>
        )}
        {news.map((n) => (
          <NewsCard
            key={n.id}
            news={n}
            selected={n.id === selectedId}
            isNew={newlyAdded.includes(n.id)}
            onSelect={() => {
              setSelectedId(n.id)
              setSheetOpen(false)
            }}
          />
        ))}
        {hasNextPage && (
          <div
            ref={sentinelRef}
            className="py-3 text-center text-xs font-medium"
            style={{ color: 'var(--n-500)' }}
          >
            {isFetchingNextPage ? '더 불러오는 중…' : ''}
          </div>
        )}
      </div>
    </div>
  )
}
