"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const TOUR_KEY = "sqld_tour_done";
const PAD = 6;

interface Step {
  eye: string;
  title: string;
  desc: string;
  target: string | null;
  arrow: "up" | "down" | "left" | "right" | null;
  cta?: boolean;
  iconKey: string;
}

function StepIcon({ name, isMobile }: { name: string; isMobile: boolean }) {
  const size = isMobile ? 44 : 52;
  const c = "#6366f1";
  const bg = "#eef2ff";
  const p = { width: size, height: size, viewBox: "0 0 44 44", fill: "none" as const };

  const icons: Record<string, React.ReactNode> = {
    welcome: (
      <svg {...p}>
        <circle cx="22" cy="22" r="22" fill={bg} />
        <circle cx="22" cy="17" r="5.5" stroke={c} strokeWidth="2" />
        <path d="M11 35c0-5.5 4.9-9.5 11-9.5s11 4 11 9.5" stroke={c} strokeWidth="2" strokeLinecap="round" />
        <path d="M30 12l2.5-2.5M33.5 16l2.5-1" stroke={c} strokeWidth="1.8" strokeLinecap="round" opacity="0.55" />
      </svg>
    ),
    stats: (
      <svg {...p}>
        <circle cx="22" cy="22" r="22" fill={bg} />
        <rect x="10" y="27" width="6" height="9" rx="1.5" fill={c} opacity="0.3" />
        <rect x="19" y="20" width="6" height="16" rx="1.5" fill={c} opacity="0.6" />
        <rect x="28" y="13" width="6" height="23" rx="1.5" fill={c} />
      </svg>
    ),
    ai: (
      <svg {...p}>
        <circle cx="22" cy="22" r="22" fill={bg} />
        <rect x="9" y="13" width="22" height="15" rx="4" fill={c} opacity="0.15" stroke={c} strokeWidth="1.5" />
        <circle cx="15.5" cy="20.5" r="2" fill={c} />
        <circle cx="22" cy="20.5" r="2" fill={c} />
        <circle cx="28.5" cy="20.5" r="2" fill={c} />
        <path d="M15 28v4.5" stroke={c} strokeWidth="2" strokeLinecap="round" />
        <path d="M33.5 14c2.5 0 3.5 1.5 3.5 3.5s-1 3.5-3.5 3.5" stroke={c} strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      </svg>
    ),
    wrong: (
      <svg {...p}>
        <circle cx="22" cy="22" r="22" fill={bg} />
        <rect x="11" y="9" width="17" height="23" rx="2" stroke={c} strokeWidth="1.5" />
        <path d="M15.5 15.5h8M15.5 19.5h8M15.5 23.5h5" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="30.5" cy="32" r="6.5" fill="white" stroke={c} strokeWidth="1.5" />
        <path d="M28 32l2.5 2.5 4-4" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    exam: (
      <svg {...p}>
        <circle cx="22" cy="22" r="22" fill={bg} />
        <rect x="13" y="9" width="18" height="24" rx="2" stroke={c} strokeWidth="1.5" />
        <rect x="16" y="12" width="12" height="4" rx="1" fill={c} opacity="0.2" />
        <path d="M17 21h10M17 25h6" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
        <path d="M18 7.5h8" stroke={c} strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    todo: (
      <svg {...p}>
        <circle cx="22" cy="22" r="22" fill={bg} />
        <circle cx="14" cy="16" r="2.5" fill={c} opacity="0.3" />
        <circle cx="14" cy="22" r="2.5" fill={c} opacity="0.6" />
        <circle cx="14" cy="28" r="2.5" fill={c} />
        <path d="M19.5 16h12" stroke={c} strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
        <path d="M19.5 22h12" stroke={c} strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
        <path d="M19.5 28h12" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    radar: (
      <svg {...p}>
        <circle cx="22" cy="22" r="22" fill={bg} />
        <polygon points="22,10 33,29 11,29" stroke={c} strokeWidth="1.5" fill={c} opacity="0.12" strokeLinejoin="round" />
        <polygon points="22,15 29,27 15,27" fill={c} opacity="0.3" />
        <line x1="22" y1="10" x2="22" y2="29" stroke={c} strokeWidth="1" opacity="0.2" />
        <line x1="11" y1="29" x2="33" y2="29" stroke={c} strokeWidth="1" opacity="0.2" />
        <line x1="11" y1="29" x2="22" y2="10" stroke={c} strokeWidth="1" opacity="0.2" />
        <line x1="33" y1="29" x2="22" y2="10" stroke={c} strokeWidth="1" opacity="0.2" />
        <circle cx="22" cy="22" r="3" fill={c} />
      </svg>
    ),
    calendar: (
      <svg {...p}>
        <circle cx="22" cy="22" r="22" fill={bg} />
        <rect x="9" y="13" width="26" height="20" rx="2" stroke={c} strokeWidth="1.5" />
        <path d="M9 19h26" stroke={c} strokeWidth="1.5" opacity="0.35" />
        <path d="M15.5 10v5M28.5 10v5" stroke={c} strokeWidth="2" strokeLinecap="round" />
        <rect x="13" y="22" width="4" height="4" rx="1" fill={c} opacity="0.3" />
        <rect x="20" y="22" width="4" height="4" rx="1" fill={c} opacity="0.6" />
        <rect x="27" y="22" width="4" height="4" rx="1" fill={c} />
      </svg>
    ),
    rocket: (
      <svg {...p}>
        <circle cx="22" cy="22" r="22" fill={bg} />
        <path d="M22 9c6 3.5 9 9 9 14a9 9 0 01-18 0c0-5 3-10.5 9-14z" fill={c} opacity="0.2" stroke={c} strokeWidth="1.5" />
        <circle cx="22" cy="21" r="3.5" fill={c} />
        <path d="M17 32c-1 2.5-2.5 3.5-4.5 3.5" stroke={c} strokeWidth="1.5" strokeLinecap="round" opacity="0.45" />
        <path d="M27 32c1 2.5 2.5 3.5 4.5 3.5" stroke={c} strokeWidth="1.5" strokeLinecap="round" opacity="0.45" />
      </svg>
    ),
  };

  return <>{icons[name] ?? icons.welcome}</>;
}

const M_STEPS: Step[] = [
  { eye: "", title: "가입을 환영해요!",
    desc: "SQLD AI 튜터와 함께\n7가지 핵심 기능을 안내할게요.",
    target: null, arrow: null, iconKey: "welcome" },
  { eye: "1 / 7  학습 현황", title: "학습 현황 패널",
    desc: "예상 점수, 목표 점수, 시험 D-day를\n여기서 한눈에 확인해요.",
    target: "stats-panel", arrow: "up", iconKey: "stats" },
  { eye: "2 / 7  AI 학습", title: "AI 학습",
    desc: "맞춤 문제를 풀고 틀리면\nAI가 개념까지 설명해줘요.\n진단 → 약점 파악 → 적응형 출제.",
    target: "m-ai", arrow: "up", iconKey: "ai" },
  { eye: "3 / 7  오답 회고", title: "오답 회고",
    desc: "틀린 문제를 다시 보고\nAI에게 추가 질문도 할 수 있어요.",
    target: "m-wrong", arrow: "up", iconKey: "wrong" },
  { eye: "4 / 7  모의고사", title: "모의고사",
    desc: "50문제 90분으로\n실전처럼 점수를 확인해봐요.\n과목별 점수와 해설도 제공돼요.",
    target: "m-exam", arrow: "up", iconKey: "exam" },
  { eye: "5 / 7  오늘 할 일", title: "오늘 할 일 추천",
    desc: "AI가 취약한 부분을 분석해\n오늘 해야 할 학습 목록을 추천해요.",
    target: "m-todo", arrow: "up", iconKey: "todo" },
  { eye: "6 / 7  카테고리 정답률", title: "카테고리 정답률",
    desc: "레이더 차트로 카테고리별 실력을\n한눈에 비교해요.",
    target: "m-radar", arrow: "up", iconKey: "radar" },
  { eye: "7 / 7  학습 캘린더", title: "학습 캘린더",
    desc: "날짜별 학습 기록을 색상으로 표시해요.\n꾸준히 채울수록 합격이 가까워져요.",
    target: "m-cal", arrow: "up", iconKey: "calendar" },
  { eye: "시작", title: "먼저 진단을 받아봐요",
    desc: "8문제로 카테고리별 실력을 파악하고\nAI가 맞춤 학습 계획을 짜드려요.",
    target: null, arrow: null, cta: true, iconKey: "rocket" },
];

const PC_STEPS: Step[] = [
  { eye: "", title: "가입을 환영해요!",
    desc: "SQLD AI 튜터와 함께\n7가지 핵심 기능을 안내할게요.",
    target: null, arrow: null, iconKey: "welcome" },
  { eye: "1 / 7  학습 현황", title: "학습 현황 패널",
    desc: "예상 점수, 목표 점수, 시험 D-day가\n왼쪽 패널에 표시돼요.\n진행 바로 목표까지 거리를 한눈에 확인해요.",
    target: "stats-panel", arrow: "left", iconKey: "stats" },
  { eye: "2 / 7  AI 학습", title: "AI 학습",
    desc: "맞춤 문제를 풀고 틀리면\nAI가 개념까지 설명해줘요.\n진단 → 약점 파악 → 적응형 출제.",
    target: "pc-ai", arrow: "left", iconKey: "ai" },
  { eye: "3 / 7  오답 회고", title: "오답 회고",
    desc: "틀린 문제를 다시 보고\nAI에게 추가 질문도 할 수 있어요.",
    target: "pc-wrong", arrow: "left", iconKey: "wrong" },
  { eye: "4 / 7  모의고사", title: "모의고사",
    desc: "50문제 90분으로 실전처럼\n점수를 확인해봐요.\n과목별 점수와 해설도 제공돼요.",
    target: "pc-exam", arrow: "left", iconKey: "exam" },
  { eye: "5 / 7  카테고리 정답률", title: "카테고리 정답률",
    desc: "레이더 차트로 카테고리별 실력을\n한눈에 비교해요.",
    target: "pc-radar", arrow: "left", iconKey: "radar" },
  { eye: "6 / 7  학습 캘린더", title: "학습 캘린더",
    desc: "날짜별 학습 기록을 색상으로 표시해요.",
    target: "pc-cal", arrow: "right", iconKey: "calendar" },
  { eye: "7 / 7  오늘 할 일", title: "오늘 할 일 추천",
    desc: "AI가 취약한 부분을 분석해\n오늘 해야 할 학습 목록을 추천해요.",
    target: "pc-todo", arrow: "right", iconKey: "todo" },
  { eye: "시작", title: "먼저 진단을 받아봐요",
    desc: "8문제로 카테고리별 실력을 파악하고\nAI가 맞춤 학습 계획을 짜드려요.",
    target: null, arrow: null, cta: true, iconKey: "rocket" },
];

interface Spot { top: number; left: number; w: number; h: number }
interface CardState {
  centered: boolean;
  top: number; left: number;
  arrow: string | null;
  arrowX: number; arrowY: number;
}

export default function OnboardingTour() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(true);
  const [cur, setCur] = useState(0);
  const [spot, setSpot] = useState<Spot | null>(null);
  const [cardState, setCardState] = useState<CardState>({
    centered: true, top: 0, left: 0, arrow: null, arrowX: 22, arrowY: 22,
  });

  useEffect(() => {
    let cancelled = false;
    async function check() {
      try { if (localStorage.getItem(TOUR_KEY)) return; } catch {}

      // 기존 회원(onboarding_completed: true)은 투어 스킵 + localStorage 채움
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (data.user?.user_metadata?.onboarding_completed === true) {
        try { localStorage.setItem(TOUR_KEY, "1"); } catch {}
        return;
      }

      if (cancelled) return;
      setIsMobile(window.innerWidth < 768);
      setTimeout(() => { if (!cancelled) setVisible(true); }, 800);
    }
    check();
    return () => { cancelled = true; };
  }, []);

  // Lock body scroll while tour is active
  useEffect(() => {
    if (!visible) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [visible]);

  const steps = isMobile ? M_STEPS : PC_STEPS;
  const CARD_W = isMobile ? 300 : 420;
  const CARD_H = isMobile ? 340 : 400;

  const measure = useCallback(() => {
    const step = steps[cur];

    if (!step.target) {
      setSpot(null);
      setCardState({ centered: true, top: 0, left: 0, arrow: null, arrowX: 22, arrowY: 22 });
      return;
    }

    const el = document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`);
    if (!el) return;

    // Temporarily lift scroll lock so scrollIntoView can reposition
    document.body.style.overflow = "";
    el.scrollIntoView({ behavior: "instant", block: "center" });
    document.body.style.overflow = "hidden";

    requestAnimationFrame(() => {
      const r = el.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      setSpot({ top: r.top - PAD, left: r.left - PAD, w: r.width + PAD * 2, h: r.height + PAD * 2 });

      let top = 0, left = 0, arrowX = 22, arrowY = 22;
      let arrow = step.arrow as string;

      if (arrow === "up" || arrow === "down") {
        if (arrow === "up") {
          top = r.bottom + 14;
          if (top + CARD_H > vh - 8) { top = r.top - CARD_H - 14; arrow = "down"; }
        } else {
          top = r.top - CARD_H - 14;
          if (top < 8) { top = r.bottom + 14; arrow = "up"; }
        }
        top = Math.max(8, Math.min(vh - CARD_H - 8, top));
        left = Math.max(12, Math.min(vw - CARD_W - 12, r.left + r.width / 2 - CARD_W / 2));
        arrowX = Math.max(10, Math.min(CARD_W - 26, r.left + r.width / 2 - left));
      } else {
        if (arrow === "left") {
          left = r.right + 14;
          if (left + CARD_W > vw - 8) { left = r.left - CARD_W - 14; arrow = "right"; }
        } else {
          left = r.left - CARD_W - 14;
          if (left < 8) { left = r.right + 14; arrow = "left"; }
        }
        left = Math.max(8, Math.min(vw - CARD_W - 8, left));
        top = Math.max(8, Math.min(vh - CARD_H - 8, r.top + r.height / 2 - CARD_H / 2));
        arrowY = Math.max(10, Math.min(CARD_H - 26, r.top + r.height / 2 - top));
      }

      setCardState({ centered: false, top, left, arrow, arrowX, arrowY });
    });
  }, [cur, steps, CARD_W, CARD_H]);

  useEffect(() => { if (visible) measure(); }, [visible, cur, measure]);

  const finish = useCallback((goChat: boolean) => {
    try { localStorage.setItem(TOUR_KEY, "1"); } catch {}
    setVisible(false);
    if (goChat) router.push("/chat?new=true");
  }, [router]);

  if (!visible) return null;

  const step = steps[cur];

  const arrowStyle = (dir: string): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: "absolute", width: 12, height: 12,
      background: "white", transform: "rotate(45deg)",
    };
    if (dir === "up")    return { ...base, top: -6, left: cardState.arrowX, boxShadow: "-2px -2px 5px rgba(0,0,0,.06)" };
    if (dir === "down")  return { ...base, bottom: -6, left: cardState.arrowX, boxShadow: "2px 2px 5px rgba(0,0,0,.06)" };
    if (dir === "left")  return { ...base, left: -6, top: cardState.arrowY, boxShadow: "-2px 2px 5px rgba(0,0,0,.06)" };
    if (dir === "right") return { ...base, right: -6, top: cardState.arrowY, boxShadow: "2px -2px 5px rgba(0,0,0,.06)" };
    return base;
  };

  return (
    // touchAction:none prevents native scroll gesture on mobile while overlay is up
    <div style={{ position: "fixed", inset: 0, zIndex: 9998, fontFamily: "inherit", touchAction: "none" }}>
      {!spot && <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.65)" }} />}

      {/* spotlight — pointer-events:auto so touches don't pass through to the page */}
      {spot && (
        <div style={{
          position: "absolute",
          top: spot.top, left: spot.left,
          width: spot.w, height: spot.h,
          borderRadius: 6,
          boxShadow: "0 0 0 9999px rgba(0,0,0,.65)",
          outline: "2px solid rgba(129,140,248,.85)",
          outlineOffset: 2,
          pointerEvents: "auto",
          cursor: "default",
        }} />
      )}

      {/* 말풍선 카드 */}
      <div style={{
        position: "absolute",
        ...(cardState.centered
          ? { top: "50%", left: "50%", transform: "translate(-50%, -50%)" }
          : { top: cardState.top, left: cardState.left }),
        width: CARD_W,
        background: "white",
        borderRadius: 20,
        padding: isMobile ? "24px 24px 20px" : "34px 34px 28px",
        boxShadow: "0 20px 60px rgba(0,0,0,.25)",
        zIndex: 9999,
      }}>
        {!cardState.centered && cardState.arrow && (
          <div style={arrowStyle(cardState.arrow)} />
        )}

        {/* 일러스트 아이콘 */}
        <div style={{ marginBottom: isMobile ? 14 : 18 }}>
          <StepIcon name={step.iconKey} isMobile={isMobile} />
        </div>

        {step.eye && (
          <p style={{ fontSize: isMobile ? 11 : 13, fontWeight: 700, letterSpacing: ".1em", color: "#818cf8", marginBottom: isMobile ? 7 : 9, textTransform: "uppercase" }}>
            {step.eye}
          </p>
        )}
        <p style={{ fontSize: isMobile ? 20 : 26, fontWeight: 900, color: "#1c1917", lineHeight: 1.25, marginBottom: isMobile ? 9 : 11 }}>
          {step.title}
        </p>
        <p style={{ fontSize: isMobile ? 14 : 17, color: "#78716c", lineHeight: 1.75, whiteSpace: "pre-line" }}>
          {step.desc}
        </p>

        {step.cta ? (
          <div style={{ marginTop: isMobile ? 20 : 28 }}>
            <button
              onClick={() => finish(true)}
              style={{
                width: "100%", padding: isMobile ? "14px" : "18px",
                background: "#6366f1", color: "white",
                fontFamily: "inherit", fontSize: isMobile ? 15 : 18, fontWeight: 800,
                border: "none", borderRadius: 12, cursor: "pointer",
              }}
            >
              진단 시작하기 →
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: isMobile ? 20 : 28 }}>
            <div style={{ display: "flex", gap: 5 }}>
              {steps.map((_, i) => (
                <div key={i} style={{
                  height: 6, borderRadius: 3,
                  width: i === cur ? 20 : 6,
                  background: i === cur ? "#6366f1" : "#e7e5e2",
                  transition: "all .25s",
                }} />
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button
                onClick={() => finish(false)}
                style={{ fontSize: isMobile ? 13 : 14, fontWeight: 500, color: "#a8a29e", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
              >
                건너뛰기
              </button>
              <button
                onClick={() => setCur(c => Math.min(c + 1, steps.length - 1))}
                style={{
                  fontSize: isMobile ? 14 : 16, fontWeight: 700,
                  color: "white", background: "#6366f1",
                  border: "none", borderRadius: 10,
                  padding: isMobile ? "10px 18px" : "12px 26px", cursor: "pointer", fontFamily: "inherit",
                }}
              >
                {cur === steps.length - 2 ? "마지막 →" : "다음 →"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
