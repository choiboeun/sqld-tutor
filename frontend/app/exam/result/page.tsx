"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import dynamic from "next/dynamic";

const MermaidChart = dynamic(() => import("@/components/MermaidChart"), {
  ssr: false,
  loading: () => <div className="bg-violet-50 p-3 text-xs text-indigo-300 my-2">다이어그램 로딩 중...</div>,
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
    <div className="text-[11px] font-bold text-indigo-400 border-l-2 border-indigo-300 pl-2 mt-3 mb-1.5">
      {children}
    </div>
  ),
  h4: ({ children }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <div className="text-[10px] font-semibold text-indigo-300 mt-3 mb-0.5 tracking-wider uppercase">
      {children}
    </div>
  ),
  table: (props: React.HTMLAttributes<HTMLTableElement>) => (
    <div className="overflow-x-auto my-2">
      <table className="border-collapse text-sm w-full" {...props} />
    </div>
  ),
  th: (props: React.HTMLAttributes<HTMLTableCellElement>) => (
    <th className="border border-violet-100 px-2 py-1 bg-violet-50 font-semibold text-left" {...props} />
  ),
  td: (props: React.HTMLAttributes<HTMLTableCellElement>) => (
    <td className="border border-violet-100 px-2 py-1" {...props} />
  ),
  code: ({ children, className, ...props }: React.HTMLAttributes<HTMLElement> & { className?: string }) => {
    if (className === "language-mermaid") {
      return <MermaidChart code={String(children)} />;
    }
    const isBlock = className?.includes("language-");
    return isBlock ? (
      <pre className="bg-indigo-950 text-indigo-50 rounded p-3 overflow-x-auto text-xs my-2 font-mono whitespace-pre-wrap break-words">
        <code {...props}>{children}</code>
      </pre>
    ) : (
      <code className="bg-violet-50 text-indigo-700 px-1 py-0.5 rounded text-xs font-mono" {...props}>
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
    <div className="flex h-[100dvh] items-center justify-center bg-violet-50">
      <p className="text-sm text-indigo-300">결과를 불러오는 중...</p>
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

  // 불합격 사유
  const failReasons: string[] = [];
  if (!totalPass) failReasons.push(`총점 ${totalScore}점 (60점 미달)`);
  if (!s1Pass) failReasons.push(`1과목 ${s1Score}점 (8점 미달)`);
  if (!s2Pass) failReasons.push(`2과목 ${s2Score}점 (32점 미달)`);

  const opts = (r: QuestionResult) =>
    [1, 2, 3, 4].map((n) => ({ num: n, text: r.options[String(n)] ?? "" }));

  return (
    <div className="min-h-screen bg-violet-50">

      {/* 결과 헤더 */}
      <div className={`${passed ? "bg-indigo-500" : "bg-indigo-900"} text-white`}>
        <div className="max-w-3xl mx-auto px-5 py-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3 opacity-80">SQLD 모의고사 결과</p>
          <div className="flex items-baseline justify-center gap-2 mb-4">
            <span className="text-8xl font-black tabular-nums leading-none">{totalScore}</span>
            <span className="text-2xl opacity-70">/ 100점</span>
          </div>
          <div className={`inline-block px-4 py-1.5 text-sm font-black tracking-widest mb-6 ${
            passed ? "bg-white text-indigo-600" : "bg-white/20 text-white"
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
              <p className="text-xs mt-1 opacity-70">{s1Correct}/{s1.length}개 정답 {s1Pass ? "✅" : "❌"}</p>
            </div>
            <div className={`px-4 py-3 ${s2Pass ? "bg-white/15" : "bg-red-900/40"}`}>
              <p className="text-xs opacity-70 mb-1">2과목</p>
              <p className="text-2xl font-black tabular-nums">{s2Score}<span className="text-sm font-normal opacity-60"> / 80점</span></p>
              <p className="text-xs mt-1 opacity-70">{s2Correct}/{s2.length}개 정답 {s2Pass ? "✅" : "❌"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 문제별 정오표 */}
      <div className="max-w-3xl mx-auto px-5 py-8">
        <h2 className="text-sm font-semibold text-indigo-400 uppercase tracking-widest mb-4">문제별 정오표</h2>
        <p className="text-xs text-indigo-300 mb-4">문제를 클릭하면 내 답변과 해설을 볼 수 있어요.</p>

        {/* 1과목 */}
        <p className="text-xs font-semibold text-indigo-300 mb-2">1과목</p>
        <div className="grid grid-cols-10 gap-1.5 mb-6">
          {s1.map((r) => (
            <button
              key={r.num}
              onClick={() => setSelected(r)}
              title={`${r.num}번 — ${r.category}`}
              className={`h-9 text-xs font-bold transition-colors ${
                r.correct
                  ? "bg-green-100 text-green-700 border border-green-200 hover:bg-green-200"
                  : r.selected === null
                    ? "bg-violet-50 text-indigo-300 border border-violet-100 hover:bg-violet-100"
                    : "bg-red-100 text-red-600 border border-red-200 hover:bg-red-200"
              }`}
            >
              {r.num}
            </button>
          ))}
        </div>

        {/* 2과목 */}
        <p className="text-xs font-semibold text-indigo-300 mb-2">2과목</p>
        <div className="grid grid-cols-10 gap-1.5 mb-8">
          {s2.map((r) => (
            <button
              key={r.num}
              onClick={() => setSelected(r)}
              title={`${r.num}번 — ${r.category}`}
              className={`h-9 text-xs font-bold transition-colors ${
                r.correct
                  ? "bg-green-100 text-green-700 border border-green-200 hover:bg-green-200"
                  : r.selected === null
                    ? "bg-violet-50 text-indigo-300 border border-violet-100 hover:bg-violet-100"
                    : "bg-red-100 text-red-600 border border-red-200 hover:bg-red-200"
              }`}
            >
              {r.num}
            </button>
          ))}
        </div>

        {/* 범례 */}
        <div className="flex gap-4 text-xs text-indigo-300 mb-8">
          <span><span className="inline-block w-3 h-3 bg-green-100 border border-green-200 mr-1" />정답</span>
          <span><span className="inline-block w-3 h-3 bg-red-100 border border-red-200 mr-1" />오답</span>
          <span><span className="inline-block w-3 h-3 bg-violet-50 border border-violet-100 mr-1" />미답변</span>
        </div>

        {/* 나가기 경고 배너 */}
        <div className="flex items-start gap-2.5 bg-violet-50 border border-violet-100 px-4 py-3 mb-3">
          <svg className="shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <p className="text-xs text-indigo-700 leading-relaxed">
            이 페이지를 벗어나면 <span className="font-semibold">오답 기록이 사라집니다.</span> 틀린 문제를 먼저 클릭해 확인하세요.
          </p>
        </div>

        {/* 버튼 */}
        <div className="flex gap-3">
          <button
            onClick={() => setExitTarget("home")}
            className="flex-1 py-3 border border-violet-100 text-indigo-600 text-sm font-medium hover:bg-violet-50 transition-colors"
          >
            홈으로
          </button>
          <button
            onClick={() => setExitTarget("retry")}
            className="flex-1 py-3 bg-indigo-900 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            다시 풀기
          </button>
        </div>
      </div>

      {/* 나가기 확인 모달 */}
      {exitTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-5">
          <div className="bg-white w-full max-w-sm shadow-xl p-6">
            <p className="text-sm font-semibold text-indigo-900 mb-1.5">
              {exitTarget === "retry" ? "다시 풀기로 이동할까요?" : "홈으로 이동할까요?"}
            </p>
            <p className="text-xs text-indigo-400 mb-5 leading-relaxed">
              이동하면 현재 시험 결과와 오답 기록이 <span className="font-semibold text-indigo-800">영구적으로 사라집니다.</span> 틀린 문제를 다 확인하셨나요?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setExitTarget(null)}
                className="flex-1 py-2.5 border border-violet-100 text-indigo-600 text-sm hover:bg-violet-50 transition-colors"
              >
                계속 보기
              </button>
              <button
                onClick={() => {
                  sessionStorage.removeItem("examResult");
                  router.push(exitTarget === "retry" ? "/exam" : "/home");
                }}
                className="flex-1 py-2.5 bg-indigo-900 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
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
            <div className="sticky top-0 bg-white border-b border-violet-100 px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-indigo-400">{selected.num}번</span>
                <span className="text-[11px] px-2 py-0.5 bg-violet-100 text-indigo-600 font-semibold">{selected.category}</span>
                <span className={`text-[11px] font-bold ${selected.correct ? "text-green-600" : selected.selected === null ? "text-indigo-300" : "text-red-500"}`}>
                  {selected.correct ? "정답" : selected.selected === null ? "미답변" : "오답"}
                </span>
              </div>
              <button onClick={() => setSelected(null)} className="text-indigo-300 hover:text-indigo-500 p-1">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              {/* context */}
              {selected.context && (
                <div className="bg-violet-50 border border-violet-100 px-3 py-2 text-sm text-indigo-700">
                  <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={mdComponents}>{selected.context}</ReactMarkdown>
                </div>
              )}

              {/* 문제 */}
              <div className="text-sm font-medium text-indigo-900 leading-relaxed">
                <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={mdComponents}>{selected.question}</ReactMarkdown>
              </div>

              {/* 보기 */}
              <div className="border border-violet-100 overflow-hidden">
                {opts(selected).map((opt) => {
                  const isCorrect = opt.num === selected.answer;
                  const isSelected = opt.num === selected.selected;
                  const bg = isCorrect
                    ? "bg-green-50 border-l-4 border-l-green-400"
                    : isSelected && !isCorrect
                      ? "bg-red-50 border-l-4 border-l-red-400"
                      : "bg-white";
                  return (
                    <div key={opt.num} className={`flex items-start gap-3 px-4 py-3 border-b border-violet-50 last:border-b-0 ${bg}`}>
                      <span className={`shrink-0 text-sm font-bold mt-0.5 ${
                        isCorrect ? "text-green-600" : isSelected ? "text-red-500" : "text-indigo-200"
                      }`}>
                        {["①", "②", "③", "④"][opt.num - 1]}
                      </span>
                      <div className="flex-1 min-w-0 overflow-x-auto text-sm leading-relaxed text-indigo-900">
                        <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={{
                          ...mdComponents,
                          p: ({ children }) => <span>{children}</span>,
                        }}>{opt.text}</ReactMarkdown>
                      </div>
                      {isCorrect && <span className="shrink-0 text-xs font-bold text-green-600">정답</span>}
                      {isSelected && !isCorrect && <span className="shrink-0 text-xs font-bold text-red-500">내 답</span>}
                    </div>
                  );
                })}
              </div>

              {/* 해설 */}
              <div className="bg-violet-50 border border-violet-100 px-4 py-3">
                <p className="text-xs font-semibold text-indigo-500 mb-1.5">해설</p>
                <div className="text-sm text-indigo-800 leading-relaxed">
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
                  className="flex-1 py-2 border border-violet-100 text-indigo-400 text-sm disabled:opacity-30 hover:bg-violet-50"
                >
                  ← 이전
                </button>
                <button
                  onClick={() => {
                    const idx = results.findIndex(r => r.num === selected.num);
                    if (idx < results.length - 1) setSelected(results[idx + 1]);
                  }}
                  disabled={results[results.length - 1].num === selected.num}
                  className="flex-1 py-2 border border-violet-100 text-indigo-400 text-sm disabled:opacity-30 hover:bg-violet-50"
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
