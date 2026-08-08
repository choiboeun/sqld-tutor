"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getAuthHeaders } from "@/lib/api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ExamQuestion {
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
}

const TOTAL_SECS = 90 * 60;

const mdComponents = {
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
    const isBlock = className?.includes("language-");
    return isBlock ? (
      <pre className="bg-stone-800 text-stone-100 rounded p-3 overflow-x-auto text-xs my-2 font-mono">
        <code {...props}>{children}</code>
      </pre>
    ) : (
      <code className="bg-stone-100 text-stone-700 px-1 py-0.5 rounded text-xs font-mono" {...props}>
        {children}
      </code>
    );
  },
};

export default function ExamPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [current, setCurrent] = useState(0);
  const [secsLeft, setSecsLeft] = useState(TOTAL_SECS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const submittedRef = useRef(false);

  const submit = useCallback((qs: ExamQuestion[], ans: Record<number, number>) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);

    const results = qs.map((q) => ({
      id: q.id,
      num: q.num,
      subject: q.subject,
      category: q.category,
      difficulty: q.difficulty,
      question: q.question,
      context: q.context,
      options: q.options,
      answer: q.answer,
      explanation: q.explanation,
      selected: ans[q.num] ?? null,
      correct: ans[q.num] === q.answer,
    }));

    sessionStorage.setItem("examResult", JSON.stringify(results));
    router.push("/exam/result");
  }, [router]);

  // 문제 로드
  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push("/login"); return; }

        const headers = await getAuthHeaders();
        const res = await fetch("/api/exam/generate", { headers });
        if (!res.ok) throw new Error("문제 로드 실패");
        const data = await res.json();
        setQuestions(data.questions);
      } catch (e) {
        setError("문제를 불러오지 못했어요. 다시 시도해주세요.");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  // 타이머
  useEffect(() => {
    if (loading || questions.length === 0) return;
    timerRef.current = setInterval(() => {
      setSecsLeft((s) => {
        if (s <= 1) {
          clearInterval(timerRef.current!);
          submit(questions, answers);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, questions.length]);

  const mm = String(Math.floor(secsLeft / 60)).padStart(2, "0");
  const ss = String(secsLeft % 60).padStart(2, "0");
  const timerUrgent = secsLeft <= 300; // 5분 이하 빨간색

  const q = questions[current];
  const answeredCount = Object.keys(answers).length;
  const unansweredCount = questions.length - answeredCount;

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-stone-500 text-sm">문제를 준비하는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-stone-600 mb-4">{error}</p>
          <button onClick={() => router.push("/home")} className="px-4 py-2 bg-stone-800 text-white text-sm">홈으로</button>
        </div>
      </div>
    );
  }

  if (!q) return null;

  const opts = [1, 2, 3, 4].map((n) => ({ num: n, text: q.options[String(n)] ?? "" }));

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">

      {/* 상단 바 */}
      <header className="bg-white border-b border-stone-200 px-4 py-3 flex items-center justify-between gap-4 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          {/* 모바일: 번호 그리드 토글 */}
          <button
            onClick={() => setShowGrid((v) => !v)}
            className="md:hidden text-xs px-2 py-1.5 border border-stone-200 text-stone-600 bg-stone-50"
          >
            {showGrid ? "닫기" : "문제 목록"}
          </button>
          <span className="text-sm font-semibold text-stone-700">
            문제 <span className="text-amber-600">{current + 1}</span> / {questions.length}
          </span>
          <span className="hidden sm:inline text-xs text-stone-400">
            답변 {answeredCount} / {questions.length}
          </span>
        </div>

        <div className={`text-base font-black tabular-nums tracking-wider ${timerUrgent ? "text-red-500" : "text-stone-700"}`}>
          ⏱ {mm}:{ss}
        </div>

        <button
          onClick={() => setShowSubmitConfirm(true)}
          className="px-4 py-1.5 bg-stone-900 text-white text-sm font-semibold hover:bg-stone-700 transition-colors"
        >
          제출하기
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* 왼쪽: 번호 그리드 (데스크탑 고정 / 모바일 드로어) */}
        <>
          {showGrid && (
            <div className="fixed inset-0 bg-black/40 z-20 md:hidden" onClick={() => setShowGrid(false)} />
          )}
          <aside className={`
            ${showGrid ? "fixed inset-y-0 left-0 z-30 w-64" : "hidden"}
            md:relative md:flex md:flex-col md:w-52 md:shrink-0
            bg-white border-r border-stone-200 p-4 overflow-y-auto
          `}>
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-3">문제 번호</p>

            {/* 1과목 */}
            <p className="text-[10px] text-stone-400 mb-1.5">1과목 (1~10)</p>
            <div className="grid grid-cols-5 gap-1.5 mb-4">
              {questions.filter(q => q.subject === 1).map((q) => (
                <button
                  key={q.num}
                  onClick={() => { setCurrent(q.num - 1); setShowGrid(false); }}
                  className={`h-8 text-xs font-semibold transition-colors ${
                    current === q.num - 1
                      ? "bg-amber-500 text-white"
                      : answers[q.num] !== undefined
                        ? "bg-amber-100 text-amber-700 border border-amber-200"
                        : "bg-stone-100 text-stone-500 hover:bg-stone-200"
                  }`}
                >
                  {q.num}
                </button>
              ))}
            </div>

            {/* 2과목 */}
            <p className="text-[10px] text-stone-400 mb-1.5">2과목 (11~50)</p>
            <div className="grid grid-cols-5 gap-1.5">
              {questions.filter(q => q.subject === 2).map((q) => (
                <button
                  key={q.num}
                  onClick={() => { setCurrent(q.num - 1); setShowGrid(false); }}
                  className={`h-8 text-xs font-semibold transition-colors ${
                    current === q.num - 1
                      ? "bg-amber-500 text-white"
                      : answers[q.num] !== undefined
                        ? "bg-amber-100 text-amber-700 border border-amber-200"
                        : "bg-stone-100 text-stone-500 hover:bg-stone-200"
                  }`}
                >
                  {q.num}
                </button>
              ))}
            </div>

            {/* 범례 */}
            <div className="mt-4 pt-3 border-t border-stone-100 space-y-1.5">
              <div className="flex items-center gap-2 text-[10px] text-stone-400">
                <span className="w-4 h-4 bg-stone-100 inline-block" />미답변
              </div>
              <div className="flex items-center gap-2 text-[10px] text-stone-400">
                <span className="w-4 h-4 bg-amber-100 border border-amber-200 inline-block" />답변 완료
              </div>
              <div className="flex items-center gap-2 text-[10px] text-stone-400">
                <span className="w-4 h-4 bg-amber-500 inline-block" />현재 문제
              </div>
            </div>
          </aside>
        </>

        {/* 메인: 문제 */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-4 py-6">

            {/* 문제 헤더 */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-bold text-stone-400">{q.num}번</span>
              <span className="text-[11px] px-2 py-0.5 bg-amber-100 text-amber-700 font-semibold">{q.category}</span>
              <span className={`text-[11px] px-2 py-0.5 font-semibold ${
                q.difficulty === "상" ? "bg-red-50 text-red-600"
                : q.difficulty === "중" ? "bg-stone-100 text-stone-500"
                : "bg-green-50 text-green-600"
              }`}>{q.difficulty}</span>
            </div>

            {/* context */}
            {q.context && (
              <div className="bg-stone-100 border border-stone-200 px-4 py-3 mb-4 text-sm text-stone-700 leading-relaxed">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                  {q.context}
                </ReactMarkdown>
              </div>
            )}

            {/* 문제 본문 */}
            <div className="text-base font-medium text-stone-800 leading-relaxed mb-6">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                {q.question}
              </ReactMarkdown>
            </div>

            {/* 보기 */}
            <div className="border border-stone-200 overflow-hidden mb-8">
              {opts.map((opt) => {
                const selected = answers[q.num] === opt.num;
                return (
                  <button
                    key={opt.num}
                    onClick={() => setAnswers((prev) => ({ ...prev, [q.num]: opt.num }))}
                    className={`w-full text-left flex items-start gap-3 px-4 py-3 border-b border-stone-100 last:border-b-0 transition-colors ${
                      selected ? "bg-amber-500" : "bg-white hover:bg-amber-50"
                    }`}
                  >
                    <span className={`shrink-0 text-sm font-bold mt-0.5 ${selected ? "text-white" : "text-stone-400"}`}>
                      {["①", "②", "③", "④"][opt.num - 1]}
                    </span>
                    <div className={`flex-1 text-sm leading-relaxed ${selected ? "text-white" : "text-stone-800"}`}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                        ...mdComponents,
                        p: ({ children }) => <span>{children}</span>,
                      }}>
                        {opt.text}
                      </ReactMarkdown>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* 이전/다음 */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrent((c) => Math.max(0, c - 1))}
                disabled={current === 0}
                className="px-5 py-2 border border-stone-200 text-stone-600 text-sm font-medium disabled:opacity-30 hover:bg-stone-50 transition-colors"
              >
                ← 이전
              </button>
              <span className="text-xs text-stone-400">미답변 {unansweredCount}문제</span>
              {current < questions.length - 1 ? (
                <button
                  onClick={() => setCurrent((c) => Math.min(questions.length - 1, c + 1))}
                  className="px-5 py-2 border border-stone-200 text-stone-600 text-sm font-medium hover:bg-stone-50 transition-colors"
                >
                  다음 →
                </button>
              ) : (
                <button
                  onClick={() => setShowSubmitConfirm(true)}
                  className="px-5 py-2 bg-stone-900 text-white text-sm font-semibold hover:bg-stone-700 transition-colors"
                >
                  제출하기
                </button>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* 제출 확인 모달 */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white w-full max-w-sm mx-4 shadow-xl">
            <div className="px-6 py-5 border-b border-stone-100">
              <h2 className="text-base font-semibold text-stone-800">시험을 제출할까요?</h2>
            </div>
            <div className="px-6 py-4">
              {unansweredCount > 0 && (
                <p className="text-sm text-amber-600 font-medium mb-2">
                  미답변 문제가 {unansweredCount}개 남아있어요.
                </p>
              )}
              <p className="text-sm text-stone-500">
                답변 완료: {answeredCount} / {questions.length}문제
              </p>
              <p className="text-sm text-stone-500">남은 시간: {mm}:{ss}</p>
            </div>
            <div className="px-6 py-4 flex gap-3">
              <button
                onClick={() => setShowSubmitConfirm(false)}
                className="flex-1 py-2 border border-stone-200 text-stone-600 text-sm hover:bg-stone-50"
              >
                계속 풀기
              </button>
              <button
                onClick={() => submit(questions, answers)}
                className="flex-1 py-2 bg-stone-900 text-white text-sm font-semibold hover:bg-stone-700"
              >
                제출하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
