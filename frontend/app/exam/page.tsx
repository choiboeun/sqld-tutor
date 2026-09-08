"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getAuthHeaders } from "@/lib/api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import dynamic from "next/dynamic";

const MermaidChart = dynamic(() => import("@/components/MermaidChart"), {
  ssr: false,
  loading: () => <div className="bg-stone-100 p-3 text-xs text-stone-400 my-2">다이어그램 로딩 중...</div>,
});

interface ExamQuestion {
  id: string;
  num: number;
  subject: 1 | 2;
  category: string;
  difficulty: string;
  question: string;
  context: string;
  image: string;
  options: Record<string, string>;
}

interface ExamStorage {
  questions: ExamQuestion[];
  answers: Record<number, number>;
  current: number;
  startTimestamp: number;
}

const TOTAL_SECS = 90 * 60;
const STORAGE_KEY = "examInProgress";

// **[섹션명]** → ### 섹션명 으로 변환해 h3 스타일링 적용
function preprocessContext(ctx: string): string {
  return ctx.replace(/\*\*\[([^\]]+)\]\*\*/g, (_, title) => `### ${title}`);
}

// ── 배경 정보 전용 마크다운 컴포넌트 ──
const contextMdComponents = {
  // 대섹션 헤더: ## 섹션명 → 진한 배너 (테이블 구조 / 데이터 등)
  h2: ({ children }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <div className="text-xs font-bold text-stone-700 bg-stone-300 px-4 py-2 -mx-4 mt-6 mb-2 tracking-wide border-l-4 border-stone-500">
      {children}
    </div>
  ),
  // 소섹션 헤더: ### 테이블명 → 연한 배너
  h3: ({ children }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <div className="text-[11px] font-bold text-stone-500 bg-stone-200 px-4 py-1.5 -mx-4 mt-5 mb-2 uppercase tracking-widest border-l-2 border-stone-400">
      {children}
    </div>
  ),
  // 테이블명 서브헤더: #### TABLE명 → 작은 레이블 (계층 구분)
  h4: ({ children }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <div className="text-[10px] font-semibold text-stone-400 mt-3 mb-0.5 tracking-wider uppercase">
      {children}
    </div>
  ),
  hr: () => <hr className="my-2 border-stone-300" />,
  // 데이터 테이블: 13px, 컴팩트, 왼쪽 정렬
  table: (props: React.HTMLAttributes<HTMLTableElement>) => (
    <div className="overflow-x-auto my-1.5">
      <table className="border-collapse text-xs" {...props} />
    </div>
  ),
  th: (props: React.HTMLAttributes<HTMLTableCellElement>) => (
    <th className="border border-stone-300 px-2 py-0.5 bg-stone-200 font-semibold text-left text-xs whitespace-nowrap" {...props} />
  ),
  td: (props: React.HTMLAttributes<HTMLTableCellElement>) => (
    <td className="border border-stone-300 px-2 py-0.5 text-left text-xs" {...props} />
  ),
  // 스키마 정의 리스트: 줄 전체 코드 폰트
  li: ({ children }: React.HTMLAttributes<HTMLLIElement>) => (
    <li className="font-mono text-xs leading-relaxed my-0.5">{children}</li>
  ),
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="my-1 pl-4 list-disc" {...props} />
  ),
  p: ({ children }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="text-sm leading-relaxed mb-1.5">{children}</p>
  ),
  code: ({ children, className, ...props }: React.HTMLAttributes<HTMLElement> & { className?: string }) => {
    if (className === "language-mermaid") {
      return <MermaidChart code={String(children)} />;
    }
    const isBlock = className?.includes("language-");
    return isBlock ? (
      // SQL 코드블록: 약간 밝은 배경
      <pre className="bg-stone-700 text-stone-100 rounded p-2.5 overflow-x-auto text-xs my-2 font-mono whitespace-pre-wrap">
        <code {...props}>{children}</code>
      </pre>
    ) : (
      // 인라인 코드: 테이블명, 컬럼명 등
      <code className="bg-stone-300 text-stone-800 px-1 py-0.5 rounded text-xs font-mono font-semibold" {...props}>
        {children}
      </code>
    );
  },
};

// ── 문제 본문 + 보기 전용 마크다운 컴포넌트 ──
const mdComponents = {
  h3: ({ children }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <div className="text-[11px] font-bold text-stone-500 border-l-2 border-stone-400 pl-2 mt-4 mb-1.5">
      {children}
    </div>
  ),
  hr: () => <hr className="my-3 border-stone-200" />,
  table: (props: React.HTMLAttributes<HTMLTableElement>) => (
    <div className="overflow-x-auto my-2">
      <table className="border-collapse text-sm" {...props} />
    </div>
  ),
  th: (props: React.HTMLAttributes<HTMLTableCellElement>) => (
    <th className="border border-stone-300 px-2 py-1 bg-stone-100 font-semibold text-left" {...props} />
  ),
  td: (props: React.HTMLAttributes<HTMLTableCellElement>) => (
    <td className="border border-stone-300 px-2 py-1 text-left" {...props} />
  ),
  code: ({ children, className, ...props }: React.HTMLAttributes<HTMLElement> & { className?: string }) => {
    if (className === "language-mermaid") {
      return <MermaidChart code={String(children)} />;
    }
    const isBlock = className?.includes("language-");
    return isBlock ? (
      // SQL 코드블록: bg-stone-700 (약간 밝게)
      <pre className="bg-stone-700 text-stone-100 rounded p-3 overflow-x-auto text-sm my-3 font-mono whitespace-pre-wrap">
        <code {...props}>{children}</code>
      </pre>
    ) : (
      <code className="bg-stone-200 text-stone-800 px-1.5 py-0.5 rounded text-sm font-mono font-semibold" {...props}>
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
  const [grading, setGrading] = useState(false);

  const questionsRef = useRef<ExamQuestion[]>([]);
  const answersRef = useRef<Record<number, number>>({});
  const currentRef = useRef<number>(0);
  const startTimestampRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const submitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const submittedRef = useRef(false);
  const [timerToast, setTimerToast] = useState(false);

  const persist = useCallback((
    qs: ExamQuestion[],
    ans: Record<number, number>,
    cur: number,
    startTs: number,
  ) => {
    const data: ExamStorage = { questions: qs, answers: ans, current: cur, startTimestamp: startTs };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, []);

  const submit = useCallback(async (qs: ExamQuestion[], ans: Record<number, number>) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    setGrading(true);

    try {
      const answersPayload: Record<string, number | null> = {};
      for (const q of qs) {
        answersPayload[q.id] = ans[q.num] ?? null;
      }

      const headers = await getAuthHeaders();
      const res = await fetch("/api/exam/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ answers: answersPayload }),
      });
      if (!res.ok) throw new Error("채점 실패");
      const { results: graded } = await res.json();

      const gradedMap: Record<string, { answer: number; explanation: string; correct: boolean }> = {};
      for (const g of graded) gradedMap[g.id] = g;

      const results = qs.map((q) => ({
        id: q.id,
        num: q.num,
        subject: q.subject,
        category: q.category,
        difficulty: q.difficulty,
        question: q.question,
        context: q.context,
        options: q.options,
        answer: gradedMap[q.id]?.answer ?? 0,
        explanation: gradedMap[q.id]?.explanation ?? "",
        selected: ans[q.num] ?? null,
        correct: gradedMap[q.id]?.correct ?? false,
      }));

      sessionStorage.removeItem(STORAGE_KEY);
      sessionStorage.setItem("examResult", JSON.stringify(results));
      router.push("/exam/result");
    } catch {
      setGrading(false);
      submittedRef.current = false;
      setError("채점 중 오류가 발생했어요. 다시 시도해주세요.");
    }
  }, [router]);

  const startTimer = useCallback((startTs: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const left = calcSecsLeft(startTs);
      setSecsLeft(left);
      if (left <= 0) {
        clearInterval(timerRef.current!);
        setTimerToast(true);
        submitTimeoutRef.current = setTimeout(() => submit(questionsRef.current, answersRef.current), 2000);
      }
    }, 1000);
  }, [submit]);

  useEffect(() => {
    (async () => {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const stored: ExamStorage = JSON.parse(saved);
          const left = calcSecsLeft(stored.startTimestamp);
          if (left > 0 && stored.questions?.length === 50) {
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
          sessionStorage.removeItem(STORAGE_KEY);
        } catch {
          sessionStorage.removeItem(STORAGE_KEY);
        }
      }

      try {
        const headers = await getAuthHeaders(); // 게스트면 {} 반환, 백엔드는 optional auth
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

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (submitTimeoutRef.current) clearTimeout(submitTimeoutRef.current);
    };
  }, [startTimer, submit, persist, router]);

  useEffect(() => {
    if (loading || error || submittedRef.current) return;
    const handler = (e: BeforeUnloadEvent) => {
      if (submittedRef.current) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [loading, error]);

  const selectAnswer = useCallback((questionNum: number, optNum: number) => {
    const next = { ...answersRef.current, [questionNum]: optNum };
    answersRef.current = next;
    persist(questionsRef.current, next, currentRef.current, startTimestampRef.current);
    setAnswers(next);
  }, [persist]);

  const moveTo = useCallback((idx: number) => {
    currentRef.current = idx;
    setCurrent(idx);
    persist(questionsRef.current, answersRef.current, idx, startTimestampRef.current);
  }, [persist]);

  const mm = String(Math.floor(secsLeft / 60)).padStart(2, "0");
  const ss = String(secsLeft % 60).padStart(2, "0");
  const timerUrgent = secsLeft <= 300;
  const q = questions[current];
  const answeredCount = Object.keys(answers).length;
  const unansweredCount = questions.length - answeredCount;

  if (loading || grading) {
    return (
      <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-stone-500 text-sm">{grading ? "채점하는 중..." : "문제를 준비하는 중..."}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center">
        <div className="text-center">
          <p className="text-stone-600 mb-4">{error}</p>
          <button onClick={() => router.push("/home")} className="px-4 py-2 bg-stone-800 text-white text-sm">홈으로</button>
        </div>
      </div>
    );
  }

  if (!q) return null;

  const opts = [1, 2, 3, 4].map((n) => ({ num: n, text: q.options[String(n)] ?? "" }));

  // 문제 본문 + 보기 블록 (컨텍스트 유무 관계없이 동일 구조)
  const questionBlock = (
    <>
      {/* 문제 본문: 15px, 줄간격 1.75 */}
      <div className="text-[15px] font-medium text-stone-800 leading-7 mb-5">
        <ReactMarkdown remarkPlugins={[[remarkGfm, { singleTilde: false }], remarkBreaks]} components={mdComponents}>
          {q.question}
        </ReactMarkdown>
      </div>

      {/* 보기 */}
      <div className="border border-stone-200 overflow-hidden mb-8">
        {opts.map((opt) => {
          const selected = answers[q.num] === opt.num;
          return (
            <div
              key={opt.num}
              role="button"
              tabIndex={0}
              onClick={() => selectAnswer(q.num, opt.num)}
              onKeyDown={(e) => e.key === "Enter" && selectAnswer(q.num, opt.num)}
              className={`w-full text-left flex items-start gap-3 px-4 py-3.5 border-b border-stone-100 last:border-b-0 transition-colors cursor-pointer ${
                selected ? "bg-indigo-500" : "bg-white hover:bg-indigo-50"
              }`}
            >
              <span className={`shrink-0 text-sm font-bold mt-0.5 ${selected ? "text-white" : "text-stone-400"}`}>
                {["①", "②", "③", "④"][opt.num - 1]}
              </span>
              <div className={`flex-1 min-w-0 overflow-x-auto text-sm leading-relaxed ${selected ? "text-white" : "text-stone-800"}`}>
                <ReactMarkdown remarkPlugins={[[remarkGfm, { singleTilde: false }], remarkBreaks]} components={{
                  ...mdComponents,
                  p: ({ children }) => <span>{children}</span>,
                }}>
                  {opt.text}
                </ReactMarkdown>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#fafaf9] flex flex-col">

      {/* 타이머 만료 토스트 */}
      {timerToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-stone-800 text-white text-sm font-semibold px-5 py-2.5 shadow-lg">
          시간이 종료되었습니다. 자동 제출합니다...
        </div>
      )}

      {/* 상단 바 */}
      <header className="bg-white border-b border-stone-200 px-4 py-3 flex items-center justify-between gap-4 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowGrid((v) => !v)}
            className="md:hidden text-xs px-2 py-1.5 border border-stone-200 text-stone-600 bg-[#fafaf9]"
          >
            {showGrid ? "닫기" : "문제 목록"}
          </button>
          <span className="text-sm font-semibold text-stone-700">
            문제 <span className="text-indigo-600">{current + 1}</span> / {questions.length}
          </span>
          <span className="hidden sm:inline text-xs text-stone-400">
            답변 {answeredCount} / {questions.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* 링 게이지 */}
          <div className="relative w-9 h-9 shrink-0">
            <svg width="36" height="36" viewBox="0 0 36 36" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="18" cy="18" r="14" fill="none" stroke="#e7e5e0" strokeWidth="3"/>
              <circle
                cx="18" cy="18" r="14" fill="none"
                stroke={timerUrgent ? "#ef4444" : "#292524"}
                strokeWidth="3"
                strokeDasharray={`${2 * Math.PI * 14}`}
                strokeDashoffset={`${2 * Math.PI * 14 * (1 - secsLeft / TOTAL_SECS)}`}
                strokeLinecap="round"
              />
            </svg>
          </div>
          {/* 숫자 타이머 */}
          <span className={`text-base font-black tabular-nums tracking-wider ${timerUrgent ? "text-red-500" : "text-stone-700"}`}>
            {mm}:{ss}
          </span>
        </div>

        <button
          onClick={() => setShowSubmitConfirm(true)}
          className="px-4 py-1.5 bg-stone-900 text-white text-sm font-semibold hover:bg-stone-700 transition-colors"
        >
          제출하기
        </button>
      </header>
      {/* 진행 바 */}
      <div className="h-[3px] bg-stone-100">
        <div
          className="h-full bg-[#7577f3] transition-all duration-300"
          style={{ width: questions.length > 0 ? `${(answeredCount / questions.length) * 100}%` : "0%" }}
        />
      </div>

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
                      ? "bg-indigo-500 text-white"
                      : answers[q.num] !== undefined
                        ? "bg-indigo-100 text-indigo-700 border border-indigo-200"
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
                      ? "bg-indigo-500 text-white"
                      : answers[q.num] !== undefined
                        ? "bg-indigo-100 text-indigo-700 border border-indigo-200"
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
                <span className="w-4 h-4 bg-indigo-100 border border-indigo-200 inline-block" />답변 완료
              </div>
              <div className="flex items-center gap-2 text-[10px] text-stone-400">
                <span className="w-4 h-4 bg-indigo-500 inline-block" />현재 문제
              </div>
            </div>
          </aside>
        </>

        {/* 메인: 문제 */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-5 py-6">

            {/* 문제 헤더 */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-bold text-stone-400">{q.num}번</span>
              <span className="text-[11px] px-2 py-0.5 bg-indigo-100 text-indigo-700 font-semibold">{q.category}</span>
              <span className={`text-[11px] px-2 py-0.5 font-semibold ${
                q.difficulty === "상" ? "bg-red-50 text-red-600"
                : q.difficulty === "중" ? "bg-stone-100 text-stone-500"
                : "bg-green-50 text-green-600"
              }`}>{q.difficulty}</span>
            </div>

            {q.context ? (
              /* ── 배경 정보 있음: 2단 레이아웃 ── */
              <div className="flex flex-col md:flex-row gap-5 items-start">

                {/* 왼쪽: 이미지(있으면) + 배경 정보 */}
                <div className="w-full md:w-[42%] md:shrink-0 border border-stone-200 bg-[#fafaf9] overflow-hidden">
                  {q.image && (
                    <div className="border-b border-stone-200 bg-white p-3 flex justify-center">
                      <img
                        src={`/diagrams/${q.image}`}
                        alt="문제 다이어그램"
                        className="max-w-full h-auto"
                      />
                    </div>
                  )}
                  <div className="px-4 py-3 text-stone-700">
                    <ReactMarkdown remarkPlugins={[[remarkGfm, { singleTilde: false }], remarkBreaks]} components={contextMdComponents}>
                      {preprocessContext(q.context)}
                    </ReactMarkdown>
                  </div>
                </div>

                {/* 오른쪽: 문제 + 보기 */}
                <div className="flex-1 min-w-0">
                  {questionBlock}
                </div>
              </div>
            ) : q.image ? (
              /* ── 이미지만 있음: 이미지 위, 문제 아래 ── */
              <div className="flex flex-col gap-4">
                <div className="border border-stone-200 bg-white p-4 flex justify-center">
                  <img
                    src={`/diagrams/${q.image}`}
                    alt="문제 다이어그램"
                    className="max-w-full h-auto"
                  />
                </div>
                {questionBlock}
              </div>
            ) : (
              /* ── 배경 정보 없음: 단일 컬럼 ── */
              questionBlock
            )}

            {/* 이전/다음 */}
            <div className="flex items-center justify-between mt-2">
              <button
                onClick={() => moveTo(Math.max(0, current - 1))}
                disabled={current === 0}
                className="px-5 py-2 border border-stone-200 text-stone-600 text-sm font-medium disabled:opacity-30 hover:bg-[#fafaf9] transition-colors"
              >
                ← 이전
              </button>
              <span className="text-xs text-stone-400">미답변 {unansweredCount}문제</span>
              {current < questions.length - 1 ? (
                <button
                  onClick={() => moveTo(Math.min(questions.length - 1, current + 1))}
                  className="px-5 py-2 border border-stone-200 text-stone-600 text-sm font-medium hover:bg-[#fafaf9] transition-colors"
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
                <p className="text-sm text-indigo-600 font-medium mb-2">
                  미답변 문제가 {unansweredCount}개 남아있어요.
                </p>
              )}
              <p className="text-sm text-stone-500">답변 완료: {answeredCount} / {questions.length}문제</p>
              <p className="text-sm text-stone-500">남은 시간: {mm}:{ss}</p>
            </div>
            <div className="px-6 py-4 flex gap-3">
              <button
                onClick={() => setShowSubmitConfirm(false)}
                className="flex-1 py-2 border border-stone-200 text-stone-600 text-sm hover:bg-[#fafaf9]"
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
