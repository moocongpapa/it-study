"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, GitBranch, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isSupabaseConfigured) return;
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const requested = params.get("next") ?? "/roadmap";
      const next = requested.startsWith("/") && !requested.startsWith("//") ? requested : "/roadmap";
      const redirect = new URL("/auth/callback", window.location.origin);
      redirect.searchParams.set("next", next);
      const { error: signInError } = await createClient().auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: redirect.toString() },
      });
      if (signInError) setError(signInError.status === 429
        ? "로그인 요청이 많습니다. 잠시 기다린 뒤 다시 시도해 주세요."
        : "로그인 이메일을 보내지 못했습니다. 주소를 확인하고 잠시 후 다시 시도해 주세요.");
      else setMessage("로그인 링크를 보냈습니다. 이메일과 스팸함을 확인해 주세요.");
    } catch {
      setError("연결이 원활하지 않습니다. 인터넷 연결을 확인한 뒤 다시 시도해 주세요.");
    } finally { setLoading(false); }
  }

  return (
    <Card className="w-full max-w-md border-blue-200 bg-white p-8 shadow-sm">
      <div className="mb-7 flex items-center gap-3"><span className="grid size-11 place-items-center rounded-xl bg-blue-600 text-white"><GitBranch className="size-5" /></span><span className="text-xl font-bold text-slate-900">IT Atlas</span></div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">로그인하고 이어서 배우기</h1>
      <p className="mt-2 text-sm leading-6 text-slate-500">비전공자는 전공자 수준까지, 전공자는 지식 정리까지. 학습 기록이 계정에 저장돼요.</p>
      {isSupabaseConfigured ? (
        <form onSubmit={submit} className="mt-7 space-y-4">
          <label className="block text-xs font-semibold text-slate-500" htmlFor="email">이메일 주소</label>
          <div className="flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 transition-all focus-within:border-blue-200 focus-within:ring-2 focus-within:ring-blue-500/30">
            <Mail className="size-4 text-slate-500 transition-colors group-focus-within:text-blue-700" />
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-500"
            />
          </div>
          {error ? (
            <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              {error}
            </div>
          ) : null}
          {message ? (
            <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">
              {message}
            </div>
          ) : null}
          {params.get("error") ? (
            <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              로그인 링크를 확인하지 못했습니다. 다시 시도해 주세요.
            </div>
          ) : null}
          <Button className="w-full h-11 text-sm font-bold gap-2" disabled={loading}>
            {loading ? (
              <>
                <div className="size-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                <span>링크 전송 중...</span>
              </>
            ) : (
              "이메일 링크 받기"
            )}
          </Button>
        </form>
      ) : <p className="mt-7 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs leading-6 text-slate-500">현재는 시드 데이터 미리보기 모드입니다. Supabase 프로젝트 URL과 publishable key를 설정하면 로그인을 사용할 수 있습니다.</p>}
      <Button asChild variant="ghost" className="mt-5 -ml-2"><Link href="/roadmap"><ArrowLeft className="size-4" /> 학습으로 돌아가기</Link></Button>
    </Card>
  );
}

export default function LoginPage() {
  return <main className="app-grid flex min-h-screen items-center justify-center p-5"><Suspense fallback={<div className="text-sm text-slate-500">로그인 화면을 준비하고 있습니다...</div>}><LoginForm /></Suspense></main>;
}
