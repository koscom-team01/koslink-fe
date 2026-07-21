import type {
  Direction,
  OntologyEdge,
  OntologyNode,
  VerifyDaily,
  VerifyEntry,
} from '#/types'

/**
 * docs/koslink.html의 정적 데모 데이터를 그대로 포팅한 것.
 * 백엔드가 없는 지금은 lib/api.ts가 이 파일을 동기적으로 읽어 응답 모양을 만든다.
 * 실 API가 준비되면 lib/api.ts 내부만 fetch로 바꾸면 되고, 이 파일과 컴포넌트는
 * 그대로 유지할 수 있다.
 */

// 회사(COMPANY): [id, 이름, 티커, 섹터, 시가총액(억원)]
const RAW_COMPANIES: [string, string, string, string, number][] = [
  ['sk', 'SK하이닉스', '000660', '반도체', 1200000],
  ['ss', '삼성전자', '005930', '반도체', 4600000],
  ['hanmi', '한미반도체', '042700', '반도체', 120000],
  ['eo', '이오테크닉스', '039030', '반도체', 42000],
  ['jusung', '주성엔지니어링', '036930', '반도체', 18000],
  ['wonik', '원익IPS', '240810', '반도체', 22000],
  ['hpsp', 'HPSP', '403870', '반도체', 26000],
  ['lino', '리노공업', '058470', '반도체', 32000],
  ['tck', '티씨케이', '064760', '반도체', 12000],
  ['dbh', 'DB하이텍', '000990', '반도체', 16000],
  ['solb', '솔브레인', '357780', '반도체', 19000],
  ['dj', '동진쎄미켐', '005290', '반도체', 15000],
  ['lgen', 'LG에너지솔루션', '373220', '2차전지', 900000],
  ['sdi', '삼성SDI', '006400', '2차전지', 250000],
  ['skinn', 'SK이노베이션', '096770', '2차전지', 110000],
  ['ecop', '에코프로비엠', '247540', '2차전지', 160000],
  ['posf', '포스코퓨처엠', '003670', '2차전지', 180000],
  ['lnf', '엘앤에프', '066970', '2차전지', 52000],
  ['cb', '천보', '278280', '2차전지', 14000],
  ['hmc', '현대차', '005380', '2차전지', 520000],
  ['hwa', '한화에어로스페이스', '012450', '방산', 300000],
  ['lig', 'LIG넥스원', '079550', '방산', 60000],
  ['rotem', '현대로템', '064350', '방산', 75000],
  ['kai', '한국항공우주', '047810', '방산', 58000],
  ['pung', '풍산', '103140', '방산', 20000],
]

// 개념 노드(PRODUCT/THEME/MATERIAL): [id, 이름, 종류, 섹터]
const RAW_CONCEPTS: [string, string, NodeKindKo, string][] = [
  ['hbm', 'HBM', '제품', '반도체'],
  ['dram', 'D램', '제품', '반도체'],
  ['fdry', '파운드리', '테마', '반도체'],
  ['aidc', 'AI 데이터센터', '테마', '반도체'],
  ['cath', '양극재', '제품', '2차전지'],
  ['li', '리튬', '원자재', '2차전지'],
  ['ev', '전기차', '테마', '2차전지'],
  ['k9', 'K9 자주포', '제품', '방산'],
  ['gm', '유도무기', '제품', '방산'],
  ['dex', '방산 수출', '테마', '방산'],
  ['agr', '해외 정부계약', '테마', '방산'],
]

type NodeKindKo = '제품' | '테마' | '원자재'
const KIND_MAP: Record<NodeKindKo, OntologyNode['kind']> = {
  제품: 'PRODUCT',
  테마: 'THEME',
  원자재: 'MATERIAL',
}

export const ONTOLOGY_NODES: OntologyNode[] = [
  ...RAW_COMPANIES.map(
    ([id, name, ticker, sector, marketCap]): OntologyNode => ({
      id,
      name,
      kind: 'COMPANY',
      ticker,
      sector,
      marketCap,
    }),
  ),
  ...RAW_CONCEPTS.map(([id, name, kindKo, sector]): OntologyNode => ({
    id,
    name,
    kind: KIND_MAP[kindKo],
    sector,
  })),
]

// [source, target, relation, polarity]
const RAW_EDGES: [string, string, string, 1 | -1][] = [
  ['sk', 'hbm', '주력 생산', 1],
  ['sk', 'dram', '주력 생산', 1],
  ['sk', 'hanmi', '장비 공급', 1],
  ['sk', 'ss', '경쟁', -1],
  ['sk', 'eo', '레이저 장비', 1],
  ['sk', 'wonik', '증착 장비', 1],
  ['sk', 'hpsp', '고압 어닐링', 1],
  ['sk', 'lino', '테스트 소켓', 1],
  ['sk', 'tck', '소모품 공급', 1],
  ['sk', 'solb', '공정 소재', 1],
  ['hbm', 'hanmi', 'TC본더 필수', 1],
  ['hbm', 'aidc', '수요 견인', 1],
  ['ss', 'hbm', '생산', 1],
  ['ss', 'dram', '생산', 1],
  ['ss', 'fdry', '사업 영위', 1],
  ['ss', 'jusung', '장비 공급', 1],
  ['ss', 'lino', '테스트 소켓', 1],
  ['ss', 'dj', '포토레지스트', 1],
  ['dbh', 'fdry', '사업 영위', 1],
  ['aidc', 'fdry', '수요 견인', 1],
  ['dram', 'aidc', '수요 견인', 1],
  ['lgen', 'cath', '핵심 소재', 1],
  ['lgen', 'ecop', '양극재 조달', 1],
  ['lgen', 'lnf', '양극재 조달', 1],
  ['lgen', 'sdi', '경쟁', -1],
  ['lgen', 'ev', '배터리 공급', 1],
  ['lgen', 'cb', '첨가제 조달', 1],
  ['lgen', 'skinn', '경쟁', -1],
  ['sdi', 'posf', '양극재 조달', 1],
  ['sdi', 'ev', '배터리 공급', 1],
  ['ecop', 'cath', '생산', 1],
  ['posf', 'cath', '생산', 1],
  ['lnf', 'cath', '생산', 1],
  ['cath', 'li', '원재료', 1],
  ['skinn', 'ev', '배터리 공급', 1],
  ['ev', 'hmc', '완성차', 1],
  ['hwa', 'k9', '생산', 1],
  ['hwa', 'dex', '수출 주도', 1],
  ['hwa', 'pung', '탄약 조달', 1],
  ['hwa', 'lig', '경쟁', -1],
  ['lig', 'gm', '생산', 1],
  ['lig', 'dex', '수출', 1],
  ['rotem', 'dex', '수출', 1],
  ['kai', 'dex', '수출', 1],
  ['pung', 'dex', '탄약 수출', 1],
  ['k9', 'dex', '대표 품목', 1],
  ['gm', 'dex', '대표 품목', 1],
  ['dex', 'agr', '계약 형태', 1],
  ['k9', 'agr', '계약 대상', 1],
  ['kai', 'hwa', '엔진 협력', 1],
  ['rotem', 'hmc', '계열사', 1],
  ['pung', 'k9', '탄약 공급', 1],
]

export const ONTOLOGY_EDGES: OntologyEdge[] = RAW_EDGES.map(
  ([source, target, relation, polarity], i) => ({
    id: `e${i}`,
    source,
    target,
    relation,
    polarity,
  }),
)

export interface NewsRecord {
  id: string
  sector: string
  title: string
  press: string
  publishedAt: string // ISO
  relativeTime: string // '12분 전' 등 — 정적 데모 데이터 전용 표기
  originUrl: string
  summary: string[] // 3줄
  main: { nodeId: string; direction: Direction; reason: string }
  related: {
    nodeId: string
    direction: Direction
    relation: string
    chain: string[]
  }[]
  rationale: { event: string; propagation: string; precedent: string }
}

const TODAY = '2026-07-20'

export const NEWS_RECORDS: NewsRecord[] = [
  {
    id: 'n1',
    sector: '반도체',
    title: 'SK하이닉스, HBM4 양산 위해 청주 M15X 증설 확정… 2027년 가동',
    press: '연합뉴스',
    publishedAt: `${TODAY}T09:12:00+09:00`,
    relativeTime: '12분 전',
    originUrl: 'https://www.yna.co.kr/',
    summary: [
      'SK하이닉스가 청주 M15X 공장 증설 투자를 확정했다고 공시했다.',
      'HBM4 양산 대응이 목적이며 2027년 상반기 가동이 목표다.',
      '장비 발주는 올해 4분기부터 순차 집행될 예정이다.',
    ],
    main: {
      nodeId: 'sk',
      direction: 'UP',
      reason: 'HBM4 증설 발표로 생산능력이 직접 확대되는 당사자',
    },
    related: [
      {
        nodeId: 'hanmi',
        direction: 'UP',
        relation: '장비 공급',
        chain: ['sk', 'hanmi'],
      },
      {
        nodeId: 'hpsp',
        direction: 'UP',
        relation: '고압 어닐링 장비',
        chain: ['sk', 'hpsp'],
      },
      {
        nodeId: 'wonik',
        direction: 'UP',
        relation: '증착 장비',
        chain: ['sk', 'wonik'],
      },
      {
        nodeId: 'ss',
        direction: 'DOWN',
        relation: '경쟁 관계',
        chain: ['sk', 'ss'],
      },
    ],
    rationale: {
      event: 'SK하이닉스가 HBM4 대응 목적의 청주 M15X 증설을 확정',
      propagation:
        '장비를 대는 <b>한미반도체 · HPSP · 원익IPS</b>에는 수주 확대 요인, 같은 시장에서 겨루는 <b>삼성전자</b>에는 점유율 압박 요인',
      precedent:
        '동일 유형 증설 공시 5건 중 4건에서 장비주가 익일 평균 <b>+3.1%</b>',
    },
  },
  {
    id: 'n2',
    sector: '반도체',
    title: '엔비디아, 차세대 AI 가속기 물량 30% 상향… 메모리 조달 확대',
    press: '전자신문',
    publishedAt: `${TODAY}T08:36:00+09:00`,
    relativeTime: '48분 전',
    originUrl: 'https://www.etnews.com/',
    summary: [
      '엔비디아가 차세대 AI 가속기 생산 계획을 기존 대비 30퍼센트 상향했다.',
      '추가 물량 대응을 위해 HBM 조달을 늘릴 것으로 알려졌다.',
      '국내 메모리 업체의 공급 비중이 확대될 전망이다.',
    ],
    main: {
      nodeId: 'aidc',
      direction: 'UP',
      reason: 'AI 데이터센터 투자 확대가 메모리 수요를 직접 견인',
    },
    related: [
      {
        nodeId: 'sk',
        direction: 'UP',
        relation: 'HBM 주력 생산',
        chain: ['aidc', 'hbm', 'sk'],
      },
      {
        nodeId: 'hanmi',
        direction: 'UP',
        relation: 'HBM 필수 장비',
        chain: ['aidc', 'hbm', 'hanmi'],
      },
      {
        nodeId: 'ss',
        direction: 'UP',
        relation: 'HBM 생산',
        chain: ['aidc', 'hbm', 'ss'],
      },
      {
        nodeId: 'eo',
        direction: 'UP',
        relation: '장비 납품',
        chain: ['aidc', 'hbm', 'sk', 'eo'],
      },
    ],
    rationale: {
      event: '엔비디아가 AI 가속기 생산 물량을 30퍼센트 상향',
      propagation:
        'AI 데이터센터 수요가 HBM을 거쳐 <b>SK하이닉스 · 삼성전자</b>로, 다시 후공정 장비사인 <b>한미반도체</b>까지 이어짐',
      precedent:
        '유사 수요 상향 뉴스 6건 중 4건에서 메모리주가 익일 평균 <b>+2.2%</b>',
    },
  },
  {
    id: 'n3',
    sector: '2차전지',
    title: '리튬 가격 3개월 만에 최저… 양극재 판가 연동 하락 불가피',
    press: '머니투데이',
    publishedAt: `${TODAY}T08:05:00+09:00`,
    relativeTime: '1시간 전',
    originUrl: 'https://news.mt.co.kr/',
    summary: [
      '탄산리튬 현물 가격이 3개월 만에 최저 수준으로 내려왔다.',
      '양극재는 리튬 가격에 판가가 연동되는 구조다.',
      '배터리 셀 업체는 원가 부담이 줄어드는 반대 효과가 예상된다.',
    ],
    main: {
      nodeId: 'li',
      direction: 'DOWN',
      reason: '리튬 현물 가격이 3개월 내 최저 수준으로 하락',
    },
    related: [
      {
        nodeId: 'ecop',
        direction: 'DOWN',
        relation: '양극재 판가 연동',
        chain: ['li', 'cath', 'ecop'],
      },
      {
        nodeId: 'posf',
        direction: 'DOWN',
        relation: '양극재 판가 연동',
        chain: ['li', 'cath', 'posf'],
      },
      {
        nodeId: 'lnf',
        direction: 'DOWN',
        relation: '양극재 판가 연동',
        chain: ['li', 'cath', 'lnf'],
      },
      {
        nodeId: 'lgen',
        direction: 'UP',
        relation: '원가 하락 수혜',
        chain: ['li', 'cath', 'lgen'],
      },
    ],
    rationale: {
      event: '탄산리튬 현물 가격이 3개월 만에 최저치 기록',
      propagation:
        '양극재를 만들어 파는 <b>에코프로비엠 · 포스코퓨처엠 · 엘앤에프</b>는 판가가 함께 내려가고, 그 양극재를 사다 쓰는 <b>LG에너지솔루션</b>은 반대로 원가가 낮아짐',
      precedent:
        '리튬 급락 구간 7건 중 5건에서 양극재주가 익일 평균 <b>-2.6%</b>',
    },
  },
  {
    id: 'n4',
    sector: '2차전지',
    title: '美, 중국산 전기차 관세 추가 인상… 한국 배터리 반사이익 전망',
    press: '서울경제',
    publishedAt: `${TODAY}T07:20:00+09:00`,
    relativeTime: '2시간 전',
    originUrl: 'https://www.sedaily.com/',
    summary: [
      '미국이 중국산 전기차에 대한 관세를 추가 인상하기로 했다.',
      '북미 생산 거점을 확보한 한국 배터리 업체가 수혜 대상으로 지목된다.',
      '양극재 등 소재 발주도 함께 늘어날 전망이다.',
    ],
    main: {
      nodeId: 'lgen',
      direction: 'UP',
      reason: '북미 생산 거점 기반으로 관세 인상의 직접 수혜',
    },
    related: [
      {
        nodeId: 'ecop',
        direction: 'UP',
        relation: '양극재 조달처',
        chain: ['lgen', 'ecop'],
      },
      {
        nodeId: 'lnf',
        direction: 'UP',
        relation: '양극재 조달처',
        chain: ['lgen', 'lnf'],
      },
      {
        nodeId: 'cb',
        direction: 'UP',
        relation: '첨가제 공급',
        chain: ['lgen', 'cb'],
      },
      {
        nodeId: 'sdi',
        direction: 'UP',
        relation: '배터리 공급',
        chain: ['lgen', 'ev', 'sdi'],
      },
    ],
    rationale: {
      event: '미국이 중국산 전기차 관세를 추가 인상',
      propagation:
        '북미 거점을 가진 <b>LG에너지솔루션</b>의 수주가 늘면 양극재와 첨가제를 대는 <b>에코프로비엠 · 엘앤에프 · 천보</b>의 발주도 함께 증가',
      precedent:
        '관세 인상 관련 뉴스 4건 중 3건에서 배터리주가 익일 평균 <b>+1.8%</b>',
    },
  },
  {
    id: 'n5',
    sector: '방산',
    title: '폴란드, K9 자주포 2차 실행계약 서명… 3조원대 규모',
    press: '뉴시스',
    publishedAt: `${TODAY}T06:41:00+09:00`,
    relativeTime: '3시간 전',
    originUrl: 'https://www.newsis.com/',
    summary: [
      '폴란드 정부가 K9 자주포 2차 실행계약에 서명했다.',
      '계약 규모는 3조원대로 알려졌다.',
      '탄약 패키지가 별도 협상으로 이어질 가능성이 제기된다.',
    ],
    main: {
      nodeId: 'hwa',
      direction: 'UP',
      reason: 'K9 자주포 생산 주체로 계약 물량이 전량 반영',
    },
    related: [
      {
        nodeId: 'pung',
        direction: 'UP',
        relation: '탄약 공급',
        chain: ['hwa', 'pung'],
      },
      {
        nodeId: 'rotem',
        direction: 'UP',
        relation: '방산 수출 확대',
        chain: ['hwa', 'dex', 'rotem'],
      },
      {
        nodeId: 'kai',
        direction: 'UP',
        relation: '방산 수출 확대',
        chain: ['hwa', 'dex', 'kai'],
      },
      {
        nodeId: 'lig',
        direction: 'DOWN',
        relation: '경쟁 관계',
        chain: ['hwa', 'lig'],
      },
    ],
    rationale: {
      event: '폴란드가 K9 자주포 2차 실행계약에 서명, 3조원대 규모',
      propagation:
        '생산 주체인 <b>한화에어로스페이스</b>가 물량을 받으면 탄약을 대는 <b>풍산</b>도 함께 늘고, 방산 수출 기대가 <b>현대로템 · 한국항공우주</b>로 번짐',
      precedent:
        '대형 수출 계약 공시 8건 중 6건에서 방산주가 익일 평균 <b>+4.2%</b>',
    },
  },
  {
    id: 'n6',
    sector: '방산',
    title: '국방부, 차세대 장거리 유도무기 개발사업 착수',
    press: '국방일보',
    publishedAt: `${TODAY}T04:30:00+09:00`,
    relativeTime: '5시간 전',
    originUrl: 'https://kookbang.dema.mil.kr/',
    summary: [
      '국방부가 차세대 장거리 유도무기 개발사업에 착수했다고 밝혔다.',
      '총 사업비와 개발 기간은 추후 확정될 예정이다.',
      '유도무기 체계 개발 경험이 있는 업체가 주관사 후보로 거론된다.',
    ],
    main: {
      nodeId: 'lig',
      direction: 'UP',
      reason: '유도무기 체계 개발 이력으로 사업 참여 가능성 최상위',
    },
    related: [
      {
        nodeId: 'kai',
        direction: 'UP',
        relation: '방산 수출 확대',
        chain: ['lig', 'dex', 'kai'],
      },
      {
        nodeId: 'pung',
        direction: 'UP',
        relation: '방산 수출 확대',
        chain: ['lig', 'dex', 'pung'],
      },
      {
        nodeId: 'hwa',
        direction: 'DOWN',
        relation: '경쟁 관계',
        chain: ['lig', 'hwa'],
      },
    ],
    rationale: {
      event: '국방부가 차세대 장거리 유도무기 개발사업에 착수',
      propagation:
        '유도무기를 만들어 온 <b>LIG넥스원</b>이 주관사 후보로 앞서고, 같은 사업을 노리는 <b>한화에어로스페이스</b>에는 수주 분산 요인',
      precedent:
        '개발사업 착수 뉴스 5건 중 3건에서 주관 후보사가 익일 평균 <b>+2.4%</b>',
    },
  },
]

export const VERIFY_ENTRIES: VerifyEntry[] = [
  {
    newsId: 'v1',
    date: '07-17',
    sector: '반도체',
    title: 'SK하이닉스, 엔비디아향 HBM 공급 계약 확대',
    items: [
      {
        name: '한미반도체',
        predicted: 'UP',
        actualReturn: 3.42,
        hit: true,
        pathLabel: '장비 공급 · 1단계',
      },
      {
        name: '삼성전자',
        predicted: 'DOWN',
        actualReturn: -0.81,
        hit: true,
        pathLabel: '경쟁 관계 · 1단계',
      },
      {
        name: 'HPSP',
        predicted: 'UP',
        actualReturn: 1.94,
        hit: true,
        pathLabel: '고압 어닐링 장비 · 1단계',
      },
      {
        name: '원익IPS',
        predicted: 'UP',
        actualReturn: -0.35,
        hit: false,
        pathLabel: '증착 장비 · 1단계',
      },
    ],
  },
  {
    newsId: 'v2',
    date: '07-17',
    sector: '2차전지',
    title: '유럽 배터리 규제 완화 논의 시작',
    items: [
      {
        name: 'LG에너지솔루션',
        predicted: 'UP',
        actualReturn: 1.62,
        hit: true,
        pathLabel: '뉴스 직접 언급',
      },
      {
        name: '삼성SDI',
        predicted: 'UP',
        actualReturn: 0.94,
        hit: true,
        pathLabel: '전기차 배터리 공급 · 2단계',
      },
      {
        name: 'SK이노베이션',
        predicted: 'UP',
        actualReturn: -0.42,
        hit: false,
        pathLabel: '전기차 배터리 공급 · 2단계',
      },
    ],
  },
  {
    newsId: 'v3',
    date: '07-16',
    sector: '2차전지',
    title: '美 전기차 보조금 개편안 발표',
    items: [
      {
        name: 'LG에너지솔루션',
        predicted: 'UP',
        actualReturn: 2.15,
        hit: true,
        pathLabel: '뉴스 직접 언급',
      },
      {
        name: '에코프로비엠',
        predicted: 'UP',
        actualReturn: -1.24,
        hit: false,
        pathLabel: '양극재 조달 · 1단계',
      },
      {
        name: '엘앤에프',
        predicted: 'UP',
        actualReturn: 0.88,
        hit: true,
        pathLabel: '양극재 조달 · 1단계',
      },
    ],
  },
  {
    newsId: 'v4',
    date: '07-16',
    sector: '반도체',
    title: 'D램 고정거래가 3개월 연속 상승',
    items: [
      {
        name: '삼성전자',
        predicted: 'UP',
        actualReturn: 1.85,
        hit: true,
        pathLabel: 'D램 생산 · 1단계',
      },
      {
        name: 'SK하이닉스',
        predicted: 'UP',
        actualReturn: 2.94,
        hit: true,
        pathLabel: 'D램 주력 생산 · 1단계',
      },
      {
        name: '리노공업',
        predicted: 'UP',
        actualReturn: 1.06,
        hit: true,
        pathLabel: '테스트 소켓 · 2단계',
      },
    ],
  },
  {
    newsId: 'v5',
    date: '07-15',
    sector: '방산',
    title: '루마니아, K9 자주포 도입 검토 보도',
    items: [
      {
        name: '한화에어로스페이스',
        predicted: 'UP',
        actualReturn: 4.86,
        hit: true,
        pathLabel: 'K9 생산 · 1단계',
      },
      {
        name: '풍산',
        predicted: 'UP',
        actualReturn: 2.03,
        hit: true,
        pathLabel: '탄약 공급 · 2단계',
      },
      {
        name: '현대로템',
        predicted: 'UP',
        actualReturn: 1.42,
        hit: true,
        pathLabel: '방산 수출 · 2단계',
      },
      {
        name: 'LIG넥스원',
        predicted: 'DOWN',
        actualReturn: -0.55,
        hit: true,
        pathLabel: '경쟁 관계 · 2단계',
      },
    ],
  },
  {
    newsId: 'v6',
    date: '07-15',
    sector: '반도체',
    title: '파운드리 선단공정 수율 개선 발표',
    items: [
      {
        name: '삼성전자',
        predicted: 'UP',
        actualReturn: 0.74,
        hit: true,
        pathLabel: '파운드리 영위 · 1단계',
      },
      {
        name: '동진쎄미켐',
        predicted: 'UP',
        actualReturn: 2.21,
        hit: true,
        pathLabel: '포토레지스트 · 2단계',
      },
      {
        name: '주성엔지니어링',
        predicted: 'UP',
        actualReturn: 1.55,
        hit: true,
        pathLabel: '장비 공급 · 2단계',
      },
    ],
  },
  {
    newsId: 'v7',
    date: '07-14',
    sector: '2차전지',
    title: '리튬 현물가 반등, 3주 만에 상승 전환',
    items: [
      {
        name: '에코프로비엠',
        predicted: 'UP',
        actualReturn: 1.77,
        hit: true,
        pathLabel: '양극재 판가 연동 · 2단계',
      },
      {
        name: '포스코퓨처엠',
        predicted: 'UP',
        actualReturn: 1.31,
        hit: true,
        pathLabel: '양극재 판가 연동 · 2단계',
      },
      {
        name: 'LG에너지솔루션',
        predicted: 'DOWN',
        actualReturn: 0.42,
        hit: false,
        pathLabel: '원가 상승 부담 · 3단계',
      },
    ],
  },
  {
    newsId: 'v8',
    date: '07-14',
    sector: '방산',
    title: '중동 방산 전시회서 수출 상담 확대',
    items: [
      {
        name: 'LIG넥스원',
        predicted: 'UP',
        actualReturn: 1.24,
        hit: true,
        pathLabel: '방산 수출 · 1단계',
      },
      {
        name: '한국항공우주',
        predicted: 'UP',
        actualReturn: 0.66,
        hit: true,
        pathLabel: '방산 수출 · 1단계',
      },
      {
        name: '풍산',
        predicted: 'UP',
        actualReturn: -0.31,
        hit: false,
        pathLabel: '탄약 수출 · 1단계',
      },
    ],
  },
  {
    newsId: 'v9',
    date: '07-11',
    sector: '반도체',
    title: '국내 파운드리 신규 수주 소식',
    items: [
      {
        name: 'DB하이텍',
        predicted: 'UP',
        actualReturn: 2.68,
        hit: true,
        pathLabel: '파운드리 영위 · 1단계',
      },
      {
        name: '삼성전자',
        predicted: 'UP',
        actualReturn: 1.12,
        hit: true,
        pathLabel: '파운드리 영위 · 1단계',
      },
      {
        name: '주성엔지니어링',
        predicted: 'UP',
        actualReturn: -0.92,
        hit: false,
        pathLabel: '장비 공급 · 2단계',
      },
    ],
  },
  {
    newsId: 'v10',
    date: '07-11',
    sector: '2차전지',
    title: '현대차 전용 전기차 플랫폼 증산 계획',
    items: [
      {
        name: '현대차',
        predicted: 'UP',
        actualReturn: 1.44,
        hit: true,
        pathLabel: '뉴스 직접 언급',
      },
      {
        name: 'LG에너지솔루션',
        predicted: 'UP',
        actualReturn: 1.02,
        hit: true,
        pathLabel: '배터리 공급 · 2단계',
      },
      {
        name: '천보',
        predicted: 'UP',
        actualReturn: 0.58,
        hit: true,
        pathLabel: '첨가제 조달 · 3단계',
      },
    ],
  },
  {
    newsId: 'v11',
    date: '07-10',
    sector: '방산',
    title: '중동 지역 유도무기 수출 협상 개시',
    items: [
      {
        name: 'LIG넥스원',
        predicted: 'UP',
        actualReturn: 3.55,
        hit: true,
        pathLabel: '유도무기 생산 · 1단계',
      },
      {
        name: '한화에어로스페이스',
        predicted: 'DOWN',
        actualReturn: -0.64,
        hit: true,
        pathLabel: '경쟁 관계 · 1단계',
      },
      {
        name: '한국항공우주',
        predicted: 'UP',
        actualReturn: 0.71,
        hit: true,
        pathLabel: '방산 수출 · 2단계',
      },
    ],
  },
  {
    newsId: 'v12',
    date: '07-10',
    sector: '반도체',
    title: 'HBM 후공정 장비 발주 확대 관측',
    items: [
      {
        name: '한미반도체',
        predicted: 'UP',
        actualReturn: 2.86,
        hit: true,
        pathLabel: 'TC본더 필수 · 1단계',
      },
      {
        name: '이오테크닉스',
        predicted: 'UP',
        actualReturn: 1.33,
        hit: true,
        pathLabel: '레이저 장비 · 2단계',
      },
      {
        name: '티씨케이',
        predicted: 'UP',
        actualReturn: -0.28,
        hit: false,
        pathLabel: '소모품 공급 · 2단계',
      },
    ],
  },
  {
    newsId: 'v13',
    date: '07-09',
    sector: '방산',
    title: '국방예산 증액안 국회 제출',
    items: [
      {
        name: '현대로템',
        predicted: 'UP',
        actualReturn: 1.18,
        hit: true,
        pathLabel: '방산 수출 · 1단계',
      },
      {
        name: '한화에어로스페이스',
        predicted: 'UP',
        actualReturn: 0.92,
        hit: true,
        pathLabel: '수출 주도 · 1단계',
      },
      {
        name: '풍산',
        predicted: 'UP',
        actualReturn: 1.47,
        hit: true,
        pathLabel: '탄약 수출 · 1단계',
      },
    ],
  },
  {
    newsId: 'v14',
    date: '07-08',
    sector: '2차전지',
    title: '양극재 신규 증설 계획 발표',
    items: [
      {
        name: '포스코퓨처엠',
        predicted: 'UP',
        actualReturn: 2.34,
        hit: true,
        pathLabel: '양극재 생산 · 1단계',
      },
      {
        name: '엘앤에프',
        predicted: 'UP',
        actualReturn: -1.06,
        hit: false,
        pathLabel: '양극재 생산 · 1단계',
      },
      {
        name: '에코프로비엠',
        predicted: 'UP',
        actualReturn: 0.85,
        hit: true,
        pathLabel: '양극재 생산 · 1단계',
      },
    ],
  },
]

const DAILY_HIT_RATES = [
  0.62, 0.71, 0.55, 0.68, 0.74, 0.66, 0.58, 0.7, 0.77, 0.64, 0.6, 0.72, 0.69,
  0.75, 0.58, 0.63, 0.71, 0.8, 0.66, 0.61, 0.73, 0.68, 0.7, 0.59, 0.76, 0.72,
  0.65, 0.7, 0.74, 0.69,
]

/** 최근 30거래일(=최근 30일, 어제까지)에 적중률을 매핑. 실행 시점 기준으로 계산해 데모가 언제 열려도 날짜가 맞는다. */
export function buildVerifyDaily(): VerifyDaily[] {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return DAILY_HIT_RATES.map((hitRate, i) => {
    const d = new Date(yesterday)
    d.setDate(d.getDate() - (DAILY_HIT_RATES.length - 1 - i))
    return { date: d.toISOString().slice(0, 10), hitRate }
  })
}
