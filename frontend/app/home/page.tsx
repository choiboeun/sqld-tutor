"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getAuthHeaders } from "@/lib/api";
import BottomNav from "@/components/BottomNav";

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

export default function HomePage() {
  const [threadId, setThreadId] = useState<string | null>(null);
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
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data: authData }) => {
        if (!authData.user) { window.location.href = "/login"; return; }
        setThreadId(authData.user.id);
        setUserEmail(authData.user.email ?? "");
      });
  }, []);

  useEffect(() => {
    if (!threadId) return;
    (async () => {
      try {
        const res = await fetch(`/api/progress/${threadId}`, { headers: await getAuthHeaders() });
        if (res.ok) setData(await res.json());
      } catch {}
      finally { setLoading(false); }
    })();
  }, [threadId]);

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
  const weakCategories = (data?.weak_categories ?? []).slice(0, 3);

  const handleLogout = async () => {
    await createClient().auth.signOut();
    window.location.href = "/login";
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

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      const resp = await fetch("/account/delete", { method: "DELETE" });
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

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row pb-16 md:pb-0">

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
                className="w-full border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="비밀번호 확인"
                className="w-full border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              {pwMsg && (
                <p className={`text-xs ${pwMsg.type === "success" ? "text-green-600" : "text-red-500"}`}>{pwMsg.text}</p>
              )}
              <button
                onClick={handlePasswordChange}
                disabled={pwLoading}
                className="w-full bg-amber-600 text-white py-2 text-sm font-semibold hover:bg-amber-700 disabled:opacity-40 transition-colors"
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

      {/* ── 왼쪽 패널 (앰버) ── */}
      <div className="bg-amber-600 text-white md:w-[42%] md:min-h-screen md:sticky md:top-0 md:max-h-screen flex flex-col p-7 md:p-10">

        {/* 앱 이름 + 계정 */}
        <div className="flex items-start justify-between mb-6 md:mb-0">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-7 h-7 bg-white/20 flex items-center justify-center shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
                </svg>
              </div>
              <span className="text-lg font-bold tracking-tight">SQLD AI 튜터</span>
            </div>
            <p className="text-amber-200 text-xs pl-[36px]">SQL 자격증 합격을 위한 AI 튜터</p>
          </div>

          {/* 계정 드롭다운 */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown((v) => !v)}
              className="flex items-center gap-1.5 text-xs text-amber-200 hover:text-white transition-colors"
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

        {/* 점수 영역 */}
        <div className="flex-1 flex flex-col justify-center py-6 md:py-0">
          {loading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-3 bg-white/20 w-20" />
              <div className="h-20 bg-white/20 w-36" />
              <div className="h-1.5 bg-white/20 w-full" />
              <div className="grid grid-cols-3 gap-4 pt-4">
                <div className="h-8 bg-white/20" />
                <div className="h-8 bg-white/20" />
                <div className="h-8 bg-white/20" />
              </div>
            </div>
          ) : (
            <>
              <p className="text-xs font-semibold text-amber-300 uppercase tracking-widest mb-3">예상 점수</p>

              {/* 점수 + diff */}
              <div className="flex items-end justify-between mb-5">
                <div className="flex items-baseline gap-2">
                  <span className="text-7xl md:text-8xl font-black leading-none tabular-nums">{predictedScore}</span>
                  <span className="text-xl text-amber-300">/ 100점</span>
                </div>
                <div className="text-right mb-1">
                  <p className={`text-xl font-black leading-none ${scoreDiff >= 0 ? "text-white" : "text-amber-100"}`}>
                    {scoreDiff >= 0 ? `+${scoreDiff}` : scoreDiff}점
                  </p>
                  <p className="text-[11px] text-amber-300/80 mt-0.5">목표 {targetScore}점까지</p>
                </div>
              </div>

              {/* 3구간 진행 바 */}
              <div className="mb-8">
                <div className="relative h-1.5 w-full">
                  <div className="absolute inset-0 bg-white/15" />
                  <div
                    className="absolute top-0 left-0 h-full bg-white transition-all duration-700"
                    style={{ width: `${Math.min(predictedScore, 100)}%` }}
                  />
                  {scoreDiff < 0 && (
                    <div
                      className="absolute top-0 h-full bg-white/30"
                      style={{ left: `${predictedScore}%`, width: `${targetScore - predictedScore}%` }}
                    />
                  )}
                  <div
                    className="absolute w-px bg-amber-200"
                    style={{ left: `${targetScore}%`, top: '-4px', bottom: '-4px' }}
                  />
                </div>
                <div className="relative h-5 mt-1">
                  <span
                    className="absolute -translate-x-1/2 text-[10px] text-amber-300 whitespace-nowrap"
                    style={{ left: `${targetScore}%` }}
                  >
                    목표 {targetScore}
                  </span>
                </div>
              </div>

              {/* 통계 미니 카드 */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-black/10 px-3 py-2.5">
                  <p className="text-2xl font-bold tabular-nums leading-none">{totalAnswered}</p>
                  <p className="text-[10px] text-amber-300 mt-1.5 uppercase tracking-wide">총 풀이</p>
                </div>
                <div className="bg-black/10 px-3 py-2.5">
                  <p className={`text-2xl font-bold tabular-nums leading-none ${streak > 0 ? "text-green-300" : ""}`}>{streak}</p>
                  <p className="text-[10px] text-amber-300 mt-1.5 uppercase tracking-wide">연속 정답</p>
                </div>
                <div className="bg-black/10 px-3 py-2.5">
                  <p className={`tabular-nums leading-none font-black ${wrongCount > 0 ? "text-3xl text-red-300" : "text-2xl"}`}>{wrongCount}</p>
                  <p className={`text-[10px] mt-1.5 uppercase tracking-wide ${wrongCount > 0 ? "text-red-300" : "text-amber-300"}`}>오답</p>
                </div>
              </div>

              {totalAnswered === 0 && (
                <p className="text-amber-300/70 text-xs mt-5">문제를 풀면 예상 점수가 계산됩니다.</p>
              )}
            </>
          )}
        </div>

        {/* 신뢰 문구 */}
        <p className="text-[11px] text-white/40 mt-auto pt-6 leading-relaxed">
          SQLD 합격자가 기출 경향을 분석해 제작한 문제은행
        </p>
      </div>

      {/* ── 오른쪽 패널 (흰색) ── */}
      <div className="bg-stone-50 flex-1 flex flex-col p-7 md:p-10">

        {/* 바로 시작 */}
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-1">바로 시작</p>

        <div className="flex flex-col border-t border-stone-200 mt-3">
          {/* AI 학습 */}
          <Link
            href="/chat"
            className="flex items-center justify-between py-5 border-b border-stone-200 hover:bg-stone-100 -mx-2 px-2 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-amber-50 flex items-center justify-center shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-stone-900">AI 학습</p>
                <p className="text-xs text-stone-400 mt-0.5">{totalAnswered}문제 풀이 중</p>
              </div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 group-hover:translate-x-0.5 transition-transform">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Link>

          {/* 오답 회고 */}
          <Link
            href="/wrong-answers"
            className="flex items-center justify-between py-5 border-b border-stone-200 hover:bg-stone-100 -mx-2 px-2 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-red-50 flex items-center justify-center shrink-0 relative">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
                {wrongCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[14px] h-3.5 bg-red-500 text-white text-[9px] font-bold flex items-center justify-center px-1">
                    {wrongCount}
                  </span>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-stone-900">오답 회고</p>
                <p className={`text-xs mt-0.5 ${wrongCount > 0 ? "text-red-500 font-medium" : "text-stone-400"}`}>
                  {wrongCount > 0 ? `${wrongCount}개 복습 필요` : "오답 없음"}
                </p>
              </div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-stone-400 shrink-0 group-hover:translate-x-0.5 transition-transform">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Link>

          {/* 모의고사 */}
          <Link
            href="/exam"
            className="flex items-center justify-between py-5 border-b border-stone-200 hover:bg-stone-100 -mx-2 px-2 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-stone-100 flex items-center justify-center shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#78716c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="0"/><line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-stone-900">모의고사</p>
                <p className="text-xs text-stone-400 mt-0.5">50문제 · 90분 · 실전 배점</p>
              </div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-stone-400 shrink-0 group-hover:translate-x-0.5 transition-transform">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Link>
        </div>

        {/* 집중 복습 필요 */}
        {!loading && weakCategories.length > 0 && (
          <div className="mt-8">
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-3">집중 복습 필요</p>
            <div className="flex flex-col gap-2">
              {weakCategories.map(({ category, accuracy }) => (
                <Link
                  key={category}
                  href="/chat"
                  className="flex items-center justify-between px-3 py-3 bg-white border border-stone-200 hover:border-amber-400 transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-red-400 shrink-0" />
                    <span className="text-sm text-stone-700 font-medium">{category}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold text-red-500 tabular-nums">{Math.round(accuracy * 100)}%</span>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-stone-300 group-hover:text-amber-500 transition-colors">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 로딩 스켈레톤 */}
        {loading && (
          <div className="mt-3 space-y-0 animate-pulse">
            {[1,2,3].map((i) => (
              <div key={i} className="flex items-center gap-3 py-5 border-b border-stone-200">
                <div className="w-9 h-9 bg-stone-200 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 bg-stone-200 w-20" />
                  <div className="h-2.5 bg-stone-100 w-28" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
