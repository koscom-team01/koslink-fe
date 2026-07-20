export default function GraphPanel() {
  return (
    <section className="panel col-graph">
      <div className="phead">
        <h2>관계 그래프</h2>
        <p>뉴스를 선택하면 파급 경로가 나타납니다</p>
      </div>
      <div
        className="pbody flex items-center justify-center text-sm"
        style={{ color: 'var(--n-500)' }}
      >
        그래프 준비 중…
      </div>
    </section>
  )
}
