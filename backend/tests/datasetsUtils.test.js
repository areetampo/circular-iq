import fs from 'fs';
import assert from 'node:assert/strict';
import test from 'node:test';
import path from 'path';

import { hasAppendFlag, prepareWrite, writeCsv, writeJsonl } from '#utils/datasetsUtils.js';

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

// --- new tests for append flag and writeCsv ---

test('hasAppendFlag detects --append argument', () => {
  const original = [...process.argv];
  process.argv.push('--append');
  assert.strictEqual(hasAppendFlag(), true);
  process.argv = original;
});

test('writeCsv append mode bumps id suffix and preserves existing file', async () => {
  const file = path.join(TMP_DIR, 'csv.txt');
  await fs.promises.rm(file, { force: true });

  // create initial file with two rows and id column
  const initial = [
    { id: 'foo_1', value: 'one' },
    { id: 'foo_2', value: 'two' },
  ];
  await writeCsv('foo', file, initial);

  // append new rows; ids should be rewritten to foo_3, foo_4
  const toAdd = [
    { id: 'foo_1', value: 'three' },
    { id: 'foo_2', value: 'four' },
  ];
  await writeCsv('foo', file, toAdd, true);

  let content = await fs.promises.readFile(file, 'utf8');
  let lines = content.trim().split('\n');
  assert.strictEqual(lines[0], 'id,value');
  assert.strictEqual(lines[1], 'foo_1,one');
  assert.strictEqual(lines[2], 'foo_2,two');
  assert.strictEqual(lines[3], 'foo_3,three');
  assert.strictEqual(lines[4], 'foo_4,four');
});

// append without id column should just tack rows on
test('writeCsv append with no id column does simple append', async () => {
  const file = path.join(TMP_DIR, 'csv2.txt');
  await fs.promises.rm(file, { force: true });

  const initial = [{ foo: 'a' }];
  await writeCsv('foo', file, initial);

  const toAdd = [{ foo: 'b' }];
  await writeCsv('foo', file, toAdd, true);

  const content = await fs.promises.readFile(file, 'utf8');
  const lines = content.trim().split('\n');
  assert.strictEqual(lines.length, 3);
  assert.strictEqual(lines[1], 'a');
  assert.strictEqual(lines[2], 'b');
});

// uppercase ID field should also be bumped correctly
test('writeCsv append rewrites uppercase ID column', async () => {
  const file = path.join(TMP_DIR, 'csv3.txt');
  await fs.promises.rm(file, { force: true });

  const initial = [
    { ID: 'bar_5', value: 'five' },
    { ID: 'bar_6', value: 'six' },
  ];
  await writeCsv('bar', file, initial);

  const toAdd = [{ ID: 'bar_1', value: 'seven' }];
  await writeCsv('bar', file, toAdd, true);

  const content = await fs.promises.readFile(file, 'utf8');
  const lines = content.trim().split('\n');
  assert.strictEqual(lines[0], 'ID,value');
  assert.strictEqual(lines[1], 'bar_5,five');
  assert.strictEqual(lines[2], 'bar_6,six');
  assert.strictEqual(lines[3], 'bar_7,seven');
});

// cleanup task after tests
process.on('exit', () => {
  try {
    fs.rmSync(TMP_DIR, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
});
