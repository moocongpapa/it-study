import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const requested = request.nextUrl.searchParams.get("next") ?? "/roadmap";
  const destination = new URL(requested, request.url);
  const safeNext = requested.startsWith("/") && destination.origin === request.nextUrl.origin
    ? `${destination.pathname}${destination.search}${destination.hash}`
    : "/roadmap";
  if (!code) return NextResponse.redirect(new URL("/login?error=missing-code", request.url));

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL("/login?error=auth-failed", request.url));
  return NextResponse.redirect(new URL(safeNext, request.url));
}
