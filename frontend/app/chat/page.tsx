"use client";

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Sidebar from "@/components/Sidebar";
import { createClient } from "@/lib/supabase/client";

interface Message {
  role: "user" | "ai";
  content: string;
  isError?: boolean;
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
} | null {
  const cleaned = body.replace(/\n+번호로 답하세요\.\s*$/, "").trim();
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

  return { stem, options };
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
    <th className="border border-gray-300 bg-gray-100 px-2 py-1 text-left font-semibold whitespace-nowrap">
      {children}
    </th>
  ),
  td: ({ children }: { children?: React.ReactNode }) => (
    <td className="border border-gray-300 px-2 py-1 whitespace-nowrap">{children}</td>
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
    <code className={`bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-xs font-mono ${className ?? ""}`}>
      {children}
    </code>
  ),
  pre: ({ children }: { children?: React.ReactNode }) => (
    <pre className="bg-gray-100 rounded p-2 overflow-x-auto text-xs font-mono my-1 whitespace-pre-wrap">
      {children}
    </pre>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-semibold">{children}</strong>
  ),
  hr: () => <hr className="my-2 border-gray-200" />,
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 className="font-bold text-sm mt-4 mb-2 pb-1 border-b border-gray-200">{children}</h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="font-semibold text-sm mt-3 mb-1">{children}</h3>
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
  const [aiHasResponded, setAiHasResponded] = useState(false);
  const [refreshSidebar, setRefreshSidebar] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [threadId, setThreadId] = useState("demo-user-1");
  const [targetScore, setTargetScore] = useState(70);
  const [sessionReady, setSessionReady] = useState(false);
  const [lastUserMessage, setLastUserMessage] = useState("");
  const diagnosticFired = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isRestoredRef = useRef(false);
  const restoredScrollRef = useRef(0);
  const threadIdRef = useRef("demo-user-1");

  useEffect(() => {
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
        }
        setSessionReady(true);
      });
  }, []);

  // 메시지 변경 시 sessionStorage 저장 (로그아웃 전까지 유지)
  useEffect(() => {
    if (!sessionReady || threadId === "demo-user-1") return;
    try {
      sessionStorage.setItem(`chat_${threadId}`, JSON.stringify(messages));
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

  // 페이지 떠날 때 스크롤 위치 저장
  useEffect(() => {
    return () => {
      const tid = threadIdRef.current;
      const container = scrollContainerRef.current;
      if (container && tid !== "demo-user-1") {
        try {
          sessionStorage.setItem(`scroll_${tid}`, String(container.scrollTop));
        } catch {}
      }
    };
  }, []);

  const streamChat = useCallback(async (message: string, showUserMsg: boolean) => {
    setIsLoading(true);
    setAiHasResponded(false);
    setLastUserMessage(message);
    if (showUserMsg) {
      setMessages((prev) => [...prev, { role: "user", content: message }]);
    }
    setMessages((prev) => [...prev, { role: "ai", content: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, thread_id: threadId, user_id: threadId, target_score: targetScore }),
      });

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
              setAiHasResponded(true);
              setIsLoading(false);
              setMessages((prev) => {
                const next = [...prev];
                next[next.length - 1] = { role: "ai", content: event.content };
                next.push({ role: "ai", content: "" });
                return next;
              });
              streamingContent = "";
            } else if (event.type === "token") {
              streamingContent += event.content;
              setMessages((prev) => {
                const next = [...prev];
                next[next.length - 1] = { role: "ai", content: streamingContent };
                return next;
              });
            } else if (event.type === "done") {
              setMessages((prev) =>
                prev.filter((m, i) => !(i === prev.length - 1 && m.role === "ai" && m.content === ""))
              );
              setIsLoading(false);
              setRefreshSidebar((n) => n + 1);
            } else if (event.type === "error") {
              setMessages((prev) => {
                const next = [...prev];
                next[next.length - 1] = { role: "ai", content: "연결 오류가 발생했습니다.", isError: true };
                return next;
              });
            }
          } catch {
            // JSON 파싱 실패 무시
          }
        }
      }
    } catch {
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = { role: "ai", content: "연결 오류가 발생했습니다.", isError: true };
        return next;
      });
    } finally {
      setIsLoading(false);
    }
  }, [threadId, targetScore]);

  // ?new=true 로 진입 시 진단 자동 시작 (세션 복원 완료 후에만, 대화 이력이 없을 때만)
  useEffect(() => {
    if (searchParams.get("new") === "true" && threadId !== "demo-user-1" && !diagnosticFired.current && sessionReady) {
      diagnosticFired.current = true;
      if (messages.length <= 1) {
        streamChat("진단 시작해줘", false);
      }
    }
  }, [searchParams, threadId, streamChat, sessionReady]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    setInput("");
    inputRef.current?.focus();
    await streamChat(text, true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex h-[100dvh] overflow-hidden">
      <Sidebar
        threadId={threadId}
        refresh={refreshSidebar}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex flex-col flex-1 min-w-0">
        <div className="px-6 py-4 border-b border-gray-200 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-1 text-gray-500 hover:text-gray-700 transition-colors"
              aria-label="메뉴 열기"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <rect y="3" width="20" height="2" rx="1"/>
                <rect y="9" width="20" height="2" rx="1"/>
                <rect y="15" width="20" height="2" rx="1"/>
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-gray-800">SQLD AI 튜터</h1>
          </div>
          <button
            onClick={async () => {
              sessionStorage.removeItem(`chat_${threadId}`);
              await createClient().auth.signOut();
              window.location.href = "/login";
            }}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            로그아웃
          </button>
        </div>

        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {messages.map((msg, i) =>
            msg.role === "ai" && msg.content === "" && aiHasResponded ? null : (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "max-w-[75%] bg-blue-600 text-white rounded-br-sm"
                    : "max-w-[90%] bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm"
                }`}
              >
                {msg.role === "ai" ? (
                  msg.content === "" && isLoading ? (
                    <span className="inline-flex gap-1">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </span>
                  ) : msg.isError ? (
                    <div>
                      <p className="text-gray-500 text-sm">{msg.content}</p>
                      <button
                        onClick={() => {
                          setMessages((prev) => prev.filter((_, idx) => idx !== i));
                          streamChat(lastUserMessage, false);
                        }}
                        disabled={isLoading}
                        className="mt-2 flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 font-medium disabled:opacity-40 transition-colors"
                      >
                        ↺ 다시 시도
                      </button>
                    </div>
                  ) : (() => {
                    const parsed = parseQuestionHeader(msg.content);
                    if (!parsed) {
                      return (
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                          {msg.content}
                        </ReactMarkdown>
                      );
                    }
                    const optData = parseOptions(parsed.body);
                    return (
                      <>
                        {parsed.progress && (
                          <div className="mb-2">
                            <p className="text-xs text-gray-400 font-medium">{parsed.progress}/8 진단 중</p>
                            {parsed.progress === "1" && (
                              <p className="text-xs text-gray-500 mt-0.5">8문제로 현재 실력을 진단할게요. 편하게 답해보세요!</p>
                            )}
                          </div>
                        )}
                        <div className="flex gap-1.5 mb-3">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                            {parsed.category}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${DIFF_STYLE[parsed.difficulty] ?? "bg-gray-100 text-gray-600"}`}>
                            난이도 {parsed.difficulty}
                          </span>
                        </div>
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                          {optData ? optData.stem : parsed.body}
                        </ReactMarkdown>
                        {optData && (
                          <div className="mt-3 space-y-1">
                            {optData.options.map((opt) => (
                              <button
                                key={opt.circle}
                                onClick={() => !isLoading && streamChat(`${opt.num}번`, true)}
                                disabled={isLoading}
                                className="w-full text-left flex items-start gap-2.5 px-2 py-1.5 rounded-lg hover:bg-blue-50 active:bg-blue-100 transition-colors group disabled:opacity-60 disabled:cursor-not-allowed"
                              >
                                <span className="shrink-0 w-5 h-5 rounded-full bg-gray-100 group-hover:bg-blue-500 group-hover:text-white flex items-center justify-center text-[11px] font-bold text-gray-500 transition-colors mt-0.5">
                                  {opt.num}
                                </span>
                                <div className="flex-1 text-sm leading-relaxed text-gray-800">
                                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                                    {opt.content}
                                  </ReactMarkdown>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    );
                  })()
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-white">
          <div className="flex gap-3 items-end">
            <textarea
              ref={inputRef}
              className={`flex-1 resize-none border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 max-h-32 transition-opacity ${isLoading ? "opacity-50" : ""}`}
              rows={1}
              placeholder="메시지를 입력하세요(Enter로 전송)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              className="px-5 py-3 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              전송
            </button>
          </div>
        </div>
      </div>
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
