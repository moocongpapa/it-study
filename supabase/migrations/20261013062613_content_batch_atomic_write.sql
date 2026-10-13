begin;

-- Function to atomically upsert topic articles and quizzes in a single transaction.
-- Intended for use by administrative data pipeline scripts using the service_role key.
create or replace function public.upsert_topic_content(
  p_topic_id uuid,
  p_level_1_mental_model text,
  p_level_2_core_engineering text,
  p_level_3_troubleshooting text,
  p_level_4_architecture_tradeoffs text,
  p_is_published boolean,
  p_quizzes jsonb
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  quiz_item jsonb;
  v_level smallint;
  v_question text;
  v_choices jsonb;
  v_answer_index smallint;
  v_explanation text;
begin
  -- 1. Validate topic existence
  if not exists (select 1 from public.topics where id = p_topic_id) then
    raise exception 'Topic % does not exist', p_topic_id using errcode = '22023';
  end if;

  -- 2. Upsert article
  insert into public.articles (
    topic_id,
    level_1_mental_model,
    level_2_core_engineering,
    level_3_troubleshooting,
    level_4_architecture_tradeoffs,
    is_published,
    updated_at
  ) values (
    p_topic_id,
    p_level_1_mental_model,
    p_level_2_core_engineering,
    p_level_3_troubleshooting,
    p_level_4_architecture_tradeoffs,
    p_is_published,
    now()
  )
  on conflict (topic_id) do update set
    level_1_mental_model = excluded.level_1_mental_model,
    level_2_core_engineering = excluded.level_2_core_engineering,
    level_3_troubleshooting = excluded.level_3_troubleshooting,
    level_4_architecture_tradeoffs = excluded.level_4_architecture_tradeoffs,
    is_published = excluded.is_published,
    updated_at = now();

  -- 3. Upsert quizzes (if provided)
  if p_quizzes is not null and jsonb_typeof(p_quizzes) = 'array' then
    -- Remove old quizzes that do not have user passes
    delete from public.quizzes
    where topic_id = p_topic_id
      and id not in (select quiz_id from public.user_quiz_passes);

    for quiz_item in select * from jsonb_array_elements(p_quizzes)
    loop
      v_level := (quiz_item->>'level')::smallint;
      v_question := quiz_item->>'question';
      v_choices := quiz_item->'choices';
      v_answer_index := (quiz_item->>'answer_index')::smallint;
      v_explanation := quiz_item->>'explanation';

      insert into public.quizzes (
        topic_id,
        level,
        question,
        choices,
        answer_index,
        explanation,
        question_type,
        accepted_answers
      ) values (
        p_topic_id,
        v_level,
        v_question,
        v_choices,
        v_answer_index,
        v_explanation,
        'multiple_choice',
        '{}'::text[]
      )
      on conflict (topic_id, level, question) do update set
        choices = excluded.choices,
        answer_index = excluded.answer_index,
        explanation = excluded.explanation,
        question_type = excluded.question_type,
        accepted_answers = excluded.accepted_answers;
    end loop;
  end if;
end;
$$;

-- Ensure service_role can read and modify all rows under RLS in all environments
drop policy if exists articles_service_role_all on public.articles;
create policy articles_service_role_all on public.articles
  for all to service_role using (true) with check (true);

drop policy if exists quizzes_service_role_all on public.quizzes;
create policy quizzes_service_role_all on public.quizzes
  for all to service_role using (true) with check (true);

-- Restrict execution to service_role only
revoke all on function public.upsert_topic_content(uuid, text, text, text, text, boolean, jsonb) from public, anon, authenticated;
grant execute on function public.upsert_topic_content(uuid, text, text, text, text, boolean, jsonb) to service_role;

commit;
