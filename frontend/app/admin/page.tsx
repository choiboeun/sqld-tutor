"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
const ADMIN_EMAIL = "libresearch8@gmail.com";

type Inquiry = {
  id: string;
  user_id: string;
  user_email: string;
  message: string;
  status: "new" | "read" | "resolved";
  created_at: string;
};

const STATUS_LABEL: Record<string, string> = {
  new: "신규",
  read: "확인",
  resolved: "처리완료",
};

const STATUS_COLOR: Record<string, string> = {
  new: "bg-amber-100 text-amber-700",
  read: "bg-blue-100 text-blue-700",
  resolved: "bg-green-100 text-green-700",
};

export default function AdminPage() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await createClient().auth.getSession();
      const email = data.session?.user.email;
      if (!email || email !== ADMIN_EMAIL) {
        setAuthorized(false);
        setLoading(false);
        return;
      }
      setAuthorized(true);
      const accessToken = data.session?.access_token ?? null;
      setToken(accessToken);
      await fetchInquiries(accessToken);
      setLoading(false);
    })();
  }, []);

  const fetchInquiries = async (accessToken: string | null) => {
    if (!accessToken) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/inquiries`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data: Inquiry[] = await res.json();
        setInquiries(data);
      }
    } catch {}
  };

  const updateStatus = async (id: string, status: string) => {
    if (!token) return;
    setUpdating(id);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/inquiries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setInquiries((prev) =>
          prev.map((q) => (q.id === id ? { ...q, status: status as Inquiry["status"] } : q))
        );
      }
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <p className="text-sm text-stone-400">로딩 중...</p>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <p className="text-sm text-stone-500">접근 권한이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-stone-800">문의 관리</h1>
          <button
            onClick={() => fetchInquiries(token)}
            className="text-xs text-stone-500 border border-stone-200 px-3 py-1.5 hover:bg-stone-100 transition-colors"
          >
            새로고침
          </button>
        </div>

        {inquiries.length === 0 ? (
          <div className="bg-white border border-stone-200 p-8 text-center">
            <p className="text-sm text-stone-400">문의가 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {inquiries.map((q) => (
              <div key={q.id} className="bg-white border border-stone-200 p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="min-w-0">
                    <p className="text-xs text-stone-400 truncate">{q.user_email}</p>
                    <p className="text-xs text-stone-300 mt-0.5">
                      {new Date(q.created_at).toLocaleString("ko-KR")}
                    </p>
                  </div>
                  <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 ${STATUS_COLOR[q.status] ?? ""}`}>
                    {STATUS_LABEL[q.status] ?? q.status}
                  </span>
                </div>

                <p className="text-sm text-stone-700 whitespace-pre-wrap leading-relaxed mb-4">
                  {q.message}
                </p>

                <div className="flex gap-2">
                  {(["new", "read", "resolved"] as const).map((s) => (
                    <button
                      key={s}
                      disabled={q.status === s || updating === q.id}
                      onClick={() => updateStatus(q.id, s)}
                      className={`text-xs px-3 py-1 border transition-colors disabled:opacity-40 ${
                        q.status === s
                          ? "border-amber-400 text-amber-700 bg-amber-50"
                          : "border-stone-200 text-stone-500 hover:bg-stone-50"
                      }`}
                    >
                      {STATUS_LABEL[s]}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
