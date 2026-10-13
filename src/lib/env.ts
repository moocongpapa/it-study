const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function validHttpUrl(value: string | undefined): boolean {
  if (!value) return false;
  try { return ["http:", "https:"].includes(new URL(value).protocol); }
  catch { return false; }
}

export const isSupabaseConfigured = validHttpUrl(supabaseUrl) && Boolean(supabaseKey);

export function getSupabaseConfig() {
  if (!isSupabaseConfigured || !supabaseUrl || !supabaseKey) {
    throw new Error("Supabase URL과 공개 키 설정을 확인하세요.");
  }
  return { url: supabaseUrl, key: supabaseKey };
}
