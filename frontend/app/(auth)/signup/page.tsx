"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    if (password.length < 6) {
      setError("비밀번호는 6자 이상이어야 합니다.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      router.push("/onboarding");
      return;
    }

    setDone(true);
    setLoading(false);
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-stone-200 p-8 text-center">
          <div className="text-4xl mb-4">✉️</div>
          <h2 className="text-lg font-bold text-stone-800 mb-2">이메일을 확인해주세요</h2>
          <p className="text-sm text-stone-500">
            {email}로 인증 메일을 발송했어요.<br />
            메일의 링크를 클릭하면 로그인할 수 있어요.
          </p>
          <Link href="/login" className="block mt-6 text-sm text-amber-700 font-semibold hover:underline">
            로그인 페이지로 이동
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-stone-200 p-8">
        <div className="mb-7">
          <p className="text-xs font-semibold tracking-widest text-amber-600 uppercase mb-2">SQLD AI 튜터</p>
          <h1 className="text-2xl font-bold text-stone-900 mb-1">회원가입</h1>
          <p className="text-sm text-stone-500">SQLD 합격을 향한 첫 걸음</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1.5">이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-stone-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white text-stone-900 placeholder:text-stone-400"
              placeholder="example@email.com"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1.5">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-stone-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white text-stone-900 placeholder:text-stone-400"
              placeholder="6자 이상"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1.5">비밀번호 확인</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              className="w-full border border-stone-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white text-stone-900 placeholder:text-stone-400"
              placeholder="••••••••"
            />
          </div>

          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 accent-amber-600"
            />
            <span className="text-xs text-stone-500 leading-relaxed">
              <Link href="/privacy" target="_blank" className="text-amber-700 font-semibold hover:underline">
                개인정보처리방침
              </Link>
              에 동의합니다. (이메일, 학습 기록, 채팅 내역이 저장됩니다.)
            </span>
          </label>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading || !agreed}
            className="w-full bg-amber-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "처리 중..." : "회원가입"}
          </button>
        </form>

        <p className="text-center text-xs text-stone-400 mt-6">
          이미 계정이 있으신가요?{" "}
          <Link href="/login" className="text-amber-700 font-semibold hover:underline">
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}
