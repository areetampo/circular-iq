/* global process */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { prepareWrite, writeJsonl } from '#utils/datasetsUtils.js';

const TMP_DIR = path.join(process.cwd(), 'backend', 'tests', 'tmp');

// ensure tmp directory exists before running tests
await fs.promises.mkdir(TMP_DIR, { recursive: true });

test('prepareWrite creates directory and empties file when requested', async () => {
  const file = path.join(TMP_DIR, 'prep.txt');

  // cleanup from previous runs
  await fs.promises.rm(file, { force: true });

  // first call should return false (new file)
  const existed1 = await prepareWrite(file);
  assert.strictEqual(existed1, false);
  let stat = await fs.promises.stat(file);
  assert.ok(stat.isFile());

  // write some data then lock it to simulate old run
  await fs.promises.writeFile(file, 'hello');
  await fs.promises.chmod(file, 0o444);

  // calling with clear should wipe the contents
  const existed2 = await prepareWrite(file, { clear: true });
  assert.strictEqual(existed2, true);
  const content = await fs.promises.readFile(file, 'utf8');
  assert.strictEqual(content, '');

  // file should now be writable again (mode 644 or similar)
  stat = await fs.promises.stat(file);
  assert.ok(stat.mode & 0o200, 'file should be writable by owner');
});

test('writeJsonl appends and honors clearOnFirst', async () => {
  const file = path.join(TMP_DIR, 'jsonl.txt');
  await fs.promises.rm(file, { force: true });

  // first append with clearOnFirst should create file and write
  await writeJsonl(file, [{ a: 1 }], { append: true, clearOnFirst: true });
  let content = await fs.promises.readFile(file, 'utf8');
  assert.ok(content.includes('"a":1'));

  // second append without clearOnFirst should append
  await writeJsonl(file, [{ b: 2 }], { append: true });
  content = await fs.promises.readFile(file, 'utf8');
  assert.ok(content.includes('"a":1'));
  assert.ok(content.includes('"b":2'));
});

// cleanup task after tests
process.on('exit', () => {
  try {
    fs.rmSync(TMP_DIR, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
});
