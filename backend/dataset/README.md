This folder contains small sample datasets and adapters for quick ingestion into the chunking + embedding pipeline.

Workflow:

- Place CSVs in `dataset/samples/` (existing sample files are provided).
- Run `node dataset/adapters/ingest_all.js` to merge samples into `dataset/combined_input.csv`.
- Run `node backend/scripts/chunk.js dataset/combined_input.csv dataset/chunks.json` to create chunks.
- Run `node backend/scripts/embed_and_store.js dataset/chunks.json` to generate embeddings and store in Supabase.

Notes:

- The adapter preserves original CSV column names and adds `_source_dataset` column for provenance.
- `chunk.js` was updated to copy any additional CSV columns into `metadata.fields`, so you can add extra params without changing other code.
