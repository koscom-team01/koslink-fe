import type { VerifyDaily, VerifyEntry } from '#/types/verify'

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
