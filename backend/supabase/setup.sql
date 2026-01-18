-- 1. Enable the pgvector extension to work with embeddings
create extension if not exists vector;

-- 2. Create the table to store your sustainability data chunks
create table documents (
  id bigserial primary key,
  content text,              -- The actual text chunk
  embedding vector(1536)     -- The math representation (OpenAI size)
);

-- 3. Create an index to make searches fast
create index on documents
using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

-- 4. Create the search function (RPC) for the backend to use
create or replace function match_documents (
  query_embedding vector(1536),
  match_count int
)
returns table (
  id bigint,
  content text,
  similarity float
)
language sql stable
as $$
  select
    id,
    content,
    1 - (embedding <=> query_embedding) as similarity
  from documents
  order by embedding <=> query_embedding
  limit match_count;
$$;