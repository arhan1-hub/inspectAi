create extension if not exists pgcrypto;

create table if not exists public.inspections (
  id uuid primary key default gen_random_uuid(),
  asset_name text not null,
  asset_id text,
  status text not null default 'review',
  analysis_mode text,
  summary text,
  created_at timestamptz not null default now()
);

create table if not exists public.inspection_images (
  id uuid primary key default gen_random_uuid(),
  inspection_id uuid not null references public.inspections(id) on delete cascade,
  kind text not null check (kind in ('before','after')),
  storage_path text not null,
  original_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.findings (
  id uuid primary key default gen_random_uuid(),
  inspection_id uuid not null references public.inspections(id) on delete cascade,
  title text not null,
  detail text not null,
  status text not null default 'REVIEW',
  confidence numeric,
  reviewer_status text not null default 'pending',
  reviewer_note text,
  created_at timestamptz not null default now()
);

-- Keep inspection photos private in production. Create the bucket in Supabase Storage:
-- Bucket: inspection-evidence (private)
-- Then add Storage RLS policies tied to authenticated users/organizations.
