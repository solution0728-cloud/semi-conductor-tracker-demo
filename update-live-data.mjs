/**
 * update-live-data.mjs
 * 매일 1회 실행되어 data/live.json 을 갱신합니다.
 * 의존성 없음 — Node 18+ 내장 fetch 만 사용.
 *
 *   node update-live-data.mjs
 *
 * 출력: ./data/live.json
 * HTML은 이 파일이 있으면 LIVE 모드로, 없으면 내장 데모 데이터로 동작합니다.
 */

import { writeFile, mkdir } from "node:fs/promises";

const OUT = "./data/live.json";
const UA = "sk-intel-demo/1.0 (personal research project)";

/* ────────────────────────────────────────────────────────────
   1. 원자재 시세
   Yahoo Finance chart 엔드포인트는 공식 API가 아닙니다.
   개인 데모까지는 쓸 수 있지만, 사내 배포나 상시 운영이면
   metals.dev · Alpha Vantage · Quandl 같은 정식 제공처로 바꾸십시오.
   키가 필요한 경우 process.env 로만 받고 코드에 넣지 마십시오.
   ──────────────────────────────────────────────────────────── */
const SYMBOLS = [
  { key: "gold",      sym: "GC=F", n: "금 (Au)",      u: "USD / oz", use: "본딩와이어 · 도금 · 리드프레임" },
  { key: "silver",    sym: "SI=F", n: "은 (Ag)",      u: "USD / oz", use: "은 본딩와이어 · 페이스트" },
  { key: "copper",    sym: "HG=F", n: "구리 (Cu)",    u: "USD / lb", use: "구리 본딩와이어 · 배선" },
  { key: "palladium", sym: "PA=F", n: "팔라듐 (Pd)",  u: "USD / oz", use: "구리 와이어 피막" },
  { key: "platinum",  sym: "PL=F", n: "백금 (Pt)",    u: "USD / oz", use: "공정 부품 · 촉매" },
];

async function fetchQuote(s) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(s.sym)}?range=5d&interval=1d`;
  try {
    const r = await fetch(url, { headers: { "User-Agent": UA } });
    if (!r.ok) throw new Error("HTTP " + r.status);
    const j = await r.json();
    const res = j?.chart?.result?.[0];
    const meta = res?.meta;
    if (!meta?.regularMarketPrice) throw new Error("no price");
    const prev = meta.chartPreviousClose ?? meta.previousClose;
    const px = meta.regularMarketPrice;
    const chg = prev ? ((px - prev) / prev) * 100 : null;
    return {
      ...s,
      st: "live",
      v: px.toLocaleString(undefined, { maximumFractionDigits: 2 }),
      raw: px,
      d: chg === null ? "" : (chg >= 0 ? "+" : "") + chg.toFixed(1) + "%",
      dir: chg >= 0 ? "up" : "down",
      asof: new Date((meta.regularMarketTime ?? Date.now() / 1000) * 1000).toISOString().slice(0, 10),
      src: ["Yahoo Finance (비공식 엔드포인트)", "https://finance.yahoo.com/quote/" + s.sym, "자동 수집", "en"],
    };
  } catch (e) {
    return { ...s, st: "na", v: "—", d: "", note: "수집 실패: " + e.message };
  }
}

/* ────────────────────────────────────────────────────────────
   2. 뉴스
   GDELT DOC 2.0 — 무료, 키 불필요, 언어 필터 지원.
   sourcelang 으로 한국어·일본어·중국어 원문을 따로 받을 수 있어
   이 프로젝트의 "현지어 1차 소스" 요구에 그대로 맞습니다.

   ⚠ 제목·링크·요약만 저장하고 본문은 저장하지 마십시오.
     디일렉·닛케이·DIGITIMES 등은 무단전재와 AI 활용을 명시적으로
     금지합니다. 링크로 연결하는 것은 괜찮지만 본문 복제는 안 됩니다.
   ──────────────────────────────────────────────────────────── */
const QUERIES = [
  { id: "hbm",     label: "HBM · 메모리",       q: '(HBM OR "high bandwidth memory")', lang: null },
  { id: "pkg_tw",  label: "선단 패키징 (대만)",  q: "CoWoS OR 先進封裝",                lang: "chi" },
  { id: "glass_jp",label: "유리기판 (일본)",     q: "ガラス基板 OR TGV",                lang: "jpn" },
  { id: "equip",   label: "장비 · 수출통제",     q: '("export control" OR "수출통제") AND (semiconductor OR 반도체)', lang: null },
  { id: "kr",      label: "국내 반도체",         q: "반도체 AND (SK하이닉스 OR 삼성전자)", lang: "kor" },
];

async function fetchNews(qq) {
  const parts = [qq.q];
  if (qq.lang) parts.push(`sourcelang:${qq.lang}`);
  const url =
    "https://api.gdeltproject.org/api/v2/doc/doc?query=" +
    encodeURIComponent(parts.join(" ")) +
    "&mode=ArtList&maxrecords=12&timespan=3d&sort=DateDesc&format=json";
  try {
    const r = await fetch(url, { headers: { "User-Agent": UA } });
    if (!r.ok) throw new Error("HTTP " + r.status);
    const j = await r.json();
    const arts = (j.articles || []).map((a) => ({
      t: a.title,
      u: a.url,
      pub: a.domain,
      d: (a.seendate || "").slice(0, 8).replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3"),
      lang: a.language || "",
      ctry: a.sourcecountry || "",
    }));
    // 같은 기사 중복 제거 (도메인 + 제목 앞 40자)
    const seen = new Set(), out = [];
    for (const a of arts) {
      const k = a.pub + "|" + (a.t || "").slice(0, 40);
      if (seen.has(k)) continue;
      seen.add(k); out.push(a);
    }
    return { ...qq, st: "ok", n: out.length, items: out };
  } catch (e) {
    return { ...qq, st: "fail", n: 0, items: [], err: e.message };
  }
}

/* ──────────────────────────────────────────────────────────── */
async function main() {
  const [commod, news] = await Promise.all([
    Promise.all(SYMBOLS.map(fetchQuote)),
    Promise.all(QUERIES.map(fetchNews)),
  ]);

  const okC = commod.filter((c) => c.st === "live").length;
  const okN = news.filter((n) => n.st === "ok").length;
  const totalArticles = news.reduce((a, n) => a + n.n, 0);
  const localArticles = news
    .flatMap((n) => n.items)
    .filter((a) => a.lang && !["Korean", "English"].includes(a.lang)).length;

  const payload = {
    generatedAt: new Date().toISOString(),
    status: {
      commodity: `${okC}/${commod.length}`,
      news: `${okN}/${news.length}`,
      articles: totalArticles,
      localArticles,
    },
    commodity: commod,
    news,
    notes:
      "제목·링크·메타데이터만 저장합니다. 본문은 저장하지 않으며 각 매체의 이용약관을 따릅니다.",
  };

  await mkdir("./data", { recursive: true });
  await writeFile(OUT, JSON.stringify(payload, null, 1), "utf8");

  console.log(`[${payload.generatedAt}]`);
  console.log(`  시세 ${okC}/${commod.length}  뉴스 ${okN}/${news.length}  기사 ${totalArticles}건 (현지어 ${localArticles})`);
  commod.forEach((c) => console.log(`  · ${c.n.padEnd(12)} ${c.st === "live" ? c.v + " " + c.d : "실패"}`));
  news.forEach((n) => console.log(`  · ${n.label.padEnd(16)} ${n.st === "ok" ? n.n + "건" : "실패: " + n.err}`));

  // 시세와 뉴스가 모두 전멸하면 실패로 종료 → Actions 에서 알림
  if (okC === 0 && okN === 0) process.exit(1);
}

main();
