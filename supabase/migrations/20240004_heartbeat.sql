-- ============================================================
-- Migration 004: heartbeat upsert function
-- Called by the Supabase Edge Function (see /functions/heartbeat)
-- instead of writing directly from the client.
-- Accepts a batch of progress events and upserts them safely.
-- ============================================================

create type public.heartbeat_event as (
  lesson_id        uuid,
  percent_watched  numeric
);

create or replace function public.upsert_progress_batch(
  events public.heartbeat_event[]
)
returns void
language plpgsql security definer as $$
declare
  ev public.heartbeat_event;
begin
  foreach ev in array events loop
    insert into public.progress_records (user_id, lesson_id, percent_watched)
    values (auth.uid(), ev.lesson_id, ev.percent_watched)
    on conflict (user_id, lesson_id) do update
      set percent_watched = greatest(
            public.progress_records.percent_watched,
            excluded.percent_watched
          );
      -- Note: the trigger handles is_completed and last_watched_at
  end loop;
end;
$$;

-- Grant execute to authenticated users only
revoke execute on function public.upsert_progress_batch(public.heartbeat_event[]) from public;
grant  execute on function public.upsert_progress_batch(public.heartbeat_event[]) to authenticated;
