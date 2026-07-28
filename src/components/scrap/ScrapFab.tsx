import type { ComponentProps } from 'react'

interface ScrapFabProps extends ComponentProps<'button'> {
  count: number
}

/** 우하단 고정 FAB — 스크랩한 뉴스 건수를 배지로 보여준다 */
export default function ScrapFab({ count, className, ...rest }: ScrapFabProps) {
  return (
    <button
      type="button"
      className={`fixed right-6 bottom-6 z-40 flex items-center gap-2.5 rounded-full px-5 py-3.5 text-sm font-bold text-white ${className ?? ''}`}
      style={{ background: 'var(--n-900)', boxShadow: 'var(--shadow-lg)' }}
      {...rest}
    >
      스크랩
      {count > 0 && (
        <span
          className="rounded-full px-2 py-0.5 text-xs font-extrabold"
          style={{ background: 'var(--o-500)' }}
        >
          {count}
        </span>
      )}
    </button>
  )
}
