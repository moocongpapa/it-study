begin;

-- Keep answer keys inaccessible through the Data API. The only submission path
-- is the checked RPC below; a correct attempt creates an immutable pass row.
alter table public.quizzes
  add column if not exists question_type text not null default 'multiple_choice',
  add column if not exists accepted_answers text[] not null default '{}';
alter table public.quizzes alter column answer_index drop not null;
alter table public.quizzes alter column choices set default '[]'::jsonb;
alter table public.quizzes drop constraint if exists quizzes_valid_choices;
alter table public.quizzes add constraint quizzes_valid_choices check (
  (question_type = 'multiple_choice'
    and jsonb_typeof(choices) = 'array'
    and jsonb_array_length(choices) between 2 and 6
    and answer_index between 0 and jsonb_array_length(choices) - 1
    and cardinality(accepted_answers) = 0)
  or
  (question_type = 'short_answer'
    and choices = '[]'::jsonb
    and answer_index is null
    and cardinality(accepted_answers) between 1 and 8)
);

create table if not exists public.user_quiz_passes (
  user_id uuid not null references auth.users(id) on delete cascade,
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  passed_at timestamptz not null default now(),
  primary key (user_id, quiz_id)
);
create index if not exists user_quiz_passes_recent_idx
  on public.user_quiz_passes (user_id, passed_at desc);
alter table public.user_quiz_passes enable row level security;
drop policy if exists quiz_passes_owner_read on public.user_quiz_passes;
create policy quiz_passes_owner_read on public.user_quiz_passes
  for select to authenticated using ((select auth.uid()) = user_id);
revoke all on public.user_quiz_passes from public, anon, authenticated;
grant select on public.user_quiz_passes to authenticated;
grant all on public.user_quiz_passes to service_role;

-- A callable, narrowly scoped SECURITY DEFINER function validates the answer
-- using hidden columns, derives identity from auth.uid(), and returns feedback.
create or replace function public.submit_quiz_answer(
  p_quiz_id uuid,
  p_choice_index integer default null,
  p_short_answer text default null
)
returns table (
  passed boolean,
  correct_answer text,
  explanation text,
  topic_id uuid,
  level smallint
)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  q public.quizzes%rowtype;
  learner_id uuid := auth.uid();
  correct boolean;
  answer_text text;
begin
  if learner_id is null then
    raise exception 'Login required' using errcode = '28000';
  end if;
  select * into q from public.quizzes where id = p_quiz_id;
  if not found then
    raise exception 'Quiz not found' using errcode = '22023';
  end if;
  if exists (
    select 1 from public.topic_prerequisites edge
    where edge.to_topic_id = q.topic_id
      and not exists (
        select 1 from public.user_node_progress p
        where p.user_id = learner_id
          and p.topic_id = edge.from_topic_id
          and p.is_completed
      )
  ) then
    raise exception 'Prerequisite topics must be complete' using errcode = '23514';
  end if;

  if q.question_type = 'multiple_choice' then
    if p_choice_index is null or p_choice_index < 0
       or p_choice_index >= jsonb_array_length(q.choices) then
      raise exception 'Invalid choice' using errcode = '22023';
    end if;
    correct := p_choice_index = q.answer_index;
    answer_text := q.choices ->> q.answer_index;
  else
    if p_short_answer is null or length(btrim(p_short_answer)) = 0
       or length(p_short_answer) > 500 then
      raise exception 'Invalid short answer' using errcode = '22023';
    end if;
    correct := exists (
      select 1 from unnest(q.accepted_answers) accepted
      where lower(btrim(accepted)) = lower(btrim(p_short_answer))
    );
    answer_text := q.accepted_answers[1];
  end if;

  if correct then
    insert into public.user_quiz_passes (user_id, quiz_id)
      values (learner_id, q.id)
      on conflict (user_id, quiz_id) do nothing;
    insert into public.user_learning_days (user_id, activity_date)
      values (learner_id, (now() at time zone 'Asia/Seoul')::date)
      on conflict (user_id, activity_date) do nothing;
  end if;
  return query select correct, answer_text, q.explanation, q.topic_id, q.level;
end;
$$;
revoke all on function public.submit_quiz_answer(uuid, integer, text)
  from public, anon, authenticated;
grant execute on function public.submit_quiz_answer(uuid, integer, text)
  to authenticated, service_role;

-- Direct REST updates cannot mark a quiz-backed node complete by skipping the RPC.
create or replace function curriculum_internal.enforce_progress_completion()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  became_completed boolean;
begin
  if tg_op = 'INSERT' then
    became_completed := new.is_completed;
  else
    became_completed := new.is_completed and (
      not old.is_completed
      or new.topic_id is distinct from old.topic_id
      or new.user_id is distinct from old.user_id
    );
  end if;
  if became_completed then
    if exists (
      select 1 from public.topic_prerequisites edge
      where edge.to_topic_id = new.topic_id
        and not exists (
          select 1 from public.user_node_progress p
          where p.user_id = new.user_id
            and p.topic_id = edge.from_topic_id
            and p.is_completed
        )
    ) then
      raise exception 'Prerequisite topics must be complete' using errcode = '23514';
    end if;
    if exists (select 1 from public.quizzes q where q.topic_id = new.topic_id)
       and (
         (select count(distinct q.level) from public.quizzes q
          where q.topic_id = new.topic_id) <> 4
         or exists (
           select 1 from public.quizzes q
           where q.topic_id = new.topic_id
             and not exists (
               select 1 from public.user_quiz_passes qp
               where qp.user_id = new.user_id and qp.quiz_id = q.id
             )
         )
       ) then
      raise exception 'All four quiz levels must be passed' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists progress_completion_guard on public.user_node_progress;
create trigger progress_completion_guard
  before insert or update on public.user_node_progress
  for each row execute function curriculum_internal.enforce_progress_completion();
revoke all on function curriculum_internal.enforce_progress_completion()
  from public, anon, authenticated;
grant execute on function curriculum_internal.enforce_progress_completion()
  to authenticated, service_role;

create table if not exists public.user_learning_days (
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_date date not null,
  primary key (user_id, activity_date)
);
alter table public.user_learning_days enable row level security;
drop policy if exists learning_days_owner_read on public.user_learning_days;
create policy learning_days_owner_read on public.user_learning_days
  for select to authenticated using ((select auth.uid()) = user_id);
revoke all on public.user_learning_days from public, anon, authenticated;
grant select on public.user_learning_days to authenticated;
grant all on public.user_learning_days to service_role;

create or replace function curriculum_internal.record_learning_day()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  became_completed boolean;
  reviewed boolean;
begin
  if tg_op = 'INSERT' then
    became_completed := new.is_completed;
    reviewed := new.last_reviewed_at is not null;
  else
    became_completed := new.is_completed and not old.is_completed;
    reviewed := new.last_reviewed_at is not null
      and new.last_reviewed_at is distinct from old.last_reviewed_at;
  end if;
  if became_completed or reviewed then
    insert into public.user_learning_days (user_id, activity_date)
      values (new.user_id, (now() at time zone 'Asia/Seoul')::date)
      on conflict (user_id, activity_date) do nothing;
  end if;
  return new;
end;
$$;
drop trigger if exists progress_record_learning_day on public.user_node_progress;
create trigger progress_record_learning_day
  after insert or update on public.user_node_progress
  for each row execute function curriculum_internal.record_learning_day();
revoke all on function curriculum_internal.record_learning_day()
  from public, anon, authenticated;
grant execute on function curriculum_internal.record_learning_day()
  to authenticated, service_role;

-- Browser clients may read quiz prompts only. Answers and explanations travel
-- through submit_quiz_answer after an actual attempt.
revoke all on public.quizzes from anon, authenticated;
grant select (id, topic_id, level, question, choices, question_type, created_at)
  on public.quizzes to anon, authenticated;

commit;
