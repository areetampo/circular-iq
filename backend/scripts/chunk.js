import fs from "fs";
import path from "path";

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

function chunkText(text, size = 700, overlap = 100) {
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    chunks.push(text.slice(start, start + size));
    start += size - overlap;
  }

  return chunks;
}

function getChunks() {
  const baseDir = path.join("dataset", "GreenTechGuardians");

  const files = readFiles(baseDir).filter(f =>
    /\.(md|txt|json|csv|js|ts)$/.test(f)
  );

  let allChunks = [];

  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");
    const prefixed = `FILE: ${file}\n${content}`;
    const chunks = chunkText(prefixed);
    allChunks = allChunks.concat(chunks);
  }

  return allChunks;
}

// TEMP TEST
const chunks = getChunks();
console.log("Total chunks:", chunks.length);
console.log("\n--- SAMPLE CHUNK ---\n");
console.log(chunks[0]);
