// Prepara uma cópia exclusiva do curso para o APK, sem depender de outro repositório.
import { cp, mkdir, readFile, rm, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const target = join(repo, 'www');
const includes = [
  'index.html', 'curso-completo.html', 'aulas-zero-1.js', 'aulas-zero-2.js',
  'app-zero.js', 'zero.css', 'bootstrap.js', 'firebase-tutor-setup.js', 'android-app-check.js',
  'styles.css', 'pro.css', 'sw.js', 'manifest.webmanifest',
  'assets', 'payload'
];

await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });

for (const item of includes) {
  await stat(join(repo, item));
  await cp(join(repo, item), join(target, item), { recursive: true });
}

const firstStep = await readFile(join(target, 'index.html'), 'utf8');
if (!firstStep.includes('app-zero.js') || !firstStep.includes('aulas-zero-2.js')) {
  throw new Error('Faltam as aulas do zero absoluto no início do curso');
}
const html = await readFile(join(target, 'curso-completo.html'), 'utf8');
if (!html.includes('firebase-tutor-setup.js') || !html.includes('bootstrap.js')) {
  throw new Error('Faltam scripts do tutor no curso completo');
}
for (let i = 0; i < 8; i++) {
  const part = join(target, 'payload', `code-0${i}.txt`);
  if (!(await readFile(part, 'utf8')).trim()) {
    throw new Error(`Parte do curso vazia: ${part}`);
  }
}
console.log('Trilha introdutória, 96 aulas originais e Tutor copiados para www/ do Android.');
