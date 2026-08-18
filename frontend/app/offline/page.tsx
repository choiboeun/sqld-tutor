"use client";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-violet-50 flex flex-col items-center justify-center px-6 text-center">
      <div className="w-14 h-14 bg-violet-100 flex items-center justify-center mb-5">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="1" y1="1" x2="23" y2="23"/>
          <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/>
          <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/>
          <path d="M10.71 5.05A16 16 0 0 1 22.56 9"/>
          <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/>
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
          <circle cx="12" cy="20" r="1"/>
        </svg>
      </div>
      <h1 className="text-lg font-bold text-indigo-900 mb-2">인터넷 연결이 없어요</h1>
      <p className="text-sm text-indigo-400 leading-relaxed mb-6">
        네트워크 연결을 확인하고<br />다시 시도해주세요.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="bg-indigo-500 text-white text-sm font-semibold px-6 py-2.5 hover:bg-indigo-600 transition-colors"
      >
        다시 시도
      </button>
    </div>
  );
}
