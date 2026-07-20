import { cn } from '#/lib/utils'
import { formatRelativeTime } from '#/lib/format'
import type { NewsListItem } from '#/types'

interface NewsCardProps {
  news: NewsListItem
  selected: boolean
  onSelect: () => void
}

export default function NewsCard({ news, selected, onSelect }: NewsCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'relative w-full rounded-[11px] border px-3.5 py-[13px] text-left transition-colors',
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
      <div className="mb-1.5 flex items-center gap-1">
        <span
          className={cn(
            'rounded-[5px] px-[7px] py-0.5 text-[11px] font-bold',
            selected
              ? 'bg-[var(--o-100)] text-[var(--o-700)]'
              : 'bg-[var(--n-100)] text-[var(--n-600)]',
          )}
        >
          {news.sector}
        </span>
      </div>
      <div className="line-clamp-2 text-sm font-semibold leading-[1.45] tracking-[-0.022em]">
        {news.title}
      </div>
      <div className="mt-[7px] text-xs" style={{ color: 'var(--n-500)' }}>
        <b className="font-medium" style={{ color: 'var(--n-600)' }}>
          {news.press}
        </b>{' '}
        · {news.relativeTime ?? formatRelativeTime(news.publishedAt)}
      </div>
    </button>
  )
}
