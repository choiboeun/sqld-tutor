"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("이메일 또는 비밀번호가 올바르지 않습니다.");
    } else {
      router.push("/home");
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-stone-200 p-8">
        <div className="mb-7">
          <p className="text-xs font-semibold tracking-widest text-amber-600 uppercase mb-2">SQLD AI 튜터</p>
          <h1 className="text-2xl font-bold text-stone-900 mb-1">로그인</h1>
          <p className="text-sm text-stone-500">학습을 이어가세요.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
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
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-amber-700 disabled:opacity-40 transition-colors"
          >
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-stone-200" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-3 text-xs text-stone-400">또는</span>
          </div>
        </div>

        <button
          disabled
          className="w-full bg-stone-100 text-stone-400 py-2.5 rounded-xl text-sm font-medium cursor-not-allowed"
        >
          카카오로 로그인 (준비 중)
        </button>

        <p className="text-center text-xs text-stone-400 mt-6">
          계정이 없으신가요?{" "}
          <Link href="/signup" className="text-amber-700 font-semibold hover:underline">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}
