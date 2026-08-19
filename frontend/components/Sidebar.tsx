"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
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

export interface LiveStats {
  accuracy_by_category: Record<string, number>;
  attempts_by_category: Record<string, number>;
  total_answered: number;
  streak: number;
}

interface Props {
  threadId: string | null;
  refresh: number;
  liveStats?: LiveStats | null;
  onStatsRefreshed?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
  highlightHome?: boolean;
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

const SHORT_NAMES: Record<string, string> = {
  "데이터 모델링 기초": "데이터 모델링",
  "데이터 모델과 SQL": "모델과 SQL",
  "GROUP BY & ORDER BY": "GROUP/ORDER BY",
  "서브쿼리 & Top N": "서브쿼리/Top N",
  "집합 연산자 & 그룹 함수": "집합/그룹 함수",
  "SQL 활용 기타": "SQL 활용 기타",
};

function shortName(cat: string): string {
  return SHORT_NAMES[cat] ?? cat;
}

const RING_R = 50;
const CIRCUMFERENCE = 2 * Math.PI * RING_R;

export default function Sidebar({ threadId, refresh, liveStats, onStatsRefreshed, isOpen = false, onClose, highlightHome = false }: Props) {
  const [data, setData] = useState<ProgressData | null>(null);

  useEffect(() => {
    if (!threadId) return;
    (async () => {
      try {
        const res = await fetch(`/api/progress/${threadId}`, { headers: await getAuthHeaders() });
        const d = await res.json();
        setData(d);
        onStatsRefreshed?.();
      } catch {}
    })();
  }, [threadId, refresh, onStatsRefreshed]);

  const catMap: Record<string, CategoryStat> = liveStats
    ? Object.fromEntries(
        ALL_CATEGORIES.map((cat) => [
          cat,
          {
            accuracy: liveStats.accuracy_by_category[cat] ?? 0,
            attempts: liveStats.attempts_by_category[cat] ?? 0,
          },
        ])
      )
    : (data?.accuracy_by_category ?? {});

  const totalAnswered = Math.max(liveStats?.total_answered ?? 0, data?.total_answered ?? 0);
  const streak = liveStats?.streak ?? data?.streak ?? 0;
  const targetScore = data?.target_score ?? 70;

  const predictedScore = Math.round(
    ALL_CATEGORIES.reduce((sum, cat) => {
      const acc = catMap[cat]?.accuracy ?? 0;
      return sum + acc * (CATEGORY_WEIGHTS[cat] ?? 0);
    }, 0) * 100
  );
  const scoreDiff = predictedScore - targetScore;
  const dashOffset = CIRCUMFERENCE * (1 - Math.min(predictedScore, 100) / 100);

  const sortedCats = [
    ...ALL_CATEGORIES
      .filter((c) => (catMap[c]?.attempts ?? 0) > 0)
      .sort((a, b) => (catMap[a]?.accuracy ?? 0) - (catMap[b]?.accuracy ?? 0)),
    ...ALL_CATEGORIES.filter((c) => (catMap[c]?.attempts ?? 0) === 0),
  ];

  const asideClass = "flex flex-col bg-[#fafafa] overflow-y-auto";

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={onClose}
        />
      )}
      <aside className={
        isOpen
          ? `fixed inset-y-0 left-0 z-40 w-64 ${asideClass} md:relative md:shrink-0`
          : `hidden md:flex md:flex-col md:w-64 md:shrink-0 ${asideClass}`
      }>

        {/* Logo */}
        <div className="px-5 h-[80px] flex flex-col justify-center gap-1.5 border-b border-violet-200 bg-[#dde1fb]">
          <Link
            href="/home"
            onClick={onClose}
            className={`inline-flex items-center gap-1 text-xs transition-colors ${
              highlightHome
                ? "text-indigo-700 font-semibold"
                : "text-indigo-500 hover:text-indigo-600"
            }`}
          >
            ← 홈으로
            {highlightHome && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse ml-0.5" />}
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Image src="/icons/icon-192.png" alt="SQLD AI 튜터" width={24} height={24} className="shrink-0 rounded-md" />
              <span className="text-sm font-bold text-stone-800">SQLD AI 튜터</span>
            </div>
            <button
              onClick={onClose}
              className="md:hidden text-stone-400 hover:text-stone-600 transition-colors p-1"
              aria-label="닫기"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="flex flex-col flex-1 border-r border-violet-200 overflow-y-auto">

        {/* 예상 점수 — 링 게이지 */}
        <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-violet-200">
          <div className="relative flex-shrink-0">
            <svg width="120" height="120" viewBox="0 0 120 120">
              {/* track */}
              <circle
                cx="60" cy="60" r={RING_R}
                fill="none" stroke="#ede9fe" strokeWidth="8"
                strokeDasharray={CIRCUMFERENCE}
              />
              {/* fill */}
              <circle
                cx="60" cy="60" r={RING_R}
                fill="none"
                stroke="url(#scoreGrad)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={dashOffset}
                transform="rotate(-90 60 60)"
              />
              <defs>
                <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#a5b4fc" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-black text-stone-900 leading-none">{predictedScore}</span>
              <span className="text-[10px] font-semibold text-violet-300 tracking-wide">/ 100</span>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">예상 점수</p>
            <p className="text-base font-bold text-indigo-600 mb-1.5">목표 {targetScore}점</p>
            <p className={`text-xs font-bold ${scoreDiff >= 0 ? "text-indigo-500" : "text-amber-500"}`}>
              {scoreDiff >= 0 ? `+${scoreDiff}점 달성` : `${Math.abs(scoreDiff)}점 부족`}
            </p>
            {totalAnswered === 0 && (
              <p className="text-[8px] text-stone-400 mt-1">문제를 풀면 계산됩니다</p>
            )}
          </div>
        </div>

        {/* 풀이수 + 연속정답 */}
        <div className="grid grid-cols-2 border-b border-violet-200">
          <div className="px-3 py-3 text-center border-r border-violet-200">
            <p className="text-lg font-bold text-stone-800">{totalAnswered}문제</p>
            <p className="text-xs text-stone-400 mt-0.5">풀이 수</p>
          </div>
          <div className="px-3 py-3 text-center">
            <p className={`text-lg font-bold ${streak > 0 ? "text-indigo-600" : "text-stone-800"}`}>{streak}개</p>
            <p className="text-xs text-stone-400 mt-0.5">연속 정답</p>
          </div>
        </div>

        {/* 카테고리별 정답률 */}
        <div className="px-5 py-4 flex-1">
          <h3 className="text-[8px] font-bold text-violet-300 uppercase tracking-widest mb-3">
            카테고리 정답률
          </h3>
          <div className="space-y-3">
            {sortedCats.map((cat) => {
              const stat = catMap[cat];
              const tried = (stat?.attempts ?? 0) > 0;
              const acc = stat?.accuracy ?? 0;
              const dotColor = !tried ? "bg-stone-200"
                : acc < 0.4 ? "bg-amber-400"
                : acc < 0.7 ? "bg-amber-300"
                : "bg-indigo-500";
              const pctColor = !tried ? "text-stone-300"
                : acc < 0.4 ? "text-amber-600 font-semibold"
                : acc < 0.7 ? "text-amber-500 font-semibold"
                : "text-indigo-600 font-semibold";
              const barColor = acc < 0.4
                ? "bg-gradient-to-r from-amber-400 to-amber-300"
                : acc < 0.7
                ? "bg-gradient-to-r from-amber-300 to-yellow-200"
                : "bg-gradient-to-r from-indigo-500 to-indigo-400";
              return (
                <div key={cat} title={cat}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
                    <span className={`truncate text-xs font-medium flex-1 ${tried ? "text-stone-700" : "text-stone-400"}`}>
                      {shortName(cat)}
                    </span>
                    <span className={`text-xs shrink-0 tabular-nums ${pctColor}`}>
                      {tried ? `${Math.round(acc * 100)}%` : "—"}
                    </span>
                  </div>
                  <div className="h-1 bg-violet-50 rounded-full overflow-hidden">
                    {tried && acc > 0 && (
                      <div
                        className={`h-full rounded-full transition-all ${barColor}`}
                        style={{ width: `${acc * 100}%` }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 오답 회고 */}
        <Link
          href="/wrong-answers"
          className="flex items-center justify-between w-full px-5 py-3 bg-white hover:bg-indigo-50 transition-colors text-stone-700 border-t border-violet-200 hover:text-indigo-700"
          onClick={onClose}
        >
          <span className="text-sm font-medium">오답 회고</span>
          {data?.wrong_count != null && data.wrong_count > 0 && (
            <span className="text-xs bg-amber-500 text-white px-2 py-0.5 font-semibold">
              {data.wrong_count}개
            </span>
          )}
        </Link>

        {totalAnswered === 0 && (
          <p className="text-xs text-stone-400 text-center py-3">
            문제를 풀면<br />통계가 표시됩니다.
          </p>
        )}

        </div>
      </aside>
    </>
  );
}
