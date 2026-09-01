'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const CSS = `
:root{--accent:#dde1fb;--accent-h:#6366f1;--fg:#1c1917;--fg-2:#57534e;--fg-3:#a8a29e;--bg:#fafaf9;--bg-2:#eeece9;--bd:#e2e0dd;--badge-cat-bg:#e0e7ff;--badge-cat-fg:#3730a3;--badge-dif-bg:#dcfce7;--badge-dif-fg:#166534;--ok-bg:#f0fdf4;--ok-bd:#16a34a;--ok-fg:#15803d}
@media(prefers-color-scheme:dark){:root:not([data-theme="light"]){--fg:#f5f4f3;--fg-2:#a8a29e;--fg-3:#78716c;--bg:#1c1917;--bg-2:#252220;--bd:#3a3330;--badge-cat-bg:rgba(129,140,248,.18);--badge-cat-fg:#a5b4fc;--badge-dif-bg:rgba(22,163,74,.15);--badge-dif-fg:#4ade80;--ok-bg:rgba(22,163,74,.12);--ok-bd:#22c55e;--ok-fg:#4ade80}}
:root[data-theme="dark"]{--fg:#f5f4f3;--fg-2:#a8a29e;--fg-3:#78716c;--bg:#1c1917;--bg-2:#252220;--bd:#3a3330;--badge-cat-bg:rgba(129,140,248,.18);--badge-cat-fg:#a5b4fc;--badge-dif-bg:rgba(22,163,74,.15);--badge-dif-fg:#4ade80;--ok-bg:rgba(22,163,74,.12);--ok-bd:#22c55e;--ok-fg:#4ade80}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
.lp-root{font-family:'Apple SD Gothic Neo','Malgun Gothic','Noto Sans KR',sans-serif;background:var(--bg);color:var(--fg);-webkit-font-smoothing:antialiased}
.nav{position:sticky;top:0;z-index:100;height:52px;background:#dde1fb;display:flex;align-items:center;justify-content:space-between;padding:0 40px;border-bottom:1px solid rgba(129,140,248,.2)}
.nav-brand{display:flex;align-items:center;gap:8px;text-decoration:none;color:#3730a3}
.nav-icon{width:24px;height:24px;background:rgba(99,102,241,.15);display:flex;align-items:center;justify-content:center}
.nav-name{font-size:15px;font-weight:700;letter-spacing:-.01em}
.nav-login{font-size:12px;font-weight:600;color:#4f46e5;text-decoration:none;padding:5px 14px;border:1px solid rgba(99,102,241,.35);transition:background .15s,color .15s}
.nav-login:hover{background:rgba(99,102,241,.1);color:#3730a3}
.nav.glass{background:rgba(221,225,251,.75);backdrop-filter:blur(18px) saturate(200%);-webkit-backdrop-filter:blur(18px) saturate(200%);box-shadow:0 1px 0 rgba(129,140,248,.2),0 4px 28px rgba(79,70,229,.06)}
.hero{display:grid;grid-template-columns:1fr 1fr;min-height:calc(100vh - 52px)}
.hero-l{background:var(--accent);padding:80px 60px;display:flex;flex-direction:column;justify-content:center}
.eyebrow{font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:rgba(55,48,163,.6);margin-bottom:28px}
.hero-h1{font-size:clamp(32px,3.4vw,48px);font-weight:600;line-height:1.1;letter-spacing:-.025em;color:#1c1917;text-wrap:balance;margin-bottom:24px}
.hero-sub{font-size:17px;line-height:1.8;color:#57534e;max-width:380px;margin-bottom:44px}
.hero-sub strong{color:#1c1917;font-weight:700}
.btn-glow-wrap{position:relative;display:inline-block;align-self:flex-start}
.btn-glow{position:absolute;inset:-7px;background:rgba(99,102,241,.35);filter:blur(16px);animation:glowPulse 2.4s ease-in-out infinite;z-index:0;pointer-events:none}
@keyframes glowPulse{0%,100%{opacity:.5;transform:scale(1)}50%{opacity:1;transform:scale(1.08)}}
.btn-primary{position:relative;z-index:1;display:inline-flex;align-items:center;gap:8px;background:#6366f1;color:#fff;font-size:16px;font-weight:700;padding:14px 32px;text-decoration:none;border:2px solid #6366f1;transition:background .15s,border-color .15s}
.btn-primary:hover{background:#4f46e5;border-color:#4f46e5}
.hero-note{margin-top:24px;font-size:13px;color:rgba(55,48,163,.45)}
.btn-ghost{display:inline-flex;align-items:center;gap:6px;margin-top:12px;font-size:14px;font-weight:600;color:rgba(55,48,163,.6);text-decoration:none;padding:8px 0;border-bottom:1px dashed rgba(99,102,241,.3);transition:color .15s,border-color .15s}
.btn-ghost:hover{color:#4f46e5;border-bottom-color:#6366f1}
.btn-outline{position:relative;z-index:1;display:inline-flex;align-items:center;gap:8px;background:transparent;color:#6366f1;font-size:16px;font-weight:700;padding:14px 32px;text-decoration:none;border:2px solid #6366f1;transition:background .15s,color .15s}
.btn-outline:hover{background:#6366f1;color:#fff}
.btn-cta-outline{display:inline-block;background:transparent;color:#6366f1;font-size:16px;font-weight:700;padding:16px 44px;text-decoration:none;border:2px solid #6366f1;transition:background .15s,color .15s;margin-left:16px}
.btn-cta-outline:hover{background:#6366f1;color:#fff}
.hero-cta-group{display:flex;flex-wrap:wrap;align-items:center;gap:12px;margin-top:0}
.cta-btn-group{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:16px;margin-top:8px}
.hero-r{background:var(--bg-2);display:flex;align-items:center;justify-content:center;padding:36px 36px}
.cm{width:100%;background:var(--bg);border:1px solid var(--bd);box-shadow:0 8px 32px rgba(0,0,0,.09)}
.cm-bar{background:var(--accent);padding:10px 14px;display:flex;align-items:center;gap:6px}
.cm-dot{width:7px;height:7px;border-radius:50%;background:rgba(99,102,241,.35)}
.cm-title{font-size:12px;font-weight:600;color:#3730a3;margin-left:4px}
.cm-sqlbtn{margin-left:auto;font-size:9px;font-weight:700;letter-spacing:.05em;background:rgba(99,102,241,.1);color:#4f46e5;border:1px solid rgba(99,102,241,.25);padding:3px 9px;cursor:pointer;font-family:inherit;transition:background .2s,color .2s}
.cm-sqlbtn.hov{background:rgba(99,102,241,.18);color:#3730a3}
.cm-sqlbtn.on{background:#fff;color:var(--accent-h)}
#cm-chat{display:flex;flex-direction:column}
.cm-body{height:420px;overflow-y:auto;overflow-x:hidden;padding:14px;display:flex;flex-direction:column;gap:8px;scroll-behavior:smooth}
.cm-body::-webkit-scrollbar{width:3px}
.cm-body::-webkit-scrollbar-thumb{background:var(--bd)}
.cm-foot{border-top:1px solid var(--bd);padding:8px 10px;display:flex;align-items:center;gap:8px;background:var(--bg)}
.cm-inp-wrap{flex:1;background:var(--bg-2);border:1px solid var(--bd);padding:6px 10px;display:flex;align-items:center;min-height:30px}
#cm-inp{flex:1;font-size:12px;line-height:1.5;color:var(--fg);font-family:inherit}
.cm-cur{display:inline-block;width:1.5px;height:13px;background:#6366f1;margin-left:1px;vertical-align:text-bottom;animation:blink .7s step-end infinite}
@keyframes blink{50%{opacity:0}}
.cm-send{width:30px;height:30px;background:#6366f1;border:none;display:flex;align-items:center;justify-content:center;flex-shrink:0;cursor:pointer;color:#fff}
#cm-pg{display:none;flex-direction:column;height:470px;overflow:hidden;border-top:1px solid var(--bd)}
.pg-hdr{background:var(--bg-2);border-bottom:1px solid var(--bd);padding:8px 13px;display:flex;align-items:center;justify-content:space-between}
.pg-hdr-l{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--fg-3)}
.pg-hdr-r{font-size:10px;color:var(--fg-3)}
.pg-editor{padding:11px 13px;background:var(--bg);border-bottom:1px solid var(--bd)}
#pg-code{font-family:'SF Mono','Fira Code',monospace;font-size:11.5px;line-height:1.75;color:var(--fg);min-height:54px}
.pg-kw{color:var(--accent-h);font-weight:700}
.pg-run-row{margin-top:9px;display:flex;align-items:center;gap:8px}
#pg-run{background:#6366f1;color:#fff;border:none;padding:5px 14px;font-size:11px;font-weight:700;font-family:inherit;cursor:pointer;letter-spacing:.03em;transition:filter .12s,transform .12s}
#pg-run.click{filter:brightness(.8);transform:scale(.96)}
.pg-results{opacity:0;transition:opacity .45s}
.pg-results.vis{opacity:1}
.pg-res-hdr{background:var(--bg-2);padding:5px 13px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--fg-3);border-bottom:1px solid var(--bd);border-top:1px solid var(--bd)}
.pg-tbl{width:100%;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}
.pg-tbl th{padding:5px 13px;font-size:10px;font-weight:700;color:var(--fg-3);text-transform:uppercase;letter-spacing:.04em;border-bottom:1px solid var(--bd);text-align:left}
.pg-tbl td{padding:5px 13px;color:var(--fg);border-bottom:1px solid var(--bd)}
.pg-tbl tr:last-child td{border-bottom:none}
.cm-user{align-self:flex-end;background:var(--accent);color:#3730a3;font-size:12px;padding:7px 11px;max-width:82%;word-break:keep-all;animation:popIn .2s ease-out}
@keyframes popIn{from{transform:scale(.92);opacity:0}to{transform:scale(1);opacity:1}}
.cm-ai{align-self:flex-start;max-width:94%;opacity:0;transform:translateY(4px);transition:opacity .3s,transform .3s}
.cm-ai.vis{opacity:1;transform:none}
.cm-dots{align-self:flex-start;display:flex;gap:3px;align-items:center;padding:8px 12px;background:var(--bg-2);border:1px solid var(--bd)}
.cm-dots span{width:4px;height:4px;border-radius:50%;background:var(--fg-3);animation:dot 1.1s ease-in-out infinite}
.cm-dots span:nth-child(2){animation-delay:.18s}
.cm-dots span:nth-child(3){animation-delay:.36s}
@keyframes dot{0%,60%,100%{transform:translateY(0);opacity:.4}30%{transform:translateY(-5px);opacity:1}}
.cm-q{display:flex;flex-direction:column;gap:7px}
.cm-bdgs{display:flex;gap:5px}
.cm-bdg{font-size:10px;font-weight:700;padding:2px 7px;letter-spacing:.03em}
.cm-bdg.cat{background:var(--badge-cat-bg);color:var(--badge-cat-fg)}
.cm-bdg.dif{background:var(--badge-dif-bg);color:var(--badge-dif-fg)}
.cm-qt{font-size:12px;line-height:1.55;color:var(--fg)}
.cm-opts{display:flex;flex-direction:column;gap:4px}
.cm-opt{display:flex;align-items:flex-start;gap:7px;padding:6px 9px;border:1px solid var(--bd);font-size:11px;line-height:1.45;color:var(--fg-2);background:var(--bg);position:relative;overflow:hidden;cursor:pointer;transition:background .2s,border-color .2s,color .2s}
.cm-opt em{font-style:normal;font-weight:700;font-size:10px;min-width:12px;flex-shrink:0;margin-top:1px}
.cm-opt.hov{background:var(--bg-2);border-color:var(--accent)}
.cm-opt.chosen{border-color:var(--ok-bd);background:var(--ok-bg);color:var(--ok-fg);font-weight:600}
.rpl{position:absolute;width:16px;height:16px;border-radius:50%;background:rgba(129,140,248,.3);transform:scale(0);top:50%;left:12px;margin-top:-8px;pointer-events:none;transition:transform .4s ease-out,opacity .4s ease-out;opacity:1}
.rpl.go{transform:scale(9);opacity:0}
.cm-ok{font-size:12px;font-weight:600;color:var(--ok-fg);background:var(--ok-bg);border:1px solid var(--ok-bd);padding:7px 11px;display:flex;align-items:center;gap:5px}
.cm-exp{border:1px solid rgba(129,140,248,.28);background:rgba(129,140,248,.07);padding:10px 12px;margin-top:6px}
.cm-exp-lbl{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#6366f1;margin-bottom:5px}
.cm-exp-txt{font-size:12px;line-height:1.7;color:var(--fg)}
.cm-txt{background:var(--bg-2);border:1px solid var(--bd);padding:10px 12px;font-size:12px;line-height:1.7;color:var(--fg)}
.cm-sql-bubble{border:1px solid var(--bd);overflow:hidden}
.cm-sql-bubble-h{background:var(--bg-2);padding:6px 12px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--fg-3);border-bottom:1px solid var(--bd);display:flex;align-items:center;justify-content:space-between}
.cm-ok-tag{color:var(--ok-fg);font-weight:700;text-transform:none;letter-spacing:0;font-size:10px}
.cm-res-cap{background:var(--bg-2);padding:5px 12px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--fg-3);border-bottom:1px solid var(--bd)}
.cm-res-tbl{width:100%;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}
.cm-res-tbl th{padding:5px 12px;font-size:10px;font-weight:700;color:var(--fg-3);text-transform:uppercase;letter-spacing:.04em;border-bottom:1px solid var(--bd);text-align:left}
.cm-res-tbl td{padding:5px 12px;color:var(--fg);border-bottom:1px solid var(--bd)}
.cm-res-tbl tr:last-child td{border-bottom:none}
.cm-tbl-wrap{opacity:0;transition:opacity .45s}
.cm-tbl-wrap.vis{opacity:1}
.wrap{max-width:1100px;margin:0 auto;padding:96px 56px}
.wrap-alt{background:var(--bg-2)}
.sec-label{font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--fg-3);margin-bottom:48px}
.sec-title{font-size:clamp(32px,3.2vw,44px);font-weight:900;letter-spacing:-.025em;line-height:1.15;text-wrap:balance;margin-top:14px}
.pain-grid{display:grid;grid-template-columns:repeat(3,1fr);border-top:2px solid var(--bd)}
.pain-item{padding:40px 40px 40px 0;border-right:1px solid var(--bd)}
.pain-item:last-child{border-right:none}
.pain-item+.pain-item{padding-left:40px}
.pain-q{font-size:19px;font-weight:700;line-height:1.45;margin-bottom:10px;text-wrap:balance}
.pain-desc{font-size:15px;line-height:1.65;color:var(--fg-2)}
.steps-grid{display:grid;grid-template-columns:repeat(3,1fr);border-top:2px solid var(--bd);margin-top:56px}
.step{padding:40px 40px 40px 0;border-right:1px solid var(--bd)}
.step:last-child{border-right:none}
.step+.step{padding-left:40px}
.step-n{font-size:52px;font-weight:900;line-height:1;color:#6366f1;font-variant-numeric:tabular-nums;margin-bottom:20px}
.step-t{font-size:19px;font-weight:700;line-height:1.3;margin-bottom:10px}
.step-d{font-size:15px;line-height:1.65;color:var(--fg-2)}
.feat-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:1px;background:var(--bd);border:1px solid var(--bd);margin-top:56px}
.feat-card{background:var(--bg);padding:40px;transition:transform .25s ease,box-shadow .25s ease;transform-style:preserve-3d;will-change:transform}
.feat-card:hover{box-shadow:0 20px 60px rgba(79,70,229,.1)}
.xfeat-card{transition:transform .25s ease,box-shadow .25s ease;transform-style:preserve-3d;will-change:transform}
.xfeat-card:hover{box-shadow:0 16px 48px rgba(79,70,229,.08)}
.feat-big{font-size:52px;font-weight:900;line-height:1;color:#6366f1;letter-spacing:-.02em;font-variant-numeric:tabular-nums}
.feat-big span{font-size:20px;color:var(--fg-3);font-weight:700}
.feat-t{font-size:18px;font-weight:700;margin:16px 0 8px}
.feat-d{font-size:15px;line-height:1.6;color:var(--fg-2)}
.xfeat-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:1px;background:var(--bd);border:1px solid var(--bd);border-top:none}
.xfeat-card{background:var(--bg-2);padding:32px 36px;display:flex;flex-direction:column;gap:14px}
.xfeat-icon{width:36px;height:36px;background:rgba(129,140,248,.1);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.xfeat-t{font-size:17px;font-weight:700}
.xfeat-d{font-size:15px;line-height:1.65;color:var(--fg-2)}
.trust{border-top:1px solid var(--bd);max-width:1100px;margin:0 auto;padding:28px 56px;display:flex;align-items:center;gap:12px}
.trust-line{width:24px;height:1px;background:var(--bd);flex-shrink:0}
.trust-text{font-size:13px;color:var(--fg-3)}
.cta-sec{background:var(--accent);padding:96px 56px;text-align:center}
.cta-label{font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:rgba(55,48,163,.6);margin-bottom:20px}
.cta-h{font-size:clamp(36px,4vw,54px);font-weight:900;color:#1c1917;letter-spacing:-.025em;text-wrap:balance;margin-bottom:14px;text-shadow:1px 1px 0 rgba(49,46,129,.2),2px 2px 0 rgba(49,46,129,.13),3px 3px 0 rgba(49,46,129,.08)}
.cta-sub{font-size:17px;color:#57534e;margin-bottom:44px}
.btn-cta{display:inline-block;background:#6366f1;color:#fff;font-size:16px;font-weight:700;padding:16px 44px;text-decoration:none;border:2px solid #6366f1;transition:background .15s,border-color .15s}
.btn-cta:hover{background:#4f46e5;border-color:#4f46e5}
.cta-login{display:block;margin-top:16px;font-size:14px;color:rgba(55,48,163,.5);text-decoration:none}
.cta-login:hover{color:rgba(55,48,163,.85)}
.lp-footer{background:var(--bg);border-top:1px solid var(--bd);padding:20px 56px;display:flex;align-items:center;justify-content:space-between}
.footer-l{font-size:13px;color:var(--fg-3)}
.footer-a{font-size:13px;color:var(--fg-3);text-decoration:none}
.footer-a:hover{color:var(--fg)}
.reviews{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--bd);border:1px solid var(--bd);margin-top:56px}
.review-card{background:var(--bg);padding:36px 32px;display:flex;flex-direction:column;gap:0}
.review-stars{color:#818cf8;font-size:15px;letter-spacing:3px;margin-bottom:18px}
.review-q{font-size:15px;line-height:1.75;color:var(--fg);flex:1;margin-bottom:24px}
.review-q::before{content:'\\201C'}.review-q::after{content:'\\201D'}
.review-meta{display:flex;align-items:center;gap:12px}
.review-avatar{width:34px;height:34px;border-radius:50%;background:#6366f1;color:#fff;font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.review-name{font-size:14px;font-weight:700;color:var(--fg)}
.review-role{font-size:12px;color:var(--fg-3);margin-top:2px}
.faq{border-top:2px solid var(--bd);margin-top:56px}
.faq-item{padding:28px 0;border-bottom:1px solid var(--bd);display:grid;grid-template-columns:auto 1fr;gap:12px 16px;align-items:start}
.faq-badge{font-size:9px;font-weight:700;letter-spacing:.06em;color:#fff;background:#6366f1;padding:3px 7px;flex-shrink:0;margin-top:3px}
.faq-q{font-size:17px;font-weight:700;color:var(--fg);line-height:1.4}
.faq-a{font-size:15px;line-height:1.75;color:var(--fg-2);grid-column:2}
.reveal{opacity:0;transform:translateY(52px);transition:opacity .7s cubic-bezier(0.22,1,0.36,1),transform .7s cubic-bezier(0.22,1,0.36,1)}
.reveal.in{opacity:1;transform:none}
.hero-l{position:relative}
.scroll-hint{position:absolute;bottom:28px;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:-8px;opacity:0;animation:shAppear .5s ease 2.2s forwards;pointer-events:none;transition:opacity .4s ease}
.scroll-hint.hide{opacity:0!important}
.scroll-hint svg:nth-child(1){animation:shWave 1.6s ease-in-out 2.2s infinite;opacity:.25}
.scroll-hint svg:nth-child(2){animation:shWave 1.6s ease-in-out 2.45s infinite;opacity:.5}
.scroll-hint svg:nth-child(3){animation:shWave 1.6s ease-in-out 2.7s infinite;opacity:.8}
@keyframes shAppear{to{opacity:1}}
@keyframes shWave{0%,100%{transform:translateY(0)}50%{transform:translateY(6px)}}
@media(max-width:820px){
  .hero{grid-template-columns:1fr}.hero-l{padding:48px 24px 64px}.hero-r{display:none}
  .wrap{padding:52px 20px}.sec-title{font-size:clamp(26px,6vw,36px)}
  .pain-grid,.steps-grid{grid-template-columns:1fr}
  .pain-item{padding:20px 0;border-right:none;border-bottom:1px solid var(--bd)}.pain-item:last-child{border-bottom:none}.pain-item+.pain-item{padding-left:0}
  .pain-q{font-size:16px}.pain-desc{font-size:14px}
  .step{padding:20px 0;border-right:none;border-bottom:1px solid var(--bd)}.step:last-child{border-bottom:none}.step+.step{padding-left:0}
  .step-n{font-size:36px;margin-bottom:12px}.step-t{font-size:16px}.step-d{font-size:14px}
  .feat-grid{grid-template-columns:repeat(2,1fr)}.feat-card{padding:24px 20px}
  .feat-big{font-size:36px}.feat-t{font-size:15px;margin:10px 0 6px}.feat-d{font-size:13px}
  .xfeat-grid{grid-template-columns:repeat(2,1fr)}.xfeat-card{padding:20px}
  .xfeat-t{font-size:14px}.xfeat-d{font-size:13px}
  .reviews{grid-template-columns:repeat(2,1fr)}.review-card{padding:24px 20px}
  .review-q{font-size:13px;margin-bottom:16px}
  .cta-sec{padding:56px 24px}.trust{padding:20px 24px}
  .lp-footer{padding:20px 24px;flex-direction:column;gap:10px;text-align:center}.nav{padding:0 20px}
  .faq-item{grid-template-columns:auto 1fr}.faq-q{font-size:15px}.faq-a{font-size:14px}
  .steps-grid{margin-top:36px}
}
@media(prefers-reduced-motion:reduce){
  .cm-ai,.rpl,.cm-tbl-wrap,.pg-results{transition:none}
  .cm-cur{animation:none;opacity:1}.cm-dots span{animation:none;opacity:.5}
}
.pain-line{display:inline-block;font-size:13px;font-weight:600;background:rgba(249,115,22,.1);color:#c2410c;padding:4px 10px;margin-bottom:20px;border-left:3px solid #f97316}
.hl{display:inline;background:rgba(99,102,241,.18);color:#3730a3;padding:0 4px;font-style:normal}
.scenario-grid-3{display:grid;grid-template-columns:repeat(3,1fr);border-top:2px solid var(--bd)}
.scenario-card{padding:40px 40px 40px 0;border-right:1px solid var(--bd)}
.scenario-card:last-child{border-right:none}
.scenario-card+.scenario-card{padding-left:40px}
.sc-situation{font-size:10px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--fg-3);padding-bottom:12px;border-bottom:1px solid var(--bd);margin-bottom:16px}
.sc-title{font-size:18px;font-weight:700;color:var(--fg);line-height:1.4;margin-bottom:16px}
.sc-mini-chat{display:flex;flex-direction:column;gap:6px}
.sc-user{align-self:flex-end;background:var(--accent);color:#3730a3;font-size:12px;padding:7px 11px;max-width:85%;line-height:1.5}
.sc-ai{align-self:flex-start;background:var(--bg-2);border:1px solid var(--bd);font-size:12px;padding:8px 11px;max-width:90%;line-height:1.65;color:var(--fg-2)}
.trust-num-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--bd);border:1px solid var(--bd)}
.trust-num-card{background:var(--bg);padding:36px 32px;display:flex;flex-direction:column;gap:8px}
.trust-big{font-size:48px;font-weight:900;letter-spacing:-.04em;color:#6366f1;line-height:1;font-variant-numeric:tabular-nums}
.trust-big span{font-size:20px;color:var(--fg-3);font-weight:700}
.trust-card-label{font-size:15px;font-weight:700;color:var(--fg)}
.trust-card-sub{font-size:14px;color:var(--fg-2);line-height:1.55}
.dev-quote-card{background:var(--accent);padding:36px 40px;display:flex;align-items:flex-start;gap:28px;border:1px solid rgba(99,102,241,.2);margin-top:1px}
.dev-avatar-icon{width:52px;height:52px;background:#6366f1;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.dev-text-group{display:flex;flex-direction:column;gap:8px}
.dev-badge{display:inline-flex;align-items:center;gap:6px;background:rgba(22,163,74,.15);color:#15803d;border:1px solid rgba(22,163,74,.3);font-size:11px;font-weight:700;padding:3px 10px;letter-spacing:.04em;align-self:flex-start}
.dev-quote-text{font-size:17px;font-weight:700;line-height:1.55;color:#1c1917;text-wrap:balance}
.dev-role{font-size:13px;color:rgba(55,48,163,.55)}
@media(max-width:820px){
  .scenario-grid-3{grid-template-columns:1fr}
  .scenario-card{padding:20px 0;border-right:none;border-bottom:1px solid var(--bd)}.scenario-card:last-child{border-bottom:none}.scenario-card+.scenario-card{padding-left:0}
  .sc-title{font-size:15px}
  .trust-num-grid{grid-template-columns:1fr}
  .trust-big{font-size:36px}.trust-card-label{font-size:14px}
  .dev-quote-card{flex-direction:column;gap:16px;padding:28px 20px}
  .dev-quote-text{font-size:15px}
}
`;

export default function LandingPage() {
  useEffect(() => {
    let aborted = false;

    /* ── primitives ── */
    function wait(ms: number) { return new Promise<void>(ok => setTimeout(ok, ms)); }
    function rnd(lo: number, hi: number) { return lo + Math.floor(Math.random() * (hi - lo + 1)); }

    const msgBody = document.getElementById('cm-body') as HTMLElement;
    const inp     = document.getElementById('cm-inp') as HTMLElement;
    const chatEl  = document.getElementById('cm-chat') as HTMLElement;
    const pgEl    = document.getElementById('cm-pg') as HTMLElement;
    const sqlBtn  = document.getElementById('cm-sqlbtn') as HTMLElement;
    const pgCode  = document.getElementById('pg-code') as HTMLElement;
    const pgRun   = document.getElementById('pg-run') as HTMLElement;
    const pgRes   = document.getElementById('pg-results') as HTMLElement;

    if (!msgBody) return;

    function scrollEnd() { msgBody.scrollTo({ top: 99999, behavior: 'smooth' }); }

    function cursor() {
      inp.innerHTML = '';
      const c = document.createElement('span');
      c.className = 'cm-cur';
      inp.appendChild(c);
      return c;
    }

    async function typeIn(text: string) {
      const c = cursor();
      for (let i = 0; i < text.length; i++) {
        if (aborted) return;
        c.before(document.createTextNode(text[i]));
        await wait(rnd(65, 105));
      }
    }

    async function typeCode(el: HTMLElement, text: string) {
      el.innerHTML = '';
      const c = document.createElement('span');
      c.className = 'cm-cur';
      c.style.background = 'var(--fg-2)';
      el.appendChild(c);
      for (let i = 0; i < text.length; i++) {
        if (aborted) return;
        c.before(document.createTextNode(text[i]));
        await wait(rnd(55, 85));
      }
      c.remove();
      el.innerHTML = text.replace(
        /\b(SELECT|FROM|WHERE|GROUP BY|ORDER BY|HAVING|COUNT|AS|AND|OR|ON|JOIN|LEFT|INNER|NULL)\b/g,
        '<span class="pg-kw">$1</span>'
      );
    }

    function userBubble(text: string) {
      inp.innerHTML = '';
      const el = document.createElement('div');
      el.className = 'cm-user';
      el.textContent = text;
      msgBody.appendChild(el);
      scrollEnd();
      return el;
    }

    function aiBubble(html: string) {
      const el = document.createElement('div');
      el.className = 'cm-ai';
      el.innerHTML = html;
      msgBody.appendChild(el);
      requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('vis')));
      scrollEnd();
      return el;
    }

    function dots() {
      const el = document.createElement('div');
      el.className = 'cm-dots';
      el.innerHTML = '<span></span><span></span><span></span>';
      msgBody.appendChild(el);
      scrollEnd();
      return () => el.remove();
    }

    async function stream(el: HTMLElement, text: string, ms = 38) {
      for (let i = 0; i < text.length; i++) {
        if (aborted) return;
        el.textContent += text[i];
        if (i % 4 === 0) scrollEnd();
        await wait(ms + rnd(-4, 8));
      }
    }

    async function clickOpt(opt: HTMLElement) {
      opt.classList.add('hov');
      await wait(450);
      opt.classList.remove('hov');
      const rpl = document.createElement('span');
      rpl.className = 'rpl';
      opt.appendChild(rpl);
      await wait(30);
      rpl.classList.add('go');
      await wait(80);
      opt.classList.add('chosen');
      await wait(350);
      rpl.remove();
    }

    async function openPlayground(query: string) {
      sqlBtn.classList.add('hov');
      await wait(500);
      sqlBtn.classList.add('on');
      sqlBtn.classList.remove('hov');
      chatEl.style.transition = 'opacity .35s';
      chatEl.style.opacity = '0';
      await wait(380);
      chatEl.style.display = 'none';
      pgEl.style.display = 'flex';
      pgEl.style.opacity = '0';
      pgEl.style.transition = 'opacity .35s';
      await wait(30);
      pgEl.style.opacity = '1';
      await wait(400);
      await typeCode(pgCode, query);
      await wait(600);
      pgRun.classList.add('click');
      await wait(220);
      pgRun.classList.remove('click');
      await wait(350);
      pgRes.classList.add('vis');
      await wait(2800);
    }

    function reset() {
      msgBody.innerHTML = '';
      inp.innerHTML = '';
      chatEl.style.display = '';
      chatEl.style.opacity = '1';
      chatEl.style.transition = '';
      pgEl.style.display = 'none';
      pgEl.style.opacity = '1';
      pgEl.style.transition = '';
      pgCode.innerHTML = '';
      pgRes.classList.remove('vis');
      sqlBtn.classList.remove('hov', 'on');
    }

    async function sequence() {
      await wait(700);

      /* 1. 문제 풀기 */
      cursor(); await wait(500);
      await typeIn('조인 문제 내줘'); await wait(350);
      userBubble('조인 문제 내줘');
      const rm1 = dots(); await wait(1400); rm1();
      aiBubble(
        '<div class="cm-q">' +
          '<div class="cm-bdgs"><span class="cm-bdg cat">조인</span><span class="cm-bdg dif">난이도 중</span></div>' +
          '<p class="cm-qt">다음 중 LEFT OUTER JOIN의 결과로 옳은 것은?</p>' +
          '<div class="cm-opts">' +
            '<div class="cm-opt"><em>1</em><span>두 테이블의 교집합만 반환한다</span></div>' +
            '<div class="cm-opt"><em>2</em><span>오른쪽 테이블의 모든 행이 반환된다</span></div>' +
            '<div class="cm-opt" id="_o3"><em>3</em><span>왼쪽 테이블의 모든 행과 조건에 맞는 오른쪽 행이 반환된다</span></div>' +
            '<div class="cm-opt"><em>4</em><span>두 테이블의 합집합이 반환된다</span></div>' +
          '</div>' +
        '</div>'
      );
      await wait(2200);
      const o3 = document.getElementById('_o3');
      if (o3) await clickOpt(o3);
      const rm2 = dots(); await wait(1100); rm2();
      aiBubble(
        '<div class="cm-ok">✓ 정답이에요! (3번)</div>' +
        '<div class="cm-exp"><div class="cm-exp-lbl">AI 개념 설명</div><div class="cm-exp-txt" id="_e1"></div></div>'
      );
      await wait(80);
      const e1 = document.getElementById('_e1');
      if (e1) await stream(e1, 'LEFT OUTER JOIN은 왼쪽 테이블의 모든 행을 반환하고, 오른쪽에서 일치하는 행이 없으면 NULL로 채워요. 교집합만 반환하는 것은 INNER JOIN이에요.', 36);
      await wait(2500);

      /* 2. 자유 대화 */
      cursor(); await wait(500);
      await typeIn('GROUP BY랑 HAVING 차이 설명해줘'); await wait(350);
      userBubble('GROUP BY랑 HAVING 차이 설명해줘');
      const rm3 = dots(); await wait(1300); rm3();
      aiBubble('<div class="cm-txt" id="_t2"></div>');
      await wait(80);
      const t2 = document.getElementById('_t2');
      if (t2) await stream(t2, 'GROUP BY는 행을 그룹으로 묶고, HAVING은 그 그룹에 조건을 적용해요. WHERE가 행 단위 필터라면, HAVING은 그룹 단위 필터예요.', 36);
      await wait(2500);

      /* 3. SQL 채팅 실행 */
      cursor(); await wait(500);
      await typeIn('SELECT * FROM EMP WHERE DEPTNO = 10'); await wait(350);
      userBubble('SELECT * FROM EMP WHERE DEPTNO = 10');
      const rm4 = dots(); await wait(1200); rm4();
      aiBubble(
        '<div class="cm-sql-bubble">' +
          '<div class="cm-sql-bubble-h"><span>SQL 실행 결과</span><span class="cm-ok-tag">✓ 완료</span></div>' +
          '<div class="cm-tbl-wrap" id="_tw">' +
            '<div class="cm-res-cap">3행 반환</div>' +
            '<table class="cm-res-tbl"><tbody>' +
              '<tr><th>ENAME</th><th>DEPTNO</th><th>SAL</th></tr>' +
              '<tr><td>CLARK</td><td>10</td><td>2450</td></tr>' +
              '<tr><td>KING</td><td>10</td><td>5000</td></tr>' +
              '<tr><td>MILLER</td><td>10</td><td>1300</td></tr>' +
            '</tbody></table>' +
          '</div>' +
        '</div>'
      );
      await wait(80);
      const tw = document.getElementById('_tw');
      if (tw) {
        requestAnimationFrame(() => requestAnimationFrame(() => tw.classList.add('vis')));
        scrollEnd();
      }
      await wait(2000);

      /* 4. SQL 플레이그라운드 */
      await openPlayground('SELECT * FROM EMP WHERE DEPTNO = 10');
    }

    async function run() {
      while (!aborted) {
        reset();
        await sequence();
        if (aborted) break;
        const target = pgEl.style.display === 'none' ? chatEl : pgEl;
        target.style.transition = 'opacity .5s';
        target.style.opacity = '0';
        await wait(500);
      }
    }

    run();

    /* scroll reveal */
    function initReveal() {
      function prep(el: Element, delay: number) {
        el.classList.add('reveal');
        if (delay) (el as HTMLElement).style.transitionDelay = delay + 's';
      }
      if (!window.IntersectionObserver) {
        document.querySelectorAll('.reveal').forEach(el => el.classList.add('in'));
        return;
      }
      const io = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
      }, { threshold: 0.12 });
      document.querySelectorAll('.sec-label, .sec-title').forEach(el => { prep(el, 0); io.observe(el); });
      const groups = [
        { sel: '.pain-grid',  gap: 0.13 },
        { sel: '.steps-grid', gap: 0.13 },
        { sel: '.feat-grid',  gap: 0.1  },
        { sel: '.xfeat-grid', gap: 0.1  },
        { sel: '.reviews',    gap: 0.13 },
        { sel: '.faq',        gap: 0.1  },
      ];
      groups.forEach(g => {
        const container = document.querySelector(g.sel);
        if (!container) return;
        Array.from(container.children).forEach((child, i) => { prep(child, i * g.gap); io.observe(child); });
      });
      document.querySelectorAll('.reveal').forEach(el => io.observe(el));
    }
    initReveal();

    /* 스크롤 — scroll-hint 숨김 + nav 글래스모피즘 */
    const hint = document.getElementById('scroll-hint');
    const navEl = document.querySelector('.nav') as HTMLElement | null;
    const onScroll = () => {
      if (hint && window.scrollY > 60) hint.classList.add('hide');
      if (navEl) navEl.classList.toggle('glass', window.scrollY > 40);
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    /* 3D 카드 틸트 */
    type TiltEntry = { el: HTMLElement; move: (e: MouseEvent) => void; leave: () => void };
    const tiltEntries: TiltEntry[] = [];
    document.querySelectorAll<HTMLElement>('.feat-card, .xfeat-card').forEach(card => {
      const move = (e: MouseEvent) => {
        const r = card.getBoundingClientRect();
        const rotY =  ((e.clientX - r.left  - r.width  / 2) / (r.width  / 2)) * 5;
        const rotX = -((e.clientY - r.top   - r.height / 2) / (r.height / 2)) * 5;
        card.style.transform = `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(4px)`;
        card.style.transition = 'transform .08s ease, box-shadow .25s ease';
      };
      const leave = () => {
        card.style.transform = '';
        card.style.transition = 'transform .35s ease, box-shadow .25s ease';
      };
      card.addEventListener('mousemove', move);
      card.addEventListener('mouseleave', leave);
      tiltEntries.push({ el: card, move, leave });
    });

    return () => {
      aborted = true;
      window.removeEventListener('scroll', onScroll);
      tiltEntries.forEach(({ el, move, leave }) => {
        el.removeEventListener('mousemove', move);
        el.removeEventListener('mouseleave', leave);
      });
    };
  }, []);

  return (
    <div className="lp-root">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* NAV */}
      <nav className="nav">
        <Link className="nav-brand" href="/">
          <Image src="/icons/logo-mark-64.png" alt="SQLD AI 튜터" width={24} height={24} style={{ flexShrink: 0 }} />
          <span className="nav-name">SQLD AI 튜터</span>
        </Link>
        <Link className="nav-login" href="/login">로그인</Link>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-l">
          <p className="eyebrow">SQLD AI 튜터</p>
          <p className="pain-line">해설 읽어도 왜 틀렸는지 모르겠다면</p>
          <h1 className="hero-h1">틀린 이유를 AI가<br /><em className="hl">바로 설명</em>해드려요</h1>
          <p className="hero-sub">
            &ldquo;이 보기는 왜 틀려?&rdquo; 채팅창에 물어보면 AI가 즉시 답해요.<br />
            <strong>8문제 진단</strong>으로 약점을 파악하고, 틀릴 때마다 자동으로 개념을 짚어줘요.<br />
            문어CBT에는 없는, <strong>대화형 AI 튜터</strong>가 곁에 있어요.
          </p>
          <div className="hero-cta-group">
            <div className="btn-glow-wrap">
              <div className="btn-glow" />
              <Link className="btn-primary" href="/login">
                가입하고 시작하기
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            <Link className="btn-outline" href="/chat?guest=true">
              로그인 없이 체험하기
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <p className="hero-note">회원가입 필요 · <strong style={{color:"rgba(99,102,241,0.75)",fontWeight:700}}>무료</strong> · 광고 없음</p>
          <div className="scroll-hint" id="scroll-hint">
            <svg width="64" height="32" viewBox="0 0 64 32" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 8 32 26 60 8" /></svg>
            <svg width="64" height="32" viewBox="0 0 64 32" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 8 32 26 60 8" /></svg>
            <svg width="64" height="32" viewBox="0 0 64 32" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 8 32 26 60 8" /></svg>
          </div>
        </div>

        <div className="hero-r">
          <div className="cm">
            <div className="cm-bar">
              <div className="cm-dot" /><div className="cm-dot" /><div className="cm-dot" />
              <span className="cm-title">SQLD AI 튜터</span>
              <button className="cm-sqlbtn" id="cm-sqlbtn">SQL ▾</button>
            </div>
            <div id="cm-chat">
              <div className="cm-body" id="cm-body" />
              <div className="cm-foot" id="cm-foot">
                <div className="cm-inp-wrap">
                  <div id="cm-inp" />
                </div>
                <button className="cm-send" aria-label="전송">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>
            </div>
            <div id="cm-pg">
              <div className="pg-hdr">
                <span className="pg-hdr-l">SQL 플레이그라운드</span>
                <span className="pg-hdr-r">EMP · DEPT 샘플 테이블</span>
              </div>
              <div className="pg-editor">
                <div id="pg-code" />
                <div className="pg-run-row">
                  <button id="pg-run">▶ 실행</button>
                </div>
              </div>
              <div className="pg-results" id="pg-results">
                <div className="pg-res-hdr">결과 · 3행</div>
                <table className="pg-tbl">
                  <tbody>
                    <tr><th>ENAME</th><th>DEPTNO</th><th>SAL</th></tr>
                    <tr><td>CLARK</td><td>10</td><td>2450</td></tr>
                    <tr><td>KING</td><td>10</td><td>5000</td></tr>
                    <tr><td>MILLER</td><td>10</td><td>1300</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <div className="wrap-alt">
        <div className="wrap" style={{ paddingTop: '96px', paddingBottom: '96px' }}>
          <p className="sec-label">작동 방식</p>
          <h2 className="sec-title">진단부터 합격까지,<br />AI가 함께해요</h2>
          <div className="steps-grid">
            <div className="step">
              <div className="step-n">1</div>
              <p className="step-t">8문제 진단으로 약점 파악</p>
              <p className="step-d">처음 8문제를 풀면 AI가 11개 카테고리별 수준을 분석해요. 어디가 약한지 바로 알 수 있어요.</p>
            </div>
            <div className="step">
              <div className="step-n">2</div>
              <p className="step-t">약점 카테고리 집중 출제</p>
              <p className="step-d">정답률이 낮은 카테고리 위주로 문제를 출제해요. 목표 점수에 맞게 난이도도 자동으로 조정돼요.</p>
            </div>
            <div className="step">
              <div className="step-n">3</div>
              <p className="step-t">틀리면 즉시 개념 설명 + 복습</p>
              <p className="step-d">오답이 나오면 AI가 해당 개념을 바로 설명해요. 틀린 문제는 따로 모아 간격 복습도 할 수 있어요.</p>
            </div>
          </div>
        </div>
      </div>

      {/* SCENARIO CARDS */}
      <div className="wrap" style={{ paddingTop: '96px', paddingBottom: '96px' }}>
        <p className="sec-label">이런 순간, AI가 다릅니다</p>
        <h2 className="sec-title">문제집으로는 해결 안 되던 순간들</h2>
        <div className="scenario-grid-3" style={{ marginTop: '48px' }}>
          <div className="scenario-card">
            <p className="sc-situation">해설 읽어도 이해가 안 될 때</p>
            <p className="sc-title">왜 3번이 아니라 2번이야?</p>
            <div className="sc-mini-chat">
              <div className="sc-user">GROUP BY에서 SELECT 컬럼 제한 이유가 뭐야?</div>
              <div className="sc-ai">GROUP BY는 집계 기준 컬럼 외에 개별 값이 여러 개라 특정할 수 없어서요. 예를 들어 dept_id로 묶으면 name은 여러 개라 어떤 걸 보여줄지 모르거든요.</div>
            </div>
          </div>
          <div className="scenario-card">
            <p className="sc-situation">어떤 문제를 풀어야 할지 모를 때</p>
            <p className="sc-title">오늘 뭐 공부해야 해?</p>
            <div className="sc-mini-chat">
              <div className="sc-user">서브쿼리 문제 내줘</div>
              <div className="sc-ai">[서브쿼리 & Top N / 난이도: 중] 아래 SQL에서 각 부서의 평균 급여보다 많이 받는 사원을 조회하는 올바른 쿼리는?</div>
            </div>
          </div>
          <div className="scenario-card">
            <p className="sc-situation">같은 유형을 계속 틀릴 때</p>
            <p className="sc-title">NULL 관련 문제는 왜 맨날 틀리지?</p>
            <div className="sc-mini-chat">
              <div className="sc-user">NULL 비교할 때 왜 = 못 쓰는 거야?</div>
              <div className="sc-ai">NULL은 "값 없음"이라 비교 자체가 불가능해요. NULL = NULL은 unknown을 반환해서 WHERE에서 걸러져요. IS NULL / IS NOT NULL만 동작해요.</div>
            </div>
          </div>
        </div>
      </div>

      {/* FEATURES */}
      <div className="wrap">
        <p className="sec-label">핵심 기능</p>
        <div className="feat-grid">
          <div className="feat-card"><div className="feat-big">688<span>문제</span></div><p className="feat-t">방대한 문제은행</p><p className="feat-d">SQLD 합격자가 기출 경향을 분석해 직접 제작한 688문제. 11개 카테고리를 고르게 커버해요.</p></div>
          <div className="feat-card"><div className="feat-big">11<span>개 카테고리</span></div><p className="feat-t">카테고리별 정답률 추적</p><p className="feat-d">문제를 풀수록 카테고리별 정답률이 쌓여요. 어디가 얼마나 약한지 한눈에 볼 수 있어요.</p></div>
          <div className="feat-card"><div className="feat-big">예상<span>점수</span></div><p className="feat-t">실시간 점수 계산</p><p className="feat-d">카테고리별 정답률로 SQLD 실제 배점을 반영한 예상 점수를 실시간으로 계산해드려요.</p></div>
          <div className="feat-card"><div className="feat-big">50<span>문제</span></div><p className="feat-t">실전 모의고사</p><p className="feat-d">90분 제한, 실제 SQLD 배점 구조로 구성된 모의고사. 시험 전 최종 점검에 활용하세요.</p></div>
        </div>
        <div className="xfeat-grid">
          <div className="xfeat-card">
            <div className="xfeat-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <p className="xfeat-t">오답 회고</p>
            <p className="xfeat-d">틀린 문제를 한 곳에 모아 문제·보기·해설을 다시 확인할 수 있어요. 복습이 필요한 시점도 자동으로 알려드려요.</p>
          </div>
          <div className="xfeat-card">
            <div className="xfeat-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <p className="xfeat-t">학습 캘린더 · 복습 타이밍</p>
            <p className="xfeat-d">매일 학습량을 히트맵으로 시각화하고, 오늘·내일·이번주 복습할 오답 스케줄을 자동으로 정리해드려요.</p>
          </div>
          <div className="xfeat-card">
            <div className="xfeat-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
              </svg>
            </div>
            <p className="xfeat-t">SQL 플레이그라운드</p>
            <p className="xfeat-d">문제를 보면서 직접 SQL을 실행해볼 수 있어요. EMP·DEPT 샘플 테이블이 기본 제공돼요. (PC 전용)</p>
          </div>
          <div className="xfeat-card">
            <div className="xfeat-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
            </div>
            <p className="xfeat-t">자유로운 AI 대화</p>
            <p className="xfeat-d">&ldquo;GROUP BY 설명해줘&rdquo;, &ldquo;윈도우 함수 어려운 문제 내줘&rdquo;처럼 자연어로 요청하면 AI가 바로 응답해요.</p>
          </div>
        </div>
      </div>

      {/* TRUST NUMBERS */}
      <div className="wrap" style={{ paddingBottom: '80px' }}>
        <div className="dev-quote-card" style={{ marginTop: '0' }}>
          <div className="dev-avatar-icon">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div className="dev-text-group">
            <span className="dev-badge">✓ SQLD 합격자 제작</span>
            <p className="dev-quote-text">&ldquo;저도 SQLD 준비하면서 해설만으로는 이해가 안 됐어요. 그래서 틀리면 바로 물어볼 수 있는 AI 튜터를 직접 만들었습니다.&rdquo;</p>
            <p className="dev-role">SQLD 튜터 개발자 · 최 (SQLD 합격, 2026년 3월)</p>
          </div>
        </div>
      </div>

      {/* REVIEWS */}
      <div className="wrap">
        <p className="sec-label">실제 사용자 후기</p>
        <div className="reviews">
          <div className="review-card">
            <div className="review-stars">★★★★★</div>
            <p className="review-q">카테고리별 정답률을 채우는 게 마치 게임 같아서 재밌었어요. 교재로 공부할 때보다 훨씬 편리했습니다.</p>
            <div className="review-meta">
              <div className="review-avatar">A</div>
              <div>
                <p className="review-name">베타 테스터 A</p>
                <p className="review-role">SQLD 62회 응시 준비생 · NPS 10/10</p>
              </div>
            </div>
          </div>
          <div className="review-card">
            <div className="review-stars">★★★★</div>
            <p className="review-q">이해가 안 되는 부분을 계속 파고들며 질문할 수 있는 게 가장 좋았어요.</p>
            <div className="review-meta">
              <div className="review-avatar">B</div>
              <div>
                <p className="review-name">베타 테스터 B</p>
                <p className="review-role">SQLD 62회 응시 준비생 · NPS 7/10</p>
              </div>
            </div>
          </div>
          <div className="review-card">
            <div className="review-stars" style={{ opacity: 0, pointerEvents: 'none' }}>★★★</div>
            <p className="review-q">SQL 실행기로 직접 돌려보고 나서야 진짜 제 것이 됐어요. 설명을 여섯 번 듣는 것보다 눈으로 보는 게 나았습니다.</p>
            <div className="review-meta">
              <div className="review-avatar">C</div>
              <div>
                <p className="review-name">베타 테스터 C</p>
                <p className="review-role">개발자</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="wrap-alt">
        <div className="wrap">
          <p className="sec-label">자주 묻는 질문</p>
          <div className="faq">
            <div className="faq-item">
              <span className="faq-badge">Q</span>
              <p className="faq-q">무료인가요?</p>
              <p className="faq-a">네, 완전히 무료예요. 회원가입 후 바로 사용할 수 있고 광고도 없어요.</p>
            </div>
            <div className="faq-item">
              <span className="faq-badge">Q</span>
              <p className="faq-q">2024년 개정 출제기준이 맞나요?</p>
              <p className="faq-a">네. 최신 SQLD 출제기준인 2024년 개정판 기반으로 11개 카테고리로 구성했어요. 절차형 SQL은 제외되어 있고 TOP N, PIVOT, 정규표현식 범위가 포함돼 있어요.</p>
            </div>
            <div className="faq-item">
              <span className="faq-badge">Q</span>
              <p className="faq-q">SQLD를 처음 준비하는데 쓸 수 있나요?</p>
              <p className="faq-a">네. 8문제 진단으로 현재 수준을 먼저 파악하고, 적합한 난이도의 문제부터 출제해요. 틀리면 AI가 개념을 바로 설명해주니 기초부터 시작해도 괜찮아요.</p>
            </div>
            <div className="faq-item">
              <span className="faq-badge">Q</span>
              <p className="faq-q">어떤 기기에서 쓸 수 있나요?</p>
              <p className="faq-a">PC·태블릿·모바일 모두 접속 가능해요. SQL 플레이그라운드는 화면이 넓은 PC 환경에서만 이용할 수 있어요.</p>
            </div>
          </div>
        </div>
      </div>

      {/* TRUST */}
      <div className="trust">
        <div className="trust-line" />
        <p className="trust-text">SQLD 합격자(2026년 3월)가 기출 경향을 직접 분석해 제작한 서비스예요</p>
      </div>

      {/* CTA */}
      <div className="cta-sec">
        <p className="cta-label">지금 바로 시작하기</p>
        <h2 className="cta-h">SQLD 합격,<br />AI와 함께 준비하세요</h2>
        <p className="cta-sub">가입하고 8문제 진단부터 시작해보세요. 무료예요.</p>
        <div className="cta-btn-group">
          <Link className="btn-cta" href="/login">가입하고 시작하기</Link>
          <Link className="btn-cta-outline" href="/chat?guest=true">로그인 없이 체험하기</Link>
        </div>
        <p className="hero-note" style={{marginTop:"16px"}}>회원가입 필요 · <strong style={{color:"rgba(99,102,241,0.75)",fontWeight:700}}>무료</strong> · 광고 없음</p>
        <Link className="cta-login" href="/login">이미 계정이 있으신가요? 로그인</Link>
      </div>

      {/* FOOTER */}
      <footer className="lp-footer">
        <p className="footer-l">© 2026 SQLD AI 튜터</p>
        <Link className="footer-a" href="/privacy">개인정보처리방침</Link>
      </footer>
    </div>
  );
}
