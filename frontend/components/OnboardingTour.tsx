"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

const TOUR_KEY = "sqld_tour_done";
const CARD_W = 260;
const CARD_H = 230;
const PAD = 6;

interface Step {
  eye: string;
  title: string;
  desc: string;
  target: string | null;
  arrow: "up" | "down" | "left" | "right" | null;
  cta?: boolean;
}

const M_STEPS: Step[] = [
  { eye: "", title: "가입을 환영해요! 👋",
    desc: "SQLD AI 튜터와 함께\n7가지 핵심 기능을 안내할게요.",
    target: null, arrow: null },
  { eye: "1 / 7  학습 현황", title: "학습 현황 패널",
    desc: "예상 점수, 목표 점수, 시험 D-day를\n여기서 한눈에 확인해요.",
    target: "stats-panel", arrow: "up" },
  { eye: "2 / 7  AI 학습", title: "AI 학습",
    desc: "맞춤 문제를 풀고 틀리면\nAI가 개념까지 설명해줘요.\n진단 → 약점 파악 → 적응형 출제.",
    target: "m-ai", arrow: "up" },
  { eye: "3 / 7  오답 회고", title: "오답 회고",
    desc: "틀린 문제를 다시 보고\nAI에게 추가 질문도 할 수 있어요.",
    target: "m-wrong", arrow: "up" },
  { eye: "4 / 7  모의고사", title: "모의고사",
    desc: "50문제 90분으로\n실전처럼 점수를 확인해봐요.\n과목별 점수와 해설도 제공돼요.",
    target: "m-exam", arrow: "up" },
  { eye: "5 / 7  오늘 할 일", title: "오늘 할 일 추천",
    desc: "AI가 취약한 부분을 분석해\n오늘 해야 할 학습 목록을 추천해요.",
    target: "m-todo", arrow: "up" },
  { eye: "6 / 7  카테고리 정답률", title: "카테고리 정답률",
    desc: "레이더 차트로 카테고리별 실력을\n한눈에 비교해요.",
    target: "m-radar", arrow: "up" },
  { eye: "7 / 7  학습 캘린더", title: "학습 캘린더",
    desc: "날짜별 학습 기록을 색상으로 표시해요.\n꾸준히 채울수록 합격이 가까워져요.",
    target: "m-cal", arrow: "up" },
  { eye: "시작", title: "먼저 진단을 받아봐요",
    desc: "8문제로 카테고리별 실력을 파악하고\nAI가 맞춤 학습 계획을 짜드려요.",
    target: null, arrow: null, cta: true },
];

const PC_STEPS: Step[] = [
  { eye: "", title: "가입을 환영해요! 👋",
    desc: "SQLD AI 튜터와 함께\n7가지 핵심 기능을 안내할게요.",
    target: null, arrow: null },
  { eye: "1 / 7  학습 현황", title: "학습 현황 패널",
    desc: "예상 점수, 목표 점수, 시험 D-day가\n왼쪽 패널에 표시돼요.\n진행 바로 목표까지 거리를 한눈에 확인해요.",
    target: "stats-panel", arrow: "left" },
  { eye: "2 / 7  AI 학습", title: "AI 학습",
    desc: "맞춤 문제를 풀고 틀리면\nAI가 개념까지 설명해줘요.\n진단 → 약점 파악 → 적응형 출제.",
    target: "pc-ai", arrow: "left" },
  { eye: "3 / 7  오답 회고", title: "오답 회고",
    desc: "틀린 문제를 다시 보고\nAI에게 추가 질문도 할 수 있어요.",
    target: "pc-wrong", arrow: "left" },
  { eye: "4 / 7  모의고사", title: "모의고사",
    desc: "50문제 90분으로 실전처럼\n점수를 확인해봐요.\n과목별 점수와 해설도 제공돼요.",
    target: "pc-exam", arrow: "left" },
  { eye: "5 / 7  카테고리 정답률", title: "카테고리 정답률",
    desc: "레이더 차트로 카테고리별 실력을\n한눈에 비교해요.",
    target: "pc-radar", arrow: "left" },
  { eye: "6 / 7  학습 캘린더", title: "학습 캘린더",
    desc: "날짜별 학습 기록을 색상으로 표시해요.",
    target: "pc-cal", arrow: "right" },
  { eye: "7 / 7  오늘 할 일", title: "오늘 할 일 추천",
    desc: "AI가 취약한 부분을 분석해\n오늘 해야 할 학습 목록을 추천해요.",
    target: "pc-todo", arrow: "right" },
  { eye: "시작", title: "먼저 진단을 받아봐요",
    desc: "8문제로 카테고리별 실력을 파악하고\nAI가 맞춤 학습 계획을 짜드려요.",
    target: null, arrow: null, cta: true },
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
    try { if (localStorage.getItem(TOUR_KEY)) return; } catch { return; }
    setIsMobile(window.innerWidth < 768);
    const t = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(t);
  }, []);

  const steps = isMobile ? M_STEPS : PC_STEPS;

  const measure = useCallback(() => {
    const step = steps[cur];

    if (!step.target) {
      setSpot(null);
      setCardState({ centered: true, top: 0, left: 0, arrow: null, arrowX: 22, arrowY: 22 });
      return;
    }

    const el = document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`);
    if (!el) return;

    el.scrollIntoView({ behavior: "instant", block: "start" });

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
        // left: card to the right; right: card to the left
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
  }, [cur, steps]);

  useEffect(() => { if (visible) measure(); }, [visible, cur, measure]);

  const finish = useCallback((goChat: boolean) => {
    try { localStorage.setItem(TOUR_KEY, "1"); } catch { /* ignore */ }
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
    <div style={{ position: "fixed", inset: 0, zIndex: 9998, fontFamily: "inherit" }}>
      {/* 배경 어둠: spotlight 없을 때는 전체 dim */}
      {!spot && <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.65)" }} />}

      {/* spotlight */}
      {spot && (
        <div style={{
          position: "absolute",
          top: spot.top, left: spot.left,
          width: spot.w, height: spot.h,
          borderRadius: 6,
          boxShadow: "0 0 0 9999px rgba(0,0,0,.65)",
          outline: "2px solid rgba(129,140,248,.85)",
          outlineOffset: 2,
          pointerEvents: "none",
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
        borderRadius: 14,
        padding: "20px 20px 16px",
        boxShadow: "0 16px 40px rgba(0,0,0,.22)",
        zIndex: 9999,
      }}>
        {/* 화살표 */}
        {!cardState.centered && cardState.arrow && (
          <div style={arrowStyle(cardState.arrow)} />
        )}

        {step.eye && (
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", color: "#818cf8", marginBottom: 6 }}>
            {step.eye}
          </p>
        )}
        <p style={{ fontSize: 17, fontWeight: 900, color: "#1c1917", lineHeight: 1.25, marginBottom: 8 }}>
          {step.title}
        </p>
        <p style={{ fontSize: 13, color: "#78716c", lineHeight: 1.65, whiteSpace: "pre-line" }}>
          {step.desc}
        </p>

        {step.cta ? (
          <div style={{ marginTop: 16 }}>
            <button
              onClick={() => finish(true)}
              style={{
                width: "100%", padding: 13,
                background: "#6366f1", color: "white",
                fontFamily: "inherit", fontSize: 13, fontWeight: 800,
                border: "none", borderRadius: 8, cursor: "pointer",
              }}
            >
              진단 시작하기 →
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16 }}>
            {/* 진행 점 */}
            <div style={{ display: "flex", gap: 5 }}>
              {steps.map((_, i) => (
                <div key={i} style={{
                  height: 6, borderRadius: 3,
                  width: i === cur ? 18 : 6,
                  background: i === cur ? "#6366f1" : "#e7e5e2",
                  transition: "all .25s",
                }} />
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button
                onClick={() => finish(false)}
                style={{ fontSize: 12, fontWeight: 500, color: "#a8a29e", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
              >
                건너뛰기
              </button>
              <button
                onClick={() => setCur(c => Math.min(c + 1, steps.length - 1))}
                style={{
                  fontSize: 13, fontWeight: 700,
                  color: "white", background: "#6366f1",
                  border: "none", borderRadius: 8,
                  padding: "9px 14px", cursor: "pointer", fontFamily: "inherit",
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
