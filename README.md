# Semiconductor Strategic Intelligence OS (Demo)

외부 신호(현지어 원문 기사 · 기업 IR · 정부 자료)를 메모리 반도체 기업의
**자산 → 노출 → 의사결정**으로 변환하는 전략 인텔리전스 워크스페이스 데모입니다.

빌드 도구 없는 단일 HTML 파일이며, GitHub Pages로 그대로 서빙됩니다.

---

## ⚠️ 먼저 읽어주세요 (Disclaimer)

- 이 저장소는 **개인이 만든 비공식 데모**입니다. SK하이닉스를 포함한 어떤 회사의
  공식 입장·공식 데이터·내부 자료와도 무관합니다.
- 회사명·제품명·로고는 각 권리자의 상표입니다. 이 저장소는 해당 기업과
  제휴·후원·승인 관계가 없습니다.
- **투자 판단이나 구매·조달 의사결정의 근거로 사용할 수 없습니다.**
- 화면에 보이는 수치는 아래 세 종류가 섞여 있으며, 앱 안에서 배지로 구분됩니다.

| 구분 | 표시 | 성격 |
|---|---|---|
| 사실 | 출처 링크 | 공개된 1차·2차 자료에서 확인된 내용. 발행사·날짜·원문 링크를 함께 표시 |
| 추정 | `EST` 배지 | 공개 신호를 바탕으로 이 앱이 계산한 점수·등급. 근거가 되는 신호를 함께 표시 |
| 미연결 | `—` 또는 빈 칸 | 공개 자료로 확인 불가. 무엇을 연결하면 채워지는지 메모를 남김 |

마지막 세 번째 칸을 숫자로 채우지 않은 것은 의도적입니다. 데모의 신뢰도는
빈 칸을 숨기는 쪽보다 드러내는 쪽에서 나옵니다.

---

## 파일 구조

```
.
├── index.html                      # 앱 본체 (sk-strategic-intelligence-v6.html)
├── ir-narrative-intelligence.html  # IR 커뮤니케이션 버전 (선택)
├── update-live-data.mjs            # 시세·뉴스 수집 스크립트 (Node 18+, 의존성 0)
├── data/
│   └── live.json                   # 수집 결과. 없어도 앱은 내장 데모 데이터로 동작
└── .github/
    └── workflows/
        └── daily-update.yml        # 매일 07:00 KST 자동 수집 + 커밋
```

`data/live.json`이 없거나 fetch가 실패하면 앱은 조용히 내장 데모 데이터로
되돌아갑니다. 36시간보다 오래된 데이터면 화면에 `STALE` 배지가 붙습니다.

---

## 올리는 순서

1. GitHub에서 새 저장소 생성 (public이면 Pages 무료)
2. `sk-strategic-intelligence-v6.html`을 **`index.html`로 이름을 바꿔** 루트에 올리고,
   `update-live-data.mjs`도 루트에 올립니다
3. `.github/workflows/daily-update.yml` 경로를 그대로 만들어 워크플로 파일을 올립니다
4. Settings → Pages → Source를 `main` / `/ (root)`로 지정
5. Actions 탭 → `daily-update` → **Run workflow**로 첫 수집을 한 번 수동 실행

5분 내로 `https://<사용자명>.github.io/<저장소명>/` 에서 열립니다.

---

## 로컬에서 확인

```bash
node update-live-data.mjs          # data/live.json 생성
python3 -m http.server 8000        # http://localhost:8000
```

`index.html`을 더블클릭해도 앱은 열리지만, `file://` 프로토콜에서는 브라우저가
fetch를 차단하므로 `data/live.json`이 읽히지 않습니다. 이때는 내장 데모 데이터로
동작합니다. 실시간 데이터까지 보려면 위처럼 로컬 서버로 띄워야 합니다.

---

## 데이터 소스

| 항목 | 소스 | 비고 |
|---|---|---|
| 원자재·메모리 시세 | Yahoo Finance chart endpoint | **비공식 엔드포인트.** 운영 전환 시 metals.dev / Alpha Vantage 등 공식 API로 교체 필요 |
| 다국어 뉴스 헤드라인 | GDELT DOC 2.0 API | `sourcelang:chi\|jpn\|kor`로 현지어 기사 수집 |
| 기업 실적·가이던스 | 각사 IR 자료 · 실적발표 트랜스크립트 | 앱 내 수기 입력. 출처·날짜 표기 |
| 정부 보조금·입지 | 경제산업성 등 정부 공표 자료 | 앱 내 수기 입력. 원문 링크 표기 |
| 논문·특허 지표 | **미연결** | OpenAlex / Lens.org / KIPRIS / Espacenet 연결 시 채워짐 |

---

## 저작권 · 수집 원칙

수집 스크립트는 **제목 · 링크 · 발행사 · 발행일만 저장하고 기사 본문은 저장하지
않습니다.** 디일렉 · 닛케이 · DIGITIMES 등 다수 매체가 무단전재와 AI 학습·활용을
명시적으로 금지하고 있습니다. 링크로 연결하는 것은 문제없지만, 본문을 긁어
저장하는 순간 성격이 달라집니다.

수집 대상 사이트의 `robots.txt`와 이용약관을 따르는 범위에서만 운영해야 합니다.
새 소스를 추가할 때마다 해당 사이트의 약관을 먼저 확인하십시오.

### API 키

**키는 반드시 Settings → Secrets and variables → Actions에 넣고, 워크플로에서
`env:`로 주입하십시오.** 코드나 HTML에 넣으면 저장소를 본 누구나 꺼내 쓸 수
있습니다. `daily-update.yml`에 주입 예시가 주석으로 들어 있습니다.

---

## 주요 화면

**OVERVIEW** — 오늘의 브리핑 · Executive Summary (A4 2장 인쇄용) · Decision Queue

**STRATEGY** — Samsung Benchmark · Demand·Customers · Competition Map (18 세그먼트 ×
6개국) · Japan·Kioxia (팩트체크 포함) · Cycle Regime · Industry Outlook (기준/낙관/비관) ·
Memory Portfolio

**INTELLIGENCE** — Briefing (공정 단계별 기사 그룹) · Technology · Supply Chain ·
Ecosystem · Decisions

**TOOLS** — Scenario Lab · Trigger Calendar · Source Intelligence (언어·국가·1차 비중)

**LIBRARY** — Watchlist · Methodology

Executive Summary 화면에서 브라우저 인쇄(Ctrl/Cmd+P)로 A4 2장 PDF가 나옵니다.
jsPDF 대신 `@media print`를 쓴 이유는 한글 폰트 임베딩이 깨지기 때문입니다.

---

## 알려진 한계

- **자동 수집 파이프라인이 없습니다.** 시세와 뉴스 헤드라인만 자동이고, 전략
  판단·벤치마킹·경쟁맵은 전부 수기 입력된 정적 데이터입니다.
- 질문 입력창은 **로컬 검색**입니다. LLM 호출이 아닙니다.
- 논문·특허 지표는 비어 있습니다. 숫자를 만들어 넣지 않았습니다.
- 일부 시장점유율은 과거 보도 기준이며, 화면에 기준 연도를 함께 표기했습니다.
- M&A 게이트 6개 항목 중 "인수 가능 타깃 존재"와 "밸류에이션 합리성"은 공개 신호로
  판단할 수 없어 항상 미충족으로 둡니다. 따라서 어떤 항목도 M&A로 자동 상향되지
  않습니다. 이는 버그가 아니라 설계입니다.
- 앱 내 기준일(`ASOF`)과 실제 열어보는 날짜가 다르면 그만큼 내용이 과거입니다.
  상단에 기준일이 표시됩니다.
