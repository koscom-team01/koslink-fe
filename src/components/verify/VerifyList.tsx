import { useRef } from 'react'
import { useInfiniteScrollTrigger } from '#/shared/hooks/useInfiniteScrollTrigger'
import type { VerifyEntry } from '#/types/verify'
import { SECTORS } from '#/constants/verify/sectors'

export function hitCount(entry: VerifyEntry): number {
  return entry.items.filter((i) => i.hit).length
}

interface VerifyListProps {
  rows: VerifyEntry[]
  sector: string
  onSectorChange: (sector: string) => void
  selectedNewsId: string | null
  onSelect: (newsId: string) => void
  subtitle: string
  hasNextPage: boolean
  isFetchingNextPage: boolean
  fetchNextPage: () => void
}

/** 검증 목록 — 섹터 필터 + 커서 기반 무한 스크롤. 상세는 우측 고정. */
export default function VerifyList({
  rows,
  sector,
  onSectorChange,
  selectedNewsId,
  onSelect,
  subtitle,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: VerifyListProps) {
  const scrollRootRef = useRef<HTMLDivElement>(null)
  const sentinelRef = useInfiniteScrollTrigger(
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    scrollRootRef,
  )
  return (
    <div
      className="vlist flex flex-col overflow-hidden rounded-2xl border bg-white"
      style={{ borderColor: 'var(--n-150)', boxShadow: 'var(--shadow-md)' }}
    >
      <div
        className="border-b px-4 pt-[15px] pb-[11px]"
        style={{ borderColor: 'var(--n-150)' }}
      >
        <h2 className="text-[14.5px] font-bold tracking-[-0.025em]">
          검증 목록
        </h2>
        <p
          className="mt-[3px] text-xs font-medium"
          style={{ color: 'var(--n-500)' }}
        >
          {subtitle}
        </p>
      </div>
      <div className="flex flex-wrap gap-[5px] px-3.5 pt-[11px] pb-1">
        {SECTORS.map((s) => {
          const active = s === sector
          return (
            <button
              key={s}
              type="button"
              onClick={() => onSectorChange(s)}
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
      <div
        ref={scrollRootRef}
        className="flex flex-col gap-1 overflow-y-auto px-2.5 pt-1.5 pb-3"
      >
        {rows.length === 0 && (
          <div
            className="px-3.5 py-16 text-center"
            style={{ color: 'var(--n-500)' }}
          >
            <b
              className="mb-[7px] block text-[15px] font-bold"
              style={{ color: 'var(--n-600)' }}
            >
              검증 결과가 없습니다
            </b>
            <p className="text-[13px] leading-[1.6] font-medium">
              필터를 바꾸거나 전체 검증을 확인해 주세요
            </p>
          </div>
        )}
        {rows.map((v) => {
          const hits = hitCount(v)
          const pct = Math.round((hits / v.items.length) * 100)
          const selected = v.newsId === selectedNewsId
          return (
            <button
              key={v.newsId}
              type="button"
              onClick={() => onSelect(v.newsId)}
              className="flex w-full items-center gap-3 rounded-[11px] border px-3 py-3 text-left"
              style={{
                borderColor: selected ? 'var(--o-300)' : 'transparent',
                background: selected ? 'var(--o-50)' : undefined,
              }}
            >
              <span className="w-10 flex-none text-center">
                <b
                  className="block text-sm font-extrabold tracking-[-0.04em]"
                  style={{ color: 'var(--o-600)' }}
                >
                  {pct}%
                </b>
                <i
                  className="mt-[5px] block h-1 overflow-hidden rounded-full"
                  style={{ background: 'var(--n-150)' }}
                >
                  <span
                    className="block h-full rounded-full"
                    style={{ width: `${pct}%`, background: 'var(--o-500)' }}
                  />
                </i>
              </span>
              <span className="min-w-0 flex-1">
                <span className="line-clamp-2 block text-sm font-bold tracking-[-0.025em] leading-[1.4]">
                  {v.title}
                </span>
                <span
                  className="mt-[5px] flex items-center gap-1.5 text-[11.5px] font-medium"
                  style={{ color: 'var(--n-500)' }}
                >
                  <span
                    className="rounded-[5px] px-[7px] py-0.5 text-[11px] font-bold"
                    style={{
                      background: 'var(--n-100)',
                      color: 'var(--n-600)',
                    }}
                  >
                    {v.sector}
                  </span>
                  {v.date} · {v.items.length}종목
                </span>
              </span>
            </button>
          )
        })}
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
