begin;

-- Replace the earlier destructive implementation. This function is intentionally
-- insert-only: an existing draft, article, or quiz is editorial content.
drop function if exists public.upsert_topic_content(uuid, text, text, text, text, boolean, jsonb);
drop function if exists public.insert_generated_topic_content(uuid, text, text, text, text, boolean, jsonb);

create function public.insert_generated_topic_content(
  p_topic_id uuid,
  p_level_1_mental_model text,
  p_level_2_core_engineering text,
  p_level_3_troubleshooting text,
  p_level_4_architecture_tradeoffs text,
  p_is_published boolean,
  p_quizzes jsonb
)
returns text
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  quiz_item jsonb;
  quiz_level smallint;
  answer_index smallint;
begin
  -- Serializes competing batch workers for the same topic, including the
  -- existence check. A second worker gets a harmless skipped_existing result.
  perform 1 from public.topics where id = p_topic_id for update;
  if not found then
    raise exception 'Topic % does not exist', p_topic_id using errcode = '22023';
  end if;

  if exists (select 1 from public.articles where topic_id = p_topic_id)
    or exists (select 1 from public.quizzes where topic_id = p_topic_id) then
    return 'skipped_existing';
  end if;

  if nullif(btrim(p_level_1_mental_model), '') is null
    or nullif(btrim(p_level_2_core_engineering), '') is null
    or nullif(btrim(p_level_3_troubleshooting), '') is null
    or nullif(btrim(p_level_4_architecture_tradeoffs), '') is null
    or p_quizzes is null
    or jsonb_typeof(p_quizzes) is distinct from 'array'
    or jsonb_array_length(p_quizzes) <> 4 then
    raise exception 'Four nonempty article levels and four quizzes are required'
      using errcode = '22023';
  end if;

  if (select count(distinct (item->>'level')::integer)
      from jsonb_array_elements(p_quizzes) as item) <> 4 then
    raise exception 'One quiz for each level is required' using errcode = '22023';
  end if;

  -- Validate all rows before the first insert. The function runs in the
  -- caller's transaction, so any later SQL error also rolls everything back.
  for quiz_item in select value from jsonb_array_elements(p_quizzes) loop
    quiz_level := (quiz_item->>'level')::smallint;
    answer_index := (quiz_item->>'answer_index')::smallint;
    if quiz_level not between 1 and 4
      or jsonb_typeof(quiz_item->'choices') is distinct from 'array'
      or jsonb_array_length(quiz_item->'choices') <> 4
      or answer_index not between 0 and 3
      or nullif(btrim(quiz_item->>'question'), '') is null
      or nullif(btrim(quiz_item->>'explanation'), '') is null then
      raise exception 'Invalid quiz payload for topic %', p_topic_id using errcode = '22023';
    end if;
  end loop;

  insert into public.articles (
    topic_id, level_1_mental_model, level_2_core_engineering,
    level_3_troubleshooting, level_4_architecture_tradeoffs, is_published
  ) values (
    p_topic_id, p_level_1_mental_model, p_level_2_core_engineering,
    p_level_3_troubleshooting, p_level_4_architecture_tradeoffs,
    coalesce(p_is_published, false)
  );

  for quiz_item in select value from jsonb_array_elements(p_quizzes) loop
    insert into public.quizzes (
      topic_id, level, question, choices, answer_index,
      explanation, question_type, accepted_answers
    ) values (
      p_topic_id, (quiz_item->>'level')::smallint,
      quiz_item->>'question', quiz_item->'choices',
      (quiz_item->>'answer_index')::smallint,
      quiz_item->>'explanation', 'multiple_choice', '{}'::text[]
    );
  end loop;

  return 'inserted';
end;
$$;

revoke all on function public.insert_generated_topic_content(uuid, text, text, text, text, boolean, jsonb)
  from public, anon, authenticated;
grant execute on function public.insert_generated_topic_content(uuid, text, text, text, text, boolean, jsonb)
  to service_role;

commit;
