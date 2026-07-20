"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
}

const ALL_CATEGORIES = [
  "데이터 모델링 기초", "데이터 모델과 SQL", "SELECT & WHERE",
  "함수", "GROUP BY & ORDER BY", "조인",
  "서브쿼리 & Top N", "집합 연산자 & 그룹 함수",
  "윈도우 함수", "SQL 활용 기타", "관리 구문",
];

// SQLD 실제 배점: 1과목 20점(10문제), 2과목 80점(40문제) / 총 100점
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
  "SQL 활용 기타": "SQL 활용 기타",
};

function shortName(cat: string): string {
  return SHORT_NAMES[cat] ?? cat;
}

export default function Sidebar({ threadId, refresh, liveStats, onStatsRefreshed, isOpen = false, onClose }: Props) {
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
  }, [threadId, refresh]);

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
  const attemptedCount = ALL_CATEGORIES.filter((c) => (catMap[c]?.attempts ?? 0) > 0).length;
  const totalAnswered = liveStats?.total_answered ?? data?.total_answered ?? 0;
  const streak = liveStats?.streak ?? data?.streak ?? 0;
  const targetScore = data?.target_score ?? 70;

  const predictedScore = Math.round(
    ALL_CATEGORIES.reduce((sum, cat) => {
      const acc = catMap[cat]?.accuracy ?? 0;
      return sum + acc * (CATEGORY_WEIGHTS[cat] ?? 0);
    }, 0) * 100
  );
  const scoreDiff = predictedScore - targetScore;

  const sortedCats = [
    ...ALL_CATEGORIES
      .filter((c) => (catMap[c]?.attempts ?? 0) > 0)
      .sort((a, b) => (catMap[a]?.accuracy ?? 0) - (catMap[b]?.accuracy ?? 0)),
    ...ALL_CATEGORIES.filter((c) => (catMap[c]?.attempts ?? 0) === 0),
  ];

  const weakCategories = liveStats
    ? ALL_CATEGORIES
        .filter((cat) => (liveStats.attempts_by_category[cat] ?? 0) >= 1 && (liveStats.accuracy_by_category[cat] ?? 1) < 0.6)
        .map((cat) => ({ category: cat, accuracy: liveStats.accuracy_by_category[cat] ?? 0 }))
        .sort((a, b) => a.accuracy - b.accuracy)
        .slice(0, 3)
    : (data?.weak_categories ?? []);

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
          ? "fixed inset-y-0 left-0 z-40 w-64 flex flex-col bg-white border-r border-stone-200 p-5 gap-5 overflow-y-auto md:relative md:shrink-0"
          : "hidden md:flex md:flex-col md:w-64 md:shrink-0 bg-white border-r border-stone-200 p-5 gap-5 overflow-y-auto"
      }>
      <div>
        <h2 className="text-xs font-semibold tracking-widest text-stone-400 uppercase mb-3">학습 현황</h2>

        {/* 예상 점수 */}
        <div className="bg-amber-50 rounded-xl px-4 py-3 mb-3 border border-amber-100">
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="text-xs text-amber-700 font-semibold">예상 점수</span>
            <span className={`text-xs font-semibold ${scoreDiff >= 0 ? "text-green-600" : "text-red-500"}`}>
              목표 {targetScore}점 {scoreDiff >= 0 ? `+${scoreDiff}` : scoreDiff}점
            </span>
          </div>
          <div className="flex items-end gap-1.5">
            <span className="text-3xl font-bold text-amber-800 leading-none">{predictedScore}</span>
            <span className="text-sm text-amber-400 mb-0.5">/ 100점</span>
          </div>
          <div className="mt-2 h-1.5 bg-amber-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all"
              style={{ width: `${Math.min(predictedScore, 100)}%` }}
            />
          </div>
          {totalAnswered === 0 && (
            <p className="text-xs text-amber-400 mt-1.5">문제를 풀면 점수가 계산됩니다</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <StatCard label="풀이 수" value={`${totalAnswered}문제`} />
          <StatCard
            label="연속 정답"
            value={`${streak}개`}
            color={streak > 0 ? "text-green-600" : "text-stone-500"}
          />
        </div>

        {/* 전체 진행률 */}
        <div className="bg-stone-50 rounded-xl px-3 py-2 border border-stone-100">
          <div className="flex justify-between text-xs text-stone-600 mb-1">
            <span>학습 진행</span>
            <span className="font-medium">{attemptedCount} / 11 카테고리</span>
          </div>
          <div className="h-2 bg-stone-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all"
              style={{ width: `${(attemptedCount / 11) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* 카테고리별 정답률 */}
      <div>
        <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-2">
          카테고리별 정답률
        </h3>
        <div className="space-y-2.5">
          {sortedCats.map((cat) => {
            const stat = catMap[cat];
            const tried = (stat?.attempts ?? 0) > 0;
            const acc = stat?.accuracy ?? 0;
            return (
              <div key={cat} title={cat}>
                <div className="flex justify-between text-xs mb-0.5">
                  <span className={`truncate max-w-[130px] ${tried ? "text-stone-700" : "text-stone-400"}`}>
                    {shortName(cat)}
                  </span>
                  <span className={tried ? "text-stone-600 shrink-0 ml-1 font-medium" : "text-stone-300 shrink-0 ml-1"}>
                    {tried ? `${Math.round(acc * 100)}%` : "미학습"}
                  </span>
                </div>
                <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                  {tried ? (
                    <div
                      className={`h-full rounded-full transition-all ${
                        acc < 0.4 ? "bg-red-400" :
                        acc < 0.7 ? "bg-amber-400" : "bg-green-400"
                      }`}
                      style={{ width: acc === 0 ? "4px" : `${acc * 100}%` }}
                    />
                  ) : (
                    <div className="h-full w-0" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 취약 카테고리 */}
      {weakCategories.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-2">
            집중 복습 필요
          </h3>
          <ul className="space-y-1.5">
            {weakCategories.map(({ category, accuracy }) => (
              <li key={category} className="flex items-center gap-2 text-xs text-red-600">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                <span className="truncate" title={category}>{shortName(category)}</span>
                <span className="ml-auto shrink-0 font-semibold">{Math.round(accuracy * 100)}%</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 오답 회고 버튼 */}
      <Link
        href="/wrong-answers"
        className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 transition-colors text-red-600 border border-red-100"
        onClick={onClose}
      >
        <span className="text-sm font-medium">오답 회고</span>
        {data?.wrong_count != null && data.wrong_count > 0 && (
          <span className="text-xs bg-red-200 text-red-700 rounded-full px-2 py-0.5 font-semibold">
            {data.wrong_count}개
          </span>
        )}
      </Link>

      {totalAnswered === 0 && (
        <p className="text-xs text-stone-400 text-center mt-2">
          문제를 풀면<br />통계가 표시됩니다.
        </p>
      )}
    </aside>
    </>
  );
}

function StatCard({
  label,
  value,
  color = "text-stone-800",
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="bg-stone-50 rounded-xl p-3 text-center border border-stone-100">
      <p className={`text-lg font-bold ${color}`}>{value}</p>
      <p className="text-xs text-stone-400 mt-0.5">{label}</p>
    </div>
  );
}
