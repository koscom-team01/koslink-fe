export default function NewsPanel() {
  return (
    <section className="panel col-news">
      <div className="phead">
        <h2>최신 뉴스</h2>
        <p>뉴스를 선택하면 영향받는 종목이 나타납니다</p>
      </div>
      <div
        className="pbody flex items-center justify-center text-sm"
        style={{ color: 'var(--n-500)' }}
      >
        뉴스 목록 준비 중…
      </div>
    </section>
  )
}
