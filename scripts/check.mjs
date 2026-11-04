#!/usr/bin/env node
// Dependency-free release check for Nexus 2035.
//
//   node scripts/check.mjs
//
// Verifies that the release files exist, local assets and Markdown links resolve,
// JavaScript parses, JSON parses, and the reusable skill template is byte-identical
// to the shipped sources. Exits 0 on success, 1 on any failure.

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SKILL = "skills/nexus-2035-house-tour";

let checks = 0;
const failures = [];

function ok(condition, label, detail) {
  checks += 1;
  if (!condition) failures.push(detail ? `${label} — ${detail}` : label);
}

function abs(rel) {
  return join(ROOT, rel);
}

function read(rel) {
  return readFileSync(abs(rel), "utf8");
}

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".git") continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.isFile()) out.push(full);
  }
  return out;
}

/* ── 1. Required release files ─────────────────────────────── */
const required = [
  "index.html",
  "style.css",
  "script.js",
  "README.md",
  "AGENTS.md",
  "LICENSE",
  "state.json",
  ".nojekyll",
  "scripts/check.mjs",
  "docs/ARCHITECTURE.md",
  "docs/REPRODUCTION.md",
  "docs/DEPLOYMENT.md",
  "docs/TESTING.md",
  `${SKILL}/SKILL.md`,
  `${SKILL}/ATTRIBUTION.md`,
  `${SKILL}/references/method.md`,
  `${SKILL}/references/lessons.md`,
  `${SKILL}/references/verification.md`,
  `${SKILL}/assets/template/index.html`,
  `${SKILL}/assets/template/style.css`,
  `${SKILL}/assets/template/script.js`
];
for (const rel of required) {
  ok(existsSync(abs(rel)), `required file: ${rel}`, "missing");
}

/* ── 2. Local src/href in index.html ───────────────────────── */
const html = read("index.html");
const assetRefs = [...html.matchAll(/\b(?:src|href)="([^"]+)"/g)].map((m) => m[1]);
for (const ref of assetRefs) {
  if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(ref)) continue;
  const clean = decodeURIComponent(ref.split("#")[0].split("?")[0]);
  if (!clean) continue;
  ok(existsSync(join(ROOT, clean)), `index.html asset: ${ref}`, "does not resolve");
}

/* ── 3. Relative Markdown links ────────────────────────────── */
function markdownFiles() {
  const list = ["README.md", "AGENTS.md"];
  for (const name of ["docs", "skills"]) {
    const dir = abs(name);
    if (existsSync(dir)) {
      for (const file of walk(dir)) {
        if (/\.md$/i.test(file) && !file.includes("node_modules")) {
          list.push(relative(ROOT, file));
        }
      }
    }
  }
  return [...new Set(list)].filter((rel) => existsSync(abs(rel)));
}

const LINK_RE = /\[[^\]]*\]\(\s*(<[^>]+>|[^)\s]+)(?:\s+"[^"]*")?\s*\)/g;
for (const relFile of markdownFiles()) {
  const body = read(relFile);
  let inFence = false;
  body.split(/\r?\n/).forEach((line) => {
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      return;
    }
    if (inFence) return;
    const text = line.replace(/`[^`]*`/g, "");
    for (const match of text.matchAll(LINK_RE)) {
      let target = match[1];
      if (target.startsWith("<") && target.endsWith(">")) target = target.slice(1, -1);
      if (!target || target.startsWith("#")) continue;
      if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(target)) continue;
      const clean = decodeURIComponent(target.split("#")[0].split("?")[0]);
      if (!clean) continue;
      const targetPath = clean.startsWith("/")
        ? join(ROOT, clean)
        : resolve(dirname(abs(relFile)), clean);
      ok(
        existsSync(targetPath),
        `markdown link: ${relFile} → ${target}`,
        "does not resolve"
      );
    }
  });
}

/* ── 4. JavaScript syntax ──────────────────────────────────── */
const scriptFiles = walk(ROOT).filter((file) => /\.(?:js|mjs)$/i.test(file));
for (const file of scriptFiles) {
  const rel = relative(ROOT, file);
  try {
    execFileSync(process.execPath, ["--check", file], { stdio: "pipe" });
    ok(true, `node --check: ${rel}`);
  } catch (error) {
    const detail = (error.stderr || Buffer.from("")).toString().trim().split("\n")[0];
    ok(false, `node --check: ${rel}`, detail || "syntax error");
  }
}

/* ── 5. JSON files parse ───────────────────────────────────── */
const jsonFiles = walk(ROOT).filter((file) => extname(file).toLowerCase() === ".json");
for (const file of jsonFiles) {
  const rel = relative(ROOT, file);
  try {
    JSON.parse(readFileSync(file, "utf8"));
    ok(true, `JSON parses: ${rel}`);
  } catch (error) {
    ok(false, `JSON parses: ${rel}`, error.message);
  }
}

/* ── 6. Skill template is byte-identical ───────────────────── */
for (const name of ["index.html", "style.css", "script.js"]) {
  const source = readFileSync(abs(name));
  const template = readFileSync(abs(`${SKILL}/assets/template/${name}`));
  ok(source.equals(template), `skill template: ${name}`, "not byte-identical to the release source");
}

/* ── 7. README documents the release set ───────────────────── */
const readme = read("README.md");
for (const target of [
  "AGENTS.md",
  "docs/REPRODUCTION.md",
  "docs/ARCHITECTURE.md",
  "docs/TESTING.md",
  "docs/DEPLOYMENT.md",
  `${SKILL}/SKILL.md`
]) {
  ok(readme.includes(`](${target})`), `README links: ${target}`, "missing from Documentation section");
}

/* ── 8. Application invariants the docs rely on ────────────── */
ok(html.includes("three.js/r128/three.min.js"), "pinned Three.js r128 CDN", "r128 URL missing");
ok(
  html.includes("three@0.128.0/examples/js/controls/OrbitControls.js"),
  "pinned OrbitControls CDN",
  "0.128.0 URL missing"
);
ok(html.includes('id="scene-canvas"'), "canvas hook", "#scene-canvas missing");
const script = read("script.js");
for (const token of [
  'const STORAGE_KEY = "nexus2035.tour.v1"',
  "function buildWorld()",
  "function tickEnvironment(dt)",
  "function flyTo(",
  "function applyTourState(",
  "nexus2035_house_state.json",
  "function pick("
]) {
  ok(script.includes(token), `script invariant: ${token}`, "missing");
}
ok(!/\bfetch\s*\(/.test(script), "no fetch() in app code", "runtime network call added");
ok(!/XMLHttpRequest/.test(script), "no XMLHttpRequest", "runtime network call added");
ok(!/new\s+WebSocket/.test(script), "no WebSocket", "runtime network call added");
ok(!/\bTODO\b|\bFIXME\b/.test(script), "no TODO/FIXME markers", "unfinished marker in script.js");

/* ── Report ────────────────────────────────────────────────── */
if (failures.length) {
  for (const failure of failures) console.log(`FAIL ${failure}`);
  console.log(`FAILED ${failures.length} of ${checks} checks`);
  process.exit(1);
}
console.log(`OK ${checks} checks`);
