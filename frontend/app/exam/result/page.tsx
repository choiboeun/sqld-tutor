"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import dynamic from "next/dynamic";

const MermaidChart = dynamic(() => import("@/components/MermaidChart"), {
  ssr: false,
  loading: () => <div className="bg-stone-100 p-3 text-xs text-stone-400 my-2">다이어그램 로딩 중...</div>,
});

interface QuestionResult {
  id: string;
  num: number;
  subject: 1 | 2;
  category: string;
  difficulty: string;
  question: string;
  context: string;
  options: Record<string, string>;
  answer: number;
  explanation: string;
  selected: number | null;
  correct: boolean;
}

const mdComponents = {
  h3: ({ children }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <div className="text-[11px] font-bold text-stone-500 border-l-2 border-stone-400 pl-2 mt-3 mb-1.5">
      {children}
    </div>
  ),
  h4: ({ children }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <div className="text-[10px] font-semibold text-stone-400 mt-3 mb-0.5 tracking-wider uppercase">
      {children}
    </div>
  ),
  table: (props: React.HTMLAttributes<HTMLTableElement>) => (
    <div className="overflow-x-auto my-2">
      <table className="border-collapse text-sm w-full" {...props} />
    </div>
  ),
  th: (props: React.HTMLAttributes<HTMLTableCellElement>) => (
    <th className="border border-stone-300 px-2 py-1 bg-stone-100 font-semibold text-left" {...props} />
  ),
  td: (props: React.HTMLAttributes<HTMLTableCellElement>) => (
    <td className="border border-stone-300 px-2 py-1" {...props} />
  ),
  code: ({ children, className, ...props }: React.HTMLAttributes<HTMLElement> & { className?: string }) => {
    if (className === "language-mermaid") {
      return <MermaidChart code={String(children)} />;
    }
    const isBlock = className?.includes("language-");
    return isBlock ? (
      <pre className="bg-stone-800 text-stone-100 rounded p-3 overflow-x-auto text-xs my-2 font-mono whitespace-pre-wrap break-words">
        <code {...props}>{children}</code>
      </pre>
    ) : (
      <code className="bg-stone-100 text-stone-700 px-1 py-0.5 rounded text-xs font-mono" {...props}>
        {children}
      </code>
    );
  },
  p: ({ children }: React.HTMLAttributes<HTMLParagraphElement>) => <p className="mb-1 last:mb-0">{children}</p>,
};

export default function ExamResultPage() {
  const router = useRouter();
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [selected, setSelected] = useState<QuestionResult | null>(null);
  const [exitTarget, setExitTarget] = useState<"home" | "retry" | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = sessionStorage.getItem("examResult");
    if (!raw) { router.push("/home"); return; }
    try {
      setResults(JSON.parse(raw));
    } catch {
      router.push("/home");
    } finally {
      setLoading(false);
    }
  }, [router]);

  if (loading) return (
    <div className="flex h-[100dvh] items-center justify-center bg-[#fafaf9]">
      <p className="text-sm text-stone-400">결과를 불러오는 중...</p>
    </div>
  );
  if (results.length === 0) return null;

  // 채점
  const s1 = results.filter((r) => r.subject === 1);
  const s2 = results.filter((r) => r.subject === 2);
  const s1Correct = s1.filter((r) => r.correct).length;
  const s2Correct = s2.filter((r) => r.correct).length;
  const s1Score = s1Correct * 2;   // 1과목 최대 20점
  const s2Score = s2Correct * 2;   // 2과목 최대 80점
  const totalScore = s1Score + s2Score;

  const s1Pass = s1Score >= 8;    // 40% = 8점
  const s2Pass = s2Score >= 32;   // 40% = 32점
  const totalPass = totalScore >= 60;
  const passed = totalPass && s1Pass && s2Pass;

  // 카테고리별 정답률
  const categoryMap: Record<string, { correct: number; total: number }> = {};
  for (const r of results) {
    if (!categoryMap[r.category]) categoryMap[r.category] = { correct: 0, total: 0 };
    categoryMap[r.category].total++;
    if (r.correct) categoryMap[r.category].correct++;
  }
  const categoryStats = Object.entries(categoryMap)
    .map(([cat, s]) => ({ cat, pct: Math.round((s.correct / s.total) * 100) }))
    .sort((a, b) => a.pct - b.pct);

  // 불합격 사유
  const failReasons: string[] = [];
  if (!totalPass) failReasons.push(`총점 ${totalScore}점 (60점 미달)`);
  if (!s1Pass) failReasons.push(`1과목 ${s1Score}점 (8점 미달)`);
  if (!s2Pass) failReasons.push(`2과목 ${s2Score}점 (32점 미달)`);

  const opts = (r: QuestionResult) =>
    [1, 2, 3, 4].map((n) => ({ num: n, text: r.options[String(n)] ?? "" }));

  return (
    <div className="min-h-screen bg-[#fafaf9]">

      {/* 결과 헤더 */}
      <div className={`${passed ? "bg-[#14b8a6]" : "bg-[#292524]"} text-white`}>
        <div className="max-w-3xl mx-auto px-5 py-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3 opacity-80">SQLD 모의고사 결과</p>
          <div className="flex items-baseline justify-center gap-2 mb-4">
            <span className="text-8xl font-black tabular-nums leading-none">{totalScore}</span>
            <span className="text-2xl opacity-70">/ 100점</span>
          </div>
          <div className={`inline-block px-4 py-1.5 text-sm font-black tracking-widest mb-6 ${
            passed ? "bg-white/25 text-white" : "bg-white/15 text-white/80"
          }`}>
            {passed ? "합격" : "불합격"}
          </div>

          {!passed && failReasons.length > 0 && (
            <div className="bg-white/10 px-4 py-3 mb-4 text-left">
              <p className="text-xs font-semibold opacity-80 mb-1.5">불합격 사유</p>
              {failReasons.map((r) => (
                <p key={r} className="text-sm opacity-90">· {r}</p>
              ))}
            </div>
          )}

          {/* 과목별 점수 */}
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className={`px-4 py-3 ${s1Pass ? "bg-white/15" : "bg-red-900/40"}`}>
              <p className="text-xs opacity-70 mb-1">1과목</p>
              <p className="text-2xl font-black tabular-nums">{s1Score}<span className="text-sm font-normal opacity-60"> / 20점</span></p>
              <p className="text-xs mt-1 opacity-70">{s1Correct}/{s1.length}개 정답 · {s1Pass ? "통과" : "미달"}</p>
            </div>
            <div className={`px-4 py-3 ${s2Pass ? "bg-white/15" : "bg-red-900/40"}`}>
              <p className="text-xs opacity-70 mb-1">2과목</p>
              <p className="text-2xl font-black tabular-nums">{s2Score}<span className="text-sm font-normal opacity-60"> / 80점</span></p>
              <p className="text-xs mt-1 opacity-70">{s2Correct}/{s2.length}개 정답 · {s2Pass ? "통과" : "미달"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 본문 */}
      <div className="max-w-3xl mx-auto px-5 py-8">

        {/* 카테고리별 정답률 */}
        <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-widest mb-4">카테고리별 정답률</h2>
        <div className="space-y-3 mb-8">
          {categoryStats.map(({ cat, pct }) => {
            const barColor = pct >= 70 ? "#14b8a6" : pct >= 40 ? "#f59e0b" : "#ef4444";
            const textColor = pct >= 70 ? "#0d9488" : pct >= 40 ? "#b45309" : "#b91c1c";
            return (
              <div key={cat} className="flex items-center gap-3">
                <span className="text-xs text-stone-500 w-28 text-right shrink-0 leading-tight">{cat}</span>
                <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: barColor }} />
                </div>
                <span className="text-xs font-bold w-8 shrink-0 tabular-nums" style={{ color: textColor }}>{pct}%</span>
              </div>
            );
          })}
        </div>

        {/* 문제별 정오표 */}
        <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-widest mb-4">문제별 정오표</h2>
        <p className="text-xs text-stone-400 mb-4">문제를 클릭하면 내 답변과 해설을 볼 수 있어요.</p>

        {/* 1과목 */}
        <p className="text-xs font-semibold text-stone-400 mb-2">1과목</p>
        <div className="grid grid-cols-10 gap-1.5 mb-6">
          {s1.map((r) => (
            <button
              key={r.num}
              onClick={() => setSelected(r)}
              title={`${r.num}번 — ${r.category}`}
              className={`h-9 text-xs font-bold transition-colors ${
                r.correct
                  ? "bg-teal-100 text-teal-700 border border-teal-200 hover:bg-teal-200"
                  : r.selected === null
                    ? "bg-stone-100 text-stone-400 border border-stone-200 hover:bg-stone-200"
                    : "bg-red-100 text-red-600 border border-red-200 hover:bg-red-200"
              }`}
            >
              {r.num}
            </button>
          ))}
        </div>

        {/* 2과목 */}
        <p className="text-xs font-semibold text-stone-400 mb-2">2과목</p>
        <div className="grid grid-cols-10 gap-1.5 mb-8">
          {s2.map((r) => (
            <button
              key={r.num}
              onClick={() => setSelected(r)}
              title={`${r.num}번 — ${r.category}`}
              className={`h-9 text-xs font-bold transition-colors ${
                r.correct
                  ? "bg-teal-100 text-teal-700 border border-teal-200 hover:bg-teal-200"
                  : r.selected === null
                    ? "bg-stone-100 text-stone-400 border border-stone-200 hover:bg-stone-200"
                    : "bg-red-100 text-red-600 border border-red-200 hover:bg-red-200"
              }`}
            >
              {r.num}
            </button>
          ))}
        </div>

        {/* 범례 */}
        <div className="flex gap-4 text-xs text-stone-400 mb-8">
          <span><span className="inline-block w-3 h-3 bg-teal-100 border border-teal-200 mr-1" />정답</span>
          <span><span className="inline-block w-3 h-3 bg-red-100 border border-red-200 mr-1" />오답</span>
          <span><span className="inline-block w-3 h-3 bg-stone-100 border border-stone-200 mr-1" />미답변</span>
        </div>

        {/* 나가기 경고 배너 */}
        <div className="flex items-start gap-2.5 bg-indigo-50 border border-indigo-200 px-4 py-3 mb-3">
          <svg className="shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <p className="text-xs text-indigo-800 leading-relaxed">
            이 페이지를 벗어나면 <span className="font-semibold">오답 기록이 사라집니다.</span> 틀린 문제를 먼저 클릭해 확인하세요.
          </p>
        </div>

        {/* 버튼 */}
        <div className="flex gap-3">
          <button
            onClick={() => setExitTarget("home")}
            className="flex-1 py-3 border border-stone-200 text-stone-600 text-sm font-medium hover:bg-stone-100 transition-colors"
          >
            홈으로
          </button>
          <button
            onClick={() => setExitTarget("retry")}
            className="flex-1 py-3 bg-stone-900 text-white text-sm font-semibold hover:bg-stone-700 transition-colors"
          >
            다시 풀기
          </button>
        </div>
      </div>

      {/* 나가기 확인 모달 */}
      {exitTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-5">
          <div className="bg-white w-full max-w-sm shadow-xl p-6">
            <p className="text-sm font-semibold text-stone-800 mb-1.5">
              {exitTarget === "retry" ? "다시 풀기로 이동할까요?" : "홈으로 이동할까요?"}
            </p>
            <p className="text-xs text-stone-500 mb-5 leading-relaxed">
              이동하면 현재 시험 결과와 오답 기록이 <span className="font-semibold text-stone-700">영구적으로 사라집니다.</span> 틀린 문제를 다 확인하셨나요?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setExitTarget(null)}
                className="flex-1 py-2.5 border border-stone-200 text-stone-600 text-sm hover:bg-[#fafaf9] transition-colors"
              >
                계속 보기
              </button>
              <button
                onClick={() => {
                  sessionStorage.removeItem("examResult");
                  router.push(exitTarget === "retry" ? "/exam" : "/home");
                }}
                className="flex-1 py-2.5 bg-stone-900 text-white text-sm font-semibold hover:bg-stone-700 transition-colors"
              >
                {exitTarget === "retry" ? "다시 풀기" : "홈으로"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 문제 해설 모달 */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50">
          <div className="bg-white w-full max-w-lg mx-0 md:mx-4 max-h-[85vh] overflow-y-auto shadow-xl">
            {/* 모달 헤더 */}
            <div className="sticky top-0 bg-white border-b border-stone-100 px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-stone-500">{selected.num}번</span>
                <span className="text-[11px] px-2 py-0.5 bg-indigo-100 text-indigo-700 font-semibold">{selected.category}</span>
                <span className={`text-[11px] font-bold ${selected.correct ? "text-teal-600" : selected.selected === null ? "text-stone-400" : "text-red-500"}`}>
                  {selected.correct ? "정답" : selected.selected === null ? "미답변" : "오답"}
                </span>
              </div>
              <button onClick={() => setSelected(null)} className="text-stone-400 hover:text-stone-600 p-1">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              {/* context */}
              {selected.context && (
                <div className="bg-stone-100 border border-stone-200 px-3 py-2 text-sm text-stone-700">
                  <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={mdComponents}>{selected.context}</ReactMarkdown>
                </div>
              )}

              {/* 문제 */}
              <div className="text-sm font-medium text-stone-800 leading-relaxed">
                <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={mdComponents}>{selected.question}</ReactMarkdown>
              </div>

              {/* 보기 */}
              <div className="border border-stone-200 overflow-hidden">
                {opts(selected).map((opt) => {
                  const isCorrect = opt.num === selected.answer;
                  const isSelected = opt.num === selected.selected;
                  const bg = isCorrect
                    ? "bg-teal-50 border-l-4 border-l-teal-400"
                    : isSelected && !isCorrect
                      ? "bg-red-50 border-l-4 border-l-red-400"
                      : "bg-white";
                  return (
                    <div key={opt.num} className={`flex items-start gap-3 px-4 py-3 border-b border-stone-100 last:border-b-0 ${bg}`}>
                      <span className={`shrink-0 text-sm font-bold mt-0.5 ${
                        isCorrect ? "text-teal-600" : isSelected ? "text-red-500" : "text-stone-300"
                      }`}>
                        {["①", "②", "③", "④"][opt.num - 1]}
                      </span>
                      <div className="flex-1 min-w-0 overflow-x-auto text-sm leading-relaxed text-stone-800">
                        <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={{
                          ...mdComponents,
                          p: ({ children }) => <span>{children}</span>,
                        }}>{opt.text}</ReactMarkdown>
                      </div>
                      {isCorrect && <span className="shrink-0 text-xs font-bold text-teal-600">정답</span>}
                      {isSelected && !isCorrect && <span className="shrink-0 text-xs font-bold text-red-500">내 답</span>}
                    </div>
                  );
                })}
              </div>

              {/* 해설 */}
              <div className="bg-indigo-50 border border-indigo-200 px-4 py-3">
                <p className="text-xs font-semibold text-indigo-700 mb-1.5">해설</p>
                <div className="text-sm text-stone-700 leading-relaxed">
                  <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={mdComponents}>{selected.explanation}</ReactMarkdown>
                </div>
              </div>

              {/* 이전/다음 문제 이동 */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => {
                    const idx = results.findIndex(r => r.num === selected.num);
                    if (idx > 0) setSelected(results[idx - 1]);
                  }}
                  disabled={results[0].num === selected.num}
                  className="flex-1 py-2 border border-stone-200 text-stone-500 text-sm disabled:opacity-30 hover:bg-[#fafaf9]"
                >
                  ← 이전
                </button>
                <button
                  onClick={() => {
                    const idx = results.findIndex(r => r.num === selected.num);
                    if (idx < results.length - 1) setSelected(results[idx + 1]);
                  }}
                  disabled={results[results.length - 1].num === selected.num}
                  className="flex-1 py-2 border border-stone-200 text-stone-500 text-sm disabled:opacity-30 hover:bg-[#fafaf9]"
                >
                  다음 →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
