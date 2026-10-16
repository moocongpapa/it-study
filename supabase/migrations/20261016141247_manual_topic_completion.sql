begin;

-- Completion is a learner's bookmark. Quiz passes remain independently verified.
alter table public.user_node_progress
  add column if not exists completion_source text
    check (completion_source in ('manual', 'quiz'));

create or replace function curriculum_internal.enforce_progress_completion()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  needs_verification boolean;
begin
  if not new.is_completed then
    new.completion_source := null;
    return new;
  end if;
  -- RLS still requires ownership. Manual completion never creates quiz passes.
  if new.completion_source = 'manual' then
    return new;
  end if;
  if tg_op = 'INSERT' then
    needs_verification := true;
  else
    needs_verification := not old.is_completed
      or new.topic_id is distinct from old.topic_id
      or new.user_id is distinct from old.user_id
      or new.completion_source is distinct from old.completion_source;
  end if;
  if needs_verification then
    if exists (
      select 1 from public.topic_prerequisites edge
      where edge.to_topic_id = new.topic_id and not exists (
        select 1 from public.user_node_progress p
        where p.user_id = new.user_id and p.topic_id = edge.from_topic_id and p.is_completed
      )
    ) then
      raise exception 'Prerequisite topics must be complete' using errcode = '23514';
    end if;
    if exists (select 1 from public.quizzes q where q.topic_id = new.topic_id) and (
      (select count(distinct q.level) from public.quizzes q where q.topic_id = new.topic_id) <> 4
      or exists (
        select 1 from public.quizzes q where q.topic_id = new.topic_id and not exists (
          select 1 from public.user_quiz_passes qp where qp.user_id = new.user_id and qp.quiz_id = q.id
        )
      )
    ) then
      raise exception 'All four quiz levels must be passed' using errcode = '23514';
    end if;
  end if;
  new.completion_source := 'quiz';
  return new;
end;
$$;
revoke all on function curriculum_internal.enforce_progress_completion() from public, anon, authenticated;
grant execute on function curriculum_internal.enforce_progress_completion() to authenticated, service_role;

create or replace function public.set_topic_completion(
  p_topic_id uuid,
  p_completed boolean,
  p_self_assessment smallint default null
)
returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  learner_id uuid := auth.uid();
  saved public.user_node_progress%rowtype;
  reviewed_at timestamptz := now();
begin
  if learner_id is null then raise exception 'Authentication required' using errcode = '28000'; end if;
  if p_completed is null or (p_self_assessment is not null and p_self_assessment not between 1 and 5) then
    raise exception 'Invalid completion input' using errcode = '22023';
  end if;
  if not exists (select 1 from public.topics where id = p_topic_id) then
    raise exception 'Topic not found' using errcode = 'P0002';
  end if;
  -- Serializes double taps and concurrent requests without trusting a client user ID.
  perform pg_advisory_xact_lock(hashtextextended(learner_id::text || ':' || p_topic_id::text, 0));
  select * into saved from public.user_node_progress
    where user_id = learner_id and topic_id = p_topic_id for update;
  if found and saved.is_completed = p_completed then
    return to_jsonb(saved) - 'user_id';
  end if;
  if p_completed then
    insert into public.user_node_progress (
      user_id, topic_id, is_completed, completion_source, current_level, self_assessment,
      completed_at, last_reviewed_at, next_review_at, review_interval_days, ease_factor, review_count
    ) values (
      learner_id, p_topic_id, true, 'manual', 4, p_self_assessment,
      reviewed_at, reviewed_at, reviewed_at + interval '24 hours', 1, 2.50, 0
    ) on conflict (user_id, topic_id) do update set
      is_completed = true, completion_source = 'manual', current_level = 4,
      self_assessment = excluded.self_assessment, completed_at = excluded.completed_at,
      last_reviewed_at = excluded.last_reviewed_at, next_review_at = excluded.next_review_at,
      review_interval_days = 1, ease_factor = 2.50, review_count = 0
    returning * into saved;
  else
    update public.user_node_progress set
      is_completed = false, completion_source = null, current_level = 1, completed_at = null,
      last_reviewed_at = null, next_review_at = null, review_interval_days = 0,
      ease_factor = 2.50, review_count = 0
    where user_id = learner_id and topic_id = p_topic_id
    returning * into saved;
    if not found then
      return jsonb_build_object('topic_id', p_topic_id, 'is_completed', false,
        'current_level', 1, 'self_assessment', null, 'completed_at', null, 'next_review_at', null);
    end if;
  end if;
  return to_jsonb(saved) - 'user_id';
end;
$$;
revoke all on function public.set_topic_completion(uuid, boolean, smallint) from public, anon, authenticated;
grant execute on function public.set_topic_completion(uuid, boolean, smallint) to authenticated, service_role;

commit;
