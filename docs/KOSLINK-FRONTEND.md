# KOSLINK — 프론트엔드 개발 가이드

뉴스 한 건이 어떤 종목까지 영향을 미치는지 온톨로지 그래프로 보여주는 데스크탑 웹 서비스.
코스콤 해커톤 2일 프로젝트.

---

## 1. 핵심 전제

| 항목            | 내용                                                                                     |
| --------------- | ---------------------------------------------------------------------------------------- |
| 인증            | **없음.** 로그인, 회원가입, 마이페이지 구현 안 함                                        |
| 데이터          | 뉴스, 그래프, 분석, 검증 **전부 서버 API에서 조회**                                      |
| 클라이언트 저장 | 없음. localStorage 등 영속 저장 사용 안 함                                               |
| 스크랩          | 저장한 뉴스 id만 **세션 메모리(Jotai)** 에 유지. 서버 API 없음. 새로고침하면 사라짐      |
| 플랫폼          | 데스크탑 웹 우선, 태블릿·모바일 반응형 대응                                              |
| 페이지          | SPA 단일 페이지. 라우터 없이 탭 전환                                                     |
| 언어            | 한국어 전용                                                                              |

---

## 2. 기술 스택

```
React 18 + TypeScript + Vite
@xyflow/react (v12)        그래프
Tailwind CSS + shadcn/ui   tabs, badge, sheet, tooltip, command, scroll-area, separator
Jotai                      UI 상태 + 스크랩 메모리
TanStack Query             서버 상태 캐싱
```

```bash
npm i @xyflow/react jotai @tanstack/react-query
npx shadcn@latest add tabs badge sheet tooltip command scroll-area separator
```

```tsx
import '@xyflow/react/dist/style.css' // 필수. 빠뜨리면 노드가 겹쳐 보임
```

---

## 3. 화면 구성

### SC-01 뉴스맵 (메인)

3분할 그리드 `312px | 1fr | 384px`

```
┌─ GNB ───────────────────────────────────────────────┐
│ KOSLINK   [뉴스맵] [예측 검증]                        │
├──────────┬──────────────────────┬───────────────────┤
│ A 뉴스    │ B 관계 그래프          │ C 영향 분석        │
│          │ [파급경로|전체관계망]   │                   │
│ 뉴스카드  │                      │ 기사 요약 3줄      │
│ 뉴스카드  │   ○ ─── ○            │ 원문 링크          │
│ 뉴스카드  │   │                   │ ─────────────    │
│          │   ○     ○            │ 영향 기점 카드     │
│          │                      │ 관련주 리스트      │
│          │ 범례                  │ 최종 요약          │
└──────────┴──────────────────────┴───────────────────┘
                                    [스크랩] ← FAB
```

### SC-02 예측 검증

```
┌─ 컨텍스트 배너 (뉴스에서 진입했을 때만) ────────────────┐
├─ 요약 카드 ─────────────────────────────────────────┤
│  지표 3개 (300px)  │  30일 적중률 추이 차트           │
├─────────────────────────────────────────────────────┤
│ 검증 목록 (392px)   │  선택한 뉴스 상세                │
│  섹터 필터          │   제목, 적중률 도넛              │
│  뉴스 행 (스크롤)    │   종목별 예측 vs 실제 표         │
└─────────────────────────────────────────────────────┘
```

페이지 번호 UI 없음. 목록은 커서 기반 무한 스크롤(뉴스 목록과 동일한 방식), 상세는 우측 고정.

### SC-03 스크랩

우측 슬라이드 시트 424px. shadcn `Sheet`.
뉴스 카드의 ☆ 토글로 저장 → 시트에서 목록 확인 → 클릭 시 해당 뉴스로 이동. 서버 API 없이
프론트엔드 세션 메모리(Jotai `scrappedNewsIdsAtom`)에만 저장한다. 닫아도 상태 유지,
FAB에 저장 건수 배지. 새로고침하면 사라진다(§1 원칙과 동일).

### 반응형

| 폭        | 처리                                                                               |
| --------- | ---------------------------------------------------------------------------------- |
| 1281px+   | 3분할                                                                              |
| 1081~1280 | 폭만 축소                                                                          |
| ~1080     | 뉴스 리스트를 **상단 현재뉴스 바 + 바텀시트**로 전환. 좌우 화살표로 이전/다음 이동 |
| ~820      | 1열 스택                                                                           |

모바일에서 뉴스 리스트를 가로 스크롤로 만들지 말 것.

---

## 4. 데이터 모델

실제 온톨로지(Neo4j)는 Stock/Role/Theme 3계층 + BELONGS_TO/SUPPLY_TO/RELATED_TO
관계로 이뤄져 있다. 프론트는 이 중 렌더링에 실제로 쓰는 최소 필드만 받는다 —
거래 가능 여부(STOCK/CONCEPT), 화면에 표시할 관계 레이블, 경쟁 관계 여부뿐이다.
좌표는 절대 내려주지 않는다. hop 레벨 기반 배치는 항상 프론트가 계산한다
(`lib/graphIndex.ts`의 `bfsBuild`, `lib/layout.ts`의 `radialLayout`).

```ts
type NodeKind = 'STOCK' | 'CONCEPT' // Role/Theme는 CONCEPT로 통칭 — 프론트는 거래 가능 여부만 구분하면 된다

interface OntologyNode {
  id: string // 'sk'
  name: string // 'SK하이닉스'
  kind: NodeKind
  ticker?: string // STOCK만
  sector: string // '반도체' | '2차전지' | '방산'
  marketCap?: number // 억원, STOCK만
}

// 실제 RELATED_TO.relation_type 중 일부. STOCK-STOCK 엣지에만 존재한다.
type RelationType =
  | 'EQUITY_INVESTMENT'
  | 'AFFILIATE'
  | 'LICENSING'
  | 'COMPETITOR'
  | 'MNA'
  | 'OTHER'

interface OntologyEdge {
  id: string
  source: string
  target: string
  relation: string // 화면에 보여줄 관계 레이블 — '장비 공급', '경쟁', '양극재 조달'
  relationType?: RelationType // SUPPLY_TO·BELONGS_TO 등은 생략(= 항상 동조)
}
```

`relationType === 'COMPETITOR'`가 핵심이다. 같은 뉴스에서 상승주와 하락주가
동시에 나오는 근거이며, 프론트는 이 값으로 극성(동조/반대)을 계산한다 —
`polarity`라는 별도 필드를 서버에 요청하지 않는다(`lib/graphIndex.ts`의
`polarityOf`).

---

## 5. API 명세

베이스 `/api`. 인증 헤더 없음. 전부 TanStack Query로 감싼다. wire 응답은 아래처럼
snake_case다 — `lib/mappers.ts`가 이를 camelCase 도메인 타입으로 변환한 뒤
컴포넌트에 넘긴다(그래프 노드/엣지만 예외로, 명세 그대로 camelCase다).

### 5.1 뉴스 목록 (커서 기반 페이징 · 무한 스크롤)

```
GET /api/news?limit=20&cursor=10020
```

```jsonc
{
  "items": [
    {
      "news_id": 10001,
      "title": "SK하이닉스, HBM4 양산 위해 청주 M15X 증설 확정",
      "press": "연합뉴스",
      "published_at": "2026-07-18T09:12:00+09:00",
    },
  ],
  "nextCursor": "10001", // 다음 페이지 요청 시 그대로 실어 보낸다. 마지막 페이지면 null
}
```

**설계 노트**

- `status='done'`(AI 분석 완료) 필터는 서버가 항상 고정 적용 — 클라이언트가 신경 쓸
  파라미터가 아니므로 쿼리에 노출하지 않는다
- `category`/`sector` 필드·파라미터 없음 — 지금은 반도체 스코프만 다루므로 제외한다.
  섹터 구분은 온톨로지 그래프(§5.3)에는 여전히 존재한다
- `cursor`는 클라이언트가 값을 해석하지 않는 opaque 문자열이다 — 이전 응답의
  `nextCursor`를 다음 요청의 `cursor`에 그대로 담아 보낸다. 첫 요청은 `cursor`를 생략한다
- 리스트 카드는 가볍게 유지 — 요약, 관련종목 등은 클릭 시 §5.2로 별도 조회한다
- 프론트는 `useInfiniteQuery`로 페이지를 쌓고, 목록 하단 sentinel이 뷰포트에
  들어오면 다음 페이지를 요청한다(`lib/queries.ts`의 `useNewsQuery`)

### 5.2 뉴스 영향 분석 — 화면의 핵심

기존에는 분석과 파급 경로 그래프가 별도 엔드포인트였으나, 같은 화면 전환에서
동시에 필요한 데이터라 하나로 합쳤다.

```
GET /api/news/{news_id}/impact
```

```jsonc
{
  "news_summary": ["요약 1", "요약 2", "요약 3"],
  "source": {
    "press": "연합뉴스",
    "published_at": "2026-07-18T09:12:00+09:00",
    "url": "https://www.yna.co.kr/...",
  },
  "origin_stocks": [
    {
      "ticker": "000660",
      "name": "SK하이닉스",
      "status": "up",
      "reason": "HBM4 증설 발표로 생산능력이 직접 확대되는 당사자",
    },
  ],
  "related_stocks": [
    {
      "ticker": "042700",
      "name": "한미반도체",
      "status": "up",
      "relation_label": "장비 공급",
      "relation_path": "SK하이닉스 → 한미반도체",
      "propagation": "SK하이닉스과(와) 장비 공급 관계인 한미반도체에는 상승 요인으로 작용한다.",
    },
    {
      "ticker": "005930",
      "name": "삼성전자",
      "status": "down",
      "relation_label": "경쟁",
      "relation_path": "SK하이닉스 → 삼성전자",
      "propagation": "SK하이닉스과(와) 경쟁 관계인 삼성전자에는 하락 요인으로 작용한다.",
    },
  ],
  "final_summary": "SK하이닉스 관련 이슈로 관련 종목 4개까지 영향이 파급됐다.",
  "graph": {
    "newsId": 10001,
    "originId": "sk",
    "nodes": [
      { "id": "sk", "name": "SK하이닉스", "kind": "STOCK", "ticker": "000660", "sector": "반도체", "marketCap": 1200000, "direction": "UP" },
      { "id": "hanmi", "name": "한미반도체", "kind": "STOCK", "ticker": "042700", "sector": "반도체", "marketCap": 120000, "direction": "UP" },
    ],
    "edges": [
      { "id": "e2", "source": "sk", "target": "hanmi", "relation": "장비 공급" },
    ],
  },
}
```

**필드 설명**

| 필드 | 설명 |
| --- | --- |
| `news_summary` | 기사 요약 3줄, 문자열 배열 |
| `source` | 언론사·발행시각·원문 URL (뉴스 하나당 1개) |
| `origin_stocks` | 뉴스에 직접 언급된 당사자 종목. 배열 — 뉴스 하나가 여러 종목을 동시에 언급하는 경우도 대응한다 |
| `related_stocks` | 온톨로지로 파생된 관련 종목. 종목별로 관계 레이블·경로 문자열·판단 근거(`propagation`)를 갖는다 |
| `final_summary` | 패널 하단에 한 번만 표시하는 최종 요약 한 줄 |
| `graph` | 이 뉴스의 파급 경로 서브그래프. 좌표는 없다 — §6 참고 |

**설계 결정 로그**

- `origin_stocks`를 단일 객체가 아닌 배열로 설계했다
- "판단 근거"는 뉴스 전체 통짜 텍스트가 아니라 종목별로 분산했다(`origin_stocks[].reason`,
  `related_stocks[].propagation`) — UI는 "종목 카드 클릭 시 그 종목의 근거 표시"로 동작한다
  (`RelatedList`의 펼치기 인터랙션)
- `affected_count`(영향 종목 개수)는 없다 — `related_stocks.length + origin_stocks.length`로
  프론트에서 바로 계산 가능한 파생값이라 서버가 별도로 내려줄 필요가 없다
- `related_stocks[].propagation`은 서버가 그래프 경로(관계 레이블 + 방향)에서 템플릿
  생성한다 — 목데이터에서는 `lib/api.ts`의 `buildPropagation()`이 이 역할을 한다
- `confidence` 같은 확률값은 받지도, 표시하지도 않는다

### 5.3 전체 그래프

```
GET /api/graph?mode=full
→ { "nodes": OntologyNode[], "edges": OntologyEdge[] }
```

뉴스에 종속되지 않는 온톨로지 전체 뷰라 `newsId`/`originId`가 없다. 그 외
`nodes`/`edges` 스키마는 §5.2의 `graph` 필드와 동일하며, camelCase 그대로 온다
(매핑 불필요).

### 5.4 스크랩 (서버 API 없음)

관심종목 브리핑(티커 역조회) 기능은 없앴다. 대신 뉴스 카드에서 바로 저장/해제하는
단순 스크랩으로 바꿨다 — 서버 호출이 전혀 없고 프론트엔드 세션 메모리
(`lib/atoms.ts`의 `scrappedNewsIdsAtom: number[]`)에만 저장된다. 새로고침하면
사라진다(§1 원칙과 동일). 이미 로드된 뉴스 목록 캐시(`useNewsQuery`)에서 저장된
id만 걸러 시트에 보여준다.

### 5.5 예측 검증 (news는 커서 기반 페이징)

```
GET /api/verify?days=30&sector=반도체&cursor=v10&limit=10
```

```jsonc
{
  "daily": [{ "date": "2026-07-17", "hitRate": 0.71 }], // 섹터/페이지와 무관한 전체 추이, 페이징하지 않음
  "news": [
    {
      "newsId": "v1",
      "date": "07-17",
      "sector": "반도체",
      "title": "SK하이닉스, 엔비디아향 HBM 공급 계약 확대",
      "items": [
        {
          "name": "한미반도체",
          "predicted": "UP",
          "actualReturn": 3.42,
          "hit": true,
          "pathLabel": "장비 공급 · 1단계",
        },
      ],
    },
  ],
  "nextCursor": "v10", // §5.1과 동일한 opaque 커서 관례. 마지막 페이지면 null
}
```

`daily`(적중률 추이 차트)는 사전 배치로 계산된 정적 결과이며 페이징 대상이
아니다. `news`(검증 목록)만 §5.1과 동일한 커서 페이징을 적용해 무한
스크롤로 받는다. 프론트는 읽기만 한다.

---

## 6. 그래프 — @xyflow/react

React Flow에는 **레이아웃 엔진이 없다.** 좌표는 우리가 계산해서 `position`으로 넣는다.
dagre나 elkjs를 붙일 필요 없다. 방사형과 클러스터 배치는 단순 삼각함수로 결정론적으로 계산한다.

### 6.1 기본 세팅

```tsx
// nodeTypes / edgeTypes는 반드시 컴포넌트 바깥에 선언한다.
// 안에 두면 매 렌더마다 새 객체가 되어 그래프 전체가 리마운트된다. (가장 흔한 실수)
const nodeTypes = { stock: StockNode }
const edgeTypes = { rel: RelEdge }

;<ReactFlowProvider>
  {' '}
  {/* useInternalNode 사용에 필수 */}
  <ReactFlow
    nodes={nodes}
    edges={edges}
    nodeTypes={nodeTypes}
    edgeTypes={edgeTypes}
    onNodeClick={handleNodeClick}
    onNodeMouseEnter={handleEnter}
    onNodeMouseLeave={handleLeave}
    nodesConnectable={false}
    elementsSelectable={false}
    fitView
    fitViewOptions={{ padding: 0.2 }}
    minZoom={0.2}
    maxZoom={2}
  >
    <Background
      variant={BackgroundVariant.Dots}
      gap={22}
      size={1.2}
      color="#E3E0DC"
    />
    <Controls showInteractive={false} position="top-right" />
  </ReactFlow>
</ReactFlowProvider>
```

`proOptions.hideAttribution`은 유료 라이선스 기능이다. 어트리뷰션은 그대로 둔다.

### 6.2 커스텀 노드

```tsx
type StockNodeData = {
  label: string
  ticker?: string
  abstract: boolean // THEME·PRODUCT·MATERIAL
  tier?: 't1' | 't2' | 't3' // 전체 관계망 위계
  state:
    | 'hidden'
    | 'idle'
    | 'dim'
    | 'via'
    | 'via2'
    | 'up'
    | 'down'
    | 'up2'
    | 'down2'
    | 'origin'
  isMain?: boolean
  badge?: 'UP' | 'DOWN'
  pulse?: boolean
}

function StockNode({ data }: NodeProps<StockNodeData>) {
  return (
    <div
      className={cn(
        'nd',
        data.abstract && 'abs',
        data.tier,
        `nd-${data.state}`,
        data.isMain && 'main',
        data.pulse && 'pulse',
      )}
    >
      <Handle type="target" position={Position.Top} isConnectable={false} />
      {data.badge && (
        <span className={cn('nbadge', data.badge.toLowerCase())}>
          {data.badge === 'UP' ? '▲' : '▼'}
        </span>
      )}
      <div className="nd-name">{data.label}</div>
      {data.ticker && <div className="nd-tk">{data.ticker}</div>}
      <Handle type="source" position={Position.Bottom} isConnectable={false} />
    </div>
  )
}
```

Handle은 숨기되 반드시 넣는다. 없으면 React Flow가 엣지 연결 경고를 낸다.

### 6.3 플로팅 엣지 — 반드시 커스텀으로 구현

기본 엣지는 Handle 위치에 고정된다. 방사형 배치에서는 선이 카드 옆구리에 어긋나 붙는다.
두 카드의 **사각형 테두리 교점**을 계산하는 엣지를 만든다.

```tsx
function RelEdge({ id, source, target, data, markerEnd }: EdgeProps) {
  const sn = useInternalNode(source)
  const tn = useInternalNode(target)
  if (!sn || !tn) return null

  const box = (n: InternalNode) => ({
    x: n.internals.positionAbsolute.x + (n.measured?.width ?? 150) / 2,
    y: n.internals.positionAbsolute.y + (n.measured?.height ?? 58) / 2,
    w: n.measured?.width ?? 150,
    h: n.measured?.height ?? 58,
  })

  const A = box(sn),
    B = box(tn)
  const p1 = rectPoint(A, B),
    p2 = rectPoint(B, A)
  const [path, lx, ly] = getBezierPath({
    sourceX: p1.x,
    sourceY: p1.y,
    targetX: p2.x,
    targetY: p2.y,
    sourcePosition: sideOf(p1, p2),
    targetPosition: sideOf(p2, p1),
    curvature: 0.28,
  })

  const showLabel = ['up', 'down', 'up2', 'down2', 'near'].includes(data.state)
  return (
    <>
      <path
        id={id}
        d={path}
        markerEnd={markerEnd}
        className={cn('ep', data.state, data.draw && 'draw')}
      />
      {showLabel && (
        <EdgeLabelRenderer>
          <div
            className={cn('elabel', data.state)}
            style={{
              position: 'absolute',
              transform: `translate(-50%,-50%) translate(${lx}px,${ly}px)`,
            }}
          >
            {data.relation}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}

// 카드 테두리 교점
function rectPoint(a: Box, b: Box) {
  const dx = b.x - a.x,
    dy = b.y - a.y
  const hw = a.w / 2 + 6,
    hh = a.h / 2 + 6
  const t = Math.min(Math.abs(hw / (dx || 1e-6)), Math.abs(hh / (dy || 1e-6)))
  return { x: a.x + dx * t, y: a.y + dy * t }
}
function sideOf(from: Pt, to: Pt) {
  const dx = to.x - from.x,
    dy = to.y - from.y
  return Math.abs(dx) > Math.abs(dy)
    ? dx > 0
      ? Position.Right
      : Position.Left
    : dy > 0
      ? Position.Bottom
      : Position.Top
}
```

화살표는 엣지 객체에 지정하면 React Flow가 마커를 자동 생성한다.

```ts
markerEnd: { type: MarkerType.ArrowClosed, width: 15, height: 15,
             color: polarity === -1 ? '#0E6E96' : '#F26722' }
```

### 6.4 레이아웃 — `lib/layout.ts`

```ts
// 파급 경로: 기점 중앙, hop 레벨별 동심원
const RADIUS = [0, 300, 520, 700]
function radialLayout(ids: string[], level: Record<string, number>) {
  const byLv: Record<number, string[]> = {}
  ids.forEach((id) => (byLv[level[id]] ??= []).push(id))
  const pos: Record<string, XYPosition> = {}
  Object.entries(byLv).forEach(([lk, arr]) => {
    const l = +lk
    if (l === 0) {
      pos[arr[0]] = { x: 0, y: 0 }
      return
    }
    const step = (2 * Math.PI) / arr.length
    const off = -Math.PI / 2 + (l % 2 ? 0 : step / 2)
    arr.forEach((id, i) => {
      const a = off + step * i,
        r = RADIUS[Math.min(l, 3)]
      pos[id] = { x: Math.cos(a) * r, y: Math.sin(a) * r * 0.76 } // 타원
    })
  })
  return pos
}
```

| 함수                   | 역할                                                            |
| ---------------------- | --------------------------------------------------------------- |
| `focusBuild(analysis)` | `related[].chain`을 펼쳐 노드·엣지·hop 레벨 산출                |
| `nodeBuild(nodeId, 2)` | 특정 노드 기점 BFS 2단계                                        |
| `radialLayout()`       | 위 결과를 동심원 좌표로                                         |
| `fullLayout(graph)`    | 섹터 3클러스터 고정 좌표. 클러스터 안은 연결 수 내림차순 동심원 |

**`fullLayout` 결과는 한 번 계산해 캐시한다.** 뷰를 오갈 때마다 재계산하면 노드가 튄다.

### 6.5 시각 규칙

```
모양   COMPANY = 실선 카드 / THEME·PRODUCT·MATERIAL = 점선 카드
크기   시총 30조↑ 172px · 5~30조 150px · 5조↓ 134px · 개념 노드 auto
위계   전체 관계망에서 연결 수로 3단계 (t1 진한 잉크 / t2 중간 / t3 연한)
색상   상승 주황 · 하락 딥애저 · 경유 흰색+주황테두리 · 무관 dim
라벨   노드는 항상 / 엣지는 활성 상태와 호버 시에만
```

**주황은 "영향받는 것"에만 쓴다.** GNB, 탭, 버튼 같은 장식에는 쓰지 않는다.
그래야 그래프에 주황이 켜지는 순간이 화면에서 유일한 사건이 된다.

### 6.6 애니메이션

**React Flow의 `animated: true`를 쓰지 말 것.** 점선이 무한 반복돼 정신없다.
CSS 1회 재생으로 구현하고 끝나면 멈춘다.

```css
.ep.draw {
  stroke-dasharray: 1400;
  stroke-dashoffset: 1400;
  animation: draw 0.48s cubic-bezier(0.33, 0, 0.2, 1) forwards; /* forwards = 상태 유지 */
}
@keyframes draw {
  to {
    stroke-dashoffset: 0;
  }
}
```

뉴스 선택 시퀀스. `setTimeout` 체인으로 `data.state`를 갱신하면 CSS 트랜지션이 따라온다.

| 시점  | 동작                                                 | 상단 라벨      |
| ----- | ---------------------------------------------------- | -------------- |
| 0.30s | 기점 카드 점등 + 링 2회 확산                         | 영향 기점 확인 |
| 0.80s | hop별 엣지가 순차적으로 그려짐                       | 관계 경로 추적 |
| —     | 도착 노드가 경유(흰색) 또는 최종(주황/애저)으로 전환 |                |
| 1.60s | 관련주가 0.21s 간격으로 확정, 우측 카드도 동시 강조  | 영향 종목 산출 |

타이머는 `useRef<number[]>`에 모아 두고 언마운트·재선택 시 전부 `clearTimeout` 한다.

### 6.7 클릭 동작

| 현재 뷰        | 노드 클릭                                                                           |
| -------------- | ----------------------------------------------------------------------------------- |
| 전체 관계망    | **배치 유지.** 그 자리에서 2단계 파급만 강조 (1단계 진하게, 2단계 옅게, 나머지 dim) |
| 파급 경로      | 그 종목을 기점으로 동심원 재배치                                                    |
| 종목 기점 탐색 | 다른 종목으로 계속 이동. 뒤로가기 칩으로 원위치                                     |

**하이라이트가 켜져 있는 동안 호버 강조를 막아야 한다.** 안 그러면 마우스를 떼는 순간 지워진다.

```ts
const onNodeMouseLeave = () => {
  if (highlightedNode) return // 이 가드가 없으면 하이라이트가 사라진다
  resetHoverEdges()
}
```

---

## 7. 상태 (Jotai)

Jotai는 단일 스토어 객체가 아니라 atom 단위로 상태를 쪼갠다. 문서 전체에서
언급하는 슬라이스를 각각 독립 atom으로 선언한다 (`lib/atoms.ts`):

```ts
import { atom } from 'jotai'

export const viewAtom = atom<'map' | 'network' | 'verify'>('map')
export const selectedNewsIdAtom = atom<number | null>(null)
export const highlightedNodeAtom = atom<string | null>(null) // 전체 관계망 제자리 강조
export const verifyContextAtom = atom<{
  label: string
  names: string[]
} | null>(null) // 뉴스에서 진입 시 종목명 배열
export const newsSheetOpenAtom = atom(false) // 모바일 바텀시트

// 스크랩 — 메모리 전용, 영속 저장 없음
export const scrappedNewsIdsAtom = atom<number[]>([])
```

서버 데이터(뉴스, 그래프, 분석, 검증)는 atom에 넣지 않는다. TanStack Query가
관리한다(백엔드 연결 전까지는 `lib/api.ts`가 로컬 데이터를 동기적으로
반환한다). Jotai atom은 **UI 상태와 스크랩 메모리**만 담당한다.

파생 상태가 필요하면(예: 선택된 뉴스 객체, 필터링된 뉴스 목록) 각 atom을
`get`으로 조합하는 파생 atom(`atom((get) => ...)`)을 추가로 선언해 컴포넌트
안에서 매번 다시 계산하지 않도록 한다.

`verifyContext`가 있으면 검증 화면은 그 종목이 포함된 과거 검증만 보여주고 상단에 배너를 띄운다.
뉴스 상세의 "이 종목들의 지난 예측 적중률 보기" 버튼이 이 값을 채운다.

---

## 8. 디자인 토큰

```css
:root {
  /* Primary — 코스콤 오렌지 */
  --o-50: #fff4ed;
  --o-100: #ffe4d3;
  --o-200: #ffc7a6;
  --o-300: #fca271;
  --o-500: #f26722;
  --o-600: #dd5410;
  --o-700: #b0400b;

  /* Negative — 주황의 보색 계열 딥애저. 선명한 파랑은 주황과 충돌한다 */
  --d-50: #e9f3f8;
  --d-100: #cfe5ef;
  --d-500: #0e6e96;
  --d-600: #0a5878;
  --d-700: #08455e;

  /* Warm neutrals — 쿨 그레이를 쓰면 주황이 겉돈다 */
  --n-0: #ffffff;
  --n-25: #fcfcfb;
  --n-50: #fafaf9;
  --n-100: #f4f3f1;
  --n-150: #edebe8;
  --n-200: #e3e0dc;
  --n-300: #d6d3d1;
  --n-400: #b4afaa;
  --n-500: #8a847e;
  --n-600: #57534e;
  --n-700: #44403c;
  --n-900: #1c1917;
}
```

- 폰트 Pretendard, 라디우스 카드 16px·요소 10~13px
- 그림자 아주 약하게 `0 1px 2px rgba(28,25,23,.04), 0 6px 18px rgba(28,25,23,.06)`
- 자간 제목류 `-0.03em` 전후
- shadcn 기본 테마를 그대로 쓰면 티가 난다. 설치 직후 위 토큰으로 `--primary`, `--border`, `--radius`를 교체할 것

---

## 9. 하지 말 것

- 로그인, 회원가입, 마이페이지, 설정 화면
- localStorage 등 클라이언트 영속 저장
- 신뢰도 퍼센트 표시 (검증 화면의 실측 등락률·적중률은 예외)
- React Flow `animated: true` 또는 반복 재생 애니메이션
- `nodeTypes` / `edgeTypes`를 컴포넌트 안에서 선언
- dagre·elkjs 등 레이아웃 라이브러리 추가
- 모바일 가로 스크롤 뉴스 리스트
- 뉴스 목록·검증 목록에 페이지 번호(1, 2, 3 …) UI 추가 — 둘 다 커서 기반 무한 스크롤만 쓴다
- 기사 본문 전문 저장·표시 (저작권. 요약 3줄 + 원문 링크만)
- 그래프 노드 안에 shadcn `Card` 사용 (래퍼가 크기 계산을 방해)
- 장식 목적의 주황색 사용

---

## 10. 폴더 구조

```
src/
├── app/
│   ├── App.tsx
│   └── queryClient.ts
├── components/
│   ├── ui/                      # shadcn
│   ├── news/
│   │   ├── NewsList.tsx
│   │   ├── NewsCard.tsx
│   │   └── MobileNewsBar.tsx    # 반응형 상단 바 + 바텀시트
│   ├── graph/
│   │   ├── GraphPanel.tsx       # ReactFlowProvider, 모드 전환, 범례
│   │   ├── StockNode.tsx
│   │   ├── RelEdge.tsx          # 플로팅 엣지
│   │   └── usePropagation.ts    # 하이라이트 시퀀스 훅
│   ├── analysis/
│   │   ├── AnalysisPanel.tsx
│   │   ├── MainStockCard.tsx
│   │   ├── RelatedList.tsx
│   │   └── RationaleBox.tsx
│   ├── verify/
│   │   ├── VerifyView.tsx
│   │   ├── VerifyList.tsx
│   │   └── VerifyDetail.tsx
│   └── scrap/
│       ├── ScrapFab.tsx
│       └── ScrapSheet.tsx
├── lib/
│   ├── api.ts                   # 목 데이터 wire 응답 함수 (§11 데모 안전장치)
│   ├── mappers.ts                # wire(snake_case) → 도메인(camelCase) 매핑
│   ├── queries.ts               # fetch 래퍼 + Query 훅
│   ├── atoms.ts                 # Jotai atom (UI 상태 + 스크랩 메모리)
│   ├── layout.ts                # focusBuild, nodeBuild, radialLayout, fullLayout
│   └── format.ts                # 방향 라벨, 영향 태그(직접/간접/확산)
└── types/index.ts
```

---

## 11. 데모 안전장치

발표 당일 네트워크 장애 대비. 우선순위 높음.

- 모든 Query에 **로컬 목 데이터 폴백**을 둔다 (`placeholderData` 또는 에러 시 fallback)
- 데모용 뉴스 5건은 분석 결과를 번들에 포함해 즉시 응답하게 한다
- 외부 CDN 의존성은 전부 로컬로 내려받아 번들에 포함한다
- 빌드된 정적 파일로 발표한다. 개발 서버로 시연하지 않는다
