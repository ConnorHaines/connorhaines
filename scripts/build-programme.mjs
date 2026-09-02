#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, relative, resolve, sep } from 'node:path';

const projectRoot = resolve(import.meta.dirname, '..');
const suppliedPdf = resolve(process.argv[2] || join(projectRoot, 'programmes/current.pdf'));
const programmeDir = resolve(process.argv[3] || join(projectRoot, 'programmes'));
const canonicalPdf = join(programmeDir, 'current.pdf');
const pagesDir = join(programmeDir, 'pages');
const manifestPath = join(programmeDir, 'programme.json');

function fail(message) {
  console.error(`Programme build failed: ${message}`);
  process.exit(1);
}

function run(command, args, options = {}) {
  try {
    return execFileSync(command, args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      ...options
    }).trim();
  } catch (error) {
    const detail = error.stderr?.toString().trim() || error.message;
    fail(`${command}: ${detail}`);
  }
}

function dimensions(file) {
  const output = run('identify', ['-format', '%w %h', file]);
  const [width, height] = output.split(/\s+/).map(Number);
  if (!width || !height) fail(`Could not read image dimensions for ${file}`);
  return { width, height };
}

if (!existsSync(suppliedPdf)) fail(`PDF not found: ${suppliedPdf}`);
if (statSync(suppliedPdf).size === 0) fail('The supplied PDF is empty.');

mkdirSync(programmeDir, { recursive: true });
if (suppliedPdf !== canonicalPdf) copyFileSync(suppliedPdf, canonicalPdf);

const pdfBytes = readFileSync(canonicalPdf);
const version = createHash('sha256').update(pdfBytes).digest('hex').slice(0, 12);
const info = run('pdfinfo', [canonicalPdf]);
const pageCount = Number(info.match(/^Pages:\s+(\d+)$/m)?.[1]);
if (!pageCount) fail('The PDF has no readable pages.');

const tempDir = mkdtempSync(join(tmpdir(), 'hollybush-programme-'));

try {
  run('pdftoppm', [
    '-jpeg',
    '-scale-to-x', '1200',
    '-scale-to-y', '-1',
    '-jpegopt', 'quality=94',
    canonicalPdf,
    join(tempDir, 'render')
  ]);

  const rendered = readdirSync(tempDir)
    .filter(name => /^render-\d+\.jpg$/i.test(name))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map(name => join(tempDir, name));

  if (rendered.length !== pageCount) {
    fail(`Expected ${pageCount} rendered pages but found ${rendered.length}.`);
  }

  const first = dimensions(rendered[0]);
  const trimmed = run('convert', [
    rendered[0], '-fuzz', '6%', '-trim', '-format', '%w %h %X %Y', 'info:'
  ]).split(/\s+/).map(Number);
  const [trimWidth, trimHeight] = trimmed;
  const trimAspect = trimWidth / trimHeight;
  const borderShare = 1 - (trimHeight / first.height);
  const squareArtwork = trimWidth / first.width > 0.96
    && Math.abs(trimAspect - 1) < 0.08
    && borderShare > 0.15;

  const resolvedPagesDir = resolve(pagesDir);
  if (!resolvedPagesDir.startsWith(`${resolve(programmeDir)}${sep}`)) {
    fail('Refusing to clear a pages directory outside the programme folder.');
  }
  rmSync(resolvedPagesDir, { recursive: true, force: true });
  mkdirSync(resolvedPagesDir, { recursive: true });

  const pages = rendered.map((input, index) => {
    const outputName = `page-${String(index + 1).padStart(3, '0')}.jpg`;
    const output = join(resolvedPagesDir, outputName);
    const source = dimensions(input);
    const transform = [];

    if (squareArtwork) {
      const side = Math.min(source.width, source.height);
      const left = Math.floor((source.width - side) / 2);
      const top = Math.floor((source.height - side) / 2);
      transform.push('-crop', `${side}x${side}+${left}+${top}`, '+repage');
    }

    transform.push(
      '-resize', '1200x1800>',
      '-strip',
      '-quality', '84',
      '-sampling-factor', '4:2:0',
      '-interlace', 'Plane'
    );

    run('convert', [input, ...transform, output]);
    if (!existsSync(output) || statSync(output).size === 0) {
      fail(`ImageMagick did not produce page ${index + 1}.`);
    }
    const outputSize = dimensions(output);

    return {
      number: index + 1,
      src: `programmes/pages/${outputName}?v=${version}`,
      width: outputSize.width,
      height: outputSize.height
    };
  });

  const firstPage = pages[0];
  const manifest = {
    schemaVersion: 1,
    title: 'Matchday Programme',
    edition: 'Current edition',
    version,
    pageCount,
    pageWidth: firstPage.width,
    pageHeight: firstPage.height,
    displayMode: squareArtwork ? 'trimmed-square' : 'original-page',
    pdf: `programmes/current.pdf?v=${version}`,
    pdfSizeBytes: pdfBytes.length,
    pages
  };

  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  const originalMegabytes = (pdfBytes.length / 1024 / 1024).toFixed(1);
  const pageMegabytes = pages.reduce((total, page) => {
    const filename = page.src.split('?')[0].replace('programmes/pages/', '');
    return total + statSync(join(resolvedPagesDir, filename)).size;
  }, 0) / 1024 / 1024;

  console.log(`Built ${pageCount} programme pages from ${basename(canonicalPdf)}.`);
  console.log(`Layout: ${squareArtwork ? 'square artwork (A4 whitespace removed)' : 'original page ratio'}.`);
  console.log(`PDF: ${originalMegabytes} MB; optimised pages: ${pageMegabytes.toFixed(1)} MB.`);
  console.log(`Manifest: ${relative(projectRoot, manifestPath)} (${version}).`);
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
