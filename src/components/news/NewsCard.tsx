import type { MouseEvent } from 'react'
import { useAtom } from 'jotai'
import { cn } from '#/lib/utils'
import { formatRelativeTime } from '#/lib/format'
import { scrappedNewsIdsAtom } from '#/lib/atoms'
import type { NewsListItem } from '#/types'

interface NewsCardProps {
  news: NewsListItem
  selected: boolean
  onSelect: () => void
}

export default function NewsCard({ news, selected, onSelect }: NewsCardProps) {
  const [scrapped, setScrapped] = useAtom(scrappedNewsIdsAtom)
  const isScrapped = scrapped.includes(news.id)

  function toggleScrap(e: MouseEvent) {
    e.stopPropagation()
    setScrapped(
      isScrapped
        ? scrapped.filter((id) => id !== news.id)
        : [...scrapped, news.id],
    )
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onSelect()
      }}
      className={cn(
        'relative w-full cursor-pointer rounded-[11px] border px-3.5 py-[13px] text-left transition-colors',
        selected
          ? 'border-[var(--o-300)] bg-[var(--o-50)]'
          : 'border-transparent hover:bg-[var(--n-50)]',
      )}
    >
      {selected && (
        <span
          className="absolute top-[13px] bottom-[13px] left-0 w-[3px] rounded-r-[3px]"
          style={{ background: 'var(--o-500)' }}
        />
      )}
      <button
        type="button"
        onClick={toggleScrap}
        aria-label={isScrapped ? '스크랩 해제' : '스크랩'}
        aria-pressed={isScrapped}
        className="absolute top-2.5 right-2.5 text-xs font-bold"
        style={{ color: isScrapped ? 'var(--n-900)' : 'var(--n-300)' }}
      >
        {isScrapped ? '★' : '☆'}
      </button>
      <div className="line-clamp-2 pr-5 text-sm font-semibold leading-[1.45] tracking-[-0.022em]">
        {news.title}
      </div>
      <div className="mt-[7px] text-xs" style={{ color: 'var(--n-500)' }}>
        <b className="font-medium" style={{ color: 'var(--n-600)' }}>
          {news.press}
        </b>{' '}
        · {formatRelativeTime(news.publishedAt)}
      </div>
    </div>
  )
}
