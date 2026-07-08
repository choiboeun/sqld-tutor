"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const SCORE_OPTIONS = [
  { value: 60, label: "60점", desc: "합격선 통과 (최소 목표)" },
  { value: 70, label: "70점", desc: "안정권 합격" },
  { value: 80, label: "80점", desc: "여유 있는 합격" },
  { value: 90, label: "90점", desc: "고득점 목표" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [targetScore, setTargetScore] = useState(70);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStart = async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        data: { onboarding_completed: true, target_score: targetScore },
      });
      if (updateError) throw updateError;
      router.push("/chat?new=true");
    } catch {
      setError("설정 저장에 실패했습니다. 다시 시도해주세요.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="text-center mb-6">
          <div className="text-3xl mb-3">🎯</div>
          <h1 className="text-xl font-bold text-gray-800 mb-1">목표 점수를 알려주세요</h1>
          <p className="text-sm text-gray-400">SQLD 시험 목표에 맞춰 학습을 조정할게요</p>
        </div>

        <div className="space-y-2 mb-8">
          {SCORE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTargetScore(opt.value)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm transition-colors ${
                targetScore === opt.value
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 text-gray-700 hover:border-gray-300"
              }`}
            >
              <span className="font-semibold">{opt.label}</span>
              <span className={targetScore === opt.value ? "text-blue-500" : "text-gray-400"}>
                {opt.desc}
              </span>
            </button>
          ))}
        </div>

        {error && (
          <p className="text-xs text-red-500 text-center mb-3">{error}</p>
        )}
        <button
          onClick={handleStart}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-40 transition-colors"
        >
          {loading ? "준비 중..." : "8문제로 실력 진단 시작 →"}
        </button>

        <p className="text-center text-xs text-gray-400 mt-4">
          진단 후 약점 카테고리를 중심으로 학습이 시작됩니다
        </p>
      </div>
    </div>
  );
}
