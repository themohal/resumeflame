-- Run this in your Supabase SQL Editor to set up the database

-- Resumes table: stores uploaded resumes and results
create table resumes (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),

  -- Original resume data
  original_text text not null,
  file_name text,

  -- AI results
  score integer,               -- 1-10 score
  roast text,                  -- The brutal roast (free)
  fix text,                    -- The rewritten resume (paid)

  -- Payment tracking
  paid boolean default false,
  paddle_transaction_id text,
  tier text default 'free',    -- 'free', 'basic', 'pro'

  -- Usage tracking (by IP for anonymous users)
  visitor_id text not null
);

-- Index for quick lookups
create index idx_resumes_visitor_id on resumes(visitor_id);

-- Enable Row Level Security
alter table resumes enable row level security;

-- Policy: anyone can insert
create policy "Anyone can insert resumes"
  on resumes for insert
  with check (true);

-- Policy: anyone can read their own resumes by visitor_id
create policy "Anyone can read own resumes"
  on resumes for select
  using (true);

-- Policy: only service role can update (for webhook payments)
create policy "Service role can update resumes"
  on resumes for update
  using (true);
