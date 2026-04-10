create table public.announcements (
  id text not null default (gen_random_uuid ())::text,
  title text not null,
  body text not null,
  posted_by text not null,
  target text not null default 'all'::text,
  target_employer_id text null,
  created_at timestamp with time zone not null default now(),
  pinned boolean not null default false,
  constraint announcements_pkey primary key (id),
  constraint announcements_posted_by_fkey foreign KEY (posted_by) references employees (id) on delete CASCADE,
  constraint announcements_target_employer_id_fkey foreign KEY (target_employer_id) references employees (id) on delete CASCADE,
  constraint announcements_target_check check (
    (
      target = any (array['all'::text, 'employer_team'::text])
    )
  )
) TABLESPACE pg_default;

create index IF not exists announcements_target on public.announcements using btree (target, target_employer_id, created_at desc) TABLESPACE pg_default;
