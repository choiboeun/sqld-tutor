"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { createClient } from "@/lib/supabase/client";
import { getAuthHeaders } from "@/lib/api";

interface Option {
  num: number;
  text: string;
}

interface WrongAnswer {
  question_id: string;
  category: string;
  difficulty: string;
  question: string;
  context: string;
  options: Option[];
  correct_answer: number;
  student_answer: number | null;
  explanation: string;
  still_wrong: boolean;
}

interface MiniMessage {
  role: "user" | "ai";
  content: string;
}

const DIFF_STYLE: Record<string, string> = {
  하: "bg-green-100 text-green-700",
  중: "bg-amber-100 text-amber-700",
  상: "bg-red-100 text-red-700",
};

export default function WrongAnswersPage() {
  const [threadId, setThreadId] = useState<string | null>(null);
  const [wrongAnswers, setWrongAnswers] = useState<WrongAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<WrongAnswer | null>(null);

  // 미니 채팅
  const [miniMessages, setMiniMessages] = useState<MiniMessage[]>([]);
  const [miniInput, setMiniInput] = useState("");
  const [miniLoading, setMiniLoading] = useState(false);
  const miniBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => {
        if (data.user) setThreadId(data.user.id);
      });
  }, []);

  useEffect(() => {
    if (!threadId) return;
    (async () => {
      try {
        const res = await fetch(`/api/wrong-answers/${threadId}`, { headers: await getAuthHeaders() });
        const d = await res.json();
        setWrongAnswers(d.wrong_answers ?? []);
      } catch {
      } finally {
        setLoading(false);
      }
    })();
  }, [threadId]);

  useEffect(() => {
    miniBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [miniMessages]);

  const openModal = (wa: WrongAnswer) => {
    setSelected(wa);
    setMiniMessages([]);
    setMiniInput("");
  };

  const closeModal = () => {
    setSelected(null);
    setMiniMessages([]);
  };

  const sendMiniMessage = useCallback(async () => {
    if (!miniInput.trim() || miniLoading || !selected) return;
    const text = miniInput.trim();
    const historySnapshot = miniMessages.filter((m) => m.content);
    setMiniInput("");

    setMiniMessages((prev) => [
      ...prev,
      { role: "user", content: text },
      { role: "ai", content: "" },
    ]);
    setMiniLoading(true);

    const questionContext = {
      category: selected.category,
      difficulty: selected.difficulty,
      question: selected.question,
      options: selected.options,
      correct_answer: selected.correct_answer,
      explanation: selected.explanation,
    };

    try {
      const res = await fetch("/api/mini-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question_context: questionContext,
          messages: historySnapshot,
          user_message: text,
        }),
      });

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let streaming = "";

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
            if (event.type === "token") {
              streaming += event.content;
              setMiniMessages((prev) => {
                const next = [...prev];
                next[next.length - 1] = { role: "ai", content: streaming };
                return next;
              });
            } else if (event.type === "message") {
              setMiniMessages((prev) => {
                const next = [...prev];
                next[next.length - 1] = { role: "ai", content: event.content };
                return next;
              });
              streaming = "";
            } else if (event.type === "done") {
              setMiniMessages((prev) =>
                prev.filter((m, i) => !(i === prev.length - 1 && m.role === "ai" && m.content === ""))
              );
            } else if (event.type === "error") {
              setMiniMessages((prev) => {
                const next = [...prev];
                next[next.length - 1] = { role: "ai", content: "오류가 발생했습니다. 다시 시도해주세요." };
                return next;
              });
            }
          } catch { /* JSON 파싱 실패 무시 */ }
        }
      }
    } catch {
      setMiniMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = { role: "ai", content: "오류가 발생했습니다. 다시 시도해주세요." };
        return next;
      });
    } finally {
      setMiniLoading(false);
    }
  }, [miniInput, miniLoading, selected, threadId]);

  return (
    <div className="min-h-screen bg-stone-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-stone-200 px-6 py-4 flex items-center gap-3">
        <Link href="/chat" className="text-stone-400 hover:text-stone-600 transition-colors">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </Link>
        <h1 className="text-lg font-semibold text-stone-800">오답 회고</h1>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* 안내 배너 */}
        <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 mb-6 text-sm text-amber-800">
          오답을 다시 풀고 싶다면 홈 채팅에서 <strong>"오답 복습해줘"</strong>를 입력해보세요.
        </div>

        {/* 카드 목록 */}
        {loading ? (
          <p className="text-center text-stone-400 py-12">불러오는 중...</p>
        ) : wrongAnswers.length === 0 ? (
          <p className="text-center text-stone-400 py-12">아직 오답 기록이 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {wrongAnswers.map((wa) => (
              <button
                key={wa.question_id}
                onClick={() => openModal(wa)}
                className="w-full text-left bg-white rounded-xl border border-stone-200 px-4 py-3.5 hover:border-amber-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-700">
                    {wa.category}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${DIFF_STYLE[wa.difficulty] ?? "bg-gray-100 text-gray-600"}`}>
                    난이도 {wa.difficulty}
                  </span>
                  {wa.still_wrong && (
                    <span className="ml-auto text-xs text-red-500 font-semibold">복습 필요</span>
                  )}
                </div>
                <p className="text-sm text-stone-700 line-clamp-2">{wa.question}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 모달 */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-0 sm:px-4">
          <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl flex flex-col max-h-[90dvh]">
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
              <div className="flex gap-2">
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-700">
                  {selected.category}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${DIFF_STYLE[selected.difficulty] ?? "bg-gray-100 text-gray-600"}`}>
                  난이도 {selected.difficulty}
                </span>
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {/* 모달 본문 */}
            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
              {/* 문제 */}
              <div>
                {selected.context && (
                  <div className="text-sm text-gray-600 mb-3 p-3 bg-gray-50 rounded-lg">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{selected.context}</ReactMarkdown>
                  </div>
                )}
                <p className="text-sm font-medium text-gray-800 mb-3">{selected.question}</p>
                <div className="space-y-1.5">
                  {selected.options.map((opt) => {
                    const isStudentAnswer = opt.num === selected.student_answer;
                    const isCorrect = opt.num === selected.correct_answer;
                    return (
                      <div
                        key={opt.num}
                        className={`flex items-start gap-2.5 px-3 py-2 rounded-lg text-sm ${
                          isCorrect
                            ? "bg-green-50 text-green-800"
                            : isStudentAnswer
                            ? "bg-red-50 text-red-700"
                            : "text-gray-600"
                        }`}
                      >
                        <span className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold mt-0.5 ${
                          isCorrect
                            ? "bg-green-200 text-green-700"
                            : isStudentAnswer
                            ? "bg-red-200 text-red-600"
                            : "bg-gray-100 text-gray-500"
                        }`}>
                          {opt.num}
                        </span>
                        <span className="leading-relaxed">{opt.text}</span>
                        {isCorrect && <span className="ml-auto text-xs font-semibold text-green-600 shrink-0">정답</span>}
                        {isStudentAnswer && !isCorrect && <span className="ml-auto text-xs font-semibold text-red-500 shrink-0">내 답</span>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 해설 */}
              <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                <p className="text-xs font-semibold text-amber-700 mb-1">해설</p>
                <p className="text-sm text-amber-900 leading-relaxed">{selected.explanation}</p>
              </div>

              {/* 미니 채팅 */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-3 py-2 bg-stone-50 border-b border-stone-200">
                  <p className="text-xs font-medium text-stone-500">더 궁금한 게 있으신가요?</p>
                </div>
                {miniMessages.length > 0 && (
                  <div className="px-3 py-3 space-y-2 max-h-48 overflow-y-auto">
                    {miniMessages.map((m, i) => (
                      <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div className={`rounded-xl px-3 py-2 text-xs max-w-[85%] leading-relaxed ${
                          m.role === "user"
                            ? "bg-stone-800 text-white"
                            : "bg-stone-100 text-stone-800"
                        }`}>
                          {m.role === "ai" && m.content === "" && miniLoading ? (
                            <span className="inline-flex gap-1">
                              <span className="w-1 h-1 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                              <span className="w-1 h-1 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                              <span className="w-1 h-1 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                            </span>
                          ) : (
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                          )}
                        </div>
                      </div>
                    ))}
                    <div ref={miniBottomRef} />
                  </div>
                )}
                <div className="flex gap-2 px-3 py-2.5 border-t border-stone-100">
                  <input
                    type="text"
                    value={miniInput}
                    onChange={(e) => setMiniInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMiniMessage(); } }}
                    placeholder="이 문제에 대해 질문하세요"
                    disabled={miniLoading}
                    className="flex-1 text-xs border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-50 placeholder:text-stone-400"
                  />
                  <button
                    onClick={sendMiniMessage}
                    disabled={miniLoading || !miniInput.trim()}
                    className="px-3 py-2 bg-amber-600 text-white text-xs font-semibold rounded-lg hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    전송
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
