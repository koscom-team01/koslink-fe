import type {
  Direction,
  OntologyEdge,
  OntologyNode,
  RelationType,
  VerifyDaily,
  VerifyEntry,
} from '#/types'

/**
 * docs/koslink.html의 정적 데모 데이터를 포팅 + 확장한 것.
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
  // 후공정·패키징
  ['nepes', '네패스', '033640', '반도체', 8000],
  ['hanamc', '하나마이크론', '067310', '반도체', 13000],
  ['sfa', 'SFA반도체', '036540', '반도체', 9000],
  ['simmtech', '심텍', '222800', '반도체', 14000],
  ['haesungds', '해성디에스', '195870', '반도체', 8000],
  ['daeduck', '대덕전자', '353200', '반도체', 9000],
  // 테스트·검사
  ['unitest', '유니테스트', '086390', '반도체', 7000],
  ['testna', '테스나', '131290', '반도체', 6000],
  ['exicon', '엑시콘', '092870', '반도체', 3500],
  ['isc', 'ISC', '095340', '반도체', 14000],
  ['nextin', '넥스틴', '348340', '반도체', 9000],
  ['park', '파크시스템스', '140860', '반도체', 17000],
  // 장비
  ['wonikqnc', '원익QnC', '074600', '반도체', 11000],
  ['kctech', '케이씨텍', '281820', '반도체', 15000],
  ['psk', '피에스케이', '319660', '반도체', 18000],
  ['eugene', '유진테크', '084370', '반도체', 16000],
  ['comico', '코미코', '183300', '반도체', 12000],
  ['miraecom', '미래컴퍼니', '049950', '반도체', 7000],
  ['protec', '프로텍', '053610', '반도체', 4000],
  ['yest', '예스티', '122640', '반도체', 3000],
  // 소재·가스
  ['hansolchem', '한솔케미칼', '014680', '반도체', 28000],
  ['foosung', '후성', '093370', '반도체', 20000],
  ['enf', '이엔에프테크놀로지', '102710', '반도체', 10000],
  ['dnf', '디엔에프', '092070', '반도체', 5000],
  // 팹리스
  ['anapass', '아나패스', '123860', '반도체', 4000],
  ['telechips', '텔레칩스', '054450', '반도체', 6000],
  ['abov', '어보브반도체', '102120', '반도체', 3000],
]

// 개념 노드(실제 온톨로지의 Role/Theme — 프론트는 거래 불가 노드로만 구분하면 되므로 CONCEPT로 통칭): [id, 이름, 섹터]
const RAW_CONCEPTS: [string, string, string][] = [
  ['hbm', 'HBM', '반도체'],
  ['dram', 'D램', '반도체'],
  ['fdry', '파운드리', '반도체'],
  ['aidc', 'AI 데이터센터', '반도체'],
  ['adpkg', '첨단패키징', '반도체'],
  ['glass', '유리기판', '반도체'],
  ['euv', 'EUV', '반도체'],
  ['ondevice', '온디바이스AI', '반도체'],
  ['cxl', 'CXL', '반도체'],
  ['wafermat', '웨이퍼소재', '반도체'],
  ['specgas', '특수가스', '반도체'],
  ['testinsp', '테스트·검사', '반도체'],
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
  // 첨단패키징
  ['nepes', 'adpkg', '첨단패키징 후공정'],
  ['hanamc', 'adpkg', '첨단패키징 후공정'],
  ['sfa', 'adpkg', '첨단패키징 후공정'],
  ['simmtech', 'adpkg', '반도체 기판 공급'],
  ['haesungds', 'adpkg', '리드프레임 공급'],
  ['daeduck', 'adpkg', '반도체 기판 공급'],
  ['adpkg', 'sk', 'HBM 패키징 공급'],
  ['adpkg', 'hbm', '패키징 필수 공정'],
  ['nepes', 'hanamc', '경쟁', 'COMPETITOR'],
  ['sfa', 'hanamc', '경쟁', 'COMPETITOR'],
  // 유리기판
  ['glass', 'simmtech', '유리기판 개발'],
  ['glass', 'daeduck', '유리기판 개발'],
  ['glass', 'aidc', '차세대 패키징 수요'],
  // EUV
  ['ss', 'euv', '선단공정 노광 도입'],
  ['euv', 'fdry', '미세공정 필수'],
  ['park', 'euv', '계측 장비 공급'],
  // 테스트·검사
  ['unitest', 'testinsp', '테스트 장비 공급'],
  ['testna', 'testinsp', '테스트 서비스'],
  ['exicon', 'testinsp', '테스트 장비 공급'],
  ['nextin', 'testinsp', '웨이퍼 검사 장비 공급'],
  ['park', 'testinsp', '계측 장비 공급'],
  ['isc', 'testinsp', '테스트 소켓 공급'],
  ['testinsp', 'hbm', 'HBM 검증 필수'],
  ['unitest', 'exicon', '경쟁', 'COMPETITOR'],
  ['unitest', 'testna', '경쟁', 'COMPETITOR'],
  // 소재·가스
  ['hansolchem', 'wafermat', '웨이퍼 공정 소재 공급'],
  ['enf', 'wafermat', '포토레지스트 공급'],
  ['dnf', 'wafermat', '전구체 공급'],
  ['wafermat', 'ss', '공정 소재 조달'],
  ['foosung', 'specgas', '특수가스 공급'],
  ['specgas', 'sk', '증착 공정 필수 가스'],
  ['specgas', 'fdry', '파운드리 공정 필수'],
  ['enf', 'dnf', '경쟁', 'COMPETITOR'],
  // 장비
  ['kctech', 'ss', 'CMP 장비 공급'],
  ['psk', 'sk', '식각 장비 공급'],
  ['eugene', 'sk', '증착 장비 공급'],
  ['wonikqnc', 'sk', '쿼츠 부품 공급'],
  ['comico', 'sk', '부품 세정 코팅 공급'],
  ['miraecom', 'ss', '반도체 장비 공급'],
  ['protec', 'hanmi', '본딩 장비 공급'],
  ['yest', 'sk', '열처리 장비 공급'],
  ['eugene', 'wonik', '경쟁', 'COMPETITOR'],
  ['psk', 'jusung', '경쟁', 'COMPETITOR'],
  ['comico', 'tck', '경쟁', 'COMPETITOR'],
  // 팹리스 · 온디바이스AI · CXL
  ['anapass', 'ondevice', '온디바이스 AI 구동칩 개발'],
  ['telechips', 'ondevice', '차량용 온디바이스 AI 칩 개발'],
  ['abov', 'ondevice', 'MCU 공급'],
  ['ondevice', 'aidc', 'AI 반도체 수요 확산'],
  ['anapass', 'telechips', '경쟁', 'COMPETITOR'],
  ['telechips', 'abov', '경쟁', 'COMPETITOR'],
  ['cxl', 'ss', '차세대 메모리 인터페이스 개발'],
  ['cxl', 'sk', '차세대 메모리 인터페이스 개발'],
  ['cxl', 'dram', '메모리 확장 표준'],
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

/**
 * 뉴스 목록/impact 응답을 만들기 위한 내부 표현.
 * `chain`은 파급 경로 그래프(노드/엣지) 산출에만 쓰고, 응답의 relation_path/propagation
 * 텍스트는 lib/api.ts가 이 체인에서 템플릿으로 생성한다(§5.2 설계 노트와 동일한 방식).
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
    relatedStocks: [
      { nodeId: 'hanmi', direction: 'UP', relationLabel: '장비 공급', chain: ['sk', 'hanmi'] },
      { nodeId: 'hpsp', direction: 'UP', relationLabel: '고압 어닐링 장비', chain: ['sk', 'hpsp'] },
      { nodeId: 'wonik', direction: 'UP', relationLabel: '증착 장비', chain: ['sk', 'wonik'] },
      { nodeId: 'ss', direction: 'DOWN', relationLabel: '경쟁 관계', chain: ['sk', 'ss'] },
    ],
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
      { nodeId: 'sk', direction: 'UP', relationLabel: 'HBM 주력 생산', chain: ['aidc', 'hbm', 'sk'] },
      { nodeId: 'hanmi', direction: 'UP', relationLabel: 'HBM 필수 장비', chain: ['aidc', 'hbm', 'hanmi'] },
      { nodeId: 'ss', direction: 'UP', relationLabel: 'HBM 생산', chain: ['aidc', 'hbm', 'ss'] },
      { nodeId: 'eo', direction: 'UP', relationLabel: '장비 납품', chain: ['aidc', 'hbm', 'sk', 'eo'] },
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
      { nodeId: 'jusung', direction: 'UP', relationLabel: '장비 공급', chain: ['ss', 'jusung'] },
      { nodeId: 'lino', direction: 'UP', relationLabel: '테스트 소켓', chain: ['ss', 'lino'] },
      { nodeId: 'dj', direction: 'UP', relationLabel: '포토레지스트', chain: ['ss', 'dj'] },
      { nodeId: 'sk', direction: 'DOWN', relationLabel: '경쟁', chain: ['ss', 'sk'] },
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
      { nodeId: 'sk', direction: 'UP', relationLabel: '주력 생산', chain: ['hbm', 'sk'] },
      { nodeId: 'ss', direction: 'UP', relationLabel: '생산', chain: ['hbm', 'ss'] },
      { nodeId: 'hanmi', direction: 'UP', relationLabel: 'TC본더 필수', chain: ['hbm', 'hanmi'] },
      { nodeId: 'aidc', direction: 'UP', relationLabel: '수요 견인', chain: ['hbm', 'aidc'] },
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
      { nodeId: 'sk', direction: 'UP', relationLabel: '주력 생산', chain: ['dram', 'sk'] },
      { nodeId: 'ss', direction: 'UP', relationLabel: '생산', chain: ['dram', 'ss'] },
      { nodeId: 'aidc', direction: 'UP', relationLabel: '수요 견인', chain: ['dram', 'aidc'] },
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
      { nodeId: 'sk', direction: 'UP', relationLabel: '증착 장비', chain: ['wonik', 'sk'] },
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
      { nodeId: 'sk', direction: 'UP', relationLabel: '고압 어닐링', chain: ['hpsp', 'sk'] },
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
      { nodeId: 'sk', direction: 'UP', relationLabel: '소모품 공급', chain: ['tck', 'sk'] },
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
      { nodeId: 'fdry', direction: 'UP', relationLabel: '사업 영위', chain: ['dbh', 'fdry'] },
    ],
  },
]

/**
 * "최신 뉴스 새로고침" 시연용 풀. 실 백엔드가 없으니 새로고침 버튼을 누를 때마다
 * pullRefreshBatch()가 여기서 몇 건을 순환해 뽑아 NEWS_RECORDS 맨 앞에 끼워 넣는다.
 * 실 API가 준비되면 이 풀과 pullRefreshBatch는 통째로 지우고 새로고침을 그냥
 * 쿼리 재조회로 대체하면 된다.
 */
const REFRESH_POOL: NewsRecord[] = [
  {
    id: 30001,
    title: 'HBM 검증 수요 급증… 유니테스트·테스나 테스트 장비 발주 확대',
    press: '전자신문',
    publishedAt: TODAY,
    url: 'https://www.etnews.com/',
    summary: [
      'HBM 검증 물량이 늘면서 테스트 장비 발주가 확대되고 있다.',
      '후공정 테스트 업체들의 가동률이 동반 상승하는 모습이다.',
      '하반기까지 관련 수주가 이어질 것으로 전망된다.',
    ],
    originStocks: [
      {
        nodeId: 'testinsp',
        direction: 'UP',
        reason: 'HBM 검증 수요 급증이 직접 확인된 테마',
      },
    ],
    relatedStocks: [
      { nodeId: 'unitest', direction: 'UP', relationLabel: '테스트 장비 공급', chain: ['testinsp', 'unitest'] },
      { nodeId: 'testna', direction: 'UP', relationLabel: '테스트 서비스', chain: ['testinsp', 'testna'] },
      { nodeId: 'isc', direction: 'UP', relationLabel: '테스트 소켓 공급', chain: ['testinsp', 'isc'] },
    ],
  },
  {
    id: 30002,
    title: '삼성전자, EUV 노광 장비 신규 발주 확정',
    press: '한국경제',
    publishedAt: TODAY,
    url: 'https://www.hankyung.com/',
    summary: [
      '삼성전자가 선단공정 EUV 노광 장비 신규 발주를 확정했다.',
      '미세공정 전환 대응이 목적으로 파악된다.',
      '계측 장비 협력사 수주도 함께 늘어날 전망이다.',
    ],
    originStocks: [
      {
        nodeId: 'ss',
        direction: 'UP',
        reason: 'EUV 장비 신규 발주를 직접 확정한 당사자',
      },
    ],
    relatedStocks: [
      { nodeId: 'euv', direction: 'UP', relationLabel: '선단공정 노광 도입', chain: ['ss', 'euv'] },
      { nodeId: 'park', direction: 'UP', relationLabel: '계측 장비 공급', chain: ['ss', 'euv', 'park'] },
      { nodeId: 'fdry', direction: 'UP', relationLabel: '미세공정 필수', chain: ['ss', 'euv', 'fdry'] },
    ],
  },
  {
    id: 30003,
    title: 'SK하이닉스, 첨단패키징 라인 증설 검토',
    press: '연합뉴스',
    publishedAt: TODAY,
    url: 'https://www.yna.co.kr/',
    summary: [
      'SK하이닉스가 첨단패키징 라인 증설을 검토 중이라고 밝혔다.',
      'HBM 후공정 대응 능력 확대가 목적이다.',
      '후공정 협력사 수주 기대감이 커지고 있다.',
    ],
    originStocks: [
      {
        nodeId: 'sk',
        direction: 'UP',
        reason: '첨단패키징 라인 증설을 직접 검토하는 당사자',
      },
    ],
    relatedStocks: [
      { nodeId: 'adpkg', direction: 'UP', relationLabel: 'HBM 패키징 공급', chain: ['sk', 'adpkg'] },
      { nodeId: 'hanamc', direction: 'UP', relationLabel: '첨단패키징 후공정', chain: ['sk', 'adpkg', 'hanamc'] },
      { nodeId: 'nepes', direction: 'UP', relationLabel: '첨단패키징 후공정', chain: ['sk', 'adpkg', 'nepes'] },
      { nodeId: 'sfa', direction: 'UP', relationLabel: '첨단패키징 후공정', chain: ['sk', 'adpkg', 'sfa'] },
    ],
  },
  {
    id: 30004,
    title: '웨이퍼 공정 소재 가격 상승… 한솔케미칼 수혜',
    press: '머니투데이',
    publishedAt: TODAY,
    url: 'https://www.mt.co.kr/',
    summary: [
      '웨이퍼 공정 소재 가격이 오르며 관련주가 강세다.',
      '수급 타이트로 소재 업체 협상력이 개선되고 있다.',
      '증설 투자로 이어질지 시장이 주목하고 있다.',
    ],
    originStocks: [
      {
        nodeId: 'wafermat',
        direction: 'UP',
        reason: '웨이퍼 공정 소재 가격 상승이 직접 확인된 품목',
      },
    ],
    relatedStocks: [
      { nodeId: 'hansolchem', direction: 'UP', relationLabel: '웨이퍼 공정 소재 공급', chain: ['wafermat', 'hansolchem'] },
      { nodeId: 'enf', direction: 'UP', relationLabel: '포토레지스트 공급', chain: ['wafermat', 'enf'] },
      { nodeId: 'dnf', direction: 'UP', relationLabel: '전구체 공급', chain: ['wafermat', 'dnf'] },
    ],
  },
  {
    id: 30005,
    title: '온디바이스 AI 확산… 텔레칩스·아나패스 강세',
    press: '이데일리',
    publishedAt: TODAY,
    url: 'https://www.edaily.co.kr/',
    summary: [
      '온디바이스 AI 탑재 기기가 확산되며 관련 팹리스가 강세다.',
      '차량용·가전용 구동칩 수요가 함께 늘고 있다.',
      'AI 반도체 전반으로 온기가 확산되는 모습이다.',
    ],
    originStocks: [
      {
        nodeId: 'ondevice',
        direction: 'UP',
        reason: '온디바이스 AI 수요 확산이 직접 확인된 테마',
      },
    ],
    relatedStocks: [
      { nodeId: 'telechips', direction: 'UP', relationLabel: '차량용 온디바이스 AI 칩 개발', chain: ['ondevice', 'telechips'] },
      { nodeId: 'anapass', direction: 'UP', relationLabel: '온디바이스 AI 구동칩 개발', chain: ['ondevice', 'anapass'] },
      { nodeId: 'abov', direction: 'UP', relationLabel: 'MCU 공급', chain: ['ondevice', 'abov'] },
    ],
  },
  {
    id: 30006,
    title: '유리기판 상용화 임박… 관련주 재조명',
    press: '파이낸셜뉴스',
    publishedAt: TODAY,
    url: 'https://www.fnnews.com/',
    summary: [
      '차세대 패키징용 유리기판 상용화 일정이 앞당겨지고 있다.',
      '기판 업체들의 시제품 검증이 마무리 단계에 접어들었다.',
      'AI 반도체 패키징 수요와 맞물려 주목받고 있다.',
    ],
    originStocks: [
      {
        nodeId: 'glass',
        direction: 'UP',
        reason: '유리기판 상용화 일정 단축이 직접 확인된 테마',
      },
    ],
    relatedStocks: [
      { nodeId: 'simmtech', direction: 'UP', relationLabel: '유리기판 개발', chain: ['glass', 'simmtech'] },
      { nodeId: 'daeduck', direction: 'UP', relationLabel: '유리기판 개발', chain: ['glass', 'daeduck'] },
      { nodeId: 'aidc', direction: 'UP', relationLabel: '차세대 패키징 수요', chain: ['glass', 'aidc'] },
    ],
  },
  {
    id: 30007,
    title: 'CXL 표준 확산… 메모리 대형주 재조명',
    press: '서울경제',
    publishedAt: TODAY,
    url: 'https://www.sedaily.com/',
    summary: [
      '차세대 메모리 인터페이스 CXL 채택이 확산되고 있다.',
      '메모리 확장 수요가 늘며 대형 메모리 업체가 주목받는다.',
      '관련 생태계 투자도 함께 확대될 전망이다.',
    ],
    originStocks: [
      {
        nodeId: 'cxl',
        direction: 'UP',
        reason: 'CXL 표준 채택 확산이 직접 확인된 테마',
      },
    ],
    relatedStocks: [
      { nodeId: 'ss', direction: 'UP', relationLabel: '차세대 메모리 인터페이스 개발', chain: ['cxl', 'ss'] },
      { nodeId: 'sk', direction: 'UP', relationLabel: '차세대 메모리 인터페이스 개발', chain: ['cxl', 'sk'] },
      { nodeId: 'dram', direction: 'UP', relationLabel: '메모리 확장 표준', chain: ['cxl', 'dram'] },
    ],
  },
  {
    id: 30008,
    title: '특수가스 공급 부족 심화… 후성 반사이익',
    press: '뉴스1',
    publishedAt: TODAY,
    url: 'https://www.news1.kr/',
    summary: [
      '반도체 공정용 특수가스 공급 부족이 심화하고 있다.',
      '증착·파운드리 공정 전반에 영향이 확산되는 모습이다.',
      '공급사의 가격 협상력이 개선되고 있다.',
    ],
    originStocks: [
      {
        nodeId: 'specgas',
        direction: 'UP',
        reason: '특수가스 공급 부족 심화가 직접 확인된 품목',
      },
    ],
    relatedStocks: [
      { nodeId: 'foosung', direction: 'UP', relationLabel: '특수가스 공급', chain: ['specgas', 'foosung'] },
      { nodeId: 'sk', direction: 'UP', relationLabel: '증착 공정 필수 가스', chain: ['specgas', 'sk'] },
      { nodeId: 'fdry', direction: 'UP', relationLabel: '파운드리 공정 필수', chain: ['specgas', 'fdry'] },
    ],
  },
  {
    id: 30009,
    title: '피에스케이, 대형 식각장비 수주 공시',
    press: '아시아경제',
    publishedAt: TODAY,
    url: 'https://www.asiae.co.kr/',
    summary: [
      '피에스케이가 대형 식각장비 공급 계약을 공시했다.',
      '고객사 라인 증설에 대응하는 수주로 파악된다.',
      '경쟁사 대비 수주 모멘텀이 부각되고 있다.',
    ],
    originStocks: [
      {
        nodeId: 'psk',
        direction: 'UP',
        reason: '대형 식각장비 수주 공시의 직접 당사자',
      },
    ],
    relatedStocks: [
      { nodeId: 'sk', direction: 'UP', relationLabel: '식각 장비 공급', chain: ['psk', 'sk'] },
      { nodeId: 'jusung', direction: 'DOWN', relationLabel: '경쟁', chain: ['psk', 'jusung'] },
    ],
  },
  {
    id: 30010,
    title: '코미코, 반도체 부품 세정 수주 확대',
    press: '매일경제',
    publishedAt: TODAY,
    url: 'https://www.mk.co.kr/',
    summary: [
      '코미코의 반도체 부품 세정·코팅 수주가 확대됐다.',
      '고객사 가동률 상승이 배경으로 꼽힌다.',
      '경쟁사 대비 점유율 확대가 기대된다.',
    ],
    originStocks: [
      {
        nodeId: 'comico',
        direction: 'UP',
        reason: '부품 세정 코팅 수주 확대의 직접 당사자',
      },
    ],
    relatedStocks: [
      { nodeId: 'sk', direction: 'UP', relationLabel: '부품 세정 코팅 공급', chain: ['comico', 'sk'] },
      { nodeId: 'tck', direction: 'DOWN', relationLabel: '경쟁', chain: ['comico', 'tck'] },
    ],
  },
]

const REFRESH_BATCH_SIZES = [3, 2, 2, 3]
let refreshClickCount = 0
let refreshPoolCursor = 0

/**
 * "새로고침" 클릭 데모용 — REFRESH_POOL을 순환하며 몇 건을 뽑아 발행 시각을
 * 지금으로 찍고 NEWS_RECORDS 맨 앞에 끼워 넣는다. 이미 나온 뉴스라도 풀을
 * 다 돌면 새 id로 다시 등장한다(데모를 몇 번이고 반복할 수 있도록).
 */
export function pullRefreshBatch(): NewsRecord[] {
  const batchSize =
    REFRESH_BATCH_SIZES[refreshClickCount % REFRESH_BATCH_SIZES.length]
  refreshClickCount += 1

  const now = Date.now()
  const items: NewsRecord[] = []
  for (let i = 0; i < batchSize; i++) {
    const template = REFRESH_POOL[refreshPoolCursor % REFRESH_POOL.length]
    const cycle = Math.floor(refreshPoolCursor / REFRESH_POOL.length)
    refreshPoolCursor += 1
    items.push({
      ...template,
      id: template.id + cycle * 10000,
      publishedAt: new Date(now - i * 45_000).toISOString(),
    })
  }

  NEWS_RECORDS.unshift(...items)
  return items
}

const STOCK_IDS = RAW_COMPANIES.map(([id]) => id)
const nodeNameById = new Map<string, string>([
  ...RAW_COMPANIES.map(([id, name]): [string, string] => [id, name]),
  ...RAW_CONCEPTS.map(([id, name]): [string, string] => [id, name]),
])

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
      originStocks: [{ nodeId: originId, direction, reason: template.reason(originName) }],
      relatedStocks,
    })
  }

  return news
}

export const NEWS_RECORDS: NewsRecord[] = [
  ...CURATED_NEWS,
  ...buildFillerNews(51, 10010),
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
