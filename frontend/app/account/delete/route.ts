import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function DELETE() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const userToken = session.access_token;

  // 학습 데이터 삭제 (user JWT → auth.uid() 작동)
  const rpcResp = await fetch(`${SUPABASE_URL}/rest/v1/rpc/delete_user`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${userToken}`,
      apikey: ANON_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });

  if (!rpcResp.ok) {
    const text = await rpcResp.text();
    return NextResponse.json({ error: `데이터 삭제 실패: ${text}` }, { status: 500 });
  }

  // auth.users 삭제 (service_role Admin API)
  const adminResp = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      apikey: SERVICE_ROLE_KEY,
    },
  });

  if (!adminResp.ok) {
    const text = await adminResp.text();
    return NextResponse.json({ error: text }, { status: 500 });
  }

  return NextResponse.json({ message: "deleted" });
}
