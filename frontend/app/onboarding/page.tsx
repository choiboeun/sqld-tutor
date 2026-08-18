"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const SCORES = [
  { value: 60, badge: "합격선", desc: "기초를 탄탄히 다져요" },
  { value: 70, badge: "안정권", desc: "꾸준히 실력을 올려요" },
  { value: 80, badge: "고득점", desc: "심화까지 도전해요" },
  { value: 90, badge: "최고점", desc: "완벽하게 마스터해요" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [targetScore, setTargetScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStart = async () => {
    if (!targetScore) return;
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        data: { onboarding_completed: true, target_score: targetScore },
      });
      if (updateError) throw updateError;
      router.push("/home?welcome=true");
    } catch {
      setError("설정 저장에 실패했어요. 다시 시도해주세요.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* 상단 인디고 브랜드 바 */}
      <div className="px-6 py-3.5 flex items-center gap-3" style={{ background: "#6366f1" }}>
        <div className="w-6 h-6 bg-white/20 flex items-center justify-center shrink-0">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
          </svg>
        </div>
        <span className="text-sm font-bold tracking-wider text-white/85">SQLD AI 튜터</span>
      </div>

      {/* 중앙 콘텐츠 */}
      <div className="flex-1 flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-md">
          <p className="text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-4">
            거의 다 왔어요
          </p>
          <h1 className="text-3xl font-black text-stone-900 tracking-tight leading-tight mb-3">
            목표 점수를<br />설정해주세요
          </h1>
          <p className="text-sm text-stone-500 mb-8 leading-relaxed">
            AI가 목표에 맞게 난이도와 출제 전략을 조정해요.
          </p>

          <div className="grid grid-cols-2 gap-3 mb-6">
            {SCORES.map(({ value, badge, desc }) => (
              <button
                key={value}
                onClick={() => setTargetScore(value)}
                className={`text-left p-5 border-[1.5px] transition-all duration-150 ${
                  targetScore === value
                    ? "border-indigo-500 bg-indigo-500"
                    : "border-stone-200 bg-white hover:border-indigo-400 hover:-translate-y-0.5 hover:shadow-md"
                }`}
              >
                <span className={`text-[9px] font-bold tracking-widest uppercase block mb-2 ${
                  targetScore === value ? "text-white/70" : "text-stone-400"
                }`}>
                  {badge}
                </span>
                <span className={`text-5xl font-black leading-none block mb-1.5 ${
                  targetScore === value ? "text-white" : "text-stone-900"
                }`}>
                  {value}
                </span>
                <span className={`text-xs leading-snug ${
                  targetScore === value ? "text-white/80" : "text-stone-400"
                }`}>
                  {desc}
                </span>
              </button>
            ))}
          </div>

          {error && (
            <p className="text-xs text-red-500 mb-3">{error}</p>
          )}

          <button
            onClick={handleStart}
            disabled={!targetScore || loading}
            className="w-full text-white py-3.5 text-sm font-bold tracking-wide uppercase disabled:opacity-40 disabled:cursor-not-allowed transition-colors" style={{ background: "#6366f1" }}
          >
            {loading ? "준비 중..." : "시작하기 →"}
          </button>

          <p className="text-center text-xs text-stone-400 mt-3">
            나중에 홈에서 변경할 수 있어요
          </p>
        </div>
      </div>
    </div>
  );
}
