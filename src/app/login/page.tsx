"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, GitBranch, Mail, Sparkles } from "lucide-react";
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
    const requested = params.get("next") ?? "/roadmap";
    const next = requested.startsWith("/") && !requested.startsWith("//") ? requested : "/roadmap";
    const redirect = new URL("/auth/callback", window.location.origin);
    redirect.searchParams.set("next", next);
    const { error: signInError } = await createClient().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirect.toString() },
    });
    setLoading(false);
    if (signInError) setError(signInError.message);
    else setMessage("로그인 링크를 보냈습니다. 이메일을 확인해 주세요.");
  }

  return (
    <Card className="w-full max-w-md border-cyan-300/10 bg-[#111f2d] p-8 shadow-[0_30px_90px_#0008]">
      <div className="mb-7 flex items-center gap-3"><span className="grid size-11 place-items-center rounded-xl bg-cyan-300 text-slate-950"><GitBranch className="size-5" /></span><span className="text-xl font-black text-white">IT Atlas</span></div>
      <Sparkles className="mb-4 size-5 text-cyan-300" />
      <h1 className="text-2xl font-black tracking-tight text-white">학습의 다음 장으로</h1>
      <p className="mt-2 text-sm leading-6 text-slate-400">이메일 링크로 로그인하면 완료한 개념과 다음 학습 경로가 저장됩니다.</p>
      {isSupabaseConfigured ? (
        <form onSubmit={submit} className="mt-7 space-y-4">
          <label className="block text-xs font-semibold text-slate-300" htmlFor="email">이메일 주소</label>
          <div className="flex h-12 items-center gap-3 rounded-xl border border-white/12 bg-[#0c1723] px-4 transition-all focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-400/20">
            <Mail className="size-4 text-slate-500 transition-colors group-focus-within:text-cyan-400" />
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
            />
          </div>
          {error ? (
            <div role="alert" className="rounded-xl border border-rose-500/25 bg-rose-500/10 p-3 text-xs text-rose-200">
              {error}
            </div>
          ) : null}
          {message ? (
            <div role="status" className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3 text-xs text-emerald-200">
              {message}
            </div>
          ) : null}
          {params.get("error") ? (
            <div role="alert" className="rounded-xl border border-rose-500/25 bg-rose-500/10 p-3 text-xs text-rose-200">
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
      ) : <p className="mt-7 rounded-xl border border-cyan-400/15 bg-cyan-400/5 p-4 text-xs leading-6 text-slate-300">현재는 시드 데이터 미리보기 모드입니다. Supabase 프로젝트 URL과 publishable key를 설정하면 로그인을 사용할 수 있습니다.</p>}
      <Button asChild variant="ghost" className="mt-5 -ml-2"><Link href="/roadmap"><ArrowLeft className="size-4" /> 지도로 돌아가기</Link></Button>
    </Card>
  );
}

export default function LoginPage() {
  return <main className="app-grid flex min-h-screen items-center justify-center p-5"><Suspense fallback={<div className="text-sm text-slate-400">로그인 화면을 준비하고 있습니다...</div>}><LoginForm /></Suspense></main>;
}
