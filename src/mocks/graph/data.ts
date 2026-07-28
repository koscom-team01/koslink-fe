import type { OntologyEdge, OntologyNode, RelationType } from '#/types/graph'

/**
 * docs/koslink.html의 정적 데모 데이터를 포팅 + 확장한 것.
 * 백엔드가 없는 지금은 apis/graph/mock.ts가 이 파일을 동기적으로 읽어 응답 모양을 만든다.
 * 실 API가 준비되면 apis/graph/mock.ts 내부만 fetch로 바꾸면 되고, 이 파일과 컴포넌트는
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
  ['adpkg', '삼성전자', '반도체'],
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
