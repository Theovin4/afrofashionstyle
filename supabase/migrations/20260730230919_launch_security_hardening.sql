create table if not exists public.security_rate_limits (
  bucket text primary key,
  request_count integer not null default 1,
  window_started_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.security_rate_limits enable row level security;
revoke all on table public.security_rate_limits from public, anon, authenticated;
grant select, insert, update, delete on table public.security_rate_limits to service_role;

create or replace function public.consume_security_rate_limit(
  bucket_key text,
  maximum_requests integer,
  window_seconds integer
)
returns table(allowed boolean, retry_after integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_row public.security_rate_limits%rowtype;
  elapsed_seconds integer;
begin
  if length(bucket_key) < 10 or maximum_requests < 1 or window_seconds < 1 then
    return query select false, greatest(window_seconds, 1);
    return;
  end if;

  insert into public.security_rate_limits(bucket, request_count, window_started_at, updated_at)
  values (bucket_key, 1, now(), now())
  on conflict (bucket) do update
  set
    request_count = case
      when public.security_rate_limits.window_started_at <= now() - make_interval(secs => window_seconds)
      then 1
      else public.security_rate_limits.request_count + 1
    end,
    window_started_at = case
      when public.security_rate_limits.window_started_at <= now() - make_interval(secs => window_seconds)
      then now()
      else public.security_rate_limits.window_started_at
    end,
    updated_at = now()
  returning * into current_row;

  elapsed_seconds := greatest(0, extract(epoch from (now() - current_row.window_started_at))::integer);
  return query select
    current_row.request_count <= maximum_requests,
    case when current_row.request_count <= maximum_requests
      then 0
      else greatest(1, window_seconds - elapsed_seconds)
    end;
end;
$$;

revoke all on function public.consume_security_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_security_rate_limit(text, integer, integer) to service_role;

create index if not exists security_rate_limits_updated_at_idx
  on public.security_rate_limits(updated_at);
