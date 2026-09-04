#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  cpSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join, relative, resolve, sep } from 'node:path';

const projectRoot = resolve(import.meta.dirname, '..');
const suppliedPdf = resolve(process.argv[2] || join(projectRoot, 'programmes/current.pdf'));
const programmeDir = resolve(process.argv[3] || join(projectRoot, 'programmes'));
const canonicalPdf = join(programmeDir, 'current.pdf');
const pagesDir = join(programmeDir, 'pages');
const manifestPath = join(programmeDir, 'programme.json');
const archiveDir = join(programmeDir, 'archive');
const archiveIndexPath = join(programmeDir, 'archive.json');
const pendingMetadataPath = join(programmeDir, 'pending.json');
const maxPdfBytes = Number(process.env.PROGRAMME_MAX_BYTES || 25 * 1024 * 1024);
const maxPageCount = Number(process.env.PROGRAMME_MAX_PAGES || 64);

class ProgrammeBuildError extends Error {}

function fail(message) {
  throw new ProgrammeBuildError(message);
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

function assertProgrammePath(path, label) {
  const resolvedPath = resolve(path);
  if (!resolvedPath.startsWith(`${programmeDir}${sep}`)) {
    fail(`Refusing to replace ${label} outside the programme folder.`);
  }
}

function readJson(path, fallback = null) {
  if (!existsSync(path)) return fallback;
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    fail(`Could not read ${relative(projectRoot, path)}: ${error.message}`);
  }
}

function seasonForDate(matchDate) {
  const match = /^(\d{4})-(\d{2})-\d{2}$/.exec(matchDate || '');
  if (!match) return '';
  const year = Number(match[1]);
  const month = Number(match[2]);
  const start = month >= 7 ? year : year - 1;
  return `${start}/${String(start + 1).slice(-2)}`;
}

function readableDate(matchDate) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(matchDate || '')) return '';
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC'
  }).format(new Date(`${matchDate}T12:00:00Z`));
}

function programmeMetadata(input = {}) {
  const matchDate = /^\d{4}-\d{2}-\d{2}$/.test(input.matchDate || '') ? input.matchDate : '';
  const season = /^\d{4}\/\d{2}$/.test(input.season || '')
    ? input.season
    : seasonForDate(matchDate);
  const opponent = String(input.opponent || '').trim().slice(0, 80);
  const title = String(input.title || (opponent ? `Hollybush RFC v ${opponent}` : 'Matchday Programme')).trim().slice(0, 120);
  const dateLabel = readableDate(matchDate);

  return {
    title,
    edition: String(input.edition || [dateLabel, season].filter(Boolean).join(' · ') || 'Current edition').trim().slice(0, 120),
    opponent,
    matchDate,
    season
  };
}

function archiveCurrentProgramme() {
  if (!existsSync(canonicalPdf) || !existsSync(manifestPath) || !existsSync(pagesDir)) return;

  const current = readJson(manifestPath);
  if (!current?.version || !Array.isArray(current.pages) || !current.pages.length) return;

  const index = readJson(archiveIndexPath, { schemaVersion: 1, editions: [] });
  if (!Array.isArray(index.editions)) index.editions = [];
  if (index.editions.some(item => item.version === current.version)) return;

  const metadata = programmeMetadata(current);
  const seasonSlug = (metadata.season || 'other').replace('/', '-');
  const relativeDir = `programmes/archive/${seasonSlug}/${current.version}`;
  const targetDir = join(archiveDir, seasonSlug, current.version);
  const targetPages = join(targetDir, 'pages');
  assertProgrammePath(targetDir, 'programme archive');

  mkdirSync(targetDir, { recursive: true });
  copyFileSync(canonicalPdf, join(targetDir, 'programme.pdf'));
  cpSync(pagesDir, targetPages, { recursive: true });

  const archivedManifest = {
    ...current,
    ...metadata,
    edition: metadata.edition.replace(/ · Current edition$/, ''),
    pdf: `${relativeDir}/programme.pdf?v=${current.version}`,
    pages: current.pages.map((page, index) => ({
      ...page,
      src: `${relativeDir}/pages/page-${String(index + 1).padStart(3, '0')}.jpg?v=${current.version}`
    }))
  };
  writeFileSync(join(targetDir, 'manifest.json'), `${JSON.stringify(archivedManifest, null, 2)}\n`);

  index.schemaVersion = 1;
  index.editions.push({
    version: current.version,
    title: metadata.title,
    opponent: metadata.opponent,
    matchDate: metadata.matchDate,
    season: metadata.season || 'Other',
    pageCount: current.pageCount,
    cover: `${relativeDir}/pages/page-001.jpg?v=${current.version}`,
    manifest: `${relativeDir}/manifest.json`
  });
  index.editions.sort((a, b) => (b.matchDate || '').localeCompare(a.matchDate || ''));
  writeFileSync(archiveIndexPath, `${JSON.stringify(index, null, 2)}\n`);
}

function promote(staged) {
  const replacements = [
    { target: pagesDir, source: staged.pages, backup: join(staged.root, 'previous-pages') },
    { target: canonicalPdf, source: staged.pdf, backup: join(staged.root, 'previous-current.pdf') },
    { target: manifestPath, source: staged.manifest, backup: join(staged.root, 'previous-programme.json') }
  ];

  replacements.forEach(item => assertProgrammePath(item.target, item.target));
  const backedUp = [];
  const installed = [];

  try {
    for (const item of replacements) {
      if (existsSync(item.target)) {
        renameSync(item.target, item.backup);
        backedUp.push(item);
      }
    }

    for (const item of replacements) {
      renameSync(item.source, item.target);
      installed.push(item);
    }
  } catch (error) {
    for (const item of installed.reverse()) {
      rmSync(item.target, { recursive: true, force: true });
    }
    for (const item of backedUp.reverse()) {
      if (existsSync(item.backup)) renameSync(item.backup, item.target);
    }
    fail(`Could not publish the completed programme build: ${error.message}`);
  }

  for (const item of backedUp) {
    rmSync(item.backup, { recursive: true, force: true });
  }
}

function build() {
  if (!existsSync(suppliedPdf)) fail(`PDF not found: ${suppliedPdf}`);

  const suppliedSize = statSync(suppliedPdf).size;
  if (suppliedSize === 0) fail('The supplied PDF is empty.');
  if (suppliedSize > maxPdfBytes) {
    fail(`The supplied PDF is larger than ${Math.round(maxPdfBytes / 1024 / 1024)} MB.`);
  }

  const header = readFileSync(suppliedPdf).subarray(0, 1024).toString('latin1');
  if (!header.includes('%PDF-')) fail('The supplied file does not have a valid PDF header.');

  mkdirSync(programmeDir, { recursive: true });
  const pdfBytes = readFileSync(suppliedPdf);
  const publishingPending = suppliedPdf !== canonicalPdf;
  const existingManifest = readJson(manifestPath, {});
  const requestedMetadata = publishingPending
    ? readJson(pendingMetadataPath, {})
    : existingManifest;
  const metadata = programmeMetadata(requestedMetadata);
  const version = createHash('sha256').update(pdfBytes).digest('hex').slice(0, 12);
  const info = run('pdfinfo', [suppliedPdf]);
  const pageCount = Number(info.match(/^Pages:\s+(\d+)$/m)?.[1]);
  if (!pageCount) fail('The PDF has no readable pages.');
  if (pageCount > maxPageCount) fail(`The PDF has ${pageCount} pages; the limit is ${maxPageCount}.`);
  if (/^Encrypted:\s+yes$/mi.test(info)) fail('Password-protected PDFs cannot be published.');

  const renderDir = mkdtempSync(join(tmpdir(), 'hollybush-programme-render-'));
  const stageDir = mkdtempSync(join(programmeDir, '.programme-build-'));
  const stagedPagesDir = join(stageDir, 'pages');
  const stagedPdf = join(stageDir, 'current.pdf');
  const stagedManifest = join(stageDir, 'programme.json');

  try {
    run('pdftoppm', [
      '-jpeg',
      '-scale-to-x', '1200',
      '-scale-to-y', '-1',
      '-jpegopt', 'quality=94',
      suppliedPdf,
      join(renderDir, 'render')
    ]);

    const rendered = readdirSync(renderDir)
      .filter(name => /^render-\d+\.jpg$/i.test(name))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      .map(name => join(renderDir, name));

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

    mkdirSync(stagedPagesDir, { recursive: true });

    const pages = rendered.map((input, index) => {
      const outputName = `page-${String(index + 1).padStart(3, '0')}.jpg`;
      const output = join(stagedPagesDir, outputName);
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
      ...metadata,
      version,
      pageCount,
      pageWidth: firstPage.width,
      pageHeight: firstPage.height,
      displayMode: squareArtwork ? 'trimmed-square' : 'original-page',
      pdf: `programmes/current.pdf?v=${version}`,
      pdfSizeBytes: pdfBytes.length,
      pages
    };

    copyFileSync(suppliedPdf, stagedPdf);
    writeFileSync(stagedManifest, `${JSON.stringify(manifest, null, 2)}\n`);

    const originalMegabytes = (pdfBytes.length / 1024 / 1024).toFixed(1);
    const pageBytes = pages.reduce((total, page) => {
      const filename = page.src.split('?')[0].replace('programmes/pages/', '');
      return total + statSync(join(stagedPagesDir, filename)).size;
    }, 0);

    if (publishingPending && existingManifest.version !== version) archiveCurrentProgramme();
    promote({ root: stageDir, pages: stagedPagesDir, pdf: stagedPdf, manifest: stagedManifest });

    console.log(`Built ${pageCount} programme pages from ${basename(suppliedPdf)}.`);
    console.log(`Layout: ${squareArtwork ? 'square artwork (A4 whitespace removed)' : 'original page ratio'}.`);
    console.log(`PDF: ${originalMegabytes} MB; optimised pages: ${(pageBytes / 1024 / 1024).toFixed(1)} MB.`);
    console.log(`Manifest: ${relative(projectRoot, manifestPath)} (${version}).`);
  } finally {
    rmSync(renderDir, { recursive: true, force: true });
    rmSync(stageDir, { recursive: true, force: true });
  }
}

try {
  build();
} catch (error) {
  const message = error instanceof ProgrammeBuildError ? error.message : error.stack || error.message;
  console.error(`Programme build failed: ${message}`);
  process.exitCode = 1;
}
