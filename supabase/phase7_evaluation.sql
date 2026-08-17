-- Phase 7: research evaluation infrastructure aligned with Objective 3
create table if not exists public.evaluation_cases (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  source_text text not null,
  gold_ingredients jsonb not null default '[]'::jsonb,
  gold_allergens jsonb not null default '[]'::jsonb,
  gold_nutrition jsonb not null default '{}'::jsonb,
  user_constraints jsonb not null default '[]'::jsonb,
  expected_safe boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists public.evaluation_runs (
  id uuid primary key default gen_random_uuid(),
  model_name text not null,
  baseline_name text,
  cases_count integer not null default 0,
  ingredient_precision numeric(8,5), ingredient_recall numeric(8,5), ingredient_f1 numeric(8,5),
  allergen_precision numeric(8,5), allergen_recall numeric(8,5), allergen_f1 numeric(8,5),
  nutrition_precision numeric(8,5), nutrition_recall numeric(8,5), nutrition_f1 numeric(8,5),
  constraint_violation_rate numeric(8,5),
  false_safe_count integer not null default 0,
  false_reject_count integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.evaluation_cases enable row level security;
alter table public.evaluation_runs enable row level security;
-- Evaluation datasets/results are not exposed to ordinary browser users.
create index if not exists idx_evaluation_cases_created on public.evaluation_cases(created_at desc);
create index if not exists idx_evaluation_runs_created on public.evaluation_runs(created_at desc);
