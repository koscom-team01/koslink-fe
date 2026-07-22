import { useRef } from 'react'
import { useAtom, useSetAtom } from 'jotai'
import {
  newsSheetOpenAtom,
  sectorFilterAtom,
  selectedNewsIdAtom,
} from '#/lib/atoms'
import { useNewsQuery } from '#/lib/queries'
import { useInfiniteScrollTrigger } from '#/lib/useInfiniteScrollTrigger'
import NewsCard from './NewsCard'

const SECTORS = ['전체', '반도체', '2차전지', '방산']

/** 섹터 칩 필터 + 뉴스 카드 목록. 데스크탑 패널과 모바일 바텀시트에서 함께 쓴다. */
export default function NewsList() {
  const [sector, setSector] = useAtom(sectorFilterAtom)
  const [selectedId, setSelectedId] = useAtom(selectedNewsIdAtom)
  const setSheetOpen = useSetAtom(newsSheetOpenAtom)

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useNewsQuery(sector)
  const news = data?.pages.flatMap((p) => p.items) ?? []
  const scrollRootRef = useRef<HTMLDivElement>(null)
  const sentinelRef = useInfiniteScrollTrigger(
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    scrollRootRef,
  )

  return (
    <>
      <div className="flex flex-wrap gap-1.5 px-3.5 pt-3 pb-1">
        {SECTORS.map((s) => {
          const active = s === sector
          return (
            <button
              key={s}
              type="button"
              onClick={() => setSector(s)}
              className="rounded-full px-[11px] py-[5px] text-[12.5px] font-semibold"
              style={{
                color: active ? '#fff' : 'var(--n-600)',
                background: active ? 'var(--n-900)' : 'var(--n-100)',
              }}
            >
              {s}
            </button>
          )
        })}
      </div>
      <div className="pbody" ref={scrollRootRef}>
        <div className="flex flex-col gap-1.5 px-3 pt-2 pb-4">
          {news.length === 0 && (
            <p
              className="px-2 py-8 text-center text-sm"
              style={{ color: 'var(--n-500)' }}
            >
              해당 섹터의 뉴스가 없습니다
            </p>
          )}
          {news.map((n) => (
            <NewsCard
              key={n.id}
              news={n}
              selected={n.id === selectedId}
              onSelect={() => {
                setSelectedId(n.id)
                setSheetOpen(false)
              }}
            />
          ))}
          {hasNextPage && (
            <div
              ref={sentinelRef}
              className="py-3 text-center text-xs"
              style={{ color: 'var(--n-400)' }}
            >
              {isFetchingNextPage ? '더 불러오는 중…' : ''}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
