## 진행 현황

| API                     | 화면                            | 상태    |
| ----------------------- | ------------------------------- | ------- |
| `GET /news`             | 좌측 뉴스 리스트                | ✅ 확정 |
| `GET /news/{id}/impact` | 뉴스 클릭 시 요약·기점·관련종목 | ✅ 확정 |
| `GET /graph?mode=full`  | 전체 관계망 토글                | ✅ 확정 |

---

## 1. `GET /news`

좌측 "최신 뉴스" 리스트.

**Query Parameters**

| 파라미터   | 타입 | 필수 | 설명                  |
| ---------- | ---- | ---- | --------------------- |
| `cursorId` | int  | N    | 페이지네이션의 기준점 |
| `size`     | int  | N    | 페이지 크기           |

**Response**

마지막 페이지 응답

```json
{
    "news": [
        {
            "newsId": 1,
            "title": "“AI 전력난, 원전이 답”… 野 “대형 원전 4기·SMR 2기 더 지어야” ...",
            "press": "매일경제",
            "publishedAt": "2026-07-28T09:14Z",
            "url": "https://n.news.naver.com/mnews/article/009/0005713516?sid=101"
        },
        {
            "newsId": 2,
            "title": "[로터리] 주택 공급의 ‘보이지 않는 힘’",
            "press": "서울경제",
            "publishedAt": "2026-07-28T09:14Z",
            "url": "https://n.news.naver.com/mnews/article/011/0004646132?sid=101"
        },
        {
            "newsId": 3,
            "title": "서킷브레이커도 못 막았다…코스피 10.84% '뚝', 역대 두 번째 급락",
            "press": "주간조선",
            "publishedAt": "2026-07-28T09:13Z",
            "url": "https://n.news.naver.com/mnews/article/053/0000060271?sid=101"
        }
    ],
    "hasNext": false,
    "lastCursorId": 3
}
₩
```

```json
{
  "news": [
    {
      "newsId": 105,
      "title": "SK하이닉스, HBM4 개발 본격화…2026년 양산 목표",
      "press": "전자신문",
      "publishedAt": "2026-07-28T14:30:00+09:00",
      "url": "https://n.news.naver.com/article/030/0003245678"
    },
    {
      "newsId": 104,
      "title": "삼성전자, 3나노 파운드리 수율 개선…애플 A19칩 수주 기대",
      "press": "디지털타임스",
      "publishedAt": "2026-07-28T13:15:00+09:00",
      "url": "https://n.news.naver.com/article/029/0002876543"
    },
    {
      "newsId": 103,
      "title": "HBM 시장 경쟁 격화…마이크론 4세대 양산 돌입",
      "press": "매일경제",
      "publishedAt": "2026-07-28T11:45:00+09:00",
      "url": "https://n.news.naver.com/article/009/0005234567"
    }
  ],
  "hasNext": true,
  "lastCursorId": 103
}
```

**설계 노트**

- `status='done'`(AI 분석 완료) 필터는 서버가 항상 고정 적용. 클라이언트가 신경 쓸 파라미터가 아니므로 쿼리에 노출하지 않음.
- `category` 필드/파라미터 없음 — 지금은 반도체 스코프만 다루므로 제외.
- 리스트 카드는 가볍게 유지 — 요약, 관련종목 등은 클릭 시 `GET /news/{id}/impact`로 별도 조회.

---

## 2. `GET /news/{news_id}/impact`

뉴스 클릭 시 필요한 모든 정보를 한 번에 반환 (같은 화면 전환에서 동시에 필요한 데이터라 하나로 합침)

**Response**

```json
{
  "news_summary": ["..."],
  "source": {
    "press": "...",
    "published_at": "...",
    "url": "..."
  },
  "origin_stocks": [
    {
      "ticker": "...",
      "name": "...",
      "status": "...",
      "reason": "..."
    }
  ],
  "related_stocks": [
    {
      "ticker": "...",
      "name": "...",
      "status": "...",
      "relation_label": "...",
      "relation_path": "...",
      "propagation": "..."
    }
  ],
  "final_summary": "...",
  "graph": {
    "newsId": "...",
    "originId": "...",
    "nodes": [
      {
        "id": "...",
        "name": "...",
        "ticker": "...",
        "capSize": "...",
        "marketType": "..."
      }
    ],
    "edges": [
      {
        "id": "...",
        "source": "...",
        "target": "...",
        "relation": "..."
      }
    ]
  }
}
```

**필드 설명**

| 필드                             | 설명                                                                    |
| -------------------------------- | ----------------------------------------------------------------------- |
| `summary`                        | 기사 요약 3줄, 문자열 배열                                              |
| `source`                         | 언론사·발행시각·원문 URL (뉴스 하나당 1개)                              |
| `origin_stocks`                  | 뉴스에 직접 언급된 당사자 종목. 배열 (DB의 `key_companies` 구조와 일치) |
| `related_stocks`                 | 온톨로지로 파생된 관련 종목. 각 종목마다 이벤트, 파급경로 포함          |
| `related_stocks[].relation_path` | "SK하이닉스 → 한미반도체" 형태의 경로 문자열.                           |
| `graph`                          | 그래프 시각화용 데이터. **내용 미정, 논의 후 결정**                     |

**설계 결정 로그**

- `origin_stocks`를 단일 객체가 아닌 배열로 설계 — DB 스키마의 `ai_responses.key_companies`가 배열 구조라 그대로 맞춤. 뉴스 하나가 여러 종목을 동시에 언급하는 경우 대응 가능.
- "판단 근거"는 뉴스 전체 통짜 텍스트가 아니라 **종목별로 분산** (DB의 `derived_companies[].rationale` 구조가 종목 단위였기 때문). 이에 따라 UI도 "종목 카드 클릭 시 그 종목의 근거 표시"로 변경.
- `affected_count`(영향 종목 개수)는 제거 — `related_stocks.length`로 프론트에서 바로 계산 가능한 파생값이라 서버가 별도로 내려줄 필요 없음.
- `graph` 필드는 자리만 만들고 내용은 비워둠 — 아래 3번 섹션 참고.

**미해결 논의**

- `event` 필드가 `related_stocks`의 모든 항목에서 완전히 동일한 문장으로 중복됨. 최상단에 한 번만 두고 종목별로는 `propagation`만 남길지 **미확정**.
- `derived_companies[].evidence_sources` , `derived_companies[].rationale` 두 필드 의미 구분 필요. 이벤트와 판단 근거를 `ai_responses` 테이블의 어떤 필드에서 가져올지 논의 필요

---

**설계 노트**

- 뉴스에 종속되지 않는 온톨로지 전체 뷰라 `newsId`/`originId` 없음. 그 외 `nodes`/`edges` 스키마는 `impact.graph`와 동일.

---

## 스코프 외 (논의 보류)

- **예측 검증 탭** — "지난 예측 적중률" 관련 기능.
