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
    relatedStocks: [
      {
        nodeId: 'hanmi',
        direction: 'UP',
        relationLabel: '장비 공급',
        chain: ['sk', 'hanmi'],
      },
      {
        nodeId: 'hpsp',
        direction: 'UP',
        relationLabel: '고압 어닐링 장비',
        chain: ['sk', 'hpsp'],
      },
      {
        nodeId: 'wonik',
        direction: 'UP',
        relationLabel: '증착 장비',
        chain: ['sk', 'wonik'],
      },
      {
        nodeId: 'ss',
        direction: 'DOWN',
        relationLabel: '경쟁 관계',
        chain: ['sk', 'ss'],
      },
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
 * "최신 뉴스 새로고침" 시연용 풀. 실 백엔드가 없으니 새로고침 버튼을 누를 때마다
 * pullRefreshBatch()가 여기서 몇 건을 순환해 뽑아 NEWS_RECORDS 맨 앞에 끼워 넣는다.
 * 실 API가 준비되면 이 풀과 pullRefreshBatch는 통째로 지우고 새로고침을 그냥
 * 쿼리 재조회로 대체하면 된다.
 */
const REFRESH_POOL: NewsRecord[] = [
  {
    id: 30001,
    title: '유니테스트, HBM 검증 수요 급증에 테스트 장비 수주 확대',
    press: '전자신문',
    publishedAt: TODAY,
    url: 'https://www.etnews.com/',
    summary: [
      '유니테스트가 HBM 검증용 테스트 장비 수주를 확대했다고 밝혔다.',
      'HBM 검증 물량 증가가 수주 확대의 배경으로 꼽힌다.',
      '하반기까지 관련 수주가 이어질 것으로 전망된다.',
    ],
    originStocks: [
      {
        nodeId: 'unitest',
        direction: 'UP',
        reason: 'HBM 검증용 테스트 장비 수주 확대의 직접 당사자',
      },
    ],
    relatedStocks: [
      {
        nodeId: 'testinsp',
        direction: 'UP',
        relationLabel: '테스트 장비 공급',
        chain: ['unitest', 'testinsp'],
      },
      {
        nodeId: 'testna',
        direction: 'UP',
        relationLabel: '테스트 서비스',
        chain: ['unitest', 'testinsp', 'testna'],
      },
      {
        nodeId: 'isc',
        direction: 'UP',
        relationLabel: '테스트 소켓 공급',
        chain: ['unitest', 'testinsp', 'isc'],
      },
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
      {
        nodeId: 'euv',
        direction: 'UP',
        relationLabel: '선단공정 노광 도입',
        chain: ['ss', 'euv'],
      },
      {
        nodeId: 'park',
        direction: 'UP',
        relationLabel: '계측 장비 공급',
        chain: ['ss', 'euv', 'park'],
      },
      {
        nodeId: 'fdry',
        direction: 'UP',
        relationLabel: '미세공정 필수',
        chain: ['ss', 'euv', 'fdry'],
      },
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
      {
        nodeId: 'adpkg',
        direction: 'UP',
        relationLabel: 'HBM 패키징 공급',
        chain: ['sk', 'adpkg'],
      },
      {
        nodeId: 'hanamc',
        direction: 'UP',
        relationLabel: '첨단패키징 후공정',
        chain: ['sk', 'adpkg', 'hanamc'],
      },
      {
        nodeId: 'nepes',
        direction: 'UP',
        relationLabel: '첨단패키징 후공정',
        chain: ['sk', 'adpkg', 'nepes'],
      },
      {
        nodeId: 'sfa',
        direction: 'UP',
        relationLabel: '첨단패키징 후공정',
        chain: ['sk', 'adpkg', 'sfa'],
      },
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
        nodeId: 'hansolchem',
        direction: 'UP',
        reason: '웨이퍼 공정 소재 가격 상승의 직접 수혜 당사자',
      },
    ],
    relatedStocks: [
      {
        nodeId: 'wafermat',
        direction: 'UP',
        relationLabel: '웨이퍼 공정 소재 공급',
        chain: ['hansolchem', 'wafermat'],
      },
      {
        nodeId: 'ss',
        direction: 'UP',
        relationLabel: '공정 소재 조달',
        chain: ['hansolchem', 'wafermat', 'ss'],
      },
      {
        nodeId: 'enf',
        direction: 'UP',
        relationLabel: '포토레지스트 공급',
        chain: ['hansolchem', 'wafermat', 'enf'],
      },
    ],
  },
  {
    id: 30005,
    title: '텔레칩스, 온디바이스 AI 확산에 차량용 구동칩 수주 확대',
    press: '이데일리',
    publishedAt: TODAY,
    url: 'https://www.edaily.co.kr/',
    summary: [
      '텔레칩스가 차량용 온디바이스 AI 구동칩 수주를 확대했다.',
      '온디바이스 AI 탑재 차량이 늘어난 영향으로 풀이된다.',
      'AI 반도체 팹리스 전반으로 온기가 확산되는 모습이다.',
    ],
    originStocks: [
      {
        nodeId: 'telechips',
        direction: 'UP',
        reason: '차량용 온디바이스 AI 구동칩 수주 확대의 직접 당사자',
      },
    ],
    relatedStocks: [
      {
        nodeId: 'ondevice',
        direction: 'UP',
        relationLabel: '차량용 온디바이스 AI 칩 개발',
        chain: ['telechips', 'ondevice'],
      },
      {
        nodeId: 'anapass',
        direction: 'UP',
        relationLabel: '온디바이스 AI 구동칩 개발',
        chain: ['telechips', 'ondevice', 'anapass'],
      },
      {
        nodeId: 'abov',
        direction: 'UP',
        relationLabel: 'MCU 공급',
        chain: ['telechips', 'ondevice', 'abov'],
      },
    ],
  },
  {
    id: 30006,
    title: '심텍, 유리기판 상용화 임박에 시제품 검증 마무리',
    press: '파이낸셜뉴스',
    publishedAt: TODAY,
    url: 'https://www.fnnews.com/',
    summary: [
      '심텍이 차세대 패키징용 유리기판 시제품 검증을 마무리했다.',
      '상용화 일정이 당초 계획보다 앞당겨질 전망이다.',
      'AI 반도체 패키징 수요와 맞물려 주목받고 있다.',
    ],
    originStocks: [
      {
        nodeId: 'simmtech',
        direction: 'UP',
        reason: '유리기판 시제품 검증 마무리의 직접 당사자',
      },
    ],
    relatedStocks: [
      {
        nodeId: 'glass',
        direction: 'UP',
        relationLabel: '유리기판 개발',
        chain: ['simmtech', 'glass'],
      },
      {
        nodeId: 'daeduck',
        direction: 'UP',
        relationLabel: '유리기판 개발',
        chain: ['simmtech', 'glass', 'daeduck'],
      },
      {
        nodeId: 'aidc',
        direction: 'UP',
        relationLabel: '차세대 패키징 수요',
        chain: ['simmtech', 'glass', 'aidc'],
      },
    ],
  },
  {
    id: 30007,
    title: 'SK하이닉스, CXL 표준 확산에 차세대 메모리 개발 박차',
    press: '서울경제',
    publishedAt: TODAY,
    url: 'https://www.sedaily.com/',
    summary: [
      'SK하이닉스가 차세대 메모리 인터페이스 CXL 제품 개발에 속도를 내고 있다.',
      '데이터센터향 메모리 확장 수요 대응이 목적이다.',
      '관련 생태계 투자도 함께 확대될 전망이다.',
    ],
    originStocks: [
      {
        nodeId: 'sk',
        direction: 'UP',
        reason: 'CXL 차세대 메모리 개발을 직접 주도하는 당사자',
      },
    ],
    relatedStocks: [
      {
        nodeId: 'cxl',
        direction: 'UP',
        relationLabel: '차세대 메모리 인터페이스 개발',
        chain: ['sk', 'cxl'],
      },
      {
        nodeId: 'ss',
        direction: 'UP',
        relationLabel: '차세대 메모리 인터페이스 개발',
        chain: ['sk', 'cxl', 'ss'],
      },
      {
        nodeId: 'dram',
        direction: 'UP',
        relationLabel: '메모리 확장 표준',
        chain: ['sk', 'cxl', 'dram'],
      },
    ],
  },
  {
    id: 30008,
    title: '후성, 특수가스 공급 부족 심화에 반사이익',
    press: '뉴스1',
    publishedAt: TODAY,
    url: 'https://www.news1.kr/',
    summary: [
      '후성이 반도체 공정용 특수가스 공급 부족의 반사이익을 누리고 있다.',
      '증착·파운드리 공정 전반의 수요 확대가 배경이다.',
      '가격 협상력도 함께 개선되는 모습이다.',
    ],
    originStocks: [
      {
        nodeId: 'foosung',
        direction: 'UP',
        reason: '특수가스 공급 부족 심화의 직접 반사이익 당사자',
      },
    ],
    relatedStocks: [
      {
        nodeId: 'specgas',
        direction: 'UP',
        relationLabel: '특수가스 공급',
        chain: ['foosung', 'specgas'],
      },
      {
        nodeId: 'sk',
        direction: 'UP',
        relationLabel: '증착 공정 필수 가스',
        chain: ['foosung', 'specgas', 'sk'],
      },
      {
        nodeId: 'fdry',
        direction: 'UP',
        relationLabel: '파운드리 공정 필수',
        chain: ['foosung', 'specgas', 'fdry'],
      },
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
      {
        nodeId: 'sk',
        direction: 'UP',
        relationLabel: '식각 장비 공급',
        chain: ['psk', 'sk'],
      },
      {
        nodeId: 'jusung',
        direction: 'DOWN',
        relationLabel: '경쟁',
        chain: ['psk', 'jusung'],
      },
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
      {
        nodeId: 'sk',
        direction: 'UP',
        relationLabel: '부품 세정 코팅 공급',
        chain: ['comico', 'sk'],
      },
      {
        nodeId: 'tck',
        direction: 'DOWN',
        relationLabel: '경쟁',
        chain: ['comico', 'tck'],
      },
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
