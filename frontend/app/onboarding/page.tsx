"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const LINES = ["목표가 생기면\n공부가 달라져.", "AI가 약점을\n집중 공략해줘.", "합격까지\n같이 가자."];
const FRAGS = ["SELECT * FROM EMPLOYEE","GROUP BY DEPT_ID","HAVING COUNT(*) > 3","LEFT JOIN DEPARTMENT","WHERE SALARY > 3000","ORDER BY EMP_NAME","AVG(SALARY)","INNER JOIN","PARTITION BY","ROW_NUMBER()","CASE WHEN NULL","COALESCE(A, B)","NVL(col, 0)","CONNECT BY PRIOR","SUBSTR(EMAIL, 1)","WITH CTE AS (...)","DECODE(col, val)","PIVOT(SUM(val))"];

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
        ci++; setTyperText(t.slice(0, ci));
        if (ci >= t.length) { deleting = true; paused = true; timer = setTimeout(tick, 60); return; }
        timer = setTimeout(tick, 58 + Math.random() * 40);
      } else {
        ci--; setTyperText(t.slice(0, ci));
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
        leftBgRef.current.style.background = `radial-gradient(ellipse 600px 420px at ${(mx * 100).toFixed(1)}% ${(my * 100).toFixed(1)}%,rgba(251,191,36,.1) 0%,transparent 62%),radial-gradient(ellipse 460px 320px at ${(mx * 40 + 55).toFixed(1)}% ${(my * 40 + 55).toFixed(1)}%,rgba(168,162,158,.05) 0%,transparent 58%)`;
      }
    };
    const onLeave = () => {
      frags.forEach(({ el, rot }) => { el.style.transform = `rotate(${rot}deg)`; });
      if (leftBgRef.current) {
        leftBgRef.current.style.background = "radial-gradient(ellipse 600px 420px at 22% 32%,rgba(251,191,36,.08) 0%,transparent 62%),radial-gradient(ellipse 460px 320px at 80% 72%,rgba(168,162,158,.05) 0%,transparent 58%)";
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
    <>
      <style>{`
        @keyframes bpulse{0%,100%{opacity:1;box-shadow:0 0 8px rgba(217,119,6,.5)}50%{opacity:.4;box-shadow:none}}
        @keyframes cblink{0%,49%{opacity:1}50%,100%{opacity:0}}
        @keyframes rpulse{0%,100%{transform:translate(-50%,-50%) scale(1);opacity:1}50%{transform:translate(-50%,-50%) scale(1.05);opacity:.55}}
        .ob-brand-dot{animation:bpulse 2.2s ease-in-out infinite}
        .ob-cursor{display:inline-block;width:3px;height:.82em;background:#d97706;margin-left:3px;vertical-align:middle;animation:cblink .9s infinite;-webkit-text-fill-color:#d97706}
        .ob-ring{position:absolute;border-radius:50%;border:1px solid;top:50%;left:50%;transform:translate(-50%,-50%);animation:rpulse 3.4s ease-in-out infinite}
        .ob-ring:nth-child(1){width:68px;height:68px;border-color:rgba(217,119,6,.24);animation-delay:0s}
        .ob-ring:nth-child(2){width:126px;height:126px;border-color:rgba(217,119,6,.13);animation-delay:.5s}
        .ob-ring:nth-child(3){width:194px;height:194px;border-color:rgba(217,119,6,.07);animation-delay:1s}
        .ob-ring:nth-child(4){width:268px;height:268px;border-color:rgba(217,119,6,.035);animation-delay:1.5s}
        .ob-chip{font-size:12px;font-weight:600;color:#57534e;background:#eae8e5;padding:6px 14px;border:1px solid #d6d3d1;letter-spacing:.03em;cursor:default;transition:background .15s,color .15s,transform .15s,box-shadow .15s,border-color .15s}
        .ob-chip:hover{background:#d97706;color:#fff;border-color:#d97706;transform:translateY(-2px);box-shadow:0 4px 14px rgba(217,119,6,.28)}
        .ob-right::before{content:'';position:absolute;inset:-50%;width:200%;height:200%;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='256' height='256'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.88' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='256' height='256' filter='url(%23n)'/%3E%3C/svg%3E");background-size:180px 180px;opacity:.042;pointer-events:none;z-index:0}
        .ob-score-card{border:1.5px solid #e8e4df;background:#fff;padding:20px 16px 18px;cursor:pointer;transition:border-color .18s,background .18s,transform .18s,box-shadow .18s;text-align:left;position:relative;overflow:hidden;display:flex;flex-direction:column;gap:6px}
        .ob-score-card::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(217,119,6,.06) 0%,transparent 60%);opacity:0;transition:opacity .18s}
        .ob-score-card:hover{border-color:#d97706;transform:translateY(-2px);box-shadow:0 4px 16px rgba(217,119,6,.14)}
        .ob-score-card:hover::before{opacity:1}
        .ob-score-card.selected{border-color:#d97706;background:#d97706;box-shadow:0 4px 20px rgba(217,119,6,.28)}
        .ob-score-card.selected::before{display:none}
        .ob-badge{display:inline-flex;align-items:center;font-size:9px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#a8a29e;background:#f0ede9;padding:3px 8px;width:fit-content;transition:color .18s,background .18s}
        .ob-score-card.selected .ob-badge{color:rgba(255,255,255,.75);background:rgba(255,255,255,.18)}
        .ob-score-num{font-size:46px;font-weight:900;letter-spacing:-.04em;line-height:1;color:#1c1917;transition:color .18s}
        .ob-score-card.selected .ob-score-num{color:#fff}
        .ob-score-desc{font-size:11.5px;color:#a8a29e;line-height:1.4;transition:color .18s}
        .ob-score-card.selected .ob-score-desc{color:rgba(255,255,255,.8)}
        .ob-cta{width:100%;background:#d97706;color:#fff;border:none;padding:14px;font-size:13px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;cursor:pointer;position:relative;overflow:hidden;transition:background .15s,transform .15s,box-shadow .15s,opacity .15s}
        .ob-cta::after{content:'';position:absolute;inset:0;background:linear-gradient(105deg,transparent 30%,rgba(255,255,255,.15) 50%,transparent 70%);transform:translateX(-100%);transition:transform .48s ease}
        .ob-cta:hover:not(:disabled){background:#b45309;transform:translateY(-1px);box-shadow:0 6px 20px rgba(217,119,6,.32)}
        .ob-cta:hover:not(:disabled)::after{transform:translateX(100%)}
        .ob-cta:disabled{opacity:.38;cursor:not-allowed}
        @media(max-width:680px){
          .ob-page{flex-direction:column!important}
          .ob-left{flex:none!important;min-height:auto!important;padding:36px 28px 32px!important}
          .ob-vdiv{display:none!important}
          .ob-right{padding:36px 20px!important}
          .ob-card{padding:28px 24px 24px!important}
        }
      `}</style>

      <div className="ob-page" style={{ display: "flex", width: "100%", minHeight: "100vh", overflow: "hidden" }}>

        {/* LEFT */}
        <div
          className="ob-left"
          ref={leftElRef}
          style={{ flex: "0 0 52%", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "center", padding: "56px 52px", background: "#f5f5f4" }}
        >
          <div ref={leftBgRef} style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none", background: "radial-gradient(ellipse 600px 420px at 22% 32%,rgba(251,191,36,.08) 0%,transparent 62%),radial-gradient(ellipse 460px 320px at 80% 72%,rgba(168,162,158,.05) 0%,transparent 58%)", transition: "background .28s ease" }} />
          <div style={{ position: "absolute", bottom: "-55px", right: "-55px", width: "310px", height: "310px", pointerEvents: "none", zIndex: 1 }}>
            <div className="ob-ring" /><div className="ob-ring" /><div className="ob-ring" /><div className="ob-ring" />
          </div>

          <div style={{ position: "relative", zIndex: 5, display: "flex", alignItems: "center", gap: "7px", marginBottom: "20px" }}>
            <div className="ob-brand-dot" style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#d97706" }} />
            <span style={{ fontSize: "11px", fontWeight: 800, letterSpacing: ".2em", textTransform: "uppercase", color: "#d97706" }}>SQLD AI Tutor</span>
          </div>

          <div style={{ position: "relative", zIndex: 5, fontSize: "clamp(34px,5.2vw,54px)", fontWeight: 900, letterSpacing: "-.04em", lineHeight: 1.06, marginBottom: "18px", minHeight: "2.2em" }}>
            <span style={{ whiteSpace: "pre-line", background: "linear-gradient(132deg,#d97706 0%,#92400e 42%,#44403c 82%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              {typerText}
            </span>
            <span className="ob-cursor" />
          </div>

          <p style={{ position: "relative", zIndex: 5, fontSize: "15.5px", color: "#78716c", lineHeight: 1.65, marginBottom: "22px", maxWidth: "380px" }}>
            AI가 나의 약점을 분석하고, 맞춤 문제를 출제해요.<br />오답은 자동으로 기록되고 반복 출제됩니다.
          </p>

          <div style={{ position: "relative", zIndex: 5, display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {["약점 자동 진단", "맞춤 문제 출제", "오답 반복 학습", "AI 개념 설명"].map((c) => (
              <span key={c} className="ob-chip">{c}</span>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="ob-vdiv" style={{ width: "1px", background: "#e7e5e4", flexShrink: 0, zIndex: 2 }} />

        {/* RIGHT */}
        <div className="ob-right" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "52px 48px", position: "relative", overflow: "hidden", background: "#f7f6f4" }}>
          <div className="ob-card" style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: "360px", background: "#fff", border: "1px solid #e8e4df", boxShadow: "0 2px 8px rgba(0,0,0,.04),0 8px 36px rgba(0,0,0,.07)", padding: "36px 32px 30px" }}>

            <p style={{ fontSize: "9px", fontWeight: 800, letterSpacing: ".2em", textTransform: "uppercase", color: "#d97706", marginBottom: "10px" }}>Step 1 of 1</p>
            <h1 style={{ fontSize: "22px", fontWeight: 900, color: "#1c1917", letterSpacing: "-.03em", marginBottom: "4px" }}>목표 점수 설정</h1>
            <p style={{ fontSize: "13px", color: "#78716c", marginBottom: "28px" }}>AI가 맞춤 난이도로 학습을 시작합니다.</p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "22px" }}>
              {SCORES.map(({ value, badge, desc }) => (
                <button
                  key={value}
                  className={`ob-score-card${targetScore === value ? " selected" : ""}`}
                  onClick={() => setTargetScore(value)}
                >
                  <span className="ob-badge">{badge}</span>
                  <span className="ob-score-num">{value}</span>
                  <span className="ob-score-desc">{desc}</span>
                </button>
              ))}
            </div>

            {error && <p style={{ fontSize: "12px", color: "#ef4444", marginBottom: "10px" }}>{error}</p>}

            <button
              className="ob-cta"
              onClick={handleStart}
              disabled={!targetScore || loading}
            >
              {loading ? "준비 중..." : "시작하기"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
