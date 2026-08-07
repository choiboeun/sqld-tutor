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
  "SELECT & WHERE":         0.80 / 9,
  "함수":                   0.80 / 9,
  "GROUP BY & ORDER BY":    0.80 / 9,
  "조인":                   0.80 / 9,
  "서브쿼리 & Top N":       0.80 / 9,
  "집합 연산자 & 그룹 함수": 0.80 / 9,
  "윈도우 함수":            0.80 / 9,
  "SQL 활용 기타":          0.80 / 9,
  "관리 구문":              0.80 / 9,
};

const SHORT_NAMES: Record<string, string> = {
  "데이터 모델링 기초": "데이터 모델링",
  "데이터 모델과 SQL": "모델과 SQL",
  "GROUP BY & ORDER BY": "GROUP/ORDER BY",
  "서브쿼리 & Top N": "서브쿼리/Top N",
  "집합 연산자 & 그룹 함수": "집합/그룹 함수",
};

function shortName(cat: string) {
  return SHORT_NAMES[cat] ?? cat;
}

export default function HomePage() {
  const [threadId, setThreadId] = useState<string | null>(null);
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data: authData }) => {
        if (!authData.user) {
          window.location.href = "/login";
          return;
        }
        setThreadId(authData.user.id);
        setUserEmail(authData.user.email ?? "");
      });
  }, []);

  useEffect(() => {
    if (!threadId) return;
    (async () => {
      try {
        const res = await fetch(`/api/progress/${threadId}`, {
          headers: await getAuthHeaders(),
        });
        if (res.ok) setData(await res.json());
      } catch {}
      finally { setLoading(false); }
    })();
  }, [threadId]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
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
  const attemptedCount = ALL_CATEGORIES.filter((c) => (catMap[c]?.attempts ?? 0) > 0).length;

  const weakCategories = (data?.weak_categories ?? []).slice(0, 3);

  const sortedCats = [
    ...ALL_CATEGORIES
      .filter((c) => (catMap[c]?.attempts ?? 0) > 0)
      .sort((a, b) => (catMap[a]?.accuracy ?? 0) - (catMap[b]?.accuracy ?? 0)),
    ...ALL_CATEGORIES.filter((c) => (catMap[c]?.attempts ?? 0) === 0),
  ];

  const handleLogout = async () => {
    await createClient().auth.signOut();
    window.location.href = "/login";
  };

  return (
    <div className="min-h-[100dvh] bg-stone-50 pb-20 md:pb-8">
      {/* 헤더 */}
      <header className="bg-white border-b border-stone-100 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-5 h-14 flex items-center justify-between">
          {/* 로고 */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-amber-500 rounded-lg flex items-center justify-center shrink-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
              </svg>
            </div>
            <span className="text-base font-bold text-stone-900 tracking-tight">SQLD AI 튜터</span>
          </div>

          {/* 데스크톱 네비게이션 */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/chat"
              className="px-3 py-1.5 text-sm text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors font-medium"
            >
              AI 학습
            </Link>
            <Link
              href="/wrong-answers"
              className="px-3 py-1.5 text-sm text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors font-medium"
            >
              오답 회고
            </Link>
          </nav>

          {/* 계정 드롭다운 */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown((v) => !v)}
              className="flex items-center gap-1.5 text-sm text-stone-400 hover:text-stone-700 transition-colors"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
              </svg>
              <span className="hidden sm:inline">내 계정</span>
            </button>
            {showDropdown && (
              <div className="absolute right-0 top-10 w-52 bg-white border border-stone-200 rounded-xl shadow-lg z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-stone-100">
                  <p className="text-xs text-stone-400 truncate">{userEmail}</p>
                </div>
                <Link
                  href="/chat"
                  onClick={() => setShowDropdown(false)}
                  className="w-full text-left px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition-colors flex items-center gap-2"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                  AI 학습하러 가기
                </Link>
                <button
                  onClick={() => { setShowDropdown(false); handleLogout(); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-stone-500 hover:bg-stone-50 transition-colors flex items-center gap-2 border-t border-stone-100"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  로그아웃
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-5 space-y-4">

        {/* 예상 점수 카드 */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
          {loading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-12 bg-stone-100 rounded-xl w-1/3" />
              <div className="h-2 bg-stone-100 rounded-full" />
              <div className="grid grid-cols-3 gap-3">
                <div className="h-12 bg-stone-100 rounded-xl" />
                <div className="h-12 bg-stone-100 rounded-xl" />
                <div className="h-12 bg-stone-100 rounded-xl" />
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between mb-1">
                <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest">예상 점수</p>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  scoreDiff >= 0
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-500"
                }`}>
                  목표 {targetScore}점 {scoreDiff >= 0 ? `+${scoreDiff}점` : `${scoreDiff}점`}
                </span>
              </div>
              <div className="flex items-end gap-2 mb-3">
                <span className="text-5xl font-bold text-stone-900 leading-none">{predictedScore}</span>
                <span className="text-base text-stone-400 mb-1">/ 100점</span>
              </div>
              <div className="h-2 bg-stone-100 rounded-full overflow-hidden mb-4">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(predictedScore, 100)}%` }}
                />
              </div>
              {totalAnswered === 0 && (
                <p className="text-xs text-stone-400 mb-3">문제를 풀면 예상 점수가 계산됩니다.</p>
              )}
              <div className="grid grid-cols-3 gap-3 pt-1 border-t border-stone-100">
                <div className="text-center pt-3">
                  <p className="text-2xl font-bold text-stone-800">{totalAnswered}</p>
                  <p className="text-xs text-stone-400 mt-0.5">총 풀이</p>
                </div>
                <div className="text-center pt-3 border-x border-stone-100">
                  <p className={`text-2xl font-bold ${streak > 0 ? "text-green-600" : "text-stone-800"}`}>{streak}</p>
                  <p className="text-xs text-stone-400 mt-0.5">연속 정답</p>
                </div>
                <div className="text-center pt-3">
                  <p className="text-2xl font-bold text-stone-800">{attemptedCount}<span className="text-base text-stone-400 font-normal">/11</span></p>
                  <p className="text-xs text-stone-400 mt-0.5">카테고리</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* 기능 카드 3개 */}
        <div className="grid grid-cols-3 gap-3">
          {/* AI 학습 */}
          <Link
            href="/chat"
            className="group bg-white rounded-2xl border border-stone-100 shadow-sm p-4 hover:border-amber-200 hover:shadow-md transition-all"
          >
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center mb-3 group-hover:bg-amber-100 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
              </svg>
            </div>
            <p className="text-sm font-semibold text-stone-800 mb-0.5">AI 학습</p>
            <p className="text-xs text-stone-400 leading-relaxed">{totalAnswered}문제 풀이</p>
            <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-amber-600 group-hover:gap-2 transition-all">
              시작하기
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
          </Link>

          {/* 모의고사 — 준비중 */}
          <div className="relative bg-white rounded-2xl border border-stone-100 shadow-sm p-4 opacity-60 select-none overflow-hidden">
            <div className="absolute top-2.5 right-2.5 px-1.5 py-0.5 bg-stone-100 rounded-md text-[9px] text-stone-400 font-semibold uppercase tracking-wide">
              준비중
            </div>
            <div className="w-10 h-10 bg-stone-50 rounded-xl flex items-center justify-center mb-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a8a29e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <p className="text-sm font-semibold text-stone-600 mb-0.5">모의고사</p>
            <p className="text-xs text-stone-400 leading-relaxed">50문제 · 90분</p>
          </div>

          {/* 오답 회고 */}
          <Link
            href="/wrong-answers"
            className="group bg-white rounded-2xl border border-stone-100 shadow-sm p-4 hover:border-red-200 hover:shadow-md transition-all"
          >
            <div className="relative w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center mb-3 group-hover:bg-red-100 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
              {wrongCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1">
                  {wrongCount}
                </span>
              )}
            </div>
            <p className="text-sm font-semibold text-stone-800 mb-0.5">오답 회고</p>
            <p className={`text-xs leading-relaxed ${wrongCount > 0 ? "text-red-500 font-medium" : "text-stone-400"}`}>
              {wrongCount > 0 ? `${wrongCount}개 복습 필요` : "오답 없음"}
            </p>
            <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-red-500 group-hover:gap-2 transition-all">
              복습하기
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
          </Link>
        </div>

        {/* 오늘의 집중 추천 */}
        {!loading && weakCategories.length > 0 && (
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
            <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-3">집중 복습 필요</h2>
            <div className="space-y-2">
              {weakCategories.map(({ category, accuracy }) => (
                <Link
                  key={category}
                  href="/chat"
                  className="flex items-center justify-between p-3 rounded-xl bg-stone-50 hover:bg-amber-50 border border-transparent hover:border-amber-100 transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                    <span className="text-sm text-stone-700 font-medium">{category}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold text-red-500">{Math.round(accuracy * 100)}%</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-stone-300 group-hover:text-amber-500 transition-colors">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 카테고리별 정답률 */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
          <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-4">카테고리별 정답률</h2>
          {loading ? (
            <div className="space-y-3 animate-pulse">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between">
                    <div className="h-3 bg-stone-100 rounded w-24" />
                    <div className="h-3 bg-stone-100 rounded w-8" />
                  </div>
                  <div className="h-1.5 bg-stone-100 rounded-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3.5">
              {sortedCats.map((cat) => {
                const stat = catMap[cat];
                const tried = (stat?.attempts ?? 0) > 0;
                const acc = stat?.accuracy ?? 0;
                return (
                  <div key={cat}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className={tried ? "text-stone-700 font-medium" : "text-stone-400"}>
                        {shortName(cat)}
                      </span>
                      <span className={tried ? "font-semibold text-stone-600" : "text-stone-300"}>
                        {tried ? `${Math.round(acc * 100)}%` : "미학습"}
                      </span>
                    </div>
                    <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                      {tried && (
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            acc < 0.4 ? "bg-red-400" : acc < 0.7 ? "bg-amber-400" : "bg-green-400"
                          }`}
                          style={{ width: acc === 0 ? "3px" : `${acc * 100}%` }}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 하단 여백 (데스크톱) */}
        <div className="h-2" />
      </main>

      <BottomNav />
    </div>
  );
}
