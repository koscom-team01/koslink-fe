import { useAtom } from 'jotai'
import { cn } from '#/lib/utils'
import { newsSheetOpenAtom } from '#/lib/atoms'
import NewsList from './NewsList'

/**
 * 데스크탑 3분할에서는 일반 패널, ≤1080px에서는 CSS(.col-news)가 이 섹션을
 * 그대로 바텀시트로 바꾼다. MobileNewsBar의 "현재뉴스" 버튼이 newsSheetOpenAtom을
 * 켜면 이 컴포넌트에 .open이 붙는다.
 */
export default function NewsPanel() {
  const [sheetOpen, setSheetOpen] = useAtom(newsSheetOpenAtom)

  return (
    <section className={cn('panel col-news', sheetOpen && 'open')}>
      <div className="sheet-grab" />
      <div className="phead">
        <h2>최신 뉴스</h2>
        <p>뉴스를 선택하면 영향받는 종목이 나타납니다</p>
        <button
          type="button"
          className="sheet-x"
          onClick={() => setSheetOpen(false)}
          aria-label="뉴스 목록 닫기"
        >
          ×
        </button>
      </div>
      <NewsList />
    </section>
  )
}
