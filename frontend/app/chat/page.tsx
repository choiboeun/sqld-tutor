"use client";

import React, { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import dynamic from "next/dynamic";
import Sidebar, { LiveStats } from "@/components/Sidebar";
import { visit } from 'unist-util-visit';

const MermaidChart = dynamic(() => import("@/components/MermaidChart"), {
  ssr: false,
  loading: () => <div className="bg-stone-100 p-3 text-xs text-stone-400 my-2">다이어그램 로딩 중...</div>,
});
import { flushSync } from "react-dom";
import { createClient } from "@/lib/supabase/client";
import { getAuthHeaders } from "@/lib/api";

interface Message {
  role: "user" | "ai";
  content: string;
  isConcept?: boolean;
  conceptExpanded?: boolean;
}

// ── 개념 설명 전용: 키워드 하이라이팅 remark 플러그인 ──
const _SQLD_KW = [
  "GROUP BY", "ORDER BY", "PARTITION BY",
  "INNER JOIN", "LEFT OUTER JOIN", "RIGHT OUTER JOIN", "FULL OUTER JOIN",
  "LEFT JOIN", "RIGHT JOIN", "FULL JOIN", "CROSS JOIN",
  "UNION ALL", "GROUPING SETS",
  "IS NOT NULL", "NOT EXISTS", "NOT IN",
  "IS NULL", "EXISTS",
  "PRIMARY KEY", "FOREIGN KEY", "NOT NULL",
  "ON DELETE CASCADE", "ON DELETE SET NULL",
  "ROW_NUMBER", "DENSE_RANK", "PERCENT_RANK", "CUME_DIST", "RATIO_TO_REPORT",
  "ROLLUP", "CUBE", "PIVOT", "UNPIVOT",
  "SELECT", "FROM", "WHERE", "HAVING", "JOIN",
  "UNION", "INTERSECT", "MINUS", "EXCEPT",
  "INSERT", "UPDATE", "DELETE", "MERGE",
  "CREATE", "ALTER", "DROP", "TRUNCATE",
  "GRANT", "REVOKE", "COMMIT", "ROLLBACK", "SAVEPOINT",
  "DISTINCT", "BETWEEN", "LIKE",
  "CASE", "WHEN", "THEN", "ELSE", "END",
  "COUNT", "SUM", "AVG", "MAX", "MIN",
  "RANK", "NTILE", "LAG", "LEAD",
  "OVER", "WITH", "ROWNUM", "ROWID",
  "NVL", "NVL2", "DECODE", "COALESCE", "NULLIF",
  "SUBSTR", "INSTR", "TRIM", "REPLACE",
  "TO_CHAR", "TO_DATE", "TO_NUMBER",
  "SYSDATE", "DUAL", "SEQUENCE", "SYNONYM",
  "UNIQUE", "NULL",
  "RDBMS", "DBMS", "DDL", "DML", "DCL", "TCL", "RDB", "ERD", "SQL",
  "제1정규형", "제2정규형", "제3정규형", "BCNF",
  "참조 무결성", "개체 무결성", "도메인 무결성",
  "함수 종속", "이행 종속", "부분 종속",
  "클러스터형 인덱스", "비클러스터형 인덱스",
  "집합 연산자", "윈도우 함수", "집계 함수", "그룹 함수",
  "계층형 쿼리", "분산 데이터베이스", "격리 수준",
  "기본키", "외래키", "후보키", "슈퍼키", "대리키",
  "시험 포인트", "핵심 포인트",
  "반정규화", "정규화", "무결성", "트랜잭션", "인덱스",
  "파티션", "서브쿼리", "조인", "뷰", "시퀀스",
  "엔터티", "속성", "관계", "식별자",
  "교착 상태", "옵티마이저",
  "카디널리티", "도메인",
];

const _KW_RE = new RegExp(
  _SQLD_KW.map(kw => {
    const esc = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return /[a-zA-Z0-9]/.test(kw) ? `\\b${esc}\\b` : esc;
  }).join('|'),
  'gi'
);

function remarkHighlightKeywords() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (tree: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (visit as any)(tree, 'text', (node: any, index: number | undefined, parent: any) => {
      if (index == null || !parent || parent.type === 'strong') return;
      const text: string = node.value;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const parts: any[] = [];
      let last = 0;
      for (const m of text.matchAll(_KW_RE)) {
        if (m.index! > last) parts.push({ type: 'text', value: text.slice(last, m.index) });
        parts.push({ type: 'strong', children: [{ type: 'text', value: m[0] }] });
        last = m.index! + m[0].length;
      }
      if (parts.length === 0) return;
      if (last < text.length) parts.push({ type: 'text', value: text.slice(last) });
      parent.children.splice(index, 1, ...parts);
      return index + parts.length;
    });
  };
}

const QUESTION_HDR_RE = /^\[(.+?) \/ 난이도:\s*(상|중|하)\]\n*/;

function parseQuestionHeader(content: string) {
  // **N/8** 접두어 처리: 맨 앞에 있거나 도입 문장 뒤에 있는 경우 모두 처리
  let stripped = content;
  let progress: string | null = null;

  const startMatch = content.match(/^(\*\*(\d+)\/8\*\*)\n\n/);
  if (startMatch) {
    stripped = content.slice(startMatch[0].length);
    progress = startMatch[2];
  } else {
    const afterIntroMatch = content.match(/^[\s\S]+?\n\n\*\*(\d+)\/8\*\*\n\n/);
    if (afterIntroMatch) {
      stripped = content.slice(afterIntroMatch[0].length);
      progress = afterIntroMatch[1];
    }
  }

  const m = stripped.match(QUESTION_HDR_RE);
  if (!m) return null;
  return {
    category: m[1],
    difficulty: m[2],
    body: stripped.replace(QUESTION_HDR_RE, ""),
    progress,
  };
}

const DIFF_STYLE: Record<string, string> = {
  하: "bg-green-100 text-green-700",
  중: "bg-indigo-100 text-indigo-700",
  상: "bg-red-100 text-red-700",
};

const CIRCLE_TO_NUM: Record<string, number> = { "①": 1, "②": 2, "③": 3, "④": 4 };

// LLM이 구분자 행 없이 생성한 파이프 표에 --- 행 자동 삽입 (GFM 파서가 표로 인식하도록)
function fixMissingTableSeparator(text: string): string {
  const lines = text.split("\n");
  const result: string[] = [];
  let inCodeBlock = false;
  for (let i = 0; i < lines.length; i++) {
    const cur = lines[i];
    // 코드 블록 진입/탈출 추적 (``` 로 시작하는 줄)
    if (cur.trimStart().startsWith("```")) inCodeBlock = !inCodeBlock;
    result.push(cur);
    // 코드 블록 내부는 파이프가 있어도 테이블 separator 삽입 금지
    if (inCodeBlock) continue;
    const prv = i > 0 ? lines[i - 1] : "";
    const nxt = i + 1 < lines.length ? lines[i + 1] : "";
    const curHasPipe = cur.includes("|");
    const prvHasPipe = prv.includes("|");
    const nxtHasPipe = nxt.includes("|");
    const isSepLine = (s: string) => /^[\s|:-]*-{2,}[\s|:-]*$/.test(s);
    if (curHasPipe && !prvHasPipe && nxtHasPipe && !isSepLine(nxt) && !isSepLine(cur)) {
      const pipes = (cur.match(/\|/g) ?? []).length;
      const numCols = cur.trim().startsWith("|") && cur.trim().endsWith("|")
        ? Math.max(pipes - 1, 1)
        : pipes + 1;
      result.push("| " + Array(numCols).fill("---").join(" | ") + " |");
    }
  }
  return result.join("\n");
}

function parseOptions(body: string): {
  stem: string;
  options: { circle: string; num: number; content: string }[];
  suffix?: string;
} | null {
  const suffixMatch = body.match(/\n+번호로 답하세요\.\s*\n+([\s\S]+)$/);
  const suffix = suffixMatch ? suffixMatch[1].trim() : undefined;
  const cleaned = body.replace(/\n+번호로 답하세요\.[\s\S]*$/, "").trim();
  const paras = cleaned.split(/\n\n/);
  const circleRE = /^(\*\*)?[①②③④]/;

  const optStarts: number[] = [];
  for (let i = 0; i < paras.length; i++) {
    if (circleRE.test(paras[i].trim())) optStarts.push(i);
  }
  if (optStarts.length < 4) return null;

  const stem = paras.slice(0, optStarts[0]).join("\n\n").trim();
  const options: { circle: string; num: number; content: string }[] = [];

  for (let i = 0; i < 4; i++) {
    const start = optStarts[i];
    const end = i < 3 ? optStarts[i + 1] : paras.length;
    const optParas = paras.slice(start, end);
    const m = optParas[0].trim().match(/^(?:\*\*)?([①②③④])(?:\*\*)?\s*([\s\S]*)/);
    if (!m) return null;
    const restOfFirst = m[2].trim();
    const remaining = optParas.slice(1).join("\n\n");
    const content = [restOfFirst, remaining].filter(Boolean).join("\n\n");
    options.push({ circle: m[1], num: CIRCLE_TO_NUM[m[1]], content });
  }

  return { stem, options, suffix };
}

// Fix 2+4+5: 마크다운 렌더러 — 표/번호목록/줄간격/빈 점 처리
const mdComponents = {
  // 단락 간격
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
  ),
  // Fix 1: GFM 테이블
  table: ({ children }: { children?: React.ReactNode }) => (
    <div className="overflow-x-auto my-2">
      <table className="border-collapse text-xs">{children}</table>
    </div>
  ),
  th: ({ children }: { children?: React.ReactNode }) => (
    <th className="border border-stone-200 bg-stone-100 px-2 py-1 text-left font-semibold whitespace-nowrap">
      {children}
    </th>
  ),
  td: ({ children }: { children?: React.ReactNode }) => (
    <td className="border border-stone-200 px-2 py-1 whitespace-nowrap">{children}</td>
  ),
  // Fix 2: 번호 목록(ol)은 숫자로, 불릿(ul)은 점으로
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="list-decimal ml-5 space-y-1 my-1">{children}</ol>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="list-disc ml-5 space-y-0.5 my-1">{children}</ul>
  ),
  // Fix 4: 빈 li 숨김
  li: ({ children }: { children?: React.ReactNode }) => {
    const text = Array.isArray(children)
      ? children.map((c) => (typeof c === "string" ? c : "")).join("").trim()
      : typeof children === "string"
      ? children.trim()
      : "x";
    if (text === "") return null;
    return <li className="leading-relaxed">{children}</li>;
  },
  // 코드 블록 — mermaid는 다이어그램으로, 나머지는 코드 스타일
  code: ({ children, className }: { children?: React.ReactNode; className?: string }) => {
    if (className === "language-mermaid") {
      return <MermaidChart code={String(children)} />;
    }
    return (
      <code className={`bg-stone-100 text-stone-700 px-1 py-0.5 rounded text-xs font-mono ${className ?? ""}`}>
        {children}
      </code>
    );
  },
  pre: ({ children }: { children?: React.ReactNode }) => (
    <pre className="bg-stone-100 rounded p-2 overflow-x-auto text-xs font-mono my-1 whitespace-pre-wrap">
      {children}
    </pre>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-semibold">{children}</strong>
  ),
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <div className="my-2 px-3 py-2.5 rounded-lg bg-indigo-50 border-l-4 border-indigo-400 text-sm text-indigo-900">
      {children}
    </div>
  ),
  hr: () => <hr className="my-2 border-stone-200" />,
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 className="font-bold text-sm mt-4 mb-2 pb-1 border-b border-stone-200">{children}</h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="font-semibold text-sm mt-3 mb-1">{children}</h3>
  ),
  em: ({ children }: { children?: React.ReactNode }) => (
    <span>{children}</span>
  ),
  img: ({ src, alt }: { src?: string; alt?: string }) => (
    <img
      src={src}
      alt={alt ?? "다이어그램"}
      className="my-3 max-w-full rounded-lg border border-stone-200"
      style={{ maxHeight: 360 }}
    />
  ),
};

function ChatContent() {
  const searchParams = useSearchParams();
  const isNewUser = searchParams.get("new") === "true";
  const isGuestMode = searchParams.get("guest") === "true";
  const [isGuest, setIsGuest] = useState(isGuestMode);
  const [guestQuestionCount, setGuestQuestionCount] = useState(0);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const guestModalShownRef = useRef(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      content: isGuestMode
        ? "안녕하세요! 게스트님.\nSQLD AI 튜터입니다. '문제 줘'로 시작하거나, '조인 문제 줘'처럼 카테고리를 지정할 수도 있어요. 개념이 궁금하면 채팅 창에 편하게 물어보세요."
        : isNewUser
        ? "안녕하세요! SQLD AI 튜터입니다.\n먼저 8문제로 현재 실력을 파악해볼게요. 편하게 답해보세요!"
        : "안녕하세요! SQLD AI 튜터입니다.\n'문제 줘', '약점 분석해줘' 등으로 시작해보세요.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [refreshSidebar, setRefreshSidebar] = useState(0);
  const [liveStats, setLiveStats] = useState<LiveStats | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const [chipsVisible, setChipsVisible] = useState(!isNewUser);
  const lastUserMessageRef = useRef("");
  const [threadId, setThreadId] = useState<string | null>(null);
  const [targetScore, setTargetScore] = useState(70);
  const router = useRouter();
  const [sessionReady, setSessionReady] = useState(false);
  const [sqlPanelOpen, setSqlPanelOpen] = useState(false);
  const [sqlQuery, setSqlQuery] = useState("SELECT * FROM EMP;");
  const [sqlResult, setSqlResult] = useState<{ columns: string[]; rows: string[][]; error: string | null } | null>(null);
  const [sqlLoading, setSqlLoading] = useState(false);
  const [pendingQuestionCache, setPendingQuestionCache] = useState<Record<string, unknown>>({});
  const pendingQuestionCacheRef = useRef<Record<string, unknown>>({});
  const streamIdRef = useRef(0);
  const abortStreamRef = useRef<(() => void) | null>(null);
  const diagnosticFired = useRef(false);
  const resumeDiagnosticFired = useRef(false);
  const autoActionFired = useRef(false);
  const [diagnosticResume, setDiagnosticResume] = useState<{ progress: number } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isRestoredRef = useRef(false);
  const restoredScrollRef = useRef(0);
  const threadIdRef = useRef<string | null>(null);

  useEffect(() => {
    // 게스트 모드: sessionStorage에 임시 ID 생성 (탭 닫으면 리셋)
    if (isGuestMode) {
      setIsGuest(true);
      const gid = "guest_" + crypto.randomUUID();
      sessionStorage.setItem("guest_thread_id", gid);
      setThreadId(gid);
      threadIdRef.current = gid;
      setSessionReady(true);
      return;
    }

    createClient()
      .auth.getUser()
      .then(({ data }) => {
        if (data.user) {
          const uid = data.user.id;
          setThreadId(uid);
          threadIdRef.current = uid;
          setTargetScore(data.user.user_metadata?.target_score ?? 70);
          try {
            const saved = sessionStorage.getItem(`chat_${uid}`);
            if (saved) {
              const parsed = JSON.parse(saved);
              if (parsed.length > 0) {
                setMessages(parsed);
                isRestoredRef.current = true;
                const savedScroll = sessionStorage.getItem(`scroll_${uid}`);
                restoredScrollRef.current = savedScroll ? parseInt(savedScroll, 10) : 999999;
              }
            }
          } catch {}
          setSessionReady(true);
        } else {
          // 비로그인 + 비게스트: 랜딩으로 이동
          router.replace("/");
        }
      });
  }, []);

  // 메시지 변경 시 sessionStorage 저장 (스트리밍 중 빈 슬롯 제외, 300ms debounce)
  useEffect(() => {
    if (!sessionReady || !threadId) return;
    const timer = setTimeout(() => {
      try {
        const toSave = messages.filter(m => !(m.role === "ai" && m.content === ""));
        try {
          sessionStorage.setItem(`chat_${threadId}`, JSON.stringify(toSave));
        } catch {
          // 저장 공간 초과 시 최근 50개만 유지 후 재시도
          try {
            sessionStorage.setItem(`chat_${threadId}`, JSON.stringify(toSave.slice(-50)));
          } catch {}
        }
      } catch {}
    }, 300);
    return () => clearTimeout(timer);
  }, [messages, sessionReady, threadId]);

  useEffect(() => {
    if (isRestoredRef.current) {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = restoredScrollRef.current;
      }
      isRestoredRef.current = false;
    } else {
      const lastMsg = messages[messages.length - 1];
      const hasLoadingBubble = lastMsg?.role === "ai" && lastMsg.content === "";
      bottomRef.current?.scrollIntoView({ behavior: hasLoadingBubble ? "instant" : "smooth" });
    }
  }, [messages]);

  // 로딩 시작 순간 즉시 스크롤 → ...버블이 smooth scroll 지연 없이 바로 보이도록
  useEffect(() => {
    if (isLoading) {
      bottomRef.current?.scrollIntoView({ behavior: "instant" });
    }
  }, [isLoading]);

  // 게스트 모드: 실제 대화가 있을 때만 탭/창 닫기 경고 (초기 인사 메시지 제외)
  useEffect(() => {
    if (!isGuest || messages.length <= 1) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isGuest, messages.length]);


  const streamChat = useCallback(async (message: string, showUserMsg: boolean, clearPending = false) => {
    // 스트림 버전 — 구 스트림의 done 이벤트가 신 스트림에 간섭하지 못하도록 방지
    const myStreamId = ++streamIdRef.current;
    abortStreamRef.current?.();
    const controller = new AbortController();
    abortStreamRef.current = () => controller.abort();
    // pending_question을 클라이언트 캐시에서 먼저 캡처한 뒤 즉시 초기화
    const capturedPQ = pendingQuestionCacheRef.current;
    setPendingQuestionCache({});
    pendingQuestionCacheRef.current = {};

    setChipsVisible(false);
    setNetworkError(false);
    lastUserMessageRef.current = message;
    // fetch 시작 전 빈 슬롯을 동기적으로 커밋해 ...버블이 항상 먼저 보이도록 강제
    flushSync(() => {
      setIsLoading(true);
      if (showUserMsg) {
        setMessages((prev) => [...prev, { role: "user", content: message }]);
      }
      setMessages((prev) => [...prev, { role: "ai", content: "" }]);
    });
    // scrollIntoView는 window를 스크롤할 수 있으므로 채팅 컨테이너를 직접 조작
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }

    try {
      const authHeaders = await getAuthHeaders();
      const chatUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"}/api/chat`;
      const res = await fetch(chatUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ message, thread_id: threadId, user_id: threadId, target_score: targetScore, clear_pending: clearPending, client_pending_question: clearPending ? {} : capturedPQ, is_guest: isGuest }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      if (!res.body) throw new Error("응답 스트림 없음");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let streamingContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;

          try {
            const event = JSON.parse(raw);

            if (event.type === "message") {
              setMessages((prev) => {
                const next = [...prev];
                const last = next[next.length - 1];
                // 마지막 슬롯이 빈 AI 슬롯이 아니면 새 슬롯 추가 (배칭으로 슬롯이 없는 경우 방어)
                if (!last || last.role !== "ai" || last.content !== "") {
                  next.push({ role: "ai", content: "" });
                }
                next[next.length - 1] = { role: "ai", content: event.content };
                // 채점 결과 직후 ...버블 슬롯을 같은 setState 안에서 추가
                // (loading 이벤트가 별도 tick에 오면 React 배칭으로 적용 안 될 수 있음)
                if (/^(정답|오답)입니다|^정답이에요|^아직 틀렸어요/.test(event.content)) {
                  next.push({ role: "ai", content: "" });
                }
                return next;
              });
              streamingContent = "";
            } else if (event.type === "loading") {
              // 백엔드가 채점 후 자동으로 다음 노드를 실행할 때만 전송 → ...버블 표시
              setMessages((prev) => {
                const next = [...prev];
                const last = next[next.length - 1];
                if (!last || last.role !== "ai" || last.content !== "") {
                  next.push({ role: "ai", content: "" });
                }
                return next;
              });
            } else if (event.type === "token") {
              streamingContent += event.content;
              setMessages((prev) => {
                const next = [...prev];
                next[next.length - 1] = { role: "ai", content: streamingContent };
                return next;
              });
            } else if (event.type === "concept") {
              setMessages((prev) => {
                const next = [...prev];
                const last = next[next.length - 1];
                if (!last || last.role !== "ai" || last.content !== "") {
                  next.push({ role: "ai", content: "" });
                }
                next[next.length - 1] = { role: "ai", content: event.content, isConcept: true, conceptExpanded: false };
                return next;
              });
              streamingContent = "";
            } else if (event.type === "stats_updated") {
              setLiveStats(event.content as LiveStats);
              // 게스트: 채점 완료 시 카운트 증가 → 3문제 시 모달 표시
              if (isGuest && !guestModalShownRef.current) {
                setGuestQuestionCount((n) => {
                  const next = n + 1;
                  if (next >= 3) {
                    guestModalShownRef.current = true;
                    setShowGuestModal(true);
                  }
                  return next;
                });
              }
            } else if (event.type === "done") {
              if (myStreamId !== streamIdRef.current) { await reader.cancel(); break; }
              setMessages((prev) =>
                prev.filter((m, i) => !(i === prev.length - 1 && m.role === "ai" && m.content === ""))
              );
              setIsLoading(false);
              setRefreshSidebar((n) => n + 1);
              await reader.cancel();
              break;
            } else if (event.type === "pending_question") {
              const pq = event.content as Record<string, unknown>;
              setPendingQuestionCache(pq);
              pendingQuestionCacheRef.current = pq;
            } else if (event.type === "error") {
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "ai" && last.content === "") return prev.slice(0, -1);
                return prev;
              });
              setNetworkError(true);
              setIsLoading(false);
              await reader.cancel();
              break;
            }
          } catch {
            // JSON 파싱 실패 무시
          }
        }
      }
    } catch (err) {
      const isAbort = err instanceof DOMException && err.name === "AbortError";
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "ai" && last.content === "") return prev.slice(0, -1);
        return prev;
      });
      if (isAbort) {
        setRefreshSidebar((n) => n + 1);
      } else {
        setNetworkError(true);
      }
    } finally {
      if (myStreamId === streamIdRef.current) {
        setIsLoading(false);
        abortStreamRef.current = null;
      }
    }
  }, [threadId, targetScore]);

  // ?new=true 로 진입 시 진단 자동 시작 (세션 복원 완료 후에만, 대화 이력이 없을 때만, 게스트 제외)
  useEffect(() => {
    if (!isGuest && searchParams.get("new") === "true" && threadId && !diagnosticFired.current && sessionReady) {
      diagnosticFired.current = true;
      if (messages.length <= 1) {
        streamChat("진단 시작해줘", false);
      }
    }
  }, [searchParams, threadId, streamChat, sessionReady]);

  // ?action=review 또는 ?category=... 로 진입 시 자동 메시지 전송
  useEffect(() => {
    if (!threadId || !sessionReady || autoActionFired.current) return;
    const action = searchParams.get("action");
    const category = searchParams.get("category");
    if (action === "review") {
      autoActionFired.current = true;
      streamChat("오답 복습해줘", true);
    } else if (category) {
      autoActionFired.current = true;
      streamChat(`${category} 문제 줘`, true);
    }
  }, [searchParams, threadId, streamChat, sessionReady]);

  // 재접속 시 진단 미완료 감지 → 배너 표시 (게스트는 서버에 체크포인트 없으므로 스킵)
  useEffect(() => {
    if (!sessionReady || !threadId || resumeDiagnosticFired.current) return;
    if (isGuest) return;
    if (searchParams.get("new") === "true") return;
    if (messages.length > 1) return;
    resumeDiagnosticFired.current = true;
    (async () => {
      try {
        const res = await fetch(`/api/progress/${threadId}`, { headers: await getAuthHeaders() });
        if (!res.ok) return;
        const data = await res.json();
        if (data.is_diagnostic_in_progress) {
          setDiagnosticResume({ progress: data.diagnostic_progress });
        }
      } catch {}
    })();
  }, [sessionReady, threadId, searchParams]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    setInput("");
    inputRef.current?.focus();
    await streamChat(text, true);
  };

  const toggleConcept = useCallback((idx: number) => {
    setMessages(prev => prev.map((m, i) =>
      i === idx ? { ...m, conceptExpanded: !m.conceptExpanded } : m
    ));
  }, []);

  const handleWeakConceptChip = useCallback(async () => {
    if (!threadId) return;
    try {
      const res = await fetch(`/api/progress/${threadId}`, { headers: await getAuthHeaders() });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      const cats = (data.accuracy_by_category ?? {}) as Record<string, { accuracy: number; attempts: number }>;
      const entries = Object.entries(cats).filter(([, v]) => v.attempts > 0);
      if (entries.length === 0) {
        await streamChat("문제 줘", true, true);
        return;
      }
      const weakest = entries.sort((a, b) => a[1].accuracy - b[1].accuracy)[0];
      await streamChat(`${weakest[0]} 개념 설명해줘`, true, true);
    } catch {
      await streamChat("문제 줘", true, true);
    }
  }, [threadId, streamChat]);

  const runSql = useCallback(async () => {
    if (!sqlQuery.trim() || sqlLoading) return;
    setSqlLoading(true);
    setSqlResult(null);
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch("/api/sql-execute", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ query: sqlQuery }),
      });
      const data = await res.json();
      setSqlResult(data);
    } catch {
      setSqlResult({ columns: [], rows: [], error: "서버 오류가 발생했어요." });
    } finally {
      setSqlLoading(false);
    }
  }, [sqlQuery, sqlLoading]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const hasPendingQ = !!pendingQuestionCache.id;
  const lastAiContent = ((): string => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "ai" && messages[i].content !== "") return messages[i].content;
    }
    return "";
  })();
  const isAfterGrading = /^(정답입니다|오답입니다|정답이에요|아직 틀렸어요)/.test(lastAiContent);
  const inputPlaceholder = hasPendingQ
    ? "1~4번으로 답하거나 질문하세요"
    : isAfterGrading
      ? "해설이 더 궁금하면 여기에 질문하세요"
      : "궁금한 것이 있다면 여기에 질문하세요";

  return (
    <div className="flex h-[100dvh] overflow-hidden">
      <Sidebar
        threadId={threadId}
        refresh={refreshSidebar}
        liveStats={liveStats}
        onStatsRefreshed={undefined}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        highlightHome={!isLoading && messages.some(m => m.role === "ai" && m.content.startsWith("**진단 완료!"))}
        isGuest={isGuest}
        onGuestLeave={() => setShowLeaveModal(true)}
      />

      <div className="flex flex-col flex-1 min-w-0">
        <div className="px-6 h-[80px] border-b border-violet-200 bg-[#dde1fb] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-1 text-stone-500 hover:text-stone-700 transition-colors"
              aria-label="메뉴 열기"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <rect y="3" width="20" height="2" rx="1"/>
                <rect y="9" width="20" height="2" rx="1"/>
                <rect y="15" width="20" height="2" rx="1"/>
              </svg>
            </button>
            <Link
              href="/home"
              onClick={() => {
                try {
                  if (threadId) {
                    sessionStorage.removeItem(`chat_${threadId}`);
                    sessionStorage.removeItem(`scroll_${threadId}`);
                  }
                } catch {}
              }}
              className="md:hidden flex items-center gap-2 text-lg font-semibold text-stone-900 hover:text-indigo-600 transition-colors"
            >
              <Image src="/icons/logo-mark-64.png" alt="SQLD AI 튜터" width={24} height={24} className="shrink-0" />
              SQLD AI 튜터
            </Link>
          </div>

          {/* 우측 컨트롤: SQL + 계정 */}
          <div className="flex items-center gap-3">
          {/* SQL 패널 토글 버튼 — PC만 표시 */}
          <button
            onClick={() => isGuest ? setShowGuestModal(true) : setSqlPanelOpen((v) => !v)}
            className={`hidden md:flex items-center gap-1.5 text-sm px-3 py-1.5 border transition-colors ${
              isGuest
                ? "bg-stone-100/80 border-stone-300/80 text-stone-400 opacity-75 cursor-not-allowed"
                : sqlPanelOpen
                  ? "bg-white border-white text-indigo-700"
                  : "bg-white/70 border-white/60 text-indigo-600 hover:bg-white hover:text-indigo-700"
            }`}
            title={isGuest ? "회원가입 후 사용 가능" : undefined}
          >
            {isGuest ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
              </svg>
            )}
            SQL 실행
          </button>

          </div>
        </div>

        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-stone-50">
          {diagnosticResume && (
            <div className="flex items-center justify-between bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3 text-sm">
              <span className="text-indigo-800">이전 진단을 <strong>{diagnosticResume.progress}/8</strong> 문제까지 풀었어요. 이어서 마저 풀까요?</span>
              <div className="flex gap-2 ml-4 shrink-0">
                <button
                  onClick={async () => { setDiagnosticResume(null); resumeDiagnosticFired.current = true; await streamChat("진단 이어서 해줘", false); }}
                  className="bg-indigo-500 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-indigo-600"
                >이어서 풀기</button>
                <button onClick={() => setDiagnosticResume(null)} className="text-indigo-600 text-xs px-2 py-1.5 hover:underline">닫기</button>
              </div>
            </div>
          )}
          {(() => {
            const hasPendingQuestion = !!pendingQuestionCache.id;
            const lastAiIndex = messages.map((m, idx) => m.role === "ai" ? idx : -1).filter(idx => idx !== -1).at(-1) ?? -1;
            const hasEverGraded = messages.some(m => m.role === "ai" && /^(정답|오답)입니다|^정답이에요|^아직 틀렸어요/.test(m.content));
            return messages.map((msg, i) => {
            const isAnswered = messages.slice(i + 1).some(m => m.role === "user");
            const isLastAiMessage = i === lastAiIndex;
            // 문제 버블 바로 뒤에 별도 ...버블을 Fragment로 렌더링할 조건
            const isQuestionMsg = msg.role === "ai" && msg.content !== "" && !!parseQuestionHeader(msg.content);
            const isQuestionLoadingBubble = msg.role === "ai" && msg.content !== "" && isAnswered && isLoading && (() => {
              const p = parseQuestionHeader(msg.content);
              if (!p) return false;
              if (!parseOptions(p.body)) return false;
              const nextAi = messages.slice(i + 1).find(m => m.role === "ai");
              return !nextAi || nextAi.content === "";
            })();
            if (msg.role === "ai" && msg.content === "") {
              if (isAnswered) return null;
              // Fragment 로딩 버블이 표시될 때 emptyAI 슬롯(①) 중복 방지
              if (isLoading && i >= 2 && /^[1-4]번?\s*$/.test((messages[i - 1]?.content ?? "").trim())) {
                const qMsg = messages[i - 2];
                if (qMsg?.role === "ai" && qMsg.content !== "") {
                  const p = parseQuestionHeader(qMsg.content);
                  if (p && parseOptions(p.body)) return null;
                }
              }
            }
            if (msg.role === "user" && /^[1-4]번?\s*$/.test(msg.content.trim())) return null;
            const isCorrect = msg.role === "ai" && /^정답입니다|^정답이에요/.test(msg.content);
            const isWrong   = msg.role === "ai" && /^오답입니다|^아직 틀렸어요/.test(msg.content);
            return (
            <React.Fragment key={i}>
            <div
              className={`flex animate-msg-in ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "max-w-[75%] bg-stone-600 text-white rounded-lg"
                    : `max-w-[90%] border text-stone-800 ${isQuestionMsg ? "bg-white border-violet-200" : "bg-white border-indigo-100"}`
                } ${isCorrect ? "animate-flash-correct" : isWrong ? "animate-flash-wrong" : ""}`}
              >
                {msg.role === "ai" ? (
                  msg.content === "" && isLoading ? (
                    <span className="inline-flex gap-1">
                      <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </span>
                  ) : (() => {
                    const parsed = parseQuestionHeader(msg.content);
                    if (!parsed) {
                      // 개념 설명 버블 — 접기/펼치기 UI
                      if (msg.isConcept) {
                        const isLong = msg.content.length > 300;
                        return (
                          <>
                            <div className="mb-2">
                              <span className="text-xs font-bold text-indigo-700">💡 개념 보충</span>
                            </div>
                            <div className="relative">
                              <div
                                style={{
                                  maxHeight: msg.conceptExpanded ? "2000px" : "112px",
                                  overflow: "hidden",
                                  transition: "max-height 0.38s cubic-bezier(0.4,0,0.2,1)",
                                }}
                              >
                                <ReactMarkdown remarkPlugins={[[remarkGfm, { singleTilde: false }], remarkHighlightKeywords]} components={mdComponents}>
                                  {fixMissingTableSeparator(msg.content)}
                                </ReactMarkdown>
                              </div>
                              {isLong && !msg.conceptExpanded && (
                                <div className="absolute bottom-0 left-0 right-0 h-14 bg-gradient-to-b from-transparent to-white pointer-events-none" />
                              )}
                            </div>
                            {(isLong || ((!isAnswered || isLastAiMessage) && !isLoading && !hasPendingQuestion)) && (
                              <div className="flex items-center justify-end gap-2 mt-2">
                                {isLong && (
                                  <button
                                    onClick={() => toggleConcept(i)}
                                    className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 hover:bg-indigo-100 transition-colors"
                                  >
                                    {msg.conceptExpanded ? "접기 ▲" : "더 보기 ▼"}
                                  </button>
                                )}
                                {(!isAnswered || isLastAiMessage) && !isLoading && !hasPendingQuestion && (
                                  <button
                                    onClick={() => streamChat("문제 줘", true)}
                                    className="flex items-center gap-1.5 bg-stone-900 hover:bg-stone-700 text-white text-sm font-semibold px-4 py-2 transition-colors"
                                  >
                                    다음 문제
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M5 12h14M12 5l7 7-7 7" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                            )}
                          </>
                        );
                      }

                      const isGradingResult = /^(정답|오답)입니다|^정답이에요|^아직 틀렸어요/.test(msg.content);
                      const isNextQuestionEligible =
                        isGradingResult ||
                        msg.content.includes("다음 문제를 풀려면");
                      // 채점 버블 뒤에 개념 설명이 있으면 채점 버블 버튼 숨김
                      const hasConceptAfter = isGradingResult &&
                        messages.slice(i + 1).some(m => m.role === "ai" && m.isConcept && m.content !== "");
                      // 진단 모드 채점인지 확인 — 직전 AI 메시지가 진단 문제이면 true
                      const prevAiMsg = messages.slice(0, i).reverse().find(m => m.role === "ai" && m.content !== "");
                      const isDiagnosticContext = !!(prevAiMsg && parseQuestionHeader(prevAiMsg.content)?.progress);
                      // CommonMark 한계: %·.·,** 뒤 한글 결합 시 볼드 미처리 → ** 리터럴 노출 방지
                      const safeContent = msg.content.replace(/\*\*([^*\n]+)\*\*/g, "$1");
                      return (
                        <>
                          <ReactMarkdown remarkPlugins={[[remarkGfm, { singleTilde: false }]]} components={mdComponents}>
                            {fixMissingTableSeparator(safeContent)}
                          </ReactMarkdown>
                          {/^(오답입니다|아직 틀렸어요)/.test(msg.content) && isLoading && liveStats !== null && !isAnswered && !isDiagnosticContext && (
                            <div className="mt-2 flex justify-end">
                              <button
                                onClick={() => abortStreamRef.current?.()}
                                className="text-xs text-stone-400 hover:text-stone-600 transition-colors flex items-center gap-1"
                              >
                                해설 건너뛰기
                                <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                              </button>
                            </div>
                          )}
                          {isNextQuestionEligible && (!isAnswered || isLastAiMessage) && !hasConceptAfter && !hasPendingQuestion && !isLoading && !isDiagnosticContext && (
                            <div className="mt-3 flex justify-end">
                              <button
                                onClick={() => streamChat("문제 줘", true)}
                                disabled={isLoading}
                                className="flex items-center gap-1.5 bg-stone-900 hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2 transition-colors"
                              >
                                다음 문제
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                              </button>
                            </div>
                          )}
                          {(() => {
                            // 이전 메시지 중 채점 버블(다음 문제 버튼 있는 것)이 있으면 fallback 버튼 숨김
                            // 단, 진단 컨텍스트의 채점 버블은 카운트 제외 (진단 요약 버블에 버튼이 뜨도록)
                            const hasPrevGradingBtn = messages.slice(0, i).some((m, mi) => {
                              if (m.role !== "ai") return false;
                              if (!/^(정답|오답)입니다/.test(m.content)) return false;
                              if (messages.slice(mi + 1, i).some(u => u.role === "user")) return false;
                              const prevOfM = messages.slice(0, mi).reverse().find(pm => pm.role === "ai" && pm.content !== "");
                              return !(prevOfM && parseQuestionHeader(prevOfM.content)?.progress);
                            });
                            return isLastAiMessage && hasEverGraded && !isLoading && !hasPendingQuestion && !isNextQuestionEligible && !isDiagnosticContext && !hasPrevGradingBtn;
                          })() && (
                            <div className="mt-3 flex justify-end">
                              <button
                                onClick={() => streamChat("문제 줘", true)}
                                className="flex items-center gap-1.5 bg-stone-900 hover:bg-stone-700 text-white text-sm font-semibold px-4 py-2 transition-colors"
                              >
                                다음 문제
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </>
                      );
                    }
                    const optData = parseOptions(parsed.body);
                    const selectedNum = isAnswered
                      ? (() => {
                          const nextUserMsg = messages.slice(i + 1).find(m => m.role === "user");
                          const n = parseInt(nextUserMsg?.content?.match(/^(\d+)/)?.[1] ?? "0");
                          return n >= 1 && n <= 4 ? n : null;
                        })()
                      : null;
                    return (
                      <>
                        {parsed.progress && (
                          <div className="mb-2">
                            <p className="text-xs text-stone-400 font-medium">{parsed.progress}/8 진단 중</p>
                            {parsed.progress === "1" && (
                              <p className="text-xs text-stone-500 mt-0.5">8문제로 현재 실력을 진단할게요. 편하게 답해보세요!</p>
                            )}
                          </div>
                        )}
                        <div className="flex gap-1.5 mb-3">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
                            {parsed.category}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${DIFF_STYLE[parsed.difficulty] ?? "bg-stone-100 text-stone-600"}`}>
                            난이도 {parsed.difficulty}
                          </span>
                        </div>
                        <ReactMarkdown remarkPlugins={[[remarkGfm, { singleTilde: false }], remarkBreaks]} components={mdComponents}>
                          {fixMissingTableSeparator(optData ? optData.stem : parsed.body)}
                        </ReactMarkdown>
                        {optData && (
                          <>
                            <div className="mt-3 border border-stone-200 overflow-hidden">
                              {optData.options.map((opt) => {
                                const isSelected = !!selectedNum && opt.num === selectedNum;
                                return (
                                  <button
                                    key={opt.circle}
                                    onClick={() => streamChat(`${opt.num}번`, true)}
                                    disabled={(isLoading && !hasPendingQuestion) || isAnswered}
                                    className={`w-full text-left flex items-start gap-3 px-4 py-3 border-b border-stone-100 last:border-b-0 transition-colors ${
                                      isSelected
                                        ? "bg-indigo-500 cursor-default"
                                        : isAnswered
                                          ? "bg-white cursor-default"
                                          : isLoading && !hasPendingQuestion
                                            ? "bg-stone-50 animate-pulse cursor-not-allowed"
                                            : "bg-white hover:bg-indigo-50"
                                    }`}
                                  >
                                    <span className={`shrink-0 text-sm font-bold mt-0.5 ${isSelected ? "text-white" : "text-stone-400"}`}>
                                      {opt.circle}
                                    </span>
                                    <div className={`flex-1 text-sm leading-relaxed ${isSelected ? "text-white" : "text-stone-800"}`}>
                                      <ReactMarkdown remarkPlugins={[[remarkGfm, { singleTilde: false }]]} components={mdComponents}>
                                        {fixMissingTableSeparator(opt.content)}
                                      </ReactMarkdown>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                            {optData.suffix && (
                              <div className="mt-2">
                                <ReactMarkdown remarkPlugins={[[remarkGfm, { singleTilde: false }]]} components={mdComponents}>
                                  {fixMissingTableSeparator(optData.suffix ?? "")}
                                </ReactMarkdown>
                              </div>
                            )}
                          </>
                        )}
                      </>
                    );
                  })()
                ) : (
                  msg.content
                )}
              </div>
            </div>
            {isQuestionLoadingBubble && (
              <div className="flex justify-start">
                <div className="px-4 py-3 text-sm leading-relaxed max-w-[90%] bg-white border border-indigo-100 text-stone-800">
                  <span className="inline-flex gap-1">
                    <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </span>
                </div>
              </div>
            )}
            </React.Fragment>
            );
          });
          })()}
          <div ref={bottomRef} />
        </div>

        {networkError && (
          <div className="px-6 pt-3 bg-white">
            <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
              <span className="text-sm text-red-600">연결 오류가 발생했습니다.</span>
              <button
                onClick={() => window.location.reload()}
                className="text-sm font-medium text-red-600 hover:text-red-800 transition-colors flex items-center gap-1"
              >
                ↺ 새로고침
              </button>
            </div>
          </div>
        )}
        {chipsVisible && sessionReady && !isLoading && !parseQuestionHeader(
          [...messages].reverse().find(m => m.role === "ai" && m.content !== "")?.content ?? ""
        ) && (
          <div className="px-6 py-3 flex flex-wrap gap-2 border-t border-violet-200 bg-[#dde1fb]">
            <button
              onClick={() => streamChat("문제 줘", true, true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-stone-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition-colors"
            >
              문제 풀기
            </button>
            {isGuest ? (
              <>
                {(["약점 분석", "오답 복습", "틀린 개념 복습"] as const).map((label) => (
                  <button
                    key={label}
                    onClick={() => setShowGuestModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-stone-400 bg-stone-100 border border-stone-300 cursor-not-allowed opacity-75 transition-colors"
                    title="회원가입 후 사용 가능"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-amber-500">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    {label}
                  </button>
                ))}
              </>
            ) : (
              <>
                <button
                  onClick={() => streamChat("약점 분석해줘", true, true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-stone-700 bg-white border border-indigo-200 hover:bg-indigo-50 transition-colors"
                >
                  약점 분석
                </button>
                <button
                  onClick={() => streamChat("오답 복습해줘", true, true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-stone-700 bg-white border border-indigo-200 hover:bg-indigo-50 transition-colors"
                >
                  오답 복습
                </button>
                <button
                  onClick={handleWeakConceptChip}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-stone-700 bg-white border border-indigo-200 hover:bg-indigo-50 transition-colors"
                >
                  틀린 개념 복습
                </button>
              </>
            )}
          </div>
        )}

        <div className="px-6 py-4 border-t border-violet-200 bg-[#dde1fb]">
          <div className="flex gap-3 items-end">
            <textarea
              ref={inputRef}
              className={`flex-1 resize-none border border-stone-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 max-h-32 transition-opacity placeholder:text-stone-400 ${isLoading ? "opacity-50" : ""}`}
              rows={1}
              placeholder={inputPlaceholder}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              className="p-3 bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19V5M5 12l7-7 7 7"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* 게스트 나가기 경고 모달 */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white w-full max-w-sm shadow-xl overflow-hidden">
            <div className="px-6 py-5">
              <h2 className="text-base font-bold text-stone-800 mb-2">지금 나가면 기록이 사라져요</h2>
              <p className="text-sm text-stone-500 mb-5">
                비로그인 상태라 지금까지의 대화 기록이 모두 삭제돼요.<br />
                그래도 나가시겠어요?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowLeaveModal(false)}
                  className="flex-1 border border-stone-200 text-stone-600 py-2.5 text-sm font-semibold hover:bg-stone-50 transition-colors"
                >
                  계속 풀기
                </button>
                <Link
                  href="/"
                  onClick={() => {
                    try {
                      sessionStorage.removeItem("guest_thread_id");
                      if (threadId) sessionStorage.removeItem(`chat_${threadId}`);
                    } catch {}
                  }}
                  className="flex-1 text-center bg-indigo-600 text-white py-2.5 text-sm font-semibold hover:bg-indigo-700 transition-colors"
                >
                  나가기
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 게스트 회원가입 유도 모달 */}
      {showGuestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white w-full max-w-sm shadow-xl overflow-hidden">
            <div className="bg-indigo-600 px-6 py-5 text-white">
              <p className="text-xs font-semibold tracking-wide uppercase text-indigo-200 mb-1">3문제 체험 완료</p>
              <h2 className="text-lg font-bold leading-snug">더 많은 기능을 사용하려면<br/>회원가입이 필요해요</h2>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-stone-500 mb-4">가입하면 이런 기능을 이용할 수 있어요</p>
              <ul className="space-y-2.5 mb-5">
                {[
                  "내 약점 카테고리 분석",
                  "틀린 문제 오답 복습",
                  "틀린 개념 집중 설명",
                  "풀이 기록 영구 저장",
                  "연속 정답 스트릭 & 예상 점수 추적",
                ].map((feat) => (
                  <li key={feat} className="flex items-center gap-2 text-sm text-stone-700">
                    <span className="w-4 h-4 bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold flex-shrink-0">✓</span>
                    {feat}
                  </li>
                ))}
              </ul>
              <Link
                href="/"
                className="flex items-center gap-2 text-sm text-indigo-600 font-medium bg-indigo-50 px-3 py-2.5 mb-5 hover:bg-indigo-100 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-indigo-500"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
                <span>모의고사는 <strong>비회원이여도</strong> 홈으로 이동하여 이용 가능해요 →</span>
              </Link>
              <div className="flex flex-col gap-2">
                <Link
                  href="/signup"
                  className="w-full text-center bg-indigo-600 text-white py-2.5 text-sm font-semibold hover:bg-indigo-700 transition-colors"
                >
                  무료로 회원가입
                </Link>
                <Link
                  href="/login"
                  className="w-full text-center border border-indigo-200 text-indigo-600 py-2.5 text-sm font-semibold hover:bg-indigo-50 transition-colors"
                >
                  이미 계정이 있어요
                </Link>
                <button
                  onClick={() => setShowGuestModal(false)}
                  className="text-xs text-stone-400 hover:text-stone-500 py-1 transition-colors"
                >
                  계속 체험하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SQL 패널 — PC에서만 표시 */}
      {sqlPanelOpen && (
        <div className="hidden md:flex flex-col w-[420px] shrink-0 border-l border-stone-200 bg-white">
          {/* 패널 헤더 */}
          <div className="px-4 py-3 border-b border-stone-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-600">
                <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
              </svg>
              <span className="text-sm font-semibold text-stone-700">SQL 플레이그라운드</span>
            </div>
            <button onClick={() => setSqlPanelOpen(false)} className="text-stone-400 hover:text-stone-600 transition-colors">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
              </svg>
            </button>
          </div>

          {/* 테이블 안내 */}
          <div className="px-4 py-2 bg-stone-50 border-b border-stone-100 text-xs text-stone-500 flex gap-3 flex-wrap">
            <span><strong>EMP</strong>(EMP_ID, EMP_NAME, JOB, SALARY, DEPT_ID)</span>
            <span><strong>DEPT</strong>(DEPT_ID, DEPT_NAME, LOC)</span>
            <span><strong>SALGRADE</strong>(GRADE, LOSAL, HISAL)</span>
          </div>

          {/* 에디터 + 실행 */}
          <div className="px-4 pt-3 pb-2 flex flex-col gap-2">
            <textarea
              value={sqlQuery}
              onChange={(e) => setSqlQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); runSql(); } }}
              className="w-full h-32 resize-none border border-stone-200 px-3 py-2 text-sm font-mono focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 placeholder:text-stone-400"
              placeholder="SELECT * FROM EMP;"
              spellCheck={false}
            />
            <button
              onClick={runSql}
              disabled={sqlLoading || !sqlQuery.trim()}
              className="self-end flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {sqlLoading ? "실행 중..." : "▶ 실행"}
            </button>
            <p className="text-xs text-stone-400 text-right -mt-1">Ctrl+Enter로도 실행 가능</p>
          </div>

          {/* 결과 영역 */}
          <div className="flex-1 overflow-auto px-4 pb-4">
            {sqlResult === null && (
              <p className="text-xs text-stone-400 text-center mt-8">쿼리를 실행하면 결과가 여기 표시돼요.</p>
            )}
            {sqlResult?.error && (
              <div className="bg-red-50 border border-red-100 px-3 py-2 text-sm text-red-600">
                {sqlResult.error}
              </div>
            )}
            {sqlResult && !sqlResult.error && sqlResult.columns.length > 0 && (
              <div>
                <p className="text-xs text-stone-400 mb-2 font-medium">{sqlResult.rows.length}건</p>
                <div className="overflow-x-auto">
                  <table className="text-xs border-collapse">
                    <thead>
                      <tr className="bg-stone-100">
                        {sqlResult.columns.map((col) => (
                          <th key={col} className="border border-stone-200 px-2 py-1.5 text-left font-semibold text-stone-600 whitespace-nowrap">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sqlResult.rows.map((row, i) => (
                        <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-stone-50"}>
                          {row.map((cell, j) => (
                            <td key={j} className="border border-stone-200 px-2 py-1.5 text-stone-700 whitespace-nowrap">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {sqlResult && !sqlResult.error && sqlResult.columns.length === 0 && (
              <p className="text-xs text-stone-400 text-center mt-8">결과가 없어요. (0건)</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense>
      <ChatContent />
    </Suspense>
  );
}
