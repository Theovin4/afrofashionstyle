create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 5 and 180),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  excerpt text not null default '',
  content text not null,
  topic text not null default 'Nigerian Fashion',
  status text not null default 'draft' check (status in ('draft','published','archived')),
  seo_title text not null default '',
  seo_description text not null default '',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists blog_posts_status_published_idx
  on public.blog_posts(status, published_at desc);

alter table public.blog_posts enable row level security;
drop policy if exists "Public can read published blog posts" on public.blog_posts;
create policy "Public can read published blog posts"
  on public.blog_posts for select to anon, authenticated
  using (status = 'published' and published_at <= now());

grant select on public.blog_posts to anon, authenticated;
grant all on public.blog_posts to service_role;

insert into public.blog_posts
  (title, slug, excerpt, content, topic, status, seo_title, seo_description, published_at)
values (
  'How to Style Ankara Dresses for a Modern Occasion',
  'how-to-style-ankara-dresses-for-a-modern-occasion',
  'A considered guide to balancing vibrant Ankara prints with refined accessories, confident proportions and occasion-ready polish.',
  'Ankara is expressive by nature, so the most elegant styling begins with intention. Let the print lead, then choose accessories that echo one or two colours already present in the fabric.

For weddings and celebrations, pair a sculpted Ankara dress with a clean heel and a compact bag. Gold jewellery brings warmth to orange, brown and jewel-toned prints, while silver can sharpen teal and cooler palettes.

Fit matters as much as colour. A defined waist, thoughtful sleeve and hem length create a confident silhouette without competing with the textile. If you are between sizes, send your measurements before ordering because every Afro.Fashionstyle piece is made on request.

Complete the look with restraint: one strong earring, a polished shoe and a beauty look that feels like you. Nigerian fashion is not a costume; it is a living design language made to move beautifully through modern life.',
  'Nigerian Fashion',
  'published',
  'How to Style Ankara Dresses | Afro.Fashionstyle Journal',
  'Learn how to style Ankara dresses for weddings and modern occasions with premium accessories, balanced colour and confident fit.',
  now()
) on conflict (slug) do nothing;
