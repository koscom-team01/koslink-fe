import { useState } from 'react'
import { useAtom, useSetAtom } from 'jotai'
import { scrappedNewsIdsAtom, selectedNewsIdAtom, viewAtom } from '#/lib/atoms'
import { useNewsQuery } from '#/lib/queries'
import { formatRelativeTime } from '#/lib/format'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '#/components/ui/sheet'
import ScrapFab from './ScrapFab'

/** 스크랩(저장)한 뉴스 목록 — 세션 메모리(scrappedNewsIdsAtom)에 담긴 id만 보여준다. */
export default function ScrapSheet() {
  const [scrapped, setScrapped] = useAtom(scrappedNewsIdsAtom)
  const setSelectedNewsId = useSetAtom(selectedNewsIdAtom)
  const setView = useSetAtom(viewAtom)
  const [open, setOpen] = useState(false)

  const { data } = useNewsQuery()
  const allNews = data?.pages.flatMap((p) => p.items) ?? []
  const scrappedNews = allNews.filter((n) => scrapped.includes(n.id))

  function removeScrap(id: number) {
    setScrapped(scrapped.filter((s) => s !== id))
  }

  function goToNews(id: number) {
    setOpen(false)
    setView('map')
    setSelectedNewsId(id)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <ScrapFab count={scrapped.length} />
      </SheetTrigger>
      <SheetContent className="w-[424px] gap-0 p-0 sm:max-w-[424px]">
        <SheetHeader
          className="border-b px-[22px] pt-5 pb-4"
          style={{ borderColor: 'var(--n-150)' }}
        >
          <SheetTitle className="text-[17px] font-extrabold tracking-[-0.035em]">
            스크랩
          </SheetTitle>
          <SheetDescription
            className="text-[12.5px] leading-[1.55] font-medium"
            style={{ color: 'var(--n-500)' }}
          >
            저장한 뉴스를 모아봅니다. 새로고침하면 사라집니다.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-[22px] py-[18px]">
          {scrappedNews.length === 0 ? (
            <div
              className="rounded-[10px] px-3 py-2.5 text-xs font-medium"
              style={{ background: 'var(--n-50)', color: 'var(--n-600)' }}
            >
              뉴스 카드의 ☆ 아이콘을 눌러 스크랩해 보세요.
            </div>
          ) : (
            scrappedNews.map((n) => (
              <div
                key={n.id}
                className="mb-2 rounded-xl border p-3.5"
                style={{ borderColor: 'var(--n-150)' }}
              >
                <p
                  className="text-[12.5px] leading-[1.5] font-bold"
                  style={{ color: 'var(--n-900)' }}
                >
                  {n.title}
                </p>
                <p
                  className="mt-1.5 text-[11.5px] font-medium"
                  style={{ color: 'var(--n-500)' }}
                >
                  {n.press} · {formatRelativeTime(n.publishedAt)}
                </p>
                <div className="mt-[11px] flex gap-2">
                  <button
                    type="button"
                    onClick={() => goToNews(n.id)}
                    className="flex-1 rounded-[9px] border py-2.5 text-[12.5px] font-bold"
                    style={{
                      borderColor: 'var(--n-200)',
                      color: 'var(--n-600)',
                    }}
                  >
                    이 뉴스의 파급 경로 보기 →
                  </button>
                  <button
                    type="button"
                    onClick={() => removeScrap(n.id)}
                    aria-label="스크랩 해제"
                    className="rounded-[9px] border px-3 text-[12.5px] font-bold"
                    style={{
                      borderColor: 'var(--n-200)',
                      color: 'var(--o-600)',
                    }}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
