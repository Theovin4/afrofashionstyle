alter table public.orders
  add column if not exists meta_attribution jsonb not null default '{}'::jsonb;

create unique index if not exists customer_notifications_order_type_unique
  on public.customer_notifications(order_id, notification_type)
  where order_id is not null and notification_type = 'meta_purchase';

create table if not exists public.customer_enquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  email text not null,
  phone text,
  subject text not null check (char_length(subject) between 2 and 160),
  message text not null check (char_length(message) between 10 and 3000),
  status text not null default 'new' check (status in ('new','in_progress','resolved','spam')),
  created_at timestamptz not null default now()
);

create index if not exists customer_enquiries_created_idx
  on public.customer_enquiries(created_at desc);

alter table public.customer_enquiries enable row level security;
grant all on public.customer_enquiries to service_role;
