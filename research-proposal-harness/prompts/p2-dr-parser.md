# A2 Deep Research Parser — DR 리포트 → 논문 메타데이터

## 역할

Google Deep Research가 생성한 마크다운 리포트를 파싱하여
`a2.schema.json`의 `papers` 배열 항목으로 변환한다.

## 파싱 원칙

- **정규식 금지**: LLM 기반 이해로 추출한다
- **추론 금지**: 리포트에 명시된 정보만 추출. 없으면 `null`
- **과잉 추출 금지**: 확신이 낮으면 `extraction_confidence: "low"` 표시

---

## Step 1 — 리포트 구조 파악

DR 리포트는 보통 아래 패턴 중 하나다:

| 패턴 | 인용 방식 |
|------|-----------|
| A | 본문 인라인 번호 `[1]` + 하단 References 섹션 |
| B | 본문 인라인 저자연도 `(Kim, 2023)` + 하단 References 섹션 |
| C | 각 섹션 하단에 소규모 참고문헌 목록 |
| D | 인라인 하이퍼링크만 (URL이 논문 직접 링크) |

리포트 첫 200자를 읽고 패턴을 확인한다.

---

## Step 2 — References 섹션 추출

패턴 A/B/C: `References`, `Bibliography`, `Sources`, `참고문헌` 헤딩 이하를 전부 추출.
패턴 D: 본문의 모든 하이퍼링크(`[텍스트](URL)`) 목록을 추출.

---

## Step 3 — 논문별 메타데이터 파싱

각 참조 항목에서 아래를 추출한다:

| 필드 | 추출 방법 | 없을 때 |
|------|-----------|---------|
| `title` | 따옴표 또는 이탤릭체 구간, 또는 첫 번째 문장 | `null` 불허 — 항목 전체 폐기 |
| `authors` | 성, 이름 형식 또는 "저자 외" 앞부분 | `["Unknown"]` |
| `year` | 4자리 숫자 | `null` |
| `journal` | 이탤릭체 게재지명 또는 In: 뒤 | `null` |
| `doi` | `doi.org/` 포함 URL | `null` |
| `url` | 하이퍼링크 또는 `https://` 시작 문자열 | `null` |

**`title`이 없으면 그 항목은 추출하지 않는다.**

---

## Step 4 — 핵심 발견 추출 (`abstract` 필드)

References에서 추출한 각 논문 id(번호 또는 저자연도)를 본문에서 검색한다.
해당 논문이 인용된 문장 1–3개를 `abstract` 필드에 넣는다.

예:
> 리포트 본문: "Kim et al. (2023) found that smart factory adoption significantly improved
> OEE by 23% in SMEs with over 50 employees [3]."
>
> → `abstract: "Kim et al. (2023) found that smart factory adoption significantly improved OEE by 23% in SMEs with over 50 employees."`

원문 초록이 리포트에 포함된 경우 그것을 우선한다.

---

## Step 5 — extraction_confidence 판정

| confidence | 기준 |
|-----------|------|
| `high` | DOI 또는 직접 논문 URL 확인됨 |
| `medium` | title + 저자 + year 모두 있음 |
| `low` | title만 있거나, 저자/year 중 하나 이상 누락 |

`low` 항목은 VA 검증에서 우선 재확인 대상이 된다.

---

## Step 6 — 출력 형식

각 논문을 `papers` 배열 항목으로 조립한다:

```json
{
  "id": "p_dr_001",
  "title": "Smart Factory Adoption and SME Productivity",
  "authors": ["Kim, Jinho", "Park, Sumi"],
  "year": 2023,
  "source": "Deep Research",
  "journal": "Journal of Manufacturing Technology Management",
  "doi": "10.1108/JMTM-01-2023-0001",
  "abstract": "Kim et al. (2023) found that smart factory adoption improved OEE by 23% in SMEs.",
  "url": "https://doi.org/10.1108/JMTM-01-2023-0001",
  "publication_type": "peer-reviewed",
  "language": "en",
  "metadata_partial": false,
  "extraction_confidence": "high"
}
```

`metadata_partial`:
- `false`: title + authors + year + (doi 또는 url) 모두 있음
- `true`: 위 중 하나라도 null

---

## 파싱 후 요약 출력

```
[DR 파싱 완료]
추출된 논문: N편
  - extraction_confidence high:   N편
  - extraction_confidence medium: N편
  - extraction_confidence low:    N편 (VA 우선 재검증)
  - metadata_partial true:        N편
```
