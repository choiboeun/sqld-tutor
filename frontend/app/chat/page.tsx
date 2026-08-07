"use client";

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Sidebar, { LiveStats } from "@/components/Sidebar";
import { createClient } from "@/lib/supabase/client";
import { getAuthHeaders } from "@/lib/api";

interface Message {
  role: "user" | "ai";
  content: string;
  isConcept?: boolean;
  conceptExpanded?: boolean;
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
  중: "bg-amber-100 text-amber-700",
  상: "bg-red-100 text-red-700",
};

const CIRCLE_TO_NUM: Record<string, number> = { "①": 1, "②": 2, "③": 3, "④": 4 };

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
      <table className="border-collapse text-xs w-full">{children}</table>
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
  // 코드 블록 — pre 안의 code는 블록, 밖은 인라인
  code: ({ children, className }: { children?: React.ReactNode; className?: string }) => (
    <code className={`bg-stone-100 text-stone-700 px-1 py-0.5 rounded text-xs font-mono ${className ?? ""}`}>
      {children}
    </code>
  ),
  pre: ({ children }: { children?: React.ReactNode }) => (
    <pre className="bg-stone-100 rounded p-2 overflow-x-auto text-xs font-mono my-1 whitespace-pre-wrap">
      {children}
    </pre>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-semibold">{children}</strong>
  ),
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <div className="my-2 px-3 py-2.5 rounded-lg bg-amber-50 border-l-4 border-amber-400 text-sm text-amber-900">
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
};

function ChatContent() {
  const searchParams = useSearchParams();
  const isNewUser = searchParams.get("new") === "true";
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      content: isNewUser
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
  const [sessionReady, setSessionReady] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [sqlPanelOpen, setSqlPanelOpen] = useState(false);
  const [sqlQuery, setSqlQuery] = useState("SELECT * FROM EMP;");
  const [sqlResult, setSqlResult] = useState<{ columns: string[]; rows: string[][]; error: string | null } | null>(null);
  const [sqlLoading, setSqlLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [pendingQuestionCache, setPendingQuestionCache] = useState<Record<string, unknown>>({});
  const pendingQuestionCacheRef = useRef<Record<string, unknown>>({});
  const streamIdRef = useRef(0);
  const abortStreamRef = useRef<(() => void) | null>(null);
  const diagnosticFired = useRef(false);
  const resumeDiagnosticFired = useRef(false);
  const [diagnosticResume, setDiagnosticResume] = useState<{ progress: number } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isRestoredRef = useRef(false);
  const restoredScrollRef = useRef(0);
  const threadIdRef = useRef<string | null>(null);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => {
        if (data.user) {
          const uid = data.user.id;
          setThreadId(uid);
          threadIdRef.current = uid;
          setTargetScore(data.user.user_metadata?.target_score ?? 70);
          setUserEmail(data.user.email ?? "");
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
          window.location.href = "/login";
        }
      });
  }, []);

  // 메시지 변경 시 sessionStorage 저장 (스트리밍 중 빈 슬롯은 제외)
  useEffect(() => {
    if (!sessionReady || !threadId) return;
    try {
      const toSave = messages.filter(m => !(m.role === "ai" && m.content === ""));
      sessionStorage.setItem(`chat_${threadId}`, JSON.stringify(toSave));
    } catch {}
  }, [messages, sessionReady, threadId]);

  useEffect(() => {
    if (isRestoredRef.current) {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = restoredScrollRef.current;
      }
      isRestoredRef.current = false;
    } else {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      setPwMsg({ type: "error", text: "비밀번호가 일치하지 않습니다." });
      return;
    }
    if (newPassword.length < 6) {
      setPwMsg({ type: "error", text: "6자 이상 입력해주세요." });
      return;
    }
    setPwLoading(true);
    setPwMsg(null);
    const { error } = await createClient().auth.updateUser({ password: newPassword });
    setPwLoading(false);
    if (error) {
      setPwMsg({ type: "error", text: error.message });
    } else {
      setPwMsg({ type: "success", text: "비밀번호가 변경됐습니다." });
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    const resp = await fetch("/account/delete", { method: "DELETE" });
    if (!resp.ok) {
      setDeleteLoading(false);
      alert("탈퇴 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
      return;
    }
    await createClient().auth.signOut();
    window.location.href = "/login";
  };

  // 페이지 떠날 때 스크롤 위치 저장
  useEffect(() => {
    return () => {
      const tid = threadIdRef.current;
      const container = scrollContainerRef.current;
      if (container && tid) {
        try {
          sessionStorage.setItem(`scroll_${tid}`, String(container.scrollTop));
        } catch {}
      }
    };
  }, []);

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
    setIsLoading(true);
    setNetworkError(false);
    lastUserMessageRef.current = message;
    if (showUserMsg) {
      setMessages((prev) => [...prev, { role: "user", content: message }]);
    }
    setMessages((prev) => [...prev, { role: "ai", content: "" }]);

    try {
      const authHeaders = await getAuthHeaders();
      const chatUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"}/api/chat`;
      const res = await fetch(chatUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ message, thread_id: threadId, user_id: threadId, target_score: targetScore, clear_pending: clearPending, client_pending_question: clearPending ? {} : capturedPQ }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const reader = res.body!.getReader();
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
            } else if (event.type === "done") {
              if (myStreamId !== streamIdRef.current) break;
              setMessages((prev) =>
                prev.filter((m, i) => !(i === prev.length - 1 && m.role === "ai" && m.content === ""))
              );
              setIsLoading(false);
              setRefreshSidebar((n) => n + 1);
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

  // ?new=true 로 진입 시 진단 자동 시작 (세션 복원 완료 후에만, 대화 이력이 없을 때만)
  useEffect(() => {
    if (searchParams.get("new") === "true" && threadId && !diagnosticFired.current && sessionReady) {
      diagnosticFired.current = true;
      if (messages.length <= 1) {
        streamChat("진단 시작해줘", false);
      }
    }
  }, [searchParams, threadId, streamChat, sessionReady]);

  // 재접속 시 진단 미완료 감지 → 배너 표시
  useEffect(() => {
    if (!sessionReady || !threadId || resumeDiagnosticFired.current) return;
    if (searchParams.get("new") === "true") return;
    if (messages.length > 1) return;
    (async () => {
      try {
        const res = await fetch(`/api/progress/${threadId}`, { headers: await getAuthHeaders() });
        const data = await res.json();
        if (data.is_diagnostic_in_progress) {
          setDiagnosticResume({ progress: data.diagnostic_progress });
        }
      } catch {}
    })();
  }, [sessionReady, threadId, searchParams, messages.length]);

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
      const data = await res.json();
      const cats = data.accuracy_by_category as Record<string, { accuracy: number; attempts: number }>;
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
  const lastAiContent = [...messages].reverse().find(m => m.role === "ai" && m.content !== "")?.content ?? "";
  const isAfterGrading = /^(정답입니다|오답입니다)/.test(lastAiContent);
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
        onStatsRefreshed={() => setLiveStats(null)}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex flex-col flex-1 min-w-0">
        <div className="px-6 py-4 border-b border-stone-200 bg-white flex items-center justify-between">
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
            <Link href="/home" className="md:hidden text-lg font-semibold text-stone-900 hover:text-amber-600 transition-colors">
              SQLD AI 튜터
            </Link>
          </div>

          {/* 우측 컨트롤: SQL + 계정 */}
          <div className="flex items-center gap-3">
          {/* SQL 패널 토글 버튼 — PC만 표시 */}
          <button
            onClick={() => setSqlPanelOpen((v) => !v)}
            className={`hidden md:flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border transition-colors ${
              sqlPanelOpen
                ? "bg-amber-50 border-amber-200 text-amber-700"
                : "border-stone-200 text-stone-500 hover:border-stone-300 hover:text-stone-700"
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
            </svg>
            SQL 실행
          </button>

          {/* 아바타 + 드롭다운 */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown((v) => !v)}
              className="flex items-center gap-1.5 text-sm text-stone-400 hover:text-stone-700 transition-colors"
              aria-label="계정 메뉴"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
              내 계정
            </button>

            {showDropdown && (
              <div className="absolute right-0 top-10 w-52 bg-white border border-stone-200 rounded-xl shadow-lg z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-stone-100">
                  <p className="text-xs text-stone-400 truncate">{userEmail}</p>
                </div>
                <button
                  onClick={() => { setShowDropdown(false); setShowAccountModal(true); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition-colors flex items-center gap-2"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                  계정 설정
                </button>
                <button
                  onClick={async () => {
                    setShowDropdown(false);
                    sessionStorage.removeItem(`chat_${threadId}`);
                    await createClient().auth.signOut();
                    window.location.href = "/login";
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-stone-500 hover:bg-stone-50 transition-colors flex items-center gap-2 border-t border-stone-100"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  로그아웃
                </button>
              </div>
            )}
          </div>
          </div>
        </div>

        {/* 계정 설정 모달 */}
        {showAccountModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
                <h2 className="text-base font-semibold text-stone-800">계정 설정</h2>
                <button onClick={() => { setShowAccountModal(false); setPwMsg(null); setDeleteConfirm(false); setNewPassword(""); setConfirmPassword(""); }} className="text-stone-400 hover:text-stone-600">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>

              <div className="px-6 py-4 space-y-3">
                <p className="text-xs text-stone-400">{userEmail}</p>
                <p className="text-sm font-medium text-stone-700">비밀번호 변경</p>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="새 비밀번호 (6자 이상)"
                  className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="비밀번호 확인"
                  className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                {pwMsg && (
                  <p className={`text-xs ${pwMsg.type === "success" ? "text-green-600" : "text-red-500"}`}>{pwMsg.text}</p>
                )}
                <button
                  onClick={handlePasswordChange}
                  disabled={pwLoading}
                  className="w-full bg-amber-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-amber-700 disabled:opacity-40 transition-colors"
                >
                  {pwLoading ? "변경 중..." : "비밀번호 변경"}
                </button>
              </div>

              <div className="px-6 py-4 border-t border-stone-100">
                <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-3">위험 구역</p>
                {!deleteConfirm ? (
                  <button
                    onClick={() => setDeleteConfirm(true)}
                    className="w-full border border-red-200 text-red-500 py-2 rounded-lg text-sm hover:bg-red-50 transition-colors"
                  >
                    회원 탈퇴
                  </button>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-red-500">모든 학습 기록이 삭제됩니다. 정말 탈퇴하시겠습니까?</p>
                    <div className="flex gap-2">
                      <button onClick={() => setDeleteConfirm(false)} className="flex-1 border border-stone-200 text-stone-500 py-2 rounded-lg text-sm hover:bg-stone-50 transition-colors">취소</button>
                      <button onClick={handleDeleteAccount} disabled={deleteLoading} className="flex-1 bg-red-500 text-white py-2 rounded-lg text-sm hover:bg-red-600 disabled:opacity-40 transition-colors">
                        {deleteLoading ? "처리 중..." : "탈퇴 확인"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {diagnosticResume && (
            <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm">
              <span className="text-amber-800">이전 진단을 <strong>{diagnosticResume.progress}/8</strong> 문제까지 풀었어요. 이어서 마저 풀까요?</span>
              <div className="flex gap-2 ml-4 shrink-0">
                <button
                  onClick={async () => { setDiagnosticResume(null); resumeDiagnosticFired.current = true; await streamChat("진단 이어서 해줘", false); }}
                  className="bg-amber-500 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-amber-600"
                >이어서 풀기</button>
                <button onClick={() => setDiagnosticResume(null)} className="text-amber-600 text-xs px-2 py-1.5 hover:underline">닫기</button>
              </div>
            </div>
          )}
          {(() => {
            const hasPendingQuestion = !!pendingQuestionCache.id;
            const lastAiIndex = messages.map((m, idx) => m.role === "ai" ? idx : -1).filter(idx => idx !== -1).at(-1) ?? -1;
            const hasEverGraded = messages.some(m => m.role === "ai" && /^(정답|오답)입니다/.test(m.content));
            return messages.map((msg, i) => {
            const isAnswered = messages.slice(i + 1).some(m => m.role === "user");
            const isLastAiMessage = i === lastAiIndex;
            if (msg.role === "ai" && msg.content === "" && isAnswered) return null;
            return (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "max-w-[75%] bg-stone-800 text-white rounded-br-sm"
                    : "max-w-[90%] bg-white border border-stone-200 text-stone-800 rounded-bl-sm shadow-sm"
                }`}
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
                              <span className="text-xs font-bold text-amber-700">💡 개념 보충</span>
                            </div>
                            <div className="relative">
                              <div
                                style={{
                                  maxHeight: msg.conceptExpanded ? "2000px" : "112px",
                                  overflow: "hidden",
                                  transition: "max-height 0.38s cubic-bezier(0.4,0,0.2,1)",
                                }}
                              >
                                <ReactMarkdown remarkPlugins={[[remarkGfm, { singleTilde: false }]]} components={mdComponents}>
                                  {msg.content.replace(/\*\*([^*\n]+)\*\*/g, "$1")}
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
                                    className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1 hover:bg-amber-100 transition-colors"
                                  >
                                    {msg.conceptExpanded ? "접기 ▲" : "더 보기 ▼"}
                                  </button>
                                )}
                                {(!isAnswered || isLastAiMessage) && !isLoading && !hasPendingQuestion && (
                                  <button
                                    onClick={() => streamChat("문제 줘", true)}
                                    className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
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

                      const isGradingResult = /^(정답|오답)입니다/.test(msg.content);
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
                            {safeContent}
                          </ReactMarkdown>
                          {/^오답입니다/.test(msg.content) && isLoading && liveStats !== null && !isAnswered && !isDiagnosticContext && (
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
                          {isNextQuestionEligible && (!isAnswered || isLastAiMessage) && !hasConceptAfter && !hasPendingQuestion && (
                            <div className="mt-3 flex justify-end">
                              <button
                                onClick={() => streamChat("문제 줘", true)}
                                disabled={isLoading}
                                className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
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
                            const hasPrevGradingBtn = messages.slice(0, i).some((m, mi) =>
                              m.role === "ai" &&
                              /^(정답|오답)입니다/.test(m.content) &&
                              !messages.slice(mi + 1, i).some(u => u.role === "user")
                            );
                            return isLastAiMessage && hasEverGraded && !isLoading && !hasPendingQuestion && !isNextQuestionEligible && !isDiagnosticContext && !hasPrevGradingBtn;
                          })() && (
                            <div className="mt-3 flex justify-end">
                              <button
                                onClick={() => streamChat("문제 줘", true)}
                                className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
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
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-700">
                            {parsed.category}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${DIFF_STYLE[parsed.difficulty] ?? "bg-stone-100 text-stone-600"}`}>
                            난이도 {parsed.difficulty}
                          </span>
                        </div>
                        <ReactMarkdown remarkPlugins={[[remarkGfm, { singleTilde: false }]]} components={mdComponents}>
                          {optData ? optData.stem : parsed.body}
                        </ReactMarkdown>
                        {optData && (
                          <>
                            <div className="mt-3 space-y-1">
                              {optData.options.map((opt) => (
                                <button
                                  key={opt.circle}
                                  onClick={() => streamChat(`${opt.num}번`, true)}
                                  disabled={(isLoading && !hasPendingQuestion) || isAnswered}
                                  className={`w-full text-left flex items-start gap-2.5 px-2 py-1.5 rounded-lg transition-colors group ${
                                    isLoading && !hasPendingQuestion && !isAnswered
                                      ? "bg-stone-100 animate-pulse cursor-not-allowed"
                                      : "hover:bg-amber-50 active:bg-amber-100 disabled:opacity-60 disabled:cursor-not-allowed"
                                  }`}
                                >
                                  <span className="shrink-0 w-5 h-5 rounded-full bg-stone-100 group-hover:bg-amber-500 group-hover:text-white flex items-center justify-center text-[11px] font-bold text-stone-500 transition-colors mt-0.5">
                                    {opt.num}
                                  </span>
                                  <div className="flex-1 text-sm leading-relaxed text-stone-800">
                                    <ReactMarkdown remarkPlugins={[[remarkGfm, { singleTilde: false }]]} components={mdComponents}>
                                      {opt.content}
                                    </ReactMarkdown>
                                  </div>
                                </button>
                              ))}
                            </div>
                            {optData.suffix && (
                              <div className="mt-2">
                                <ReactMarkdown remarkPlugins={[[remarkGfm, { singleTilde: false }]]} components={mdComponents}>
                                  {optData.suffix}
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
          <div className="px-6 py-3 flex flex-wrap gap-2 border-t border-stone-100 bg-white">
            <button
              onClick={() => streamChat("문제 줘", true, true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-stone-600 bg-stone-100 hover:bg-amber-50 hover:text-amber-800 rounded-full transition-colors border border-transparent hover:border-amber-200"
            >
              📝 문제 풀기
            </button>
            <button
              onClick={() => streamChat("약점 분석해줘", true, true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-stone-600 bg-stone-100 hover:bg-amber-50 hover:text-amber-800 rounded-full transition-colors border border-transparent hover:border-amber-200"
            >
              📊 약점 분석
            </button>
            <button
              onClick={() => streamChat("오답 복습해줘", true, true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-stone-600 bg-stone-100 hover:bg-amber-50 hover:text-amber-800 rounded-full transition-colors border border-transparent hover:border-amber-200"
            >
              🔁 오답 복습
            </button>
            <button
              onClick={handleWeakConceptChip}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-stone-600 bg-stone-100 hover:bg-amber-50 hover:text-amber-800 rounded-full transition-colors border border-transparent hover:border-amber-200"
            >
              💡 틀린 개념 복습
            </button>
          </div>
        )}

        <div className="px-6 py-4 border-t border-stone-200 bg-white">
          <div className="flex gap-3 items-end">
            <textarea
              ref={inputRef}
              className={`flex-1 resize-none border border-stone-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-amber-400 max-h-32 transition-opacity placeholder:text-stone-400 ${isLoading ? "opacity-50" : ""}`}
              rows={1}
              placeholder={inputPlaceholder}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              className="px-5 py-3 bg-amber-600 text-white text-sm font-semibold rounded-xl hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              전송
            </button>
          </div>
        </div>
      </div>

      {/* SQL 패널 — PC에서만 표시 */}
      {sqlPanelOpen && (
        <div className="hidden md:flex flex-col w-[420px] shrink-0 border-l border-stone-200 bg-white">
          {/* 패널 헤더 */}
          <div className="px-4 py-3 border-b border-stone-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-600">
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
            <span>📋 <strong>EMP</strong>(EMP_ID, EMP_NAME, JOB, SALARY, DEPT_ID)</span>
            <span>📋 <strong>DEPT</strong>(DEPT_ID, DEPT_NAME, LOC)</span>
            <span>📋 <strong>SALGRADE</strong>(GRADE, LOSAL, HISAL)</span>
          </div>

          {/* 에디터 + 실행 */}
          <div className="px-4 pt-3 pb-2 flex flex-col gap-2">
            <textarea
              value={sqlQuery}
              onChange={(e) => setSqlQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); runSql(); } }}
              className="w-full h-32 resize-none border border-stone-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-stone-400"
              placeholder="SELECT * FROM EMP;"
              spellCheck={false}
            />
            <button
              onClick={runSql}
              disabled={sqlLoading || !sqlQuery.trim()}
              className="self-end flex items-center gap-1.5 px-4 py-2 bg-amber-600 text-white text-sm font-semibold rounded-lg hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
              <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-sm text-red-600">
                {sqlResult.error}
              </div>
            )}
            {sqlResult && !sqlResult.error && sqlResult.columns.length > 0 && (
              <div>
                <p className="text-xs text-stone-400 mb-2 font-medium">{sqlResult.rows.length}건</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
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
