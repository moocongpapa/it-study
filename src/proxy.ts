import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  const isPublicArticle = ["GET", "HEAD"].includes(request.method)
    && /^\/api\/articles\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(request.nextUrl.pathname);
  if (!isSupabaseConfigured || isPublicArticle) {
    return NextResponse.next({ request });
  }
  return updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
