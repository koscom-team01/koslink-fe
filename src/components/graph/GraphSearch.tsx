import { useMemo, useState } from 'react'
import type { KeyboardEvent } from 'react'
import type { GraphIndex } from '#/shared/utils/graphIndex'

const MAX_RESULTS = 8

interface GraphSearchProps {
  index: GraphIndex
  onSelect: (id: string) => void
}

/** 전체 관계망 전용 종목 검색 — 결과 선택은 해당 노드를 클릭한 것과 동일하게
 * onSelect(id)로 highlightedNodeAtom을 세팅해 그 자리 파급 강조를 켠다. */
export default function GraphSearch({ index, onSelect }: GraphSearchProps) {
  const [query, setQuery] = useState('')
  const nodes = useMemo(() => Array.from(index.byId.values()), [index])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return nodes
      .filter(
        (n) =>
          n.name.toLowerCase().includes(q) ||
          (n.ticker?.toLowerCase().includes(q) ?? false),
      )
      .slice(0, MAX_RESULTS)
  }, [nodes, query])

  function handleSelect(id: string) {
    onSelect(id)
    setQuery('')
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && results.length > 0) {
      handleSelect(results[0].id)
    } else if (e.key === 'Escape') {
      setQuery('')
    }
  }

  return (
    <div className="gsearch">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="종목 검색"
        className="gsearch-input"
        aria-label="종목 검색"
      />
      {results.length > 0 && (
        <ul className="gsearch-results">
          {results.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                // mousedown이 input의 blur보다 먼저 발생하게 해 목록이 닫히기 전에 선택을 확정한다
                onMouseDown={(e) => {
                  e.preventDefault()
                  handleSelect(n.id)
                }}
              >
                <span className="gsearch-name">{n.name}</span>
                {n.ticker && <span className="gsearch-ticker">{n.ticker}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
