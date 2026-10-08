create table if not exists public.analytics_users (
  id uuid primary key,
  full_name text not null check (char_length(full_name) between 1 and 100),
  display_name text not null check (char_length(display_name) between 1 and 100),
  username text not null check (char_length(username) between 1 and 32),
  email text not null check (char_length(email) between 3 and 254),
  roles text[] not null default '{}'::text[],
  avatar_path text,
  country text,
  country_code text,
  region text,
  consent_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.analytics_users
  add column if not exists roles text[] not null default '{}'::text[];

alter table public.analytics_users enable row level security;
revoke all on table public.analytics_users from anon, authenticated;
grant all on table public.analytics_users to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('arlo-user-avatars', 'arlo-user-avatars', false, 524288, array['image/jpeg'])
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.analytics_dashboard_summary()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'total_users', (select count(*) from public.analytics_users),
    'countries', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'country', country,
            'countryCode', country_code,
            'total', profile_count
          )
          order by profile_count desc, country asc nulls last
        )
        from (
          select country, country_code, count(*) as profile_count
          from public.analytics_users
          group by country, country_code
        ) as country_totals
      ),
      '[]'::jsonb
    )
  );
$$;

revoke all on function public.analytics_dashboard_summary() from public, anon, authenticated;
grant execute on function public.analytics_dashboard_summary() to service_role;
