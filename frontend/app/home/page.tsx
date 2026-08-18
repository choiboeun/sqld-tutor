"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getAuthHeaders } from "@/lib/api";

interface CategoryStat {
  accuracy: number;
  attempts: number;
}

interface ProgressData {
  total_answered: number;
  streak: number;
  accuracy_by_category: Record<string, CategoryStat>;
  weak_categories: { category: string; accuracy: number }[];
  wrong_count: number;
  target_score: number;
}

interface CalendarData {
  dates: Record<string, number>;
}

interface ReviewItem {
  qid: string;
  category: string;
}

interface ReviewTiming {
  today: ReviewItem[];
  tomorrow: ReviewItem[];
  this_week: ReviewItem[];
  overdue: ReviewItem[];
}

const ALL_CATEGORIES = [
  "데이터 모델링 기초", "데이터 모델과 SQL", "SELECT & WHERE",
  "함수", "GROUP BY & ORDER BY", "조인",
  "서브쿼리 & Top N", "집합 연산자 & 그룹 함수",
  "윈도우 함수", "SQL 활용 기타", "관리 구문",
];

const CATEGORY_WEIGHTS: Record<string, number> = {
  "데이터 모델링 기초": 0.20 / 2,
  "데이터 모델과 SQL":  0.20 / 2,
  "SELECT & WHERE":          0.80 / 9,
  "함수":                    0.80 / 9,
  "GROUP BY & ORDER BY":     0.80 / 9,
  "조인":                    0.80 / 9,
  "서브쿼리 & Top N":        0.80 / 9,
  "집합 연산자 & 그룹 함수":  0.80 / 9,
  "윈도우 함수":             0.80 / 9,
  "SQL 활용 기타":           0.80 / 9,
  "관리 구문":               0.80 / 9,
};

/* ── GitHub-style heatmap ── */
function CalendarHeatmap({ dates }: { dates: Record<string, number> }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Start from the Sunday that includes the day 90 days back
  const anchor = new Date(today);
  anchor.setDate(anchor.getDate() - 90);
  anchor.setDate(anchor.getDate() - anchor.getDay()); // rewind to Sunday

  // Build week columns
  const weeks: { date: string; count: number; isFuture: boolean }[][] = [];
  const cur = new Date(anchor);

  while (cur <= today) {
    if (!weeks.length || weeks[weeks.length - 1].length === 7) weeks.push([]);
    const dateStr = cur.toISOString().split("T")[0];
    weeks[weeks.length - 1].push({
      date: dateStr,
      count: dates[dateStr] ?? 0,
      isFuture: cur > today,
    });
    cur.setDate(cur.getDate() + 1);
  }
  // pad last week
  const last = weeks[weeks.length - 1];
  if (last && last.length < 7) {
    while (last.length < 7) last.push({ date: "", count: 0, isFuture: true });
  }

  // Month labels: find first week where each new month appears
  const monthLabels: { col: number; label: string }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, wi) => {
    const firstValid = week.find((c) => c.date && !c.isFuture);
    if (!firstValid) return;
    const m = new Date(firstValid.date).getMonth();
    if (m !== lastMonth) {
      monthLabels.push({ col: wi, label: ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"][m] });
      lastMonth = m;
    }
  });

  const cellColor = (count: number, isFuture: boolean) => {
    if (isFuture || count === 0) return "bg-stone-100";
    if (count <= 2) return "bg-indigo-200";
    if (count <= 5) return "bg-indigo-400";
    return "bg-indigo-500";
  };

  return (
    <div className="overflow-x-auto pb-1">
      {/* X축 월 라벨 — Y축 너비만큼 왼쪽 여백 */}
      <div className="flex gap-2 mb-2 ml-[32px]">
        {weeks.map((_, wi) => {
          const lbl = monthLabels.find((m) => m.col === wi);
          return (
            <div key={wi} className="w-5 shrink-0 text-xs text-stone-400 leading-none">
              {lbl ? lbl.label : ""}
            </div>
          );
        })}
      </div>
      {/* Y축 + 격자 */}
      <div className="flex gap-2">
        {/* Y축: 요일 */}
        <div className="flex flex-col gap-2 shrink-0">
          {["일","월","화","수","목","금","토"].map((d) => (
            <div key={d} className="h-5 w-5 text-xs text-stone-300 leading-none flex items-center justify-end">
              {d}
            </div>
          ))}
        </div>
        {/* 격자 */}
        <div className="flex gap-2">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-2 shrink-0">
              {week.map((cell, di) => (
                <div
                  key={di}
                  className={`w-5 h-5 ${cellColor(cell.count, cell.isFuture)}`}
                  title={cell.date && !cell.isFuture ? `${cell.date}: ${cell.count}문제` : ""}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── 복습 타이밍 row ── */

/* ── 레이더 차트 ── */
const RADAR_SHORT: Record<string, string> = {
  "데이터 모델링 기초":      "모델링",
  "데이터 모델과 SQL":       "모델SQL",
  "SELECT & WHERE":          "SELECT",
  "함수":                    "함수",
  "GROUP BY & ORDER BY":     "GROUP BY",
  "조인":                    "조인",
  "서브쿼리 & Top N":        "서브쿼리",
  "집합 연산자 & 그룹 함수": "집합/그룹",
  "윈도우 함수":             "윈도우",
  "SQL 활용 기타":           "SQL기타",
  "관리 구문":               "관리구문",
};

function RadarChart({ catMap }: { catMap: Record<string, CategoryStat> }) {
  const n = ALL_CATEGORIES.length;
  const cx = 140, cy = 95, maxR = 68, labelR = 88;

  const toAngle = (i: number) => (i / n) * 2 * Math.PI - Math.PI / 2;
  const pt = (i: number, r: number): [number, number] => [
    cx + r * Math.cos(toAngle(i)),
    cy + r * Math.sin(toAngle(i)),
  ];

  const points = ALL_CATEGORIES.map((cat) => {
    const stat  = catMap[cat];
    const tried = (stat?.attempts ?? 0) > 0;
    const pct   = tried ? (stat?.accuracy ?? 0) : 0;
    return { cat, tried, pct };
  });

  const dataPolygon = points
    .map((d, i) => pt(i, d.pct * maxR).join(","))
    .join(" ");

  const hasAnyData = points.some((d) => d.tried);

  return (
    <svg viewBox="0 0 280 190" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}>
      {/* 배경 링 */}
      {[0.2, 0.4, 0.6, 0.8, 1].map((r, ri) => (
        <polygon
          key={ri}
          points={ALL_CATEGORIES.map((_, i) => pt(i, r * maxR).join(",")).join(" ")}
          fill="none"
          stroke="rgba(99,102,241,0.18)"
          strokeWidth="1"
        />
      ))}

      {/* 스포크 */}
      {ALL_CATEGORIES.map((_, i) => {
        const [x2, y2] = pt(i, maxR);
        return (
          <line key={i} x1={cx} y1={cy} x2={x2} y2={y2}
            stroke="rgba(99,102,241,0.18)" strokeWidth="1" />
        );
      })}

      {/* 데이터 다각형 */}
      <polygon
        points={dataPolygon}
        fill="rgba(99,102,241,0.12)"
        stroke={hasAnyData ? "#6366f1" : "transparent"}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      {/* 꼭짓점 점 */}
      {points.map((d, i) => {
        if (!d.tried || d.pct === 0) return null;
        const [x, y] = pt(i, d.pct * maxR);
        return <circle key={i} cx={x} cy={y} r="3" fill="#6366f1" />;
      })}

      {/* 라벨 */}
      {points.map((d, i) => {
        const [x, y] = pt(i, labelR);
        return (
          <text
            key={i}
            x={x} y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={d.tried ? "#3730a3" : "rgba(99,102,241,0.35)"}
            fontSize="8"
            fontWeight={d.tried ? "600" : "400"}
            fontFamily="system-ui, sans-serif"
          >
            {RADAR_SHORT[d.cat] ?? d.cat}
          </text>
        );
      })}

      {/* 데이터 없을 때 안내 */}
      {!hasAnyData && (
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
          fill="rgba(55,48,163,0.45)" fontSize="9" fontFamily="system-ui, sans-serif">
          문제를 풀면 표시됩니다
        </text>
      )}
    </svg>
  );
}

export default function HomePage() {
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [examDate, setExamDate] = useState<string>("");
  const [showExamModal, setShowExamModal] = useState(false);
  const [examDateInput, setExamDateInput] = useState("");
  const [examSaving, setExamSaving] = useState(false);
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
  const [reviewTiming, setReviewTiming] = useState<ReviewTiming | null>(null);
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [inquiryMsg, setInquiryMsg] = useState("");
  const [inquiryLoading, setInquiryLoading] = useState(false);
  const [inquiryResult, setInquiryResult] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("welcome") === "true") setShowWelcomeModal(true);
  }, []);

  useEffect(() => {
    (async () => {
      const { data: authData } = await createClient().auth.getUser();
      if (!authData.user) { window.location.href = "/login"; return; }

      const uid = authData.user.id;
      setUserEmail(authData.user.email ?? "");
      setExamDate(authData.user.user_metadata?.exam_date ?? "");

      try {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/home-data/${uid}`, { headers });
        if (res.ok) {
          const { progress, calendar, review_timing } = await res.json();
          setData(progress);
          setCalendarData(calendar);
          setReviewTiming(review_timing);
        }
      } catch {}
      finally { setLoading(false); }
    })();
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setShowDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const catMap = data?.accuracy_by_category ?? {};
  const totalAnswered = data?.total_answered ?? 0;
  const streak = data?.streak ?? 0;
  const targetScore = data?.target_score ?? 70;
  const wrongCount = data?.wrong_count ?? 0;

  const predictedScore = Math.round(
    ALL_CATEGORIES.reduce((sum, cat) => {
      const acc = catMap[cat]?.accuracy ?? 0;
      return sum + acc * (CATEGORY_WEIGHTS[cat] ?? 0);
    }, 0) * 100
  );
  const scoreDiff = predictedScore - targetScore;

  // D-day
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dDayCount = examDate
    ? Math.ceil((new Date(examDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const handleLogout = async () => {
    await createClient().auth.signOut();
    window.location.href = "/login";
  };

  const handleInquirySubmit = async () => {
    if (!inquiryMsg.trim()) return;
    setInquiryLoading(true);
    setInquiryResult(null);
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"}/api/inquiries`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ message: inquiryMsg.trim() }),
      });
      if (res.ok) {
        setInquiryResult({ type: "success", text: "문의가 접수됐습니다. 빠르게 확인하고 답변 드릴게요." });
        setInquiryMsg("");
      } else {
        setInquiryResult({ type: "error", text: "제출 중 오류가 발생했습니다. 다시 시도해주세요." });
      }
    } catch {
      setInquiryResult({ type: "error", text: "네트워크 오류가 발생했습니다." });
    } finally {
      setInquiryLoading(false);
    }
  };

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

  const handleSaveExamDate = async () => {
    if (!examDateInput) return;
    setExamSaving(true);
    const { error } = await createClient().auth.updateUser({
      data: { exam_date: examDateInput },
    });
    setExamSaving(false);
    if (!error) {
      setExamDate(examDateInput);
      setShowExamModal(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      const resp = await fetch("/account/delete", { method: "DELETE", headers: await getAuthHeaders() });
      if (!resp.ok) {
        alert("탈퇴 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
        return;
      }
      await createClient().auth.signOut();
      window.location.href = "/login";
    } catch {
      alert("탈퇴 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const reviewTotal =
    (reviewTiming?.today.length ?? 0) +
    (reviewTiming?.tomorrow.length ?? 0) +
    (reviewTiming?.this_week.length ?? 0) +
    (reviewTiming?.overdue.length ?? 0);

  const weakCats = ALL_CATEGORIES
    .map(cat => ({ category: cat, accuracy: catMap[cat]?.accuracy ?? 1, attempts: catMap[cat]?.attempts ?? 0 }))
    .filter(c => c.attempts > 0)
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 2);

  const urgentCount = (reviewTiming?.today.length ?? 0) + (reviewTiming?.overdue.length ?? 0);
  const todayTasks: { id: string; title: string; sub: string; href: string }[] = [];
  if (urgentCount > 0) {
    todayTasks.push({
      id: "review",
      title: `오답 복습 ${urgentCount}개`,
      sub: (reviewTiming?.overdue.length ?? 0) > 0
        ? `기간 지난 ${reviewTiming?.overdue.length ?? 0}개 포함 — 오늘 안에 복습하세요`
        : "오늘 복습하면 기억에 가장 효과적",
      href: "/chat?action=review",
    });
  }
  weakCats.forEach((c, i) => {
    todayTasks.push({
      id: `cat-${i}`,
      title: `${c.category} 문제 풀기`,
      sub: `정답률 ${Math.round(c.accuracy * 100)}%${i === 0 ? " — 가장 취약한 카테고리" : ""}`,
      href: `/chat?category=${encodeURIComponent(c.category)}`,
    });
  });

  return (
    <div className="h-[100dvh] overflow-hidden flex flex-col md:flex-row">

      {/* 신규 가입 웰컴 모달 */}
      {showWelcomeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white w-full max-w-sm mx-4 overflow-hidden shadow-xl">
            <div className="px-7 py-6" style={{ background: "#818cf8" }}>
              <p className="text-xs font-bold text-indigo-200 uppercase tracking-widest mb-2">SQLD AI 튜터</p>
              <h2 className="text-2xl font-black text-white leading-snug">가입을 환영해요!</h2>
              <p className="text-sm text-indigo-200 mt-1.5">먼저 AI가 실력을 진단해드릴게요.</p>
            </div>
            <div className="px-7 py-6 space-y-4">
              <div className="space-y-2.5">
                {[
                  { icon: "①", text: "8문제로 카테고리별 실력을 진단해요" },
                  { icon: "②", text: "진단 결과를 바탕으로 맞춤 문제를 출제해요" },
                  { icon: "③", text: "취약한 부분은 AI가 개념까지 설명해줘요" },
                ].map(({ icon, text }) => (
                  <div key={icon} className="flex items-start gap-3">
                    <span className="text-indigo-500 font-bold text-sm shrink-0 w-5">{icon}</span>
                    <p className="text-sm text-stone-600 leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>
              <Link
                href="/chat?new=true"
                className="block w-full bg-indigo-500 text-white text-center py-3 text-sm font-bold tracking-wide hover:bg-indigo-600 transition-colors"
              >
                진단 시작하기
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 계정 설정 모달 */}
      {showAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white w-full max-w-sm mx-4 overflow-hidden shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
              <h2 className="text-base font-semibold text-stone-800">계정 설정</h2>
              <button
                onClick={() => { setShowAccountModal(false); setPwMsg(null); setDeleteConfirm(false); setNewPassword(""); setConfirmPassword(""); }}
                className="text-stone-400 hover:text-stone-600"
              >
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
                className="w-full border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="비밀번호 확인"
                className="w-full border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              {pwMsg && (
                <p className={`text-xs ${pwMsg.type === "success" ? "text-green-600" : "text-red-500"}`}>{pwMsg.text}</p>
              )}
              <button
                onClick={handlePasswordChange}
                disabled={pwLoading}
                className="w-full bg-indigo-500 text-white py-2 text-sm font-semibold hover:bg-indigo-600 disabled:opacity-40 transition-colors"
              >
                {pwLoading ? "변경 중..." : "비밀번호 변경"}
              </button>
            </div>
            <div className="px-6 py-4 border-t border-stone-100">
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-3">위험 구역</p>
              {!deleteConfirm ? (
                <button
                  onClick={() => setDeleteConfirm(true)}
                  className="w-full border border-red-200 text-red-500 py-2 text-sm hover:bg-red-50 transition-colors"
                >
                  회원 탈퇴
                </button>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-red-500">모든 학습 기록이 삭제됩니다. 정말 탈퇴하시겠습니까?</p>
                  <div className="flex gap-2">
                    <button onClick={() => setDeleteConfirm(false)} className="flex-1 border border-stone-200 text-stone-500 py-2 text-sm hover:bg-stone-50 transition-colors">취소</button>
                    <button onClick={handleDeleteAccount} disabled={deleteLoading} className="flex-1 bg-red-500 text-white py-2 text-sm hover:bg-red-600 disabled:opacity-40 transition-colors">
                      {deleteLoading ? "처리 중..." : "탈퇴 확인"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 시험일 설정 모달 */}
      {showExamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white w-full max-w-sm mx-4 overflow-hidden shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
              <h2 className="text-base font-semibold text-stone-800">시험일 설정</h2>
              <button
                onClick={() => setShowExamModal(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <p className="text-sm text-stone-500">시험 날짜를 설정하면 D-day가 자동으로 표시됩니다.</p>
              <input
                type="date"
                value={examDateInput}
                onChange={(e) => setExamDateInput(e.target.value)}
                className="w-full border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <button
                onClick={handleSaveExamDate}
                disabled={examSaving || !examDateInput}
                className="w-full bg-indigo-500 text-white py-2 text-sm font-semibold hover:bg-indigo-600 disabled:opacity-40 transition-colors"
              >
                {examSaving ? "저장 중..." : "저장"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 왼쪽 패널 (앰버) ── */}
      <div className="md:w-[42%] md:min-h-screen md:sticky md:top-0 md:max-h-screen md:overflow-y-auto flex flex-col p-7 md:p-10" style={{ background: "#dde1fb", color: "#1c1917" }}>

        {/* 앱 이름 + 계정 */}
        <div className="flex items-start justify-between mb-6 md:mb-0">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-7 h-7 bg-indigo-200 flex items-center justify-center shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
                </svg>
              </div>
              <span className="text-lg font-bold tracking-tight">SQLD AI 튜터</span>
            </div>
            <p className="text-sm pl-[36px]" style={{ color: "rgba(55,48,163,.6)" }}>SQL 자격증 합격을 위한 AI 튜터</p>
          </div>

          {/* 계정 드롭다운 */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown((v) => !v)}
              className="flex items-center gap-1.5 text-xs text-indigo-500 hover:text-indigo-900 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
              </svg>
              <span>내 계정</span>
            </button>
            {showDropdown && (
              <div className="absolute right-0 top-8 w-52 bg-white border border-stone-200 shadow-xl z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-stone-100">
                  <p className="text-xs text-stone-400 truncate">{userEmail}</p>
                </div>
                <button
                  onClick={() => { setShowDropdown(false); setShowAccountModal(true); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition-colors flex items-center gap-2"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                  계정 관리
                </button>
                <button
                  onClick={() => { setShowDropdown(false); setShowInquiryModal(true); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition-colors flex items-center gap-2"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                  문의하기
                </button>
                <button
                  onClick={() => { setShowDropdown(false); handleLogout(); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-stone-500 hover:bg-stone-50 transition-colors flex items-center gap-2 border-t border-stone-100"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  로그아웃
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 예상 점수 + D-day + 오늘 할 일 + 카테고리 */}
        <div className="flex flex-col flex-1 justify-center">
          {loading ? (
            <div className="space-y-4 animate-pulse">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="h-2 bg-indigo-200 w-16 mb-2.5" />
                  <div className="h-12 bg-indigo-200 w-20" />
                </div>
                <div>
                  <div className="h-2 bg-indigo-200 w-16 mb-2.5" />
                  <div className="h-12 bg-indigo-200 w-16" />
                </div>
              </div>
              <div className="h-1 bg-indigo-200 w-full" />
              <div className="mt-4 space-y-2">
                <div className="h-2 bg-indigo-200 w-20" />
                <div className="h-14 bg-indigo-200" />
                <div className="h-14 bg-indigo-200" />
              </div>
            </div>
          ) : (
            <>
              {/* ── V2: 빅타입 + 도트 세그먼트 ── */}
              <div className="w-full">
                {/* 점수 + D-day */}
                <div className="flex items-end justify-between mb-5">
                  <div>
                    <p className="font-bold uppercase mb-2" style={{ fontSize: "12px", letterSpacing: ".15em", color: "rgba(55,48,163,.55)" }}>예상 점수</p>
                    <div className="flex items-baseline gap-1">
                      <span className="font-black leading-[.85] tabular-nums" style={{ fontSize: "62px", letterSpacing: "-.07em", color: "#1e1b4b" }}>{predictedScore}</span>
                      <span className="text-lg font-semibold" style={{ color: "rgba(55,48,163,.38)" }}>점</span>
                    </div>
                    <p className={`text-xs font-bold mt-2 ${scoreDiff >= 0 ? "text-green-700" : "text-red-500"}`}>
                      목표까지 {scoreDiff >= 0 ? `+${scoreDiff}` : scoreDiff}점
                    </p>
                  </div>
                  <div className="text-right pb-1">
                    <div className="flex items-center justify-end gap-2 mb-1.5">
                      <p className="font-bold uppercase" style={{ fontSize: "12px", letterSpacing: ".12em", color: "rgba(55,48,163,.55)" }}>시험까지</p>
                      <button
                        onClick={() => { setExamDateInput(examDate); setShowExamModal(true); }}
                        className="text-indigo-400 hover:text-indigo-700 transition-colors"
                        title={dDayCount !== null ? "날짜 변경" : "날짜 설정"}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                    </div>
                    {dDayCount !== null ? (
                      <>
                        <p
                          className={`font-black leading-none tabular-nums ${
                            dDayCount === 0 ? "text-red-500" : dDayCount < 0 ? "text-stone-400" : "text-indigo-600"
                          }`}
                          style={{ fontSize: "38px", letterSpacing: "-.05em" }}
                        >
                          {dDayCount > 0 ? `D-${dDayCount}` : dDayCount === 0 ? "D-Day" : `D+${Math.abs(dDayCount)}`}
                        </p>
                        {streak > 0 && (
                          <p className="text-xs text-indigo-500 mt-1">🔥 {streak}일 연속</p>
                        )}
                      </>
                    ) : (
                      <button
                        onClick={() => { setExamDateInput(""); setShowExamModal(true); }}
                        className="text-sm font-medium text-indigo-500 hover:text-indigo-800 transition-colors mt-2"
                      >
                        날짜 설정 +
                      </button>
                    )}
                  </div>
                </div>

                {/* 구분선 */}
                <div className="h-px mb-4" style={{ background: "rgba(99,102,241,.18)" }} />

                {/* 도트 세그먼트 바 */}
                <div className="flex justify-between mb-2">
                  <span style={{ fontSize: "11px", fontWeight: 600, color: "rgba(55,48,163,.5)" }}>0점</span>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "rgba(55,48,163,.55)" }}>목표 {targetScore}점 ↓</span>
                  <span style={{ fontSize: "11px", fontWeight: 600, color: "rgba(55,48,163,.5)" }}>100점</span>
                </div>
                <div className="flex gap-[5px]">
                  {Array.from({ length: 10 }, (_, i) => {
                    const dotVal = (i + 1) * 10;
                    const isFilled = predictedScore >= dotVal;
                    const targetDot = Math.round(targetScore / 10);
                    const isTarget = i + 1 === targetDot && !isFilled;
                    return (
                      <div
                        key={i}
                        className="flex-1 rounded-full transition-all duration-500"
                        style={{
                          height: "9px",
                          ...(isFilled
                            ? { background: "linear-gradient(90deg, #3730a3, #818cf8)" }
                            : isTarget
                            ? { background: "transparent", outline: "2px solid rgba(55,48,163,.45)", outlineOffset: "2px" }
                            : { background: "rgba(99,102,241,.16)" }),
                        }}
                      />
                    );
                  })}
                </div>
              </div>

            </>
          )}
        </div>

        {/* 신뢰 문구 */}
        <p className="text-xs mt-auto pt-6 leading-relaxed" style={{ color: "rgba(55,48,163,.4)" }}>
          SQLD 합격자가 기출 경향을 분석해 제작한 문제은행
        </p>
      </div>

      {/* ── 오른쪽 패널 (흰색) ── */}
      <div className="bg-stone-50 flex-1 flex flex-col p-7 md:p-10">

        {/* ── 전체 2열 레이아웃 ── */}
        <div className="grid grid-cols-2 gap-8 flex-1">

          {/* ── 왼쪽: 바로 시작 ── */}
          <div className="flex flex-col gap-2.5">
            <p className="text-sm font-semibold text-stone-400 uppercase tracking-widest mb-1">바로 시작</p>

            {/* AI 학습 */}
            <Link
              href="/chat"
              className="flex flex-col bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-none p-5 hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className="w-9 h-9 bg-indigo-500 rounded-sm flex items-center justify-center mb-3 shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                </svg>
              </div>
              <p className="text-[15px] font-bold text-stone-900">AI 학습</p>
              <p className="text-sm text-indigo-500 mt-1">{totalAnswered}문제 풀이 중</p>
              <div className="mt-4">
                <span className="inline-flex items-center bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-full">
                  이어서 학습 →
                </span>
              </div>
            </Link>

            {/* 오답 회고 */}
            <Link
              href="/wrong-answers"
              className="flex flex-col bg-white border border-stone-100 rounded-none p-4 hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className="w-9 h-9 bg-red-500 rounded-sm flex items-center justify-center mb-3 shrink-0">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
              </div>
              <p className="text-[15px] font-bold text-stone-900">오답 회고</p>
              <p className={`text-sm mt-1 ${wrongCount > 0 ? "text-red-500 font-medium" : "text-stone-400"}`}>
                {wrongCount > 0 ? `${wrongCount}개 복습 필요` : "오답 없음"}
              </p>
              {wrongCount > 0 && (
                <div className="mt-2">
                  <span className="inline-flex items-center bg-red-50 text-red-600 text-xs font-bold px-3 py-1.5 rounded-full">
                    {wrongCount}개
                  </span>
                </div>
              )}
            </Link>

            {/* 모의고사 */}
            <Link
              href="/exam"
              className="flex flex-col bg-white border border-stone-100 rounded-none p-4 hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className="w-9 h-9 bg-indigo-400 rounded-sm flex items-center justify-center mb-3 shrink-0">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
              <p className="text-[15px] font-bold text-stone-900">모의고사</p>
              <p className="text-sm text-stone-400 mt-1">50문제 · 90분 · 실전 배점</p>
              <div className="mt-2">
                <span className="inline-flex items-center bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-full">
                  도전
                </span>
              </div>
            </Link>

            {/* 카테고리 정답률 — 레이더 차트 */}
            <div className="bg-white border border-stone-100 rounded-none p-5">
              <p className="text-[15px] font-bold text-stone-800 mb-3">카테고리 정답률</p>
              <div className="relative" style={{ minHeight: "220px" }}>
                <RadarChart catMap={catMap} />
              </div>
            </div>
          </div>

          {/* ── 오른쪽: 학습 캘린더 + 오늘 할 일 ── */}
          <div className="flex flex-col gap-4">

            {/* 학습 캘린더 카드 */}
            <div className="bg-white border border-stone-100 rounded-none p-5">
              <p className="text-[15px] font-bold text-stone-800 mb-4">학습 캘린더</p>

              {streak > 0 && (
                <div className="flex items-center gap-3 mb-4">
                  <span
                    style={{
                      display: "inline-flex", alignItems: "center", gap: "6px",
                      background: "linear-gradient(135deg,#4f46e5,#818cf8)",
                      color: "#fff", fontSize: "12px", fontWeight: 800, letterSpacing: ".04em",
                      padding: "5px 14px", borderRadius: "999px",
                    }}
                  >
                    🔥 <span style={{ fontSize: "17px", fontWeight: 900, letterSpacing: "-.5px" }}>{streak}</span>일 연속
                  </span>
                  <span className="text-xs text-stone-400 font-medium">어제도 학습했어요</span>
                </div>
              )}

              {calendarData ? (
                <CalendarHeatmap dates={calendarData.dates} />
              ) : (
                <div className="flex gap-2 animate-pulse">
                  {Array.from({ length: 14 }).map((_, wi) => (
                    <div key={wi} className="flex flex-col gap-2">
                      {Array.from({ length: 7 }).map((_, di) => (
                        <div key={di} className="w-3 h-3 bg-stone-100 rounded-sm" />
                      ))}
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-1.5 mt-3">
                <span style={{ fontSize: "10px", color: "#c4bfbb", fontWeight: 500, letterSpacing: ".03em" }}>적음</span>
                {["#f0edfb","#c7d2fe","#818cf8","#4f46e5"].map((c) => (
                  <div key={c} style={{ width: "11px", height: "11px", borderRadius: "2px", background: c }} />
                ))}
                <span style={{ fontSize: "10px", color: "#c4bfbb", fontWeight: 500, letterSpacing: ".03em" }}>많음</span>
              </div>
            </div>

            {/* 오늘 할 일 카드 — flex-1으로 남은 공간 채움 */}
            <div className="flex-1 bg-white border border-stone-100 rounded-none p-5">
              <p className="text-[15px] font-bold text-stone-800 mb-4">오늘 할 일</p>

              {todayTasks.length > 0 && (
                <div className="flex items-baseline gap-2 mb-5">
                  <span style={{ fontSize: "24px", fontWeight: 900, letterSpacing: "-.04em", color: "#1c1917" }}>
                    {todayTasks.length}
                  </span>
                  <span style={{ fontSize: "12px", color: "#a8a29e", fontWeight: 500 }}>가지 남았어요</span>
                </div>
              )}

              {todayTasks.length === 0 ? (
                <p style={{ fontSize: "13px", color: "#c4bfbb", fontWeight: 500, letterSpacing: ".01em", padding: "16px 0" }}>
                  문제를 풀면 맞춤 목표가 생성됩니다.
                </p>
              ) : (
                <div>
                  {todayTasks.map((task, i) => (
                    <div
                      key={task.id}
                      className="flex items-start gap-3.5"
                      style={{ padding: "13px 0", borderBottom: i < todayTasks.length - 1 ? "1px solid #f5f4f2" : "none" }}
                    >
                      <div
                        style={{
                          width: "20px", height: "20px", borderRadius: "6px", flexShrink: 0,
                          marginTop: "1px", fontSize: "10px", fontWeight: 800, letterSpacing: ".04em",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          background: task.id === "review" ? "#fff1f1" : "#eef2ff",
                          color: task.id === "review" ? "#f87171" : "#818cf8",
                        }}
                      >
                        {task.id === "review" ? "!" : String(i).padStart(2, "0")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p style={{ fontSize: "14px", fontWeight: 700, color: "#1c1917", letterSpacing: "-.01em", marginBottom: "2px" }}>
                          {task.title}
                        </p>
                        <p style={{ fontSize: "12px", color: "#a8a29e", fontWeight: 500 }}>{task.sub}</p>
                      </div>
                      <Link
                        href={task.href}
                        className="shrink-0 relative overflow-hidden group"
                        style={{
                          padding: "6px 14px",
                          fontSize: "10px", fontWeight: 800, letterSpacing: ".12em", textTransform: "uppercase",
                          color: "#fff",
                          background: task.id === "review" ? "#ef4444" : "#4f46e5",
                          display: "inline-block",
                          transition: "transform .15s, box-shadow .15s",
                        }}
                      >
                        시작
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

      </div>

      {/* 문의하기 모달 */}
      {showInquiryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white w-full max-w-sm mx-4 overflow-hidden shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
              <h2 className="text-base font-semibold text-stone-800">문의하기</h2>
              <button
                onClick={() => { setShowInquiryModal(false); setInquiryMsg(""); setInquiryResult(null); }}
                className="text-stone-400 hover:text-stone-600"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {inquiryResult ? (
                <div className={`text-sm px-4 py-3 ${inquiryResult.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                  {inquiryResult.text}
                </div>
              ) : (
                <p className="text-sm text-stone-500">버그, 기능 요청, 기타 문의 사항을 자유롭게 남겨주세요.</p>
              )}
              {!inquiryResult && (
                <textarea
                  value={inquiryMsg}
                  onChange={(e) => setInquiryMsg(e.target.value)}
                  placeholder="문의 내용을 입력해주세요."
                  rows={5}
                  className="w-full border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                />
              )}
              {inquiryResult?.type === "success" ? (
                <button
                  onClick={() => { setShowInquiryModal(false); setInquiryMsg(""); setInquiryResult(null); }}
                  className="w-full bg-stone-100 text-stone-700 py-2 text-sm font-semibold hover:bg-stone-200 transition-colors"
                >
                  닫기
                </button>
              ) : (
                <button
                  onClick={handleInquirySubmit}
                  disabled={inquiryLoading || !inquiryMsg.trim()}
                  className="w-full bg-indigo-500 text-white py-2 text-sm font-semibold hover:bg-indigo-600 disabled:opacity-40 transition-colors"
                >
                  {inquiryLoading ? "제출 중..." : "제출하기"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
