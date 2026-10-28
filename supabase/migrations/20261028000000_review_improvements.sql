-- Performance & commercial readiness improvements:
-- 1. FK covering indexes for advisor candidates: user_node_progress(topic_id), user_quiz_passes(quiz_id)
-- 2. Atomic per-user rate limiting & daily quota table + RPC for AI Tutor cost/abuse guard
begin;

create index if not exists user_node_progress_topic_id_idx
  on public.user_node_progress (topic_id);

create index if not exists user_quiz_passes_quiz_id_idx
  on public.user_quiz_passes (quiz_id);

create table if not exists curriculum_internal.ai_tutor_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null default ((now() at time zone 'Asia/Seoul')::date),
  request_count integer not null default 0 check (request_count >= 0),
  window_started_at timestamptz not null default now(),
  window_count integer not null default 0 check (window_count >= 0),
  last_requested_at timestamptz not null default now(),
  primary key (user_id, usage_date)
);

revoke all on table curriculum_internal.ai_tutor_usage from public, anon, authenticated;

create or replace function public.consume_ai_tutor_quota(
  p_daily_limit integer default 60,
  p_minute_limit integer default 8
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, curriculum_internal
as $$
declare
  learner_id uuid := auth.uid();
  today date := (now() at time zone 'Asia/Seoul')::date;
  current_ts timestamptz := now();
  usage_row curriculum_internal.ai_tutor_usage%rowtype;
begin
  if learner_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if p_daily_limit is null or p_daily_limit < 1 or p_minute_limit is null or p_minute_limit < 1 then
    raise exception 'Invalid quota limit' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('ai_tutor_quota:' || learner_id::text, 0));

  insert into curriculum_internal.ai_tutor_usage (
    user_id, usage_date, request_count, window_started_at, window_count, last_requested_at
  ) values (
    learner_id, today, 0, current_ts, 0, current_ts
  ) on conflict (user_id, usage_date) do nothing;

  select * into usage_row
  from curriculum_internal.ai_tutor_usage
  where user_id = learner_id and usage_date = today
  for update;

  if usage_row.request_count >= p_daily_limit then
    return jsonb_build_object(
      'allowed', false,
      'reason', 'daily_limit',
      'remaining_daily', 0,
      'retry_after_seconds', 3600
    );
  end if;

  if current_ts - usage_row.window_started_at < interval '60 seconds' then
    if usage_row.window_count >= p_minute_limit then
      return jsonb_build_object(
        'allowed', false,
        'reason', 'minute_limit',
        'remaining_daily', greatest(0, p_daily_limit - usage_row.request_count),
        'retry_after_seconds', greatest(1, ceil(extract(epoch from (usage_row.window_started_at + interval '60 seconds' - current_ts)))::int)
      );
    end if;
    update curriculum_internal.ai_tutor_usage
    set request_count = request_count + 1,
        window_count = window_count + 1,
        last_requested_at = current_ts
    where user_id = learner_id and usage_date = today
    returning * into usage_row;
  else
    update curriculum_internal.ai_tutor_usage
    set request_count = request_count + 1,
        window_started_at = current_ts,
        window_count = 1,
        last_requested_at = current_ts
    where user_id = learner_id and usage_date = today
    returning * into usage_row;
  end if;

  return jsonb_build_object(
    'allowed', true,
    'reason', null,
    'remaining_daily', greatest(0, p_daily_limit - usage_row.request_count),
    'retry_after_seconds', 0
  );
end;
$$;

revoke all on function public.consume_ai_tutor_quota(integer, integer) from public, anon;
grant execute on function public.consume_ai_tutor_quota(integer, integer) to authenticated, service_role;

commit;
