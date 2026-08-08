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

interface ExamStorage {
  questions: ExamQuestion[];
  answers: Record<number, number>;
  current: number;
  startTimestamp: number; // Date.now() 기준
}

const TOTAL_SECS = 90 * 60;
const STORAGE_KEY = "examInProgress";

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
      <pre className="bg-stone-800 text-stone-100 rounded p-3 overflow-x-auto text-xs my-2 font-mono whitespace-pre-wrap break-words">
        <code {...props}>{children}</code>
      </pre>
    ) : (
      <code className="bg-stone-100 text-stone-700 px-1 py-0.5 rounded text-xs font-mono" {...props}>
        {children}
      </code>
    );
  },
};

function calcSecsLeft(startTimestamp: number): number {
  const elapsed = Math.floor((Date.now() - startTimestamp) / 1000);
  return Math.max(0, TOTAL_SECS - elapsed);
}

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

  // 타이머 콜백에서 최신 state를 stale closure 없이 읽기 위한 ref
  const questionsRef = useRef<ExamQuestion[]>([]);
  const answersRef = useRef<Record<number, number>>({});
  const startTimestampRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const submittedRef = useRef(false);

  // ── sessionStorage에 현재 상태 저장 ──
  const persist = useCallback((
    qs: ExamQuestion[],
    ans: Record<number, number>,
    cur: number,
    startTs: number,
  ) => {
    const data: ExamStorage = { questions: qs, answers: ans, current: cur, startTimestamp: startTs };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, []);

  // ── 제출 ──
  const submit = useCallback((qs: ExamQuestion[], ans: Record<number, number>) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    sessionStorage.removeItem(STORAGE_KEY); // 진행 중 상태 삭제

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

  // ── 타이머 시작 (ref에서 최신 state를 읽어 stale closure 방지) ──
  const startTimer = useCallback((startTs: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const left = calcSecsLeft(startTs);
      setSecsLeft(left);
      if (left <= 0) {
        clearInterval(timerRef.current!);
        submit(questionsRef.current, answersRef.current);
      }
    }, 1000);
  }, [submit]);

  // ── 초기 로드: sessionStorage 복원 또는 신규 fetch ──
  useEffect(() => {
    (async () => {
      // 1) 이미 진행 중인 시험이 있는지 확인
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const stored: ExamStorage = JSON.parse(saved);
          const left = calcSecsLeft(stored.startTimestamp);
          if (left > 0 && stored.questions?.length === 50) {
            // 복원
            startTimestampRef.current = stored.startTimestamp;
            questionsRef.current = stored.questions;
            answersRef.current = stored.answers ?? {};
            setQuestions(stored.questions);
            setAnswers(stored.answers ?? {});
            setCurrent(stored.current ?? 0);
            setSecsLeft(left);
            setLoading(false);
            startTimer(stored.startTimestamp);
            return;
          }
          // 시간 초과된 저장본 → 삭제 후 새로 시작
          sessionStorage.removeItem(STORAGE_KEY);
        } catch {
          sessionStorage.removeItem(STORAGE_KEY);
        }
      }

      // 2) 인증 확인
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push("/login"); return; }

        // 3) 신규 문제 fetch
        const headers = await getAuthHeaders();
        const res = await fetch("/api/exam/generate", { headers });
        if (!res.ok) throw new Error("문제 로드 실패");
        const data = await res.json();

        const startTs = Date.now();
        startTimestampRef.current = startTs;
        questionsRef.current = data.questions;
        answersRef.current = {};
        setQuestions(data.questions);
        setSecsLeft(TOTAL_SECS);
        persist(data.questions, {}, 0, startTs);
        startTimer(startTs);
      } catch {
        setError("문제를 불러오지 못했어요. 다시 시도해주세요.");
      } finally {
        setLoading(false);
      }
    })();

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 답변 선택 ──
  const selectAnswer = useCallback((questionNum: number, optNum: number) => {
    setAnswers((prev) => {
      const next = { ...prev, [questionNum]: optNum };
      answersRef.current = next;
      persist(questionsRef.current, next, current, startTimestampRef.current);
      return next;
    });
  }, [current, persist]);

  // ── 문제 이동 (저장 포함) ──
  const moveTo = useCallback((idx: number) => {
    setCurrent(idx);
    persist(questionsRef.current, answersRef.current, idx, startTimestampRef.current);
  }, [persist]);

  // ── 렌더 ──
  const mm = String(Math.floor(secsLeft / 60)).padStart(2, "0");
  const ss = String(secsLeft % 60).padStart(2, "0");
  const timerUrgent = secsLeft <= 300;
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

        {/* 번호 그리드 사이드바 */}
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

            <p className="text-[10px] text-stone-400 mb-1.5">1과목 (1~10)</p>
            <div className="grid grid-cols-5 gap-1.5 mb-4">
              {questions.filter(q => q.subject === 1).map((q) => (
                <button
                  key={q.num}
                  onClick={() => { moveTo(q.num - 1); setShowGrid(false); }}
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

            <p className="text-[10px] text-stone-400 mb-1.5">2과목 (11~50)</p>
            <div className="grid grid-cols-5 gap-1.5">
              {questions.filter(q => q.subject === 2).map((q) => (
                <button
                  key={q.num}
                  onClick={() => { moveTo(q.num - 1); setShowGrid(false); }}
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
          <div className="max-w-3xl mx-auto px-5 py-6">

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
                    onClick={() => selectAnswer(q.num, opt.num)}
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
                onClick={() => moveTo(Math.max(0, current - 1))}
                disabled={current === 0}
                className="px-5 py-2 border border-stone-200 text-stone-600 text-sm font-medium disabled:opacity-30 hover:bg-stone-50 transition-colors"
              >
                ← 이전
              </button>
              <span className="text-xs text-stone-400">미답변 {unansweredCount}문제</span>
              {current < questions.length - 1 ? (
                <button
                  onClick={() => moveTo(Math.min(questions.length - 1, current + 1))}
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
              <p className="text-sm text-stone-500">답변 완료: {answeredCount} / {questions.length}문제</p>
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
                onClick={() => submit(questionsRef.current, answersRef.current)}
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
