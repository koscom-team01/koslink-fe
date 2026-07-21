import { useAtom, useAtomValue } from 'jotai'
import { cn } from '#/lib/utils'
import {
  newsSheetOpenAtom,
  sectorFilterAtom,
  selectedNewsIdAtom,
} from '#/lib/atoms'
import { useNewsQuery } from '#/lib/queries'

/** ≤1080px에서만 보이는 상단 현재뉴스 바 + 바텀시트 배경 스크림. CSS가 그 이상 폭에서는 숨긴다. */
export default function MobileNewsBar() {
  const sector = useAtomValue(sectorFilterAtom)
  const [selectedId, setSelectedId] = useAtom(selectedNewsIdAtom)
  const [sheetOpen, setSheetOpen] = useAtom(newsSheetOpenAtom)

  const { data: list = [] } = useNewsQuery(sector)
  const index = list.findIndex((n) => n.id === selectedId)
  const current = index >= 0 ? list[index] : null

  function step(delta: number) {
    const next = index + delta
    if (next < 0 || next >= list.length) return
    setSelectedId(list[next].id)
  }

  return (
    <>
      <div className="newsbar">
        <button
          type="button"
          className="nb-nav"
          disabled={index <= 0}
          onClick={() => step(-1)}
          aria-label="이전 뉴스"
        >
          ‹
        </button>
        <button
          type="button"
          className="nb-cur"
          onClick={() => setSheetOpen(true)}
        >
          <span className="mb-[5px] flex items-center gap-[7px]">
            <span
              className="rounded-[5px] px-[7px] py-0.5 text-[11px] font-bold"
              style={{ background: 'var(--n-100)', color: 'var(--n-600)' }}
            >
              {current?.sector ?? '전체'}
            </span>
            <span
              className="text-[11.5px] font-bold after:ml-0.5 after:content-['▾']"
              style={{ color: 'var(--n-500)' }}
            >
              {index >= 0 ? index + 1 : 0} / {list.length}
            </span>
          </span>
          <span className="line-clamp-1 block text-sm font-bold tracking-[-0.028em]">
            {current?.title ?? '뉴스를 선택해 주세요'}
          </span>
        </button>
        <button
          type="button"
          className="nb-nav"
          disabled={index < 0 || index >= list.length - 1}
          onClick={() => step(1)}
          aria-label="다음 뉴스"
        >
          ›
        </button>
      </div>
      <div
        className={cn('nscrim', sheetOpen && 'on')}
        onClick={() => setSheetOpen(false)}
      />
    </>
  )
}
