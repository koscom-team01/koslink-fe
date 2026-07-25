import type {
  Direction,
  OntologyEdge,
  OntologyNode,
  RelationType,
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

// 개념 노드(실제 온톨로지의 Role/Theme — 프론트는 거래 불가 노드로만 구분하면 되므로 CONCEPT로 통칭): [id, 이름, 섹터]
const RAW_CONCEPTS: [string, string, string][] = [
  ['hbm', 'HBM', '반도체'],
  ['dram', 'D램', '반도체'],
  ['fdry', '파운드리', '반도체'],
  ['aidc', 'AI 데이터센터', '반도체'],
  ['cath', '양극재', '2차전지'],
  ['li', '리튬', '2차전지'],
  ['ev', '전기차', '2차전지'],
  ['k9', 'K9 자주포', '방산'],
  ['gm', '유도무기', '방산'],
  ['dex', '방산 수출', '방산'],
  ['agr', '해외 정부계약', '방산'],
]

export const ONTOLOGY_NODES: OntologyNode[] = [
  ...RAW_COMPANIES.map(
    ([id, name, ticker, sector, marketCap]): OntologyNode => ({
      id,
      name,
      kind: 'STOCK',
      ticker,
      sector,
      marketCap,
    }),
  ),
  ...RAW_CONCEPTS.map(([id, name, sector]): OntologyNode => ({
    id,
    name,
    kind: 'CONCEPT',
    sector,
  })),
]

// [source, target, relation, relationType?] — relationType은 실제 RELATED_TO.relation_type이며
// STOCK-STOCK 경쟁·계열 관계에만 붙는다. 생략된 엣지(SUPPLY_TO 등)는 항상 동조로 취급된다.
const RAW_EDGES: [string, string, string, RelationType?][] = [
  ['sk', 'hbm', '주력 생산'],
  ['sk', 'dram', '주력 생산'],
  ['sk', 'hanmi', '장비 공급'],
  ['sk', 'ss', '경쟁', 'COMPETITOR'],
  ['sk', 'eo', '레이저 장비'],
  ['sk', 'wonik', '증착 장비'],
  ['sk', 'hpsp', '고압 어닐링'],
  ['sk', 'lino', '테스트 소켓'],
  ['sk', 'tck', '소모품 공급'],
  ['sk', 'solb', '공정 소재'],
  ['hbm', 'hanmi', 'TC본더 필수'],
  ['hbm', 'aidc', '수요 견인'],
  ['ss', 'hbm', '생산'],
  ['ss', 'dram', '생산'],
  ['ss', 'fdry', '사업 영위'],
  ['ss', 'jusung', '장비 공급'],
  ['ss', 'lino', '테스트 소켓'],
  ['ss', 'dj', '포토레지스트'],
  ['dbh', 'fdry', '사업 영위'],
  ['aidc', 'fdry', '수요 견인'],
  ['dram', 'aidc', '수요 견인'],
  ['lgen', 'cath', '핵심 소재'],
  ['lgen', 'ecop', '양극재 조달'],
  ['lgen', 'lnf', '양극재 조달'],
  ['lgen', 'sdi', '경쟁', 'COMPETITOR'],
  ['lgen', 'ev', '배터리 공급'],
  ['lgen', 'cb', '첨가제 조달'],
  ['lgen', 'skinn', '경쟁', 'COMPETITOR'],
  ['sdi', 'posf', '양극재 조달'],
  ['sdi', 'ev', '배터리 공급'],
  ['ecop', 'cath', '생산'],
  ['posf', 'cath', '생산'],
  ['lnf', 'cath', '생산'],
  ['cath', 'li', '원재료'],
  ['skinn', 'ev', '배터리 공급'],
  ['ev', 'hmc', '완성차'],
  ['hwa', 'k9', '생산'],
  ['hwa', 'dex', '수출 주도'],
  ['hwa', 'pung', '탄약 조달'],
  ['hwa', 'lig', '경쟁', 'COMPETITOR'],
  ['lig', 'gm', '생산'],
  ['lig', 'dex', '수출'],
  ['rotem', 'dex', '수출'],
  ['kai', 'dex', '수출'],
  ['pung', 'dex', '탄약 수출'],
  ['k9', 'dex', '대표 품목'],
  ['gm', 'dex', '대표 품목'],
  ['dex', 'agr', '계약 형태'],
  ['k9', 'agr', '계약 대상'],
  ['kai', 'hwa', '엔진 협력'],
  ['rotem', 'hmc', '계열사', 'AFFILIATE'],
  ['pung', 'k9', '탄약 공급'],
]

export const ONTOLOGY_EDGES: OntologyEdge[] = RAW_EDGES.map(
  ([source, target, relation, relationType], i) => ({
    id: `e${i}`,
    source,
    target,
    relation,
    relationType,
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
  // n7 ~ n25: 커서 기반 페이징(기본 limit=20) 테스트용으로 추가한 필러 뉴스.
  // 기존 온톨로지 노드·엣지만 재사용해 그래프/분석 패널이 항상 유효하게 뜨도록 한다.
  {
    id: 'n7',
    sector: '반도체',
    title: '삼성전자, 파운드리 신규 고객사 대형 수주 체결',
    press: '한국경제',
    publishedAt: '2026-07-20T03:40:00+09:00',
    relativeTime: '6시간 전',
    originUrl: 'https://www.hankyung.com/',
    summary: [
      '삼성전자가 해외 팹리스 업체와 파운드리 대형 공급 계약을 체결했다.',
      '선단 공정 라인의 가동률이 큰 폭으로 오를 전망이다.',
      '관련 장비·소재 협력사 발주도 함께 늘어날 것으로 보인다.',
    ],
    main: {
      nodeId: 'ss',
      direction: 'UP',
      reason: '파운드리 대형 수주로 가동률이 직접 개선되는 당사자',
    },
    related: [
      {
        nodeId: 'jusung',
        direction: 'UP',
        relation: '장비 공급',
        chain: ['ss', 'jusung'],
      },
      {
        nodeId: 'lino',
        direction: 'UP',
        relation: '테스트 소켓',
        chain: ['ss', 'lino'],
      },
      {
        nodeId: 'dj',
        direction: 'UP',
        relation: '포토레지스트',
        chain: ['ss', 'dj'],
      },
      {
        nodeId: 'sk',
        direction: 'DOWN',
        relation: '경쟁',
        chain: ['ss', 'sk'],
      },
    ],
    rationale: {
      event: '삼성전자가 파운드리 신규 고객사 대형 수주를 확정',
      propagation:
        '장비·소재를 대는 <b>주성엔지니어링·리노공업·동진쎄미켐</b>에는 발주 확대 요인, 경쟁하는 <b>SK하이닉스</b>에는 점유율 압박 요인',
      precedent:
        '대형 파운드리 수주 공시 4건 중 3건에서 협력사가 익일 평균 <b>+2.8%</b>',
    },
  },
  {
    id: 'n8',
    sector: '반도체',
    title: '글로벌 AI 서버 수요 폭증… HBM 공급 부족 심화',
    press: '이데일리',
    publishedAt: '2026-07-20T01:15:00+09:00',
    relativeTime: '8시간 전',
    originUrl: 'https://www.edaily.co.kr/',
    summary: [
      'AI 서버향 수요가 예상을 웃돌며 HBM 공급 부족이 심화하고 있다.',
      '주요 메모리 업체의 HBM 가동률이 이미 최대치에 근접했다.',
      '후공정 장비 업체의 증설 압박도 함께 커지는 모습이다.',
    ],
    main: {
      nodeId: 'hbm',
      direction: 'UP',
      reason: 'AI 서버 수요 폭증으로 공급 부족이 직접 확인된 품목',
    },
    related: [
      {
        nodeId: 'sk',
        direction: 'UP',
        relation: '주력 생산',
        chain: ['hbm', 'sk'],
      },
      {
        nodeId: 'ss',
        direction: 'UP',
        relation: '생산',
        chain: ['hbm', 'ss'],
      },
      {
        nodeId: 'hanmi',
        direction: 'UP',
        relation: 'TC본더 필수',
        chain: ['hbm', 'hanmi'],
      },
      {
        nodeId: 'aidc',
        direction: 'UP',
        relation: '수요 견인',
        chain: ['hbm', 'aidc'],
      },
    ],
    rationale: {
      event: 'AI 서버향 수요 폭증으로 HBM 공급 부족이 심화',
      propagation:
        'HBM을 만드는 <b>SK하이닉스·삼성전자</b>의 가동률이 오르고, 후공정 필수 장비인 <b>한미반도체</b> 발주가 함께 늘어남',
      precedent:
        '유사 공급 부족 뉴스 6건 중 5건에서 HBM 관련주가 익일 평균 <b>+3.5%</b>',
    },
  },
  {
    id: 'n9',
    sector: '반도체',
    title: 'D램 가격 협상력 강화… 상반기 실적 개선 기대',
    press: '조선비즈',
    publishedAt: '2026-07-19T22:50:00+09:00',
    relativeTime: '10시간 전',
    originUrl: 'https://biz.chosun.com/',
    summary: [
      'D램 고정거래가 협상에서 공급사 협상력이 강화됐다.',
      '재고 조정이 마무리 국면에 접어든 영향으로 풀이된다.',
      '상반기 메모리 업체 실적 개선 기대가 커지고 있다.',
    ],
    main: {
      nodeId: 'dram',
      direction: 'UP',
      reason: 'D램 협상력 강화가 가격에 직접 반영되는 품목',
    },
    related: [
      {
        nodeId: 'sk',
        direction: 'UP',
        relation: '주력 생산',
        chain: ['dram', 'sk'],
      },
      {
        nodeId: 'ss',
        direction: 'UP',
        relation: '생산',
        chain: ['dram', 'ss'],
      },
      {
        nodeId: 'aidc',
        direction: 'UP',
        relation: '수요 견인',
        chain: ['dram', 'aidc'],
      },
    ],
    rationale: {
      event: 'D램 고정거래가 협상에서 공급사 협상력이 강화',
      propagation:
        'D램을 주력 생산하는 <b>SK하이닉스·삼성전자</b>의 수익성이 함께 개선',
      precedent:
        '유사 협상력 강화 뉴스 5건 중 4건에서 메모리주가 익일 평균 <b>+1.9%</b>',
    },
  },
  {
    id: 'n10',
    sector: '반도체',
    title: '원익IPS, 국내 최대 반도체 라인 증착 장비 공급 계약',
    press: '파이낸셜뉴스',
    publishedAt: '2026-07-19T18:30:00+09:00',
    relativeTime: '15시간 전',
    originUrl: 'https://www.fnnews.com/',
    summary: [
      '원익IPS가 대형 반도체 라인향 증착 장비 공급 계약을 체결했다.',
      '계약 규모는 회사 연 매출의 상당 부분에 해당한다.',
      '납품은 올해 하반기부터 순차 진행될 예정이다.',
    ],
    main: {
      nodeId: 'wonik',
      direction: 'UP',
      reason: '대형 증착 장비 공급 계약의 직접 수혜 당사자',
    },
    related: [
      {
        nodeId: 'sk',
        direction: 'UP',
        relation: '증착 장비',
        chain: ['wonik', 'sk'],
      },
    ],
    rationale: {
      event: '원익IPS가 대형 반도체 라인향 증착 장비 공급 계약을 체결',
      propagation:
        '장비를 공급받는 <b>SK하이닉스</b>의 증설 일정과 맞물려 함께 주목받음',
      precedent:
        '유사 대형 장비 수주 공시 3건 중 2건에서 익일 평균 <b>+5.1%</b>',
    },
  },
  {
    id: 'n11',
    sector: '반도체',
    title: 'HPSP, 고압 어닐링 장비 해외 수주 확대',
    press: '뉴스1',
    publishedAt: '2026-07-19T14:05:00+09:00',
    relativeTime: '19시간 전',
    originUrl: 'https://www.news1.kr/',
    summary: [
      'HPSP가 해외 반도체 업체향 고압 어닐링 장비 수주를 확대했다.',
      '해외 매출 비중이 처음으로 절반을 넘어설 전망이다.',
      '증설된 생산라인은 내년부터 본격 가동된다.',
    ],
    main: {
      nodeId: 'hpsp',
      direction: 'UP',
      reason: '해외 수주 확대의 직접 수혜 당사자',
    },
    related: [
      {
        nodeId: 'sk',
        direction: 'UP',
        relation: '고압 어닐링',
        chain: ['hpsp', 'sk'],
      },
    ],
    rationale: {
      event: 'HPSP가 해외 고압 어닐링 장비 수주를 확대',
      propagation:
        '국내 수요처인 <b>SK하이닉스</b>향 공급 실적과 함께 시장이 재평가',
      precedent:
        '유사 해외 수주 확대 뉴스 4건 중 3건에서 익일 평균 <b>+3.0%</b>',
    },
  },
  {
    id: 'n12',
    sector: '반도체',
    title: '티씨케이, 반도체 소모품 공급 물량 증가',
    press: '매일경제',
    publishedAt: '2026-07-19T09:20:00+09:00',
    relativeTime: '1일 전',
    originUrl: 'https://www.mk.co.kr/',
    summary: [
      '티씨케이의 반도체 공정용 소모품 공급 물량이 늘었다.',
      '고객사 라인 가동률 상승이 주된 배경으로 지목된다.',
      '분기 실적에 긍정적으로 반영될 전망이다.',
    ],
    main: {
      nodeId: 'tck',
      direction: 'UP',
      reason: '소모품 공급 물량 증가의 직접 수혜 당사자',
    },
    related: [
      {
        nodeId: 'sk',
        direction: 'UP',
        relation: '소모품 공급',
        chain: ['tck', 'sk'],
      },
    ],
    rationale: {
      event: '티씨케이의 반도체 공정용 소모품 공급 물량이 증가',
      propagation: '주요 고객사인 <b>SK하이닉스</b>의 가동률 상승과 연동',
      precedent:
        '유사 소모품 공급 확대 뉴스 3건 중 2건에서 익일 평균 <b>+2.0%</b>',
    },
  },
  {
    id: 'n13',
    sector: '반도체',
    title: 'DB하이텍, 파운드리 가동률 상승',
    press: '아시아경제',
    publishedAt: '2026-07-19T06:45:00+09:00',
    relativeTime: '1일 전',
    originUrl: 'https://www.asiae.co.kr/',
    summary: [
      'DB하이텍의 8인치 파운드리 가동률이 상승했다.',
      '차량용·전력 반도체 수요 회복이 배경으로 꼽힌다.',
      '가격 협상력도 함께 개선되고 있다.',
    ],
    main: {
      nodeId: 'dbh',
      direction: 'UP',
      reason: '파운드리 가동률 상승의 직접 당사자',
    },
    related: [
      {
        nodeId: 'fdry',
        direction: 'UP',
        relation: '사업 영위',
        chain: ['dbh', 'fdry'],
      },
    ],
    rationale: {
      event: 'DB하이텍의 8인치 파운드리 가동률이 상승',
      propagation: '파운드리 업황 개선 테마 전반에 긍정적으로 반영',
      precedent: '유사 가동률 상승 뉴스 4건 중 3건에서 익일 평균 <b>+2.6%</b>',
    },
  },
  {
    id: 'n14',
    sector: '2차전지',
    title: '삼성SDI, 유럽 완성차 배터리 공급 계약 체결',
    press: '한국경제',
    publishedAt: '2026-07-18T20:10:00+09:00',
    relativeTime: '1일 전',
    originUrl: 'https://www.hankyung.com/',
    summary: [
      '삼성SDI가 유럽 완성차 업체와 배터리 공급 계약을 체결했다.',
      '유럽 공장 증설이 뒤따를 것으로 예상된다.',
      '경쟁사 대비 수주 잔고가 크게 늘었다.',
    ],
    main: {
      nodeId: 'sdi',
      direction: 'UP',
      reason: '유럽 배터리 공급 계약의 직접 당사자',
    },
    related: [
      {
        nodeId: 'posf',
        direction: 'UP',
        relation: '양극재 조달',
        chain: ['sdi', 'posf'],
      },
      {
        nodeId: 'ev',
        direction: 'UP',
        relation: '배터리 공급',
        chain: ['sdi', 'ev'],
      },
      {
        nodeId: 'lgen',
        direction: 'DOWN',
        relation: '경쟁',
        chain: ['sdi', 'lgen'],
      },
    ],
    rationale: {
      event: '삼성SDI가 유럽 완성차 배터리 공급 계약을 체결',
      propagation:
        '양극재를 대는 <b>포스코퓨처엠</b>에는 발주 확대 요인, 경쟁하는 <b>LG에너지솔루션</b>에는 수주 분산 요인',
      precedent:
        '유사 유럽向 공급 계약 뉴스 4건 중 3건에서 익일 평균 <b>+2.3%</b>',
    },
  },
  {
    id: 'n15',
    sector: '2차전지',
    title: '에코프로비엠, 양극재 생산능력 증설 발표',
    press: '이데일리',
    publishedAt: '2026-07-18T15:35:00+09:00',
    relativeTime: '2일 전',
    originUrl: 'https://www.edaily.co.kr/',
    summary: [
      '에코프로비엠이 양극재 생산능력 증설 계획을 발표했다.',
      '증설분은 2028년부터 순차 가동될 예정이다.',
      '고객사 다변화도 함께 추진 중이다.',
    ],
    main: {
      nodeId: 'ecop',
      direction: 'UP',
      reason: '생산능력 증설 발표의 직접 당사자',
    },
    related: [
      {
        nodeId: 'lgen',
        direction: 'UP',
        relation: '양극재 조달',
        chain: ['ecop', 'lgen'],
      },
      {
        nodeId: 'cath',
        direction: 'UP',
        relation: '생산',
        chain: ['ecop', 'cath'],
      },
    ],
    rationale: {
      event: '에코프로비엠이 양극재 생산능력 증설을 발표',
      propagation:
        '핵심 고객사인 <b>LG에너지솔루션</b>의 공급 안정성과 함께 재평가',
      precedent:
        '유사 양극재 증설 발표 뉴스 5건 중 4건에서 익일 평균 <b>+1.7%</b>',
    },
  },
  {
    id: 'n16',
    sector: '2차전지',
    title: '포스코퓨처엠, 신규 양극재 공장 착공',
    press: '조선비즈',
    publishedAt: '2026-07-18T11:00:00+09:00',
    relativeTime: '2일 전',
    originUrl: 'https://biz.chosun.com/',
    summary: [
      '포스코퓨처엠이 신규 양극재 공장 착공식을 진행했다.',
      '완공 시 국내 최대 규모 생산라인이 될 전망이다.',
      '원료 수급 다변화 계획도 함께 공개됐다.',
    ],
    main: {
      nodeId: 'posf',
      direction: 'UP',
      reason: '신규 공장 착공의 직접 당사자',
    },
    related: [
      {
        nodeId: 'sdi',
        direction: 'UP',
        relation: '양극재 조달',
        chain: ['posf', 'sdi'],
      },
      {
        nodeId: 'cath',
        direction: 'UP',
        relation: '생산',
        chain: ['posf', 'cath'],
      },
    ],
    rationale: {
      event: '포스코퓨처엠이 신규 양극재 공장을 착공',
      propagation:
        '주요 고객사인 <b>삼성SDI</b>의 물량 확보 계획과 맞물려 주목',
      precedent:
        '유사 신규 공장 착공 뉴스 3건 중 2건에서 익일 평균 <b>+2.1%</b>',
    },
  },
  {
    id: 'n17',
    sector: '2차전지',
    title: 'SK이노베이션, 배터리 부문 흑자 전환',
    press: '파이낸셜뉴스',
    publishedAt: '2026-07-18T08:25:00+09:00',
    relativeTime: '2일 전',
    originUrl: 'https://www.fnnews.com/',
    summary: [
      'SK이노베이션 배터리 부문이 분기 기준 흑자 전환에 성공했다.',
      '수율 개선과 가동률 상승이 주된 요인으로 꼽힌다.',
      '내년까지 흑자 기조가 이어질 것으로 회사는 전망했다.',
    ],
    main: {
      nodeId: 'skinn',
      direction: 'UP',
      reason: '배터리 부문 흑자 전환의 직접 당사자',
    },
    related: [
      {
        nodeId: 'lgen',
        direction: 'DOWN',
        relation: '경쟁',
        chain: ['skinn', 'lgen'],
      },
      {
        nodeId: 'ev',
        direction: 'UP',
        relation: '배터리 공급',
        chain: ['skinn', 'ev'],
      },
    ],
    rationale: {
      event: 'SK이노베이션 배터리 부문이 분기 흑자로 전환',
      propagation:
        '경쟁하는 <b>LG에너지솔루션</b>에는 점유율 경쟁 심화 요인으로 작용',
      precedent: '유사 흑자 전환 뉴스 4건 중 3건에서 익일 평균 <b>+2.9%</b>',
    },
  },
  {
    id: 'n18',
    sector: '2차전지',
    title: '천보, 전해질 첨가제 수출 물량 확대',
    press: '뉴스1',
    publishedAt: '2026-07-17T21:50:00+09:00',
    relativeTime: '2일 전',
    originUrl: 'https://www.news1.kr/',
    summary: [
      '천보의 전해질 첨가제 수출 물량이 큰 폭으로 늘었다.',
      '북미 배터리 업체향 공급이 신규로 시작됐다.',
      '증설 라인 가동률도 함께 오르고 있다.',
    ],
    main: {
      nodeId: 'cb',
      direction: 'UP',
      reason: '첨가제 수출 물량 확대의 직접 당사자',
    },
    related: [
      {
        nodeId: 'lgen',
        direction: 'UP',
        relation: '첨가제 조달',
        chain: ['cb', 'lgen'],
      },
    ],
    rationale: {
      event: '천보의 전해질 첨가제 수출 물량이 확대',
      propagation:
        '주요 고객사인 <b>LG에너지솔루션</b>의 원가 구조와 연동해 주목',
      precedent:
        '유사 수출 물량 확대 뉴스 3건 중 2건에서 익일 평균 <b>+3.3%</b>',
    },
  },
  {
    id: 'n19',
    sector: '2차전지',
    title: '현대차, 전기차 신모델 사전계약 흥행',
    press: '매일경제',
    publishedAt: '2026-07-17T16:15:00+09:00',
    relativeTime: '3일 전',
    originUrl: 'https://www.mk.co.kr/',
    summary: [
      '현대차 신형 전기차 사전계약이 목표치를 웃돌았다.',
      '배터리 공급 물량 확대가 뒤따를 것으로 예상된다.',
      '계열사의 생산 대응도 속도를 낼 전망이다.',
    ],
    main: {
      nodeId: 'hmc',
      direction: 'UP',
      reason: '전기차 신모델 흥행의 직접 당사자',
    },
    related: [
      {
        nodeId: 'ev',
        direction: 'UP',
        relation: '완성차',
        chain: ['hmc', 'ev'],
      },
      {
        nodeId: 'rotem',
        direction: 'UP',
        relation: '계열사',
        chain: ['hmc', 'rotem'],
      },
    ],
    rationale: {
      event: '현대차 신형 전기차 사전계약이 목표치를 상회',
      propagation:
        '배터리 공급망 전반과 계열사인 <b>현대로템</b>까지 훈풍이 확산',
      precedent:
        '유사 사전계약 흥행 뉴스 3건 중 2건에서 익일 평균 <b>+1.5%</b>',
    },
  },
  {
    id: 'n20',
    sector: '방산',
    title: '한국항공우주, 동유럽 훈련기 수출 협상 타결',
    press: '국방일보',
    publishedAt: '2026-07-17T10:40:00+09:00',
    relativeTime: '3일 전',
    originUrl: 'https://kookbang.dema.mil.kr/',
    summary: [
      '한국항공우주가 동유럽 국가와 훈련기 수출 협상을 타결했다.',
      '계약 규모는 1조원대로 알려졌다.',
      '후속 정비·부품 계약으로도 이어질 전망이다.',
    ],
    main: {
      nodeId: 'kai',
      direction: 'UP',
      reason: '훈련기 수출 협상 타결의 직접 당사자',
    },
    related: [
      {
        nodeId: 'dex',
        direction: 'UP',
        relation: '수출',
        chain: ['kai', 'dex'],
      },
      {
        nodeId: 'hwa',
        direction: 'UP',
        relation: '엔진 협력',
        chain: ['kai', 'hwa'],
      },
    ],
    rationale: {
      event: '한국항공우주가 동유럽 훈련기 수출 협상을 타결',
      propagation:
        '엔진을 협력하는 <b>한화에어로스페이스</b>에도 수주 훈풍 확산',
      precedent: '유사 훈련기 수출 뉴스 3건 중 2건에서 익일 평균 <b>+3.8%</b>',
    },
  },
  {
    id: 'n21',
    sector: '방산',
    title: '현대로템, K2 전차 2차 수출계약 서명',
    press: '뉴시스',
    publishedAt: '2026-07-17T07:05:00+09:00',
    relativeTime: '3일 전',
    originUrl: 'https://www.newsis.com/',
    summary: [
      '현대로템이 K2 전차 2차 수출계약에 서명했다.',
      '1차 계약 대비 물량이 두 배 이상 늘었다.',
      '현지 생산 비중 확대 방안도 함께 논의됐다.',
    ],
    main: {
      nodeId: 'rotem',
      direction: 'UP',
      reason: 'K2 전차 2차 수출계약의 직접 당사자',
    },
    related: [
      {
        nodeId: 'dex',
        direction: 'UP',
        relation: '수출',
        chain: ['rotem', 'dex'],
      },
      {
        nodeId: 'hmc',
        direction: 'UP',
        relation: '계열사',
        chain: ['rotem', 'hmc'],
      },
    ],
    rationale: {
      event: '현대로템이 K2 전차 2차 수출계약에 서명',
      propagation:
        '방산 수출 테마 전반과 계열사인 <b>현대차</b>까지 관심이 확산',
      precedent:
        '유사 전차 수출계약 뉴스 4건 중 3건에서 익일 평균 <b>+4.5%</b>',
    },
  },
  {
    id: 'n22',
    sector: '방산',
    title: '풍산, 대규모 포탄 수출 계약 체결',
    press: '국방일보',
    publishedAt: '2026-07-16T19:30:00+09:00',
    relativeTime: '3일 전',
    originUrl: 'https://kookbang.dema.mil.kr/',
    summary: [
      '풍산이 대규모 포탄 수출 계약을 체결했다.',
      '계약 물량은 역대 최대 규모로 파악된다.',
      '생산라인 증설도 함께 검토되고 있다.',
    ],
    main: {
      nodeId: 'pung',
      direction: 'UP',
      reason: '대규모 포탄 수출 계약의 직접 당사자',
    },
    related: [
      {
        nodeId: 'hwa',
        direction: 'UP',
        relation: '탄약 조달',
        chain: ['pung', 'hwa'],
      },
      {
        nodeId: 'dex',
        direction: 'UP',
        relation: '탄약 수출',
        chain: ['pung', 'dex'],
      },
      {
        nodeId: 'k9',
        direction: 'UP',
        relation: '탄약 공급',
        chain: ['pung', 'k9'],
      },
    ],
    rationale: {
      event: '풍산이 대규모 포탄 수출 계약을 체결',
      propagation:
        '탄약을 공급받는 <b>한화에어로스페이스</b>의 K9 수출 확대와 맞물려 주목',
      precedent:
        '유사 대규모 탄약 수출 뉴스 4건 중 3건에서 익일 평균 <b>+3.6%</b>',
    },
  },
  {
    id: 'n23',
    sector: '방산',
    title: '국내 유도무기 체계 해외 인증 획득',
    press: '국방일보',
    publishedAt: '2026-07-16T13:55:00+09:00',
    relativeTime: '4일 전',
    originUrl: 'https://kookbang.dema.mil.kr/',
    summary: [
      '국내 개발 유도무기 체계가 해외 인증을 획득했다.',
      '이번 인증으로 수출 절차가 한층 간소화된다.',
      '중동·동남아 국가와의 수출 상담도 본격화될 전망이다.',
    ],
    main: {
      nodeId: 'gm',
      direction: 'UP',
      reason: '해외 인증 획득의 직접 당사자',
    },
    related: [
      {
        nodeId: 'lig',
        direction: 'UP',
        relation: '생산',
        chain: ['gm', 'lig'],
      },
      {
        nodeId: 'dex',
        direction: 'UP',
        relation: '대표 품목',
        chain: ['gm', 'dex'],
      },
    ],
    rationale: {
      event: '국내 유도무기 체계가 해외 인증을 획득',
      propagation:
        '생산을 맡은 <b>LIG넥스원</b>의 수출 파이프라인 확대 기대로 이어짐',
      precedent:
        '유사 해외 인증 획득 뉴스 3건 중 2건에서 익일 평균 <b>+2.7%</b>',
    },
  },
  {
    id: 'n24',
    sector: '방산',
    title: '정부간 방산 패키지 계약 논의 본격화',
    press: '뉴시스',
    publishedAt: '2026-07-16T09:20:00+09:00',
    relativeTime: '4일 전',
    originUrl: 'https://www.newsis.com/',
    summary: [
      '정부간 방산 패키지 계약 논의가 본격화됐다.',
      '무기 체계와 정비·훈련 지원을 묶은 형태로 추진된다.',
      '연내 최종 서명 가능성이 거론되고 있다.',
    ],
    main: {
      nodeId: 'agr',
      direction: 'UP',
      reason: '정부간 패키지 계약 논의의 직접 대상 테마',
    },
    related: [
      {
        nodeId: 'dex',
        direction: 'UP',
        relation: '계약 형태',
        chain: ['agr', 'dex'],
      },
      {
        nodeId: 'k9',
        direction: 'UP',
        relation: '계약 대상',
        chain: ['agr', 'k9'],
      },
    ],
    rationale: {
      event: '정부간 방산 패키지 계약 논의가 본격화',
      propagation:
        '대표 계약 대상으로 거론되는 <b>K9 자주포</b> 라인업에 관심이 집중',
      precedent:
        '유사 정부간 패키지 계약 뉴스 3건 중 2건에서 익일 평균 <b>+3.2%</b>',
    },
  },
  {
    id: 'n25',
    sector: '방산',
    title: 'K9 자주포 3개국 동시 수출 협상 진행',
    press: '국방일보',
    publishedAt: '2026-07-16T06:45:00+09:00',
    relativeTime: '4일 전',
    originUrl: 'https://kookbang.dema.mil.kr/',
    summary: [
      'K9 자주포 수출 협상이 3개국과 동시에 진행되고 있다.',
      '협상이 모두 성사되면 역대 최대 수출 실적이 예상된다.',
      '탄약·부품 후속 계약 규모도 함께 커질 전망이다.',
    ],
    main: {
      nodeId: 'k9',
      direction: 'UP',
      reason: '3개국 동시 수출 협상의 직접 대상 품목',
    },
    related: [
      {
        nodeId: 'hwa',
        direction: 'UP',
        relation: '생산',
        chain: ['k9', 'hwa'],
      },
      {
        nodeId: 'dex',
        direction: 'UP',
        relation: '대표 품목',
        chain: ['k9', 'dex'],
      },
      {
        nodeId: 'pung',
        direction: 'UP',
        relation: '탄약 공급',
        chain: ['k9', 'pung'],
      },
      {
        nodeId: 'agr',
        direction: 'UP',
        relation: '계약 대상',
        chain: ['k9', 'agr'],
      },
    ],
    rationale: {
      event: 'K9 자주포 수출 협상이 3개국과 동시에 진행',
      propagation:
        '생산 주체인 <b>한화에어로스페이스</b>와 탄약을 대는 <b>풍산</b>까지 수혜 기대가 확산',
      precedent:
        '유사 다국 동시 수출 협상 뉴스 3건 중 2건에서 익일 평균 <b>+4.0%</b>',
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
