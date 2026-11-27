import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const matrix = JSON.parse(fs.readFileSync(path.join(root, 'ACCEPTANCE_MATRIX.json'), 'utf8'));
const requiredFields = ['id','requirement','implementation','test','evidence','status','criticVerdict','ownerDecision'];
const failures = [];
const seen = new Set();

if (!Array.isArray(matrix.requirements) || matrix.requirements.length === 0) {
  throw new Error('Acceptance matrix is empty or invalid.');
}
for (const item of matrix.requirements) {
  for (const field of requiredFields) {
    if (!(field in item) || (typeof item[field] !== 'string')) failures.push((item.id || 'UNKNOWN') + ': missing/invalid ' + field);
  }
  if (!item.id || seen.has(item.id)) failures.push((item.id || 'UNKNOWN') + ': missing or duplicate requirement ID');
  seen.add(item.id);
  if (item.status !== 'EXCELLENT / VERIFIED') failures.push(item.id + ': status is ' + (item.status || 'MISSING'));
  if (item.criticVerdict !== 'ACCEPT') failures.push(item.id + ': critic verdict is not ACCEPT');
  if (!item.implementation || !fs.existsSync(path.join(root, item.implementation))) failures.push(item.id + ': implementation evidence is missing');
  if (!item.test || !fs.existsSync(path.join(root, item.test))) failures.push(item.id + ': reproducible test is missing');
  if (!item.evidence || !fs.existsSync(path.join(root, item.evidence))) failures.push(item.id + ': evidence record is missing');
}

if (failures.length) {
  console.error('STRICT CRITIC GATE: REJECT — ' + failures.length + ' unmet acceptance conditions across ' + matrix.requirements.length + ' requirements.');
  for (const failure of failures) console.error('REJECT: ' + failure);
  process.exitCode = 1;
} else {
  console.log('STRICT CRITIC GATE: all ' + matrix.requirements.length + ' requirements are EXCELLENT / VERIFIED.');
  console.log('This automated gate does not replace independent visual review or the owner\'s final decision.');
}
