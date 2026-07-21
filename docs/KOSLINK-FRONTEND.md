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
| 관심종목        | 사용자가 입력한 종목과 브리핑 결과만 **세션 메모리(Jotai)** 에 유지. 새로고침하면 사라짐 |
| 플랫폼          | 데스크탑 웹 우선, 태블릿·모바일 반응형 대응                                              |
| 페이지          | SPA 단일 페이지. 라우터 없이 탭 전환                                                     |
| 언어            | 한국어 전용                                                                              |

---

## 2. 기술 스택

```
React 18 + TypeScript + Vite
@xyflow/react (v12)        그래프
Tailwind CSS + shadcn/ui   tabs, badge, sheet, tooltip, command, scroll-area, separator
Jotai                      UI 상태 + 관심종목 메모리
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
│ 섹터 필터 │                      │ 기사 요약 3줄      │
│ 뉴스카드  │   ○ ─── ○            │ 원문 링크          │
│ 뉴스카드  │   │                   │ ─────────────    │
│ 뉴스카드  │   ○     ○            │ 영향 기점 카드     │
│          │                      │ 관련주 리스트      │
│          │ 범례                  │ 판단 근거 3줄      │
└──────────┴──────────────────────┴───────────────────┘
                                    [관심종목 브리핑] ← FAB
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

페이지네이션 없음. 목록은 스크롤, 상세는 우측 고정.

### SC-03 관심종목 브리핑

우측 슬라이드 시트 424px. shadcn `Sheet`.
종목 칩 입력 → 조회 → 결과 카드. 닫아도 상태 유지, FAB에 매칭 건수 배지.

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

```ts
type NodeKind = 'COMPANY' | 'PRODUCT' | 'THEME' | 'MATERIAL'

interface OntologyNode {
  id: string // 'sk'
  name: string // 'SK하이닉스'
  kind: NodeKind
  ticker?: string // COMPANY만
  sector: string // '반도체' | '2차전지' | '방산'
  marketCap?: number // 억원, COMPANY만
}

interface OntologyEdge {
  id: string
  source: string
  target: string
  relation: string // '장비 공급', '경쟁', '양극재 조달'
  polarity: 1 | -1 // 1 동조 / -1 반대(경쟁·대체)
}
```

`polarity: -1`이 핵심이다. 같은 뉴스에서 상승주와 하락주가 동시에 나오는 근거다.

---

## 5. API 명세

베이스 `/api`. 인증 헤더 없음. 전부 TanStack Query로 감싼다.

### 5.1 뉴스 목록

```
GET /api/news?limit=20&sector=반도체
```

```jsonc
{
  "items": [
    {
      "id": "n1",
      "title": "SK하이닉스, HBM4 양산 위해 청주 M15X 증설 확정",
      "press": "연합뉴스",
      "publishedAt": "2026-07-18T09:12:00Z",
      "sector": "반도체",
    },
  ],
}
```

### 5.2 뉴스 영향 분석 — 화면의 핵심

```
GET /api/news/{id}/analysis
```

```jsonc
{
  "newsId": "n1",
  "article": {
    "summary": ["요약 1", "요약 2", "요약 3"],
    "originUrl": "https://www.yna.co.kr/...",
    "press": "연합뉴스",
    "publishedAt": "2026-07-18T09:12:00Z",
  },
  "main": {
    "nodeId": "sk",
    "name": "SK하이닉스",
    "ticker": "000660",
    "direction": "UP",
    "reason": "HBM4 증설 발표로 생산능력이 직접 확대되는 당사자",
  },
  "related": [
    {
      "nodeId": "hanmi",
      "name": "한미반도체",
      "ticker": "042700",
      "direction": "UP",
      "relation": "장비 공급",
      "chain": ["sk", "hanmi"],
    },
    {
      "nodeId": "ss",
      "name": "삼성전자",
      "direction": "DOWN",
      "relation": "경쟁 관계",
      "chain": ["sk", "ss"],
    },
  ],
  "rationale": {
    "event": "SK하이닉스가 HBM4 대응 목적의 청주 M15X 증설을 확정",
    "propagation": "장비를 대는 한미반도체·HPSP에는 수주 확대 요인, 경쟁하는 삼성전자에는 압박 요인",
    "precedent": "동일 유형 공시 5건 중 4건에서 장비주가 익일 평균 +3.1%",
  },
}
```

**주의**

- `confidence` 같은 확률값은 받지도, 표시하지도 않는다
- 영향의 크기는 `chain.length - 1` (hop 수)로만 표현한다
- `chain`은 기점부터 대상까지의 노드 ID 배열. 그래프 배치와 애니메이션 순서가 전부 여기서 나온다
- `rationale.propagation`은 서버가 그래프 경로에서 템플릿 생성한다

### 5.3 전체 그래프

```
GET /api/graph
→ { "nodes": OntologyNode[], "edges": OntologyEdge[] }
```

### 5.4 관심종목 브리핑

```
POST /api/briefing
{ "tickers": ["005930", "042700"] }
```

```jsonc
{
  "totalNews": 20,
  "matched": [
    {
      "ticker": "042700",
      "name": "한미반도체",
      "direction": "UP",
      "relation": "장비 공급",
      "chain": ["sk", "hanmi"],
      "newsId": "n1",
      "newsTitle": "SK하이닉스, HBM4 양산 위해...",
    },
  ],
  "unmatched": [{ "ticker": "005930", "name": "삼성전자" }],
}
```

요청에 담는 `tickers`는 서버에 저장되지 않는다. 매번 클라이언트 메모리에서 보낸다.

### 5.5 예측 검증

```
GET /api/verify?days=30
```

```jsonc
{
  "daily": [{ "date": "2026-07-17", "hitRate": 0.71 }],
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
}
```

사전 배치로 계산된 정적 결과. 프론트는 읽기만 한다.

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

export const viewAtom = atom<'map' | 'verify'>('map')
export const selectedNewsIdAtom = atom<string | null>(null)
export const graphModeAtom = atom<'focus' | 'all' | 'node'>('focus')
export const highlightedNodeAtom = atom<string | null>(null) // 전체 관계망 제자리 강조
export const backToAtom = atom<'focus' | 'all' | 'reset'>('focus')
export const sectorFilterAtom = atom<string>('전체') // '전체' | '반도체' | ...
export const verifyContextAtom = atom<{
  label: string
  names: string[]
} | null>(null) // 뉴스에서 진입 시 종목명 배열
export const newsSheetOpenAtom = atom(false) // 모바일 바텀시트

// 브리핑 — 메모리 전용, 영속 저장 없음
export const briefingTickersAtom = atom<string[]>([])
export const briefingResultAtom = atom<BriefingResponse | null>(null)
export const briefingRanAtAtom = atom<string | null>(null)
```

서버 데이터(뉴스, 그래프, 분석, 검증)는 atom에 넣지 않는다. TanStack Query가
관리한다(백엔드 연결 전까지는 `lib/api.ts`가 로컬 데이터를 동기적으로
반환한다). Jotai atom은 **UI 상태와 관심종목 메모리**만 담당한다.

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
- 검증 화면 페이지네이션
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
│   └── briefing/
│       └── BriefingSheet.tsx
├── lib/
│   ├── api.ts                   # fetch 래퍼 + Query 훅
│   ├── atoms.ts                 # Jotai atom (UI 상태 + 관심종목 메모리)
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
