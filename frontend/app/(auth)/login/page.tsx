"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const LINES = ["SQL이 헷갈려?", "약점만 골라서\n풀어줘", "오답을\n자동 분석해줘", "합격까지\nAI가 같이 가."];
const FRAGS = ["SELECT * FROM EMPLOYEE","GROUP BY DEPT_ID","HAVING COUNT(*) > 3","LEFT JOIN DEPARTMENT","WHERE SALARY > 3000","ORDER BY EMP_NAME","AVG(SALARY)","INNER JOIN","PARTITION BY","ROW_NUMBER()","CASE WHEN NULL","COALESCE(A, B)","NVL(col, 0)","CONNECT BY PRIOR","SUBSTR(EMAIL, 1)","WITH CTE AS (...)","DECODE(col, val)","PIVOT(SUM(val))"];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [typerText, setTyperText] = useState("");

  const leftElRef = useRef<HTMLDivElement>(null);
  const leftBgRef = useRef<HTMLDivElement>(null);

  // Typewriter
  useEffect(() => {
    let li = 0, ci = 0, deleting = false, paused = false;
    let timer: ReturnType<typeof setTimeout>;
    function tick() {
      if (paused) { paused = false; timer = setTimeout(tick, 1900); return; }
      const t = LINES[li];
      if (!deleting) {
        ci++;
        setTyperText(t.slice(0, ci));
        if (ci >= t.length) { deleting = true; paused = true; timer = setTimeout(tick, 60); return; }
        timer = setTimeout(tick, 58 + Math.random() * 40);
      } else {
        ci--;
        setTyperText(t.slice(0, ci));
        if (ci === 0) { deleting = false; li = (li + 1) % LINES.length; timer = setTimeout(tick, 380); return; }
        timer = setTimeout(tick, 26);
      }
    }
    tick();
    return () => clearTimeout(timer);
  }, []);

  // SQL fragments + parallax
  useEffect(() => {
    const leftEl = leftElRef.current;
    if (!leftEl) return;
    const frags: { el: HTMLDivElement; rot: number; spd: number }[] = [];
    FRAGS.forEach((txt) => {
      const el = document.createElement("div");
      el.style.cssText = "position:absolute;font-family:Menlo,Monaco,monospace;font-size:11px;color:rgba(0,0,0,.055);white-space:nowrap;pointer-events:none;z-index:1;will-change:transform;transition:transform .2s ease-out";
      el.textContent = txt;
      el.style.left = 3 + Math.random() * 90 + "%";
      el.style.top = 3 + Math.random() * 92 + "%";
      el.style.opacity = (0.04 + Math.random() * 0.05).toFixed(3);
      const rot = (Math.random() - 0.5) * 7;
      const spd = 0.25 + Math.random() * 0.75;
      el.style.transform = `rotate(${rot}deg)`;
      leftEl.appendChild(el);
      frags.push({ el, rot, spd });
    });
    const onMove = (e: MouseEvent) => {
      const r = leftEl.getBoundingClientRect();
      const mx = (e.clientX - r.left) / r.width;
      const my = (e.clientY - r.top) / r.height;
      frags.forEach(({ el, rot, spd }) => {
        el.style.transform = `translate(${(mx - 0.5) * spd * 24}px,${(my - 0.5) * spd * 15}px) rotate(${rot}deg)`;
      });
      if (leftBgRef.current) {
        leftBgRef.current.style.background = `radial-gradient(ellipse 600px 420px at ${(mx * 100).toFixed(1)}% ${(my * 100).toFixed(1)}%,rgba(129,140,248,.1) 0%,transparent 62%),radial-gradient(ellipse 460px 320px at ${(mx * 40 + 55).toFixed(1)}% ${(my * 40 + 55).toFixed(1)}%,rgba(168,162,158,.05) 0%,transparent 58%)`;
      }
    };
    const onLeave = () => {
      frags.forEach(({ el, rot }) => { el.style.transform = `rotate(${rot}deg)`; });
      if (leftBgRef.current) {
        leftBgRef.current.style.background = "radial-gradient(ellipse 600px 420px at 22% 32%,rgba(129,140,248,.08) 0%,transparent 62%),radial-gradient(ellipse 460px 320px at 80% 72%,rgba(168,162,158,.05) 0%,transparent 58%)";
      }
    };
    leftEl.addEventListener("mousemove", onMove);
    leftEl.addEventListener("mouseleave", onLeave);
    return () => {
      leftEl.removeEventListener("mousemove", onMove);
      leftEl.removeEventListener("mouseleave", onLeave);
      frags.forEach(({ el }) => el.remove());
    };
  }, []);

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
    <>
      <style>{`
        @keyframes bpulse{0%,100%{opacity:1;box-shadow:0 0 8px rgba(99,102,241,.5)}50%{opacity:.4;box-shadow:none}}
        @keyframes loginCard{from{opacity:0;transform:translateY(24px) scale(.97)}to{opacity:1;transform:none}}
        @keyframes loginEl{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
        @keyframes cblink{0%,49%{opacity:1}50%,100%{opacity:0}}
        @keyframes rpulse{0%,100%{transform:translate(-50%,-50%) scale(1);opacity:1}50%{transform:translate(-50%,-50%) scale(1.05);opacity:.55}}
        .login-brand-dot{animation:bpulse 2.2s ease-in-out infinite}
        .login-cursor{display:inline-block;width:3px;height:.82em;background:#6366f1;margin-left:3px;vertical-align:middle;animation:cblink .9s infinite;-webkit-text-fill-color:#6366f1}
        .login-ring{position:absolute;border-radius:50%;border:1px solid;top:50%;left:50%;transform:translate(-50%,-50%);animation:rpulse 3.4s ease-in-out infinite}
        .login-ring:nth-child(1){width:68px;height:68px;border-color:rgba(99,102,241,.24);animation-delay:0s}
        .login-ring:nth-child(2){width:126px;height:126px;border-color:rgba(99,102,241,.13);animation-delay:.5s}
        .login-ring:nth-child(3){width:194px;height:194px;border-color:rgba(99,102,241,.07);animation-delay:1s}
        .login-ring:nth-child(4){width:268px;height:268px;border-color:rgba(99,102,241,.035);animation-delay:1.5s}
        .login-chip{font-size:12px;font-weight:600;color:#57534e;background:#eae8e5;padding:6px 14px;border:1px solid #d6d3d1;letter-spacing:.03em;cursor:default;transition:background .15s,color .15s,transform .15s,box-shadow .15s,border-color .15s}
        .login-chip:hover{background:#6366f1;color:#fff;border-color:#6366f1;transform:translateY(-2px);box-shadow:0 4px 14px rgba(99,102,241,.28)}
        .login-submit{position:relative;overflow:hidden;transition:background .15s,transform .15s,box-shadow .15s}
        .login-submit::after{content:'';position:absolute;inset:0;background:linear-gradient(105deg,transparent 30%,rgba(255,255,255,.15) 50%,transparent 70%);transform:translateX(-100%);transition:transform .48s ease}
        .login-submit:hover:not(:disabled){background:#4f46e5!important;transform:translateY(-1px);box-shadow:0 6px 20px rgba(99,102,241,.32)}
        .login-submit:hover:not(:disabled)::after{transform:translateX(100%)}
        .login-submit:active:not(:disabled){transform:translateY(0)}
        .login-right::before{content:'';position:absolute;inset:0;pointer-events:none;z-index:0;background:radial-gradient(ellipse at 85% 15%,rgba(255,255,255,.26) 0%,transparent 55%),radial-gradient(circle,rgba(255,255,255,.14) 1.2px,transparent 1.2px);background-size:100% 100%,22px 22px}
        .login-eye:hover{color:#78716c}
        .login-fl-input{width:100%;border:1.5px solid rgba(255,255,255,.25);background:rgba(255,255,255,.12);padding:20px 14px 7px;font-size:13.5px;color:#fff;outline:none;transition:border-color .2s,box-shadow .2s,background .2s;display:block}
        .login-fl-input::placeholder{color:transparent}
        .login-fl-input:focus{border-color:rgba(255,255,255,.55);background:rgba(255,255,255,.18);box-shadow:0 0 0 3px rgba(255,255,255,.1)}
        .login-fl-label{position:absolute;left:14px;top:50%;transform:translateY(-50%);font-size:13.5px;color:rgba(255,255,255,.5);pointer-events:none;transition:all .18s ease}
        .login-fl-input:focus~.login-fl-label,.login-fl-input:not(:placeholder-shown)~.login-fl-label,.login-fl-input:-webkit-autofill~.login-fl-label{top:10px;transform:none;font-size:9px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.85)}
        .login-fl-input:-webkit-autofill{-webkit-box-shadow:0 0 0 1000px rgba(120,80,220,.3) inset;-webkit-text-fill-color:#fff;transition:background-color 5000s ease-in-out 0s}
        .login-signup-link{color:rgba(255,255,255,.9);font-weight:700;text-decoration:none;border-bottom:1px solid rgba(255,255,255,.3);transition:border-color .15s}
        .login-signup-link:hover{border-bottom-color:rgba(255,255,255,.8)}
        @media(max-width:680px){
          .login-page{flex-direction:column!important}
          .login-left{flex:none!important;min-height:auto!important;padding:36px 28px 32px!important}
          .login-vdiv{display:none!important}
          .login-right{padding:36px 20px!important}
          .login-form-card{padding:28px 24px 24px!important}
        }
      `}</style>

      <div className="login-page" style={{ display: "flex", width: "100%", minHeight: "100vh", overflow: "hidden" }}>

        {/* LEFT */}
        <div
          className="login-left"
          ref={leftElRef}
          style={{ flex: "0 0 52%", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "center", padding: "56px 52px", background: "#f5f5f4" }}
        >
          <div ref={leftBgRef} style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none", background: "radial-gradient(ellipse 600px 420px at 22% 32%,rgba(129,140,248,.08) 0%,transparent 62%),radial-gradient(ellipse 460px 320px at 80% 72%,rgba(168,162,158,.05) 0%,transparent 58%)", transition: "background .28s ease" }} />
          <div style={{ position: "absolute", bottom: "-55px", right: "-55px", width: "310px", height: "310px", pointerEvents: "none", zIndex: 1 }}>
            <div className="login-ring" /><div className="login-ring" /><div className="login-ring" /><div className="login-ring" />
          </div>

          {/* Brand */}
          <div style={{ position: "relative", zIndex: 5, display: "flex", alignItems: "center", gap: "7px", marginBottom: "20px" }}>
            <div className="login-brand-dot" style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#6366f1" }} />
            <span style={{ fontSize: "11px", fontWeight: 800, letterSpacing: ".2em", textTransform: "uppercase", color: "#6366f1" }}>SQLD AI Tutor</span>
          </div>

          {/* Typewriter headline */}
          <div style={{ position: "relative", zIndex: 5, fontSize: "clamp(34px,5.2vw,54px)", fontWeight: 900, letterSpacing: "-.04em", lineHeight: 1.06, marginBottom: "18px", minHeight: "2.2em" }}>
            <span style={{ whiteSpace: "pre-line", background: "linear-gradient(132deg,#818cf8 0%,#6366f1 42%,#3730a3 82%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              {typerText}
            </span>
            <span className="login-cursor" />
          </div>

          {/* Description */}
          <p style={{ position: "relative", zIndex: 5, fontSize: "15.5px", color: "#78716c", lineHeight: 1.65, marginBottom: "22px", maxWidth: "380px" }}>
            AI가 나의 약점을 분석하고, 맞춤 문제를 출제해요.<br />오답은 자동으로 기록되고 반복 출제됩니다.
          </p>

          {/* Chips */}
          <div style={{ position: "relative", zIndex: 5, display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {["약점 자동 진단", "맞춤 문제 출제", "오답 반복 학습", "AI 개념 설명"].map((c) => (
              <span key={c} className="login-chip">{c}</span>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="login-vdiv" style={{ width: "1px", background: "#e7e5e4", flexShrink: 0, zIndex: 2 }} />

        {/* RIGHT */}
        <div className="login-right" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "52px 48px", position: "relative", overflow: "hidden", background: "#818cf8" }}>
          <div className="login-form-card" style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: "330px", background: "rgba(255,255,255,.18)", border: "1px solid rgba(255,255,255,.35)", boxShadow: "0 8px 40px rgba(60,0,120,.2),inset 0 1px 0 rgba(255,255,255,.45)", backdropFilter: "blur(20px) saturate(180%)", WebkitBackdropFilter: "blur(20px) saturate(180%)", padding: "36px 32px 30px", animation: "loginCard .65s cubic-bezier(0.22,1,0.36,1) both" }}>

            <p style={{ fontSize: "9px", fontWeight: 800, letterSpacing: ".2em", textTransform: "uppercase", color: "rgba(255,255,255,.65)", marginBottom: "10px", animation: "loginEl .4s ease .1s both" }}>SQLD AI 튜터</p>
            <h1 style={{ fontSize: "26px", fontWeight: 900, color: "#fff", letterSpacing: "-.03em", marginBottom: "5px", animation: "loginEl .4s ease .18s both" }}>로그인</h1>
            <p style={{ fontSize: "13px", color: "rgba(255,255,255,.65)", marginBottom: "26px", animation: "loginEl .4s ease .24s both" }}>학습을 이어가세요.</p>

            <form onSubmit={handleLogin}>
              {/* Email */}
              <div style={{ position: "relative", marginBottom: "13px", animation: "loginEl .4s ease .32s both" }}>
                <input
                  className="login-fl-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder=" "
                />
                <label className="login-fl-label">이메일</label>
              </div>

              {/* Password */}
              <div style={{ position: "relative", marginBottom: "13px", animation: "loginEl .4s ease .4s both" }}>
                <input
                  className="login-fl-input"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder=" "
                  style={{ paddingRight: "44px" }}
                />
                <label className="login-fl-label">비밀번호</label>
                <button
                  type="button"
                  className="login-eye"
                  onClick={() => setShowPassword((p) => !p)}
                  style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,.5)", display: "flex", alignItems: "center", transition: "color .15s" }}
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>

              {error && <p style={{ fontSize: "12px", color: "#ef4444", marginBottom: "8px" }}>{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="login-submit"
                style={{ width: "100%", background: "rgba(255,255,255,.9)", color: "#4f46e5", border: "none", padding: "13px", fontSize: "13px", fontWeight: 800, letterSpacing: ".07em", textTransform: "uppercase", cursor: loading ? "not-allowed" : "pointer", marginTop: "6px", opacity: loading ? 0.6 : 1, animation: "loginEl .4s ease .48s both" }}
              >
                {loading ? "로그인 중..." : "로그인"}
              </button>
            </form>

            <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "20px 0", animation: "loginEl .4s ease .56s both" }}>
              <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,.2)" }} />
              <span style={{ fontSize: "10px", color: "rgba(255,255,255,.45)", fontWeight: 600, letterSpacing: ".06em" }}>또는</span>
              <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,.2)" }} />
            </div>

            <button disabled style={{ width: "100%", background: "rgba(255,255,255,.08)", border: "1.5px solid rgba(255,255,255,.18)", color: "rgba(255,255,255,.35)", padding: "12px", fontSize: "12.5px", fontWeight: 600, cursor: "not-allowed", animation: "loginEl .4s ease .62s both" }}>
              카카오로 로그인 (준비 중)
            </button>

            <p style={{ textAlign: "center", fontSize: "11.5px", color: "rgba(255,255,255,.55)", marginTop: "20px", animation: "loginEl .4s ease .68s both" }}>
              계정이 없으신가요?{" "}
              <Link href="/signup" className="login-signup-link">회원가입</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
