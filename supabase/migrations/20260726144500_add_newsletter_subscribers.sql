create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(), email text not null unique,
  status text not null default 'subscribed' check(status in ('subscribed','unsubscribed')),
  source text not null default 'website', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.newsletter_subscribers enable row level security;
create policy "Deny public newsletter access" on public.newsletter_subscribers as restrictive
for all to anon,authenticated using(false) with check(false);
grant all on public.newsletter_subscribers to service_role;
