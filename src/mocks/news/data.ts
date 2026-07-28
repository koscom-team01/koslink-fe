import { ONTOLOGY_EDGES, ONTOLOGY_NODES } from '#/mocks/graph/data'
import type { Direction } from '#/shared/types'

/**
 * 뉴스 목록/impact 응답을 만들기 위한 내부 표현.
 * `chain`은 파급 경로 그래프(노드/엣지) 산출에만 쓰고, 응답의 relation_path/propagation
 * 텍스트는 apis/analysis/mock.ts가 이 체인에서 템플릿으로 생성한다.
 */
export interface NewsRecord {
  id: number
  title: string
  press: string
  publishedAt: string // ISO
  url: string
  summary: string[] // 3줄
  originStocks: { nodeId: string; direction: Direction; reason: string }[]
  relatedStocks: {
    nodeId: string
    direction: Direction
    relationLabel: string
    chain: string[]
  }[]
}

const TODAY = '2026-07-20'

/** 데모 안전장치(§11) — 상세 서사를 손으로 쓴 반도체 뉴스 9건. 항상 번들에 포함된다. */
const CURATED_NEWS: NewsRecord[] = [
  {
    id: 10001,
    title: 'SK하이닉스, HBM4 양산 위해 청주 M15X 증설 확정… 2027년 가동',
    press: '연합뉴스',
    publishedAt: `${TODAY}T09:12:00+09:00`,
    url: 'https://www.yna.co.kr/',
    summary: [
      'SK하이닉스가 청주 M15X 공장 증설 투자를 확정했다고 공시했다.',
      'HBM4 양산 대응이 목적이며 2027년 상반기 가동이 목표다.',
      '장비 발주는 올해 4분기부터 순차 집행될 예정이다.',
    ],
    originStocks: [
      {
        nodeId: 'sk',
        direction: 'UP',
        reason: 'HBM4 증설 발표로 생산능력이 직접 확대되는 당사자',
      },
    ],
    // related_stocks 빈 배열 케이스 데모 — 리스트 첫 항목에서 온톨로지 상 파생
    // 관련 종목이 없는 경우를 항상 확인할 수 있게 의도적으로 비워둔다.
    relatedStocks: [],
  },
  {
    id: 10002,
    title: '엔비디아, 차세대 AI 가속기 물량 30% 상향… 메모리 조달 확대',
    press: '전자신문',
    publishedAt: `${TODAY}T08:36:00+09:00`,
    url: 'https://www.etnews.com/',
    summary: [
      '엔비디아가 차세대 AI 가속기 생산 계획을 기존 대비 30퍼센트 상향했다.',
      '추가 물량 대응을 위해 HBM 조달을 늘릴 것으로 알려졌다.',
      '국내 메모리 업체의 공급 비중이 확대될 전망이다.',
    ],
    originStocks: [
      {
        nodeId: 'aidc',
        direction: 'UP',
        reason: 'AI 데이터센터 투자 확대가 메모리 수요를 직접 견인',
      },
    ],
    relatedStocks: [
      {
        nodeId: 'sk',
        direction: 'UP',
        relationLabel: 'HBM 주력 생산',
        chain: ['aidc', 'hbm', 'sk'],
      },
      {
        nodeId: 'hanmi',
        direction: 'UP',
        relationLabel: 'HBM 필수 장비',
        chain: ['aidc', 'hbm', 'hanmi'],
      },
      {
        nodeId: 'ss',
        direction: 'UP',
        relationLabel: 'HBM 생산',
        chain: ['aidc', 'hbm', 'ss'],
      },
      {
        nodeId: 'eo',
        direction: 'UP',
        relationLabel: '장비 납품',
        chain: ['aidc', 'hbm', 'sk', 'eo'],
      },
    ],
  },
  {
    id: 10003,
    title: '삼성전자, 파운드리 신규 고객사 대형 수주 체결',
    press: '한국경제',
    publishedAt: '2026-07-20T03:40:00+09:00',
    url: 'https://www.hankyung.com/',
    summary: [
      '삼성전자가 해외 팹리스 업체와 파운드리 대형 공급 계약을 체결했다.',
      '선단 공정 라인의 가동률이 큰 폭으로 오를 전망이다.',
      '관련 장비·소재 협력사 발주도 함께 늘어날 것으로 보인다.',
    ],
    originStocks: [
      {
        nodeId: 'ss',
        direction: 'UP',
        reason: '파운드리 대형 수주로 가동률이 직접 개선되는 당사자',
      },
    ],
    relatedStocks: [
      {
        nodeId: 'jusung',
        direction: 'UP',
        relationLabel: '장비 공급',
        chain: ['ss', 'jusung'],
      },
      {
        nodeId: 'lino',
        direction: 'UP',
        relationLabel: '테스트 소켓',
        chain: ['ss', 'lino'],
      },
      {
        nodeId: 'dj',
        direction: 'UP',
        relationLabel: '포토레지스트',
        chain: ['ss', 'dj'],
      },
      {
        nodeId: 'sk',
        direction: 'DOWN',
        relationLabel: '경쟁',
        chain: ['ss', 'sk'],
      },
    ],
  },
  {
    id: 10004,
    title: '글로벌 AI 서버 수요 폭증… HBM 공급 부족 심화',
    press: '이데일리',
    publishedAt: '2026-07-20T01:15:00+09:00',
    url: 'https://www.edaily.co.kr/',
    summary: [
      'AI 서버향 수요가 예상을 웃돌며 HBM 공급 부족이 심화하고 있다.',
      '주요 메모리 업체의 HBM 가동률이 이미 최대치에 근접했다.',
      '후공정 장비 업체의 증설 압박도 함께 커지는 모습이다.',
    ],
    originStocks: [
      {
        nodeId: 'hbm',
        direction: 'UP',
        reason: 'AI 서버 수요 폭증으로 공급 부족이 직접 확인된 품목',
      },
    ],
    relatedStocks: [
      {
        nodeId: 'sk',
        direction: 'UP',
        relationLabel: '주력 생산',
        chain: ['hbm', 'sk'],
      },
      {
        nodeId: 'ss',
        direction: 'UP',
        relationLabel: '생산',
        chain: ['hbm', 'ss'],
      },
      {
        nodeId: 'hanmi',
        direction: 'UP',
        relationLabel: 'TC본더 필수',
        chain: ['hbm', 'hanmi'],
      },
      {
        nodeId: 'aidc',
        direction: 'UP',
        relationLabel: '수요 견인',
        chain: ['hbm', 'aidc'],
      },
    ],
  },
  {
    id: 10005,
    title: 'D램 가격 협상력 강화… 상반기 실적 개선 기대',
    press: '조선비즈',
    publishedAt: '2026-07-19T22:50:00+09:00',
    url: 'https://biz.chosun.com/',
    summary: [
      'D램 고정거래가 협상에서 공급사 협상력이 강화됐다.',
      '재고 조정이 마무리 국면에 접어든 영향으로 풀이된다.',
      '상반기 메모리 업체 실적 개선 기대가 커지고 있다.',
    ],
    originStocks: [
      {
        nodeId: 'dram',
        direction: 'UP',
        reason: 'D램 협상력 강화가 가격에 직접 반영되는 품목',
      },
    ],
    relatedStocks: [
      {
        nodeId: 'sk',
        direction: 'UP',
        relationLabel: '주력 생산',
        chain: ['dram', 'sk'],
      },
      {
        nodeId: 'ss',
        direction: 'UP',
        relationLabel: '생산',
        chain: ['dram', 'ss'],
      },
      {
        nodeId: 'aidc',
        direction: 'UP',
        relationLabel: '수요 견인',
        chain: ['dram', 'aidc'],
      },
    ],
  },
  {
    id: 10006,
    title: '원익IPS, 국내 최대 반도체 라인 증착 장비 공급 계약',
    press: '파이낸셜뉴스',
    publishedAt: '2026-07-19T18:30:00+09:00',
    url: 'https://www.fnnews.com/',
    summary: [
      '원익IPS가 대형 반도체 라인향 증착 장비 공급 계약을 체결했다.',
      '계약 규모는 회사 연 매출의 상당 부분에 해당한다.',
      '납품은 올해 하반기부터 순차 진행될 예정이다.',
    ],
    originStocks: [
      {
        nodeId: 'wonik',
        direction: 'UP',
        reason: '대형 증착 장비 공급 계약의 직접 수혜 당사자',
      },
    ],
    relatedStocks: [
      {
        nodeId: 'sk',
        direction: 'UP',
        relationLabel: '증착 장비',
        chain: ['wonik', 'sk'],
      },
    ],
  },
  {
    id: 10007,
    title: 'HPSP, 고압 어닐링 장비 해외 수주 확대',
    press: '뉴스1',
    publishedAt: '2026-07-19T14:05:00+09:00',
    url: 'https://www.news1.kr/',
    summary: [
      'HPSP가 해외 반도체 업체향 고압 어닐링 장비 수주를 확대했다.',
      '해외 매출 비중이 처음으로 절반을 넘어설 전망이다.',
      '증설된 생산라인은 내년부터 본격 가동된다.',
    ],
    originStocks: [
      {
        nodeId: 'hpsp',
        direction: 'UP',
        reason: '해외 수주 확대의 직접 수혜 당사자',
      },
    ],
    relatedStocks: [
      {
        nodeId: 'sk',
        direction: 'UP',
        relationLabel: '고압 어닐링',
        chain: ['hpsp', 'sk'],
      },
    ],
  },
  {
    id: 10008,
    title: '티씨케이, 반도체 소모품 공급 물량 증가',
    press: '매일경제',
    publishedAt: '2026-07-19T09:20:00+09:00',
    url: 'https://www.mk.co.kr/',
    summary: [
      '티씨케이의 반도체 공정용 소모품 공급 물량이 늘었다.',
      '고객사 라인 가동률 상승이 주된 배경으로 지목된다.',
      '분기 실적에 긍정적으로 반영될 전망이다.',
    ],
    originStocks: [
      {
        nodeId: 'tck',
        direction: 'UP',
        reason: '소모품 공급 물량 증가의 직접 수혜 당사자',
      },
    ],
    relatedStocks: [
      {
        nodeId: 'sk',
        direction: 'UP',
        relationLabel: '소모품 공급',
        chain: ['tck', 'sk'],
      },
    ],
  },
  {
    id: 10009,
    title: 'DB하이텍, 파운드리 가동률 상승',
    press: '아시아경제',
    publishedAt: '2026-07-19T06:45:00+09:00',
    url: 'https://www.asiae.co.kr/',
    summary: [
      'DB하이텍의 8인치 파운드리 가동률이 상승했다.',
      '차량용·전력 반도체 수요 회복이 배경으로 꼽힌다.',
      '가격 협상력도 함께 개선되고 있다.',
    ],
    originStocks: [
      {
        nodeId: 'dbh',
        direction: 'UP',
        reason: '파운드리 가동률 상승의 직접 당사자',
      },
    ],
    relatedStocks: [
      {
        nodeId: 'fdry',
        direction: 'UP',
        relationLabel: '사업 영위',
        chain: ['dbh', 'fdry'],
      },
    ],
  },
]

/**
 * "최신 뉴스 새로고침" 시연용 고정 3건 — 한미반도체(SK하이닉스·삼성전자 제외) 관련
 * 실제 최근 반도체 기사를 바탕으로 함. 이 3건의 실제 impact 응답은
 * apis/analysis/mock.ts가 id 20001~20003을 특별 취급해
 * mocks/analysis/refreshNewsExamples.json + hmiSubgraph.json으로 반환하므로,
 * 아래 originStocks/relatedStocks/summary는 리스트 표시에는 안 쓰인다.
 * 실 API가 준비되면 이 배열과 pullRefreshBatch는 통째로 지우고 새로고침을 그냥
 * 쿼리 재조회로 대체하면 된다.
 */
const REFRESH_ADDITIONS: NewsRecord[] = [
  {
    id: 20001,
    title: '한미반도체, 5천여평 규모 제8공장 확보…AI 반도체 장비 쇼티지 선제 대응',
    press: '뉴스핌',
    publishedAt: TODAY,
    url: 'https://www.newspim.com/news/view/20260720000985',
    summary: [
      '한미반도체가 인천 본사 인근 부지를 매입해 창사 이래 최대 규모인 제8공장 건설을 추진한다고 밝혔다.',
      '신규 공장은 HBM 생산에 필수적인 TC본더 등 첨단 패키징 장비 생산시설로 활용될 계획이다.',
      'AI 반도체 시장 확대에 따른 장비 공급 부족(쇼티지)에 선제 대응하려는 조치로 풀이된다.',
    ],
    originStocks: [
      {
        nodeId: 'hanmi',
        direction: 'UP',
        reason: '제8공장 확보로 TC본더 생산능력이 직접 확대되는 당사자',
      },
    ],
    relatedStocks: [],
  },
  {
    id: 20002,
    title: '한미반도체, 와이드 TC본더 앞세워 HBM4용 신규 수주 경쟁력 강화',
    press: '이데일리',
    publishedAt: TODAY,
    url: 'https://v.daum.net/v/20260702084432066',
    summary: [
      "한미반도체가 '와이드 TC본더'를 앞세워 HBM4용 신규 수주 경쟁력을 강화하고 있다고 밝혔다.",
      'TC본더 적용처가 확장되며 신규 수주 기회가 늘어날 것으로 전망된다.',
      'HBM TC본더 시장 점유율 71%를 바탕으로 후속 수주 논의도 이어지고 있다.',
    ],
    originStocks: [
      {
        nodeId: 'hanmi',
        direction: 'UP',
        reason: 'TC본더 적용처 확장으로 신규 수주 경쟁력이 직접 강화되는 당사자',
      },
    ],
    relatedStocks: [],
  },
  {
    id: 20003,
    title: "한미반도체, HBM4 'TC본더 4.5 그리핀' 442억원 수주 공시",
    press: '한국경제',
    publishedAt: TODAY,
    url: 'https://news.nate.com/view/20260608n17852',
    summary: [
      "한미반도체가 HBM4 제조용 'TC본더 4.5 그리핀' 장비 수주를 공시했다.",
      '이번 수주 규모는 442억원으로, 매출액 대비 약 7.66%에 해당한다.',
      'HBM4 양산 확대에 따른 후속 발주가 이어질지 시장의 관심이 모인다.',
    ],
    originStocks: [
      {
        nodeId: 'hanmi',
        direction: 'UP',
        reason: '442억원 규모의 TC본더 신규 수주를 직접 공시한 당사자',
      },
    ],
    relatedStocks: [],
  },
]

let refreshAlreadyPulled = false

/**
 * "새로고침" 클릭 데모용 — REFRESH_ADDITIONS 3건을 발행 시각만 지금으로 찍어
 * NEWS_RECORDS 맨 앞에 한 번만 끼워 넣는다. 이미 넣었으면 빈 배열을 반환해
 * "새 뉴스가 없습니다" 상태를 보여준다.
 */
export function pullRefreshBatch(): NewsRecord[] {
  if (refreshAlreadyPulled) return []
  refreshAlreadyPulled = true

  const now = Date.now()
  const items = REFRESH_ADDITIONS.map((template, i) => ({
    ...template,
    publishedAt: new Date(now - i * 45_000).toISOString(),
  }))

  NEWS_RECORDS.unshift(...items)
  return items
}

const STOCK_IDS = ONTOLOGY_NODES.filter((n) => n.kind === 'STOCK').map(
  (n) => n.id,
)
const nodeNameById = new Map<string, string>(
  ONTOLOGY_NODES.map((n): [string, string] => [n.id, n.name]),
)

const FILLER_TEMPLATES: {
  headline: (name: string) => string
  summary: (name: string) => string[]
  reason: (name: string) => string
}[] = [
  {
    headline: (name) => `${name}, 신규 대형 수주 확보 공시`,
    summary: (name) => [
      `${name}가 신규 대형 수주 계약을 공시했다.`,
      '계약 이행은 순차적으로 진행될 예정이다.',
      '관련 공급망 전반에 훈풍이 예상된다.',
    ],
    reason: (name) => `${name}의 신규 대형 수주 공시 직접 당사자`,
  },
  {
    headline: (name) => `${name}, 생산라인 증설 검토 착수`,
    summary: (name) => [
      `${name}가 생산라인 증설을 검토 중이라고 밝혔다.`,
      '투자 규모와 일정은 이사회 의결 후 확정된다.',
      '가동 시점은 내후년으로 예상된다.',
    ],
    reason: (name) => `${name}의 생산라인 증설 검토 직접 당사자`,
  },
  {
    headline: (name) => `${name}, 분기 실적 시장 예상치 상회`,
    summary: (name) => [
      `${name}가 시장 예상치를 웃도는 분기 실적을 발표했다.`,
      '가동률 상승과 판가 개선이 주요 배경으로 꼽힌다.',
      '다음 분기에도 개선 흐름이 이어질 것으로 전망된다.',
    ],
    reason: (name) => `${name}의 분기 실적 서프라이즈 직접 당사자`,
  },
  {
    headline: (name) => `${name}, 해외 인증 획득으로 수출 기대`,
    summary: (name) => [
      `${name}가 주요 해외 인증을 획득했다.`,
      '이번 인증으로 신규 시장 진입 절차가 단축된다.',
      '후속 수출 계약 논의도 함께 진행될 전망이다.',
    ],
    reason: (name) => `${name}의 해외 인증 획득 직접 당사자`,
  },
  {
    headline: (name) => `${name}, 주요 고객사向 공급계약 갱신`,
    summary: (name) => [
      `${name}가 주요 고객사와 공급계약을 갱신했다.`,
      '계약 기간과 물량 모두 기존 대비 확대됐다.',
      '안정적 매출 기반이 한층 강화될 전망이다.',
    ],
    reason: (name) => `${name}의 공급계약 갱신 직접 당사자`,
  },
  {
    headline: (name) => `${name}, 재고 조정 마무리… 가동률 정상화`,
    summary: (name) => [
      `${name}의 재고 조정이 마무리 국면에 접어들었다.`,
      '주요 생산라인 가동률이 정상 수준을 회복했다.',
      '수급 개선으로 판가 협상력도 함께 높아지고 있다.',
    ],
    reason: (name) => `${name}의 가동률 정상화 직접 당사자`,
  },
]

const PRESS_LIST = [
  '연합뉴스',
  '한국경제',
  '매일경제',
  '이데일리',
  '전자신문',
  '머니투데이',
  '조선비즈',
  '파이낸셜뉴스',
  '뉴스1',
  '서울경제',
]

/**
 * 무한 스크롤(커서 페이징) 테스트용 필러 뉴스를 온톨로지 엣지에서 결정론적으로 생성한다.
 * 매 실행마다 같은 결과가 나오도록 Math.random 대신 인덱스 기반 순환만 쓴다.
 */
function buildFillerNews(count: number, startId: number): NewsRecord[] {
  const news: NewsRecord[] = []
  let cursor = new Date(`${CURATED_NEWS.at(-1)!.publishedAt}`)

  for (let i = 0; i < count; i++) {
    const originId = STOCK_IDS[i % STOCK_IDS.length]
    const template = FILLER_TEMPLATES[i % FILLER_TEMPLATES.length]
    const direction: Direction = i % 3 === 2 ? 'DOWN' : 'UP'
    const originName = nodeNameById.get(originId) ?? originId

    const neighborEdges = ONTOLOGY_EDGES.filter(
      (e) => e.source === originId && nodeNameById.has(e.target),
    ).slice(0, 4)

    const relatedStocks = neighborEdges.map((edge) => {
      const isCompetitor = edge.relationType === 'COMPETITOR'
      const relatedDirection: Direction = isCompetitor
        ? direction === 'UP'
          ? 'DOWN'
          : 'UP'
        : direction
      return {
        nodeId: edge.target,
        direction: relatedDirection,
        relationLabel: edge.relation,
        chain: [originId, edge.target],
      }
    })

    cursor = new Date(cursor.getTime() - (3 + (i % 4)) * 60 * 60 * 1000)

    news.push({
      id: startId + i,
      title: template.headline(originName),
      press: PRESS_LIST[i % PRESS_LIST.length],
      publishedAt: cursor.toISOString(),
      url: 'https://example.com/',
      summary: template.summary(originName),
      originStocks: [
        { nodeId: originId, direction, reason: template.reason(originName) },
      ],
      relatedStocks,
    })
  }

  return news
}

export const NEWS_RECORDS: NewsRecord[] = [
  ...CURATED_NEWS,
  ...buildFillerNews(51, 10010),
]
