import fs from "fs";
import path from "path";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

function chunkText(text, size = 700, overlap = 100) {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    chunks.push(text.slice(start, start + size));
    start += size - overlap;
  }
  return chunks;
}

function readFiles(dir) {
  let files = [];
  for (const file of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      files = files.concat(readFiles(fullPath));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

async function ingest() {
  const baseDir = path.join("dataset", "GreenTechGuardians");
  const files = readFiles(baseDir).filter((f) =>
    /\.(md|txt|csv|json|js|ts)$/.test(f)
  );

  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");
    const chunks = chunkText(`FILE: ${file}\n${content}`);

    const BATCH_SIZE = 50;

    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);

      const embeddingResponse = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: batch,
      });

      const rows = embeddingResponse.data.map((e, idx) => ({
        content: batch[idx],
        embedding: e.embedding,
      }));

      await supabase.from("documents").insert(rows);
    }
  }

  console.log("Ingestion complete");
}

ingest();
