"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const LINES = ["SQLD 합격,\n여기서 시작해.", "AI 튜터가\n약점을 찾아줘.", "오늘부터\n달라진다."];
const FRAGS = ["SELECT * FROM EMPLOYEE","GROUP BY DEPT_ID","HAVING COUNT(*) > 3","LEFT JOIN DEPARTMENT","WHERE SALARY > 3000","ORDER BY EMP_NAME","AVG(SALARY)","INNER JOIN","PARTITION BY","ROW_NUMBER()","CASE WHEN NULL","COALESCE(A, B)","NVL(col, 0)","CONNECT BY PRIOR","SUBSTR(EMAIL, 1)","WITH CTE AS (...)","DECODE(col, val)","PIVOT(SUM(val))"];

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [typerText, setTyperText] = useState("");

  const leftElRef = useRef<HTMLDivElement>(null);
  const leftBgRef = useRef<HTMLDivElement>(null);
  const rightElRef = useRef<HTMLDivElement>(null);
  const rightBgRef = useRef<HTMLDivElement>(null);

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
        leftBgRef.current.style.background = `radial-gradient(ellipse 600px 420px at ${(mx * 100).toFixed(1)}% ${(my * 100).toFixed(1)}%,rgba(129,140,248,.14) 0%,transparent 62%),radial-gradient(ellipse 460px 320px at ${(mx * 40 + 55).toFixed(1)}% ${(my * 40 + 55).toFixed(1)}%,rgba(168,162,158,.05) 0%,transparent 58%)`;
      }
    };
    const onLeave = () => {
      frags.forEach(({ el, rot }) => { el.style.transform = `rotate(${rot}deg)`; });
      if (leftBgRef.current) {
        leftBgRef.current.style.background = "radial-gradient(ellipse 600px 420px at 22% 32%,rgba(129,140,248,.1) 0%,transparent 62%),radial-gradient(ellipse 460px 320px at 80% 72%,rgba(168,162,158,.05) 0%,transparent 58%)";
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

  // Right panel white glow
  useEffect(() => {
    const rightEl = rightElRef.current;
    if (!rightEl) return;
    const onMove = (e: MouseEvent) => {
      const r = rightEl.getBoundingClientRect();
      const mx = ((e.clientX - r.left) / r.width * 100).toFixed(1);
      const my = ((e.clientY - r.top) / r.height * 100).toFixed(1);
      if (rightBgRef.current) {
        rightBgRef.current.style.background = `radial-gradient(ellipse 460px 340px at ${mx}% ${my}%,rgba(255,255,255,.18) 0%,transparent 60%)`;
      }
    };
    const onLeave = () => {
      if (rightBgRef.current) {
        rightBgRef.current.style.background = "none";
      }
    };
    rightEl.addEventListener("mousemove", onMove);
    rightEl.addEventListener("mouseleave", onLeave);
    return () => {
      rightEl.removeEventListener("mousemove", onMove);
      rightEl.removeEventListener("mouseleave", onLeave);
    };
  }, []);

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

  return (
    <>
      <style>{`
        @keyframes su-bpulse{0%,100%{opacity:1;box-shadow:0 0 8px rgba(129,140,248,.5)}50%{opacity:.4;box-shadow:none}}
        @keyframes su-cblink{0%,49%{opacity:1}50%,100%{opacity:0}}
        @keyframes su-rpulse{0%,100%{transform:translate(-50%,-50%) scale(1);opacity:1}50%{transform:translate(-50%,-50%) scale(1.05);opacity:.55}}
        .su-brand-dot{animation:su-bpulse 2.2s ease-in-out infinite}
        .su-cursor{display:inline-block;width:3px;height:.82em;background:#818cf8;margin-left:3px;vertical-align:middle;animation:su-cblink .9s infinite}
        .su-ring{position:absolute;border-radius:50%;border:1px solid;top:50%;left:50%;transform:translate(-50%,-50%);animation:su-rpulse 3.4s ease-in-out infinite}
        .su-ring:nth-child(1){width:68px;height:68px;border-color:rgba(99,102,241,.24);animation-delay:0s}
        .su-ring:nth-child(2){width:126px;height:126px;border-color:rgba(99,102,241,.13);animation-delay:.5s}
        .su-ring:nth-child(3){width:194px;height:194px;border-color:rgba(99,102,241,.07);animation-delay:1s}
        .su-ring:nth-child(4){width:268px;height:268px;border-color:rgba(99,102,241,.035);animation-delay:1.5s}
        .su-chip{font-size:12px;font-weight:600;color:#57534e;background:#eae8e5;padding:6px 14px;border:1px solid #d6d3d1;letter-spacing:.03em;cursor:default;transition:background .15s,color .15s,transform .15s,box-shadow .15s,border-color .15s}
        .su-chip:hover{background:#6366f1;color:#fff;border-color:#6366f1;transform:translateY(-2px);box-shadow:0 4px 14px rgba(99,102,241,.28)}
        .su-submit{position:relative;overflow:hidden;transition:background .15s,transform .15s,box-shadow .15s}
        .su-submit::after{content:'';position:absolute;inset:0;background:linear-gradient(105deg,transparent 30%,rgba(255,255,255,.15) 50%,transparent 70%);transform:translateX(-100%);transition:transform .48s ease}
        .su-submit:hover:not(:disabled){background:#4f46e5!important;transform:translateY(-1px);box-shadow:0 6px 20px rgba(99,102,241,.32)}
        .su-submit:hover:not(:disabled)::after{transform:translateX(100%)}
        .su-submit:active:not(:disabled){transform:translateY(0)}
        .su-right::before{content:'';position:absolute;inset:0;pointer-events:none;z-index:0;background:radial-gradient(ellipse at 85% 15%,rgba(129,140,248,.12) 0%,transparent 55%),radial-gradient(circle,rgba(129,140,248,.09) 1px,transparent 1px);background-size:100% 100%,24px 24px}
        .su-eye:hover{color:#78716c}
        .su-fl-input{width:100%;border:1.5px solid #ede9e4;background:#fafaf9;padding:20px 14px 7px;font-size:13.5px;color:#1c1917;outline:none;transition:border-color .2s,box-shadow .2s,background .2s;display:block}
        .su-fl-input:focus{border-color:#818cf8;background:#fff;box-shadow:0 0 0 3px rgba(129,140,248,.15)}
        .su-fl-label{position:absolute;left:14px;top:50%;transform:translateY(-50%);font-size:13.5px;color:#b5b0ab;pointer-events:none;transition:all .18s ease}
        .su-fl-input:focus~.su-fl-label,.su-fl-input:not(:placeholder-shown)~.su-fl-label,.su-fl-input:-webkit-autofill~.su-fl-label{top:10px;transform:none;font-size:9px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#818cf8}
        .su-fl-input:-webkit-autofill{-webkit-box-shadow:0 0 0 1000px #fafaf9 inset;-webkit-text-fill-color:#1c1917;transition:background-color 5000s ease-in-out 0s}
        .su-login-link{color:#6366f1;font-weight:700;text-decoration:none;border-bottom:1px solid transparent;transition:border-color .15s}
        .su-login-link:hover{border-bottom-color:#6366f1}
        @media(max-width:680px){
          .su-page{flex-direction:column!important}
          .su-left{flex:none!important;min-height:auto!important;padding:36px 28px 32px!important}
          .su-vdiv{display:none!important}
          .su-right{padding:36px 20px!important}
          .su-form-card{padding:28px 24px 24px!important}
        }
      `}</style>

      <div className="su-page" style={{ display: "flex", width: "100%", minHeight: "100vh", overflow: "hidden" }}>

        {/* LEFT */}
        <div
          className="su-left"
          ref={leftElRef}
          style={{ flex: "0 0 52%", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "center", padding: "56px 52px", background: "#f5f5f4" }}
        >
          <div ref={leftBgRef} style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none", background: "radial-gradient(ellipse 600px 420px at 22% 32%,rgba(129,140,248,.1) 0%,transparent 62%),radial-gradient(ellipse 460px 320px at 80% 72%,rgba(168,162,158,.05) 0%,transparent 58%)", transition: "background .28s ease" }} />
          <div style={{ position: "absolute", bottom: "-55px", right: "-55px", width: "310px", height: "310px", pointerEvents: "none", zIndex: 1 }}>
            <div className="su-ring" /><div className="su-ring" /><div className="su-ring" /><div className="su-ring" />
          </div>

          {/* Brand */}
          <div style={{ position: "relative", zIndex: 5, display: "flex", alignItems: "center", gap: "7px", marginBottom: "20px" }}>
            <div className="su-brand-dot" style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#6366f1" }} />
            <span style={{ fontSize: "11px", fontWeight: 800, letterSpacing: ".2em", textTransform: "uppercase", color: "#6366f1" }}>SQLD AI Tutor</span>
          </div>

          {/* Typewriter headline */}
          <div style={{ position: "relative", zIndex: 5, fontSize: "clamp(34px,5.2vw,54px)", fontWeight: 900, letterSpacing: "-.04em", lineHeight: 1.06, marginBottom: "18px", minHeight: "2.2em" }}>
            <span style={{ whiteSpace: "pre-line", color: "#1c1917" }}>
              {typerText}
            </span>
            <span className="su-cursor" />
          </div>

          {/* Description */}
          <p style={{ position: "relative", zIndex: 5, fontSize: "15.5px", color: "#78716c", lineHeight: 1.65, marginBottom: "22px", maxWidth: "380px" }}>
            AI가 나의 약점을 분석하고, 맞춤 문제를 출제해요.<br />오답은 자동으로 기록되고 반복 출제됩니다.
          </p>

          {/* Chips */}
          <div style={{ position: "relative", zIndex: 5, display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {["약점 자동 진단", "맞춤 문제 출제", "오답 반복 학습", "AI 개념 설명"].map((c) => (
              <span key={c} className="su-chip">{c}</span>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="su-vdiv" style={{ width: "1px", background: "#e7e5e4", flexShrink: 0, zIndex: 2 }} />

        {/* RIGHT */}
        <div ref={rightElRef} className="su-right" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "52px 48px", position: "relative", overflow: "hidden", background: "#dde1fb" }}>
          <div ref={rightBgRef} style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none", transition: "background .25s ease" }} />
          <div className="su-form-card" style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: "330px", background: "#fff", boxShadow: "0 12px 48px rgba(49,46,129,.28),0 2px 8px rgba(49,46,129,.12)", padding: "36px 32px 30px" }}>

            {done ? (
              /* Email verification sent */
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "36px", marginBottom: "16px" }}>✉️</div>
                <p style={{ fontSize: "9px", fontWeight: 800, letterSpacing: ".2em", textTransform: "uppercase", color: "#818cf8", marginBottom: "10px" }}>SQLD AI 튜터</p>
                <h1 style={{ fontSize: "22px", fontWeight: 900, color: "#1c1917", letterSpacing: "-.03em", marginBottom: "8px" }}>이메일을 확인해주세요</h1>
                <p style={{ fontSize: "13px", color: "#78716c", lineHeight: 1.6, marginBottom: "24px" }}>
                  <strong style={{ color: "#1c1917" }}>{email}</strong>로<br />인증 메일을 발송했어요.<br />메일의 링크를 클릭하면 로그인할 수 있어요.
                </p>
                <Link
                  href="/login"
                  style={{ display: "block", width: "100%", background: "#6366f1", color: "#fff", border: "none", padding: "13px", fontSize: "13px", fontWeight: 800, letterSpacing: ".07em", textTransform: "uppercase", textAlign: "center", textDecoration: "none" }}
                >
                  로그인 페이지로
                </Link>
              </div>
            ) : (
              /* Signup form */
              <>
                <p style={{ fontSize: "9px", fontWeight: 800, letterSpacing: ".2em", textTransform: "uppercase", color: "#818cf8", marginBottom: "10px" }}>SQLD AI 튜터</p>
                <h1 style={{ fontSize: "26px", fontWeight: 900, color: "#1c1917", letterSpacing: "-.03em", marginBottom: "5px" }}>회원가입</h1>
                <p style={{ fontSize: "13px", color: "#78716c", marginBottom: "26px" }}>SQLD 합격을 향한 첫 걸음</p>

                <form onSubmit={handleSignup}>
                  {/* Email */}
                  <div style={{ position: "relative", marginBottom: "13px" }}>
                    <input
                      className="su-fl-input"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder=" "
                    />
                    <label className="su-fl-label">이메일</label>
                  </div>

                  {/* Password */}
                  <div style={{ position: "relative", marginBottom: "13px" }}>
                    <input
                      className="su-fl-input"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder=" "
                      style={{ paddingRight: "44px" }}
                    />
                    <label className="su-fl-label">비밀번호 (6자 이상)</label>
                    <button
                      type="button"
                      className="su-eye"
                      onClick={() => setShowPassword((p) => !p)}
                      style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#c7c3bf", display: "flex", alignItems: "center", transition: "color .15s" }}
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

                  {/* Confirm password */}
                  <div style={{ position: "relative", marginBottom: "16px" }}>
                    <input
                      className="su-fl-input"
                      type={showConfirm ? "text" : "password"}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      required
                      placeholder=" "
                      style={{ paddingRight: "44px" }}
                    />
                    <label className="su-fl-label">비밀번호 확인</label>
                    <button
                      type="button"
                      className="su-eye"
                      onClick={() => setShowConfirm((p) => !p)}
                      style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#c7c3bf", display: "flex", alignItems: "center", transition: "color .15s" }}
                    >
                      {showConfirm ? (
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

                  {/* Consent */}
                  <label style={{ display: "flex", alignItems: "flex-start", gap: "9px", cursor: "pointer", marginBottom: "16px" }}>
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      style={{ marginTop: "2px", accentColor: "#6366f1", flexShrink: 0 }}
                    />
                    <span style={{ fontSize: "11.5px", color: "#78716c", lineHeight: 1.55 }}>
                      <Link href="/privacy" target="_blank" style={{ color: "#6366f1", fontWeight: 700, textDecoration: "none", borderBottom: "1px solid transparent" }}>
                        개인정보처리방침
                      </Link>
                      에 동의합니다. (이메일, 학습 기록, 채팅 내역이 저장됩니다.)
                    </span>
                  </label>

                  {error && <p style={{ fontSize: "12px", color: "#ef4444", marginBottom: "8px" }}>{error}</p>}

                  <button
                    type="submit"
                    disabled={loading || !agreed}
                    className="su-submit"
                    style={{ width: "100%", background: "#6366f1", color: "#fff", border: "none", padding: "13px", fontSize: "13px", fontWeight: 800, letterSpacing: ".07em", textTransform: "uppercase", cursor: loading || !agreed ? "not-allowed" : "pointer", opacity: loading || !agreed ? 0.4 : 1 }}
                  >
                    {loading ? "처리 중..." : "회원가입"}
                  </button>
                </form>

                <p style={{ textAlign: "center", fontSize: "11.5px", color: "#a8a29e", marginTop: "20px" }}>
                  이미 계정이 있으신가요?{" "}
                  <Link href="/login" className="su-login-link">로그인</Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
