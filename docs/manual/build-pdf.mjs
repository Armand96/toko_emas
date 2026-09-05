// Build MANUAL_BOOK.pdf from MANUAL_BOOK.md
// Usage: cd docs/manual && bun install && bun run build   (atau: node build-pdf.mjs)
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { pathToFileURL } from "node:url";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { marked } from "marked";
import puppeteer from "puppeteer-core";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// docs/manual -> project root
const PROJECT_ROOT = path.resolve(__dirname, "..", "..");
const MD_PATH = path.join(PROJECT_ROOT, "MANUAL_BOOK.md");
const PDF_PATH = path.join(PROJECT_ROOT, "MANUAL_BOOK.pdf");
const HTML_OUT = path.join(__dirname, "manual-final.html");

// Resolve mermaid bundle from this folder's node_modules
const MERMAID_JS = require.resolve("mermaid/dist/mermaid.min.js");

// Auto-detect a Chromium-based browser (Chrome / Edge) on Windows/macOS/Linux
function findBrowser() {
  const candidates = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ].filter(Boolean);
  const found = candidates.find((p) => existsSync(p));
  if (!found) {
    console.error("\n[ERROR] Tidak menemukan Chrome/Edge.");
    console.error("Set environment variable PUPPETEER_EXECUTABLE_PATH ke path browser Anda, contoh:");
    console.error('  PUPPETEER_EXECUTABLE_PATH="C:/Program Files/Google/Chrome/Application/chrome.exe"\n');
    process.exit(1);
  }
  return found;
}
const chromePath = findBrowser();

if (!existsSync(MD_PATH)) {
  console.error(`[ERROR] Tidak menemukan ${MD_PATH}`);
  process.exit(1);
}

const md = readFileSync(MD_PATH, "utf8");

// --- Custom renderer: ```mermaid -> <pre class="mermaid">, gambar relatif -> file URI absolut ---
const renderer = new marked.Renderer();
const origCode = renderer.code.bind(renderer);
renderer.code = (token) => {
  const code = typeof token === "object" ? token.text : token;
  const lang = typeof token === "object" ? token.lang : "";
  if (lang === "mermaid") return `<pre class="mermaid">${code}</pre>`;
  return origCode(token);
};
renderer.image = (token) => {
  let href = typeof token === "object" ? token.href : token;
  const text = typeof token === "object" ? token.text : "";
  if (href && !/^https?:|^file:|^data:/.test(href)) {
    const abs = path.resolve(PROJECT_ROOT, href);
    if (existsSync(abs)) href = pathToFileURL(abs).href;
    else console.warn(`[WARN] gambar tidak ditemukan: ${href}`);
  }
  return `<figure class="shot"><img src="${href}" alt="${text || ""}"/><figcaption>${text || ""}</figcaption></figure>`;
};

marked.setOptions({ renderer });
let bodyHtml = marked.parse(md);
const mermaidSrc = readFileSync(MERMAID_JS, "utf8");

// --- Callout boxes: turn blockquotes starting with a marker into styled boxes ---
// Syntax in markdown: > [!TIP] text / > [!WARNING] text / > [!INFO] text (default)
const CALLOUT_META = {
  TIP: { icon: "✅", label: "TIP", cls: "callout-tip" },
  WARNING: { icon: "⚠️", label: "PERHATIAN", cls: "callout-warning" },
  INFO: { icon: "ℹ️", label: "INFO", cls: "callout-info" },
};
bodyHtml = bodyHtml.replace(
  /<blockquote>\s*<p>\s*\[!(TIP|WARNING|INFO)\]\s*/g,
  (_m, type) => {
    const meta = CALLOUT_META[type];
    return `<blockquote class="${meta.cls}"><p><span class="callout-label">${meta.icon} ${meta.label}</span><br/>`;
  }
);
// Plain blockquotes (no marker) still get a default info style via CSS fallback

// --- Status badges: turn `STATUSWORD` inline code spans matching known statuses into colored pills ---
const STATUS_COLORS = {
  AVAILABLE: "#10b981", DISETUJUI: "#10b981", SESUAI: "#10b981", INSTOCK: "#10b981", SELESAI: "#10b981",
  RESERVED: "#ca8a04", APPROVAL: "#ca8a04", EXTRA: "#ca8a04",
  TRANSIT: "#3b82f6", RETURN: "#3b82f6", "CETAK KWITANSI": "#3b82f6",
  SOLD: "#6b7280", MISSING: "#6b7280",
  REPAIR: "#7c3aed",
  LOST: "#ef4444", DITOLAK: "#ef4444", DIBATALKAN: "#ef4444", SELISIH: "#ef4444",
};
bodyHtml = bodyHtml.replace(/<code>([A-Z][A-Z ]*[A-Z])<\/code>/g, (m, word) => {
  const color = STATUS_COLORS[word];
  if (!color) return m;
  return `<span class="status-pill" style="background:${color}22;color:${color};border:1px solid ${color}55;">${word}</span>`;
});

const css = `
  @page { size: A4; margin: 16mm 14mm; }
  * { box-sizing: border-box; }
  body { font-family: "Segoe UI", Arial, sans-serif; color:#1f2937; line-height:1.65; font-size:10.5pt; margin:0; }
  h1 { font-size:24pt; color:#7c5e10; border-bottom:4px solid #d4af37; padding-bottom:10px; margin-top:.3em; }
  h2 { font-size:16pt; color:#fff; background:linear-gradient(90deg,#92710f,#c9a227); padding:8px 14px; border-radius:8px; margin-top:1.8em; page-break-after:avoid; box-shadow:0 2px 4px rgba(0,0,0,.12); }
  h3 { font-size:12.5pt; color:#5b4708; margin-top:1.1em; page-break-after:avoid; border-left:4px solid #d4af37; padding-left:8px; }
  p,li { font-size:10.5pt; }
  a { color:#92710f; text-decoration:none; }
  table { border-collapse:collapse; width:100%; margin:.8em 0; page-break-inside:avoid; box-shadow:0 1px 3px rgba(0,0,0,.08); }
  th,td { border:1px solid #d8d8d8; padding:6px 10px; text-align:left; font-size:9.5pt; vertical-align:top; }
  th { background:#5b4708; color:#fff; font-weight:700; }
  tr:nth-child(even) td { background:#faf7ee; }
  code { background:#f3f0e6; padding:1px 5px; border-radius:3px; font-size:9pt; font-family:Consolas,monospace; }
  pre:not(.mermaid) { background:#2d2a22; color:#f5f0e0; padding:11px 13px; border-radius:6px; overflow-x:auto; page-break-inside:avoid; font-size:9pt; }
  pre:not(.mermaid) code { background:transparent; color:inherit; padding:0; }

  /* Callout boxes */
  blockquote { border-left:6px solid #3b82f6; background:#eff6ff; margin:1em 0; padding:10px 16px; color:#1e3a5f; border-radius:0 8px 8px 0; page-break-inside:avoid; }
  blockquote p { margin:.3em 0; }
  blockquote .callout-label { font-weight:800; letter-spacing:.03em; font-size:9.5pt; text-transform:uppercase; }
  blockquote.callout-tip { border-left-color:#10b981; background:#ecfdf5; color:#065f46; }
  blockquote.callout-warning { border-left-color:#f59e0b; background:#fffbeb; color:#78350f; }
  blockquote.callout-info { border-left-color:#3b82f6; background:#eff6ff; color:#1e3a5f; }

  hr { border:none; border-top:2px dashed #e5d9a8; margin:1.6em 0; }
  ul,ol { padding-left:1.5em; }
  ol > li { margin-bottom:5px; padding-left:2px; }
  ol { counter-reset: step; list-style:none; padding-left:0; }
  ol > li { counter-increment: step; position:relative; padding-left:2.4em; margin-bottom:8px; min-height:1.6em; }
  ol > li::before { content: counter(step); position:absolute; left:0; top:0; width:1.7em; height:1.7em; background:#d4af37; color:#fff; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:9.5pt; box-shadow:0 1px 2px rgba(0,0,0,.15); }
  figure.shot { margin:1em 0; page-break-inside:avoid; text-align:center; }
  figure.shot img { max-width:100%; border:2px solid #e5d9a8; border-radius:8px; box-shadow:0 3px 10px rgba(0,0,0,.12); }
  figure.shot figcaption { font-size:8.5pt; color:#8a8478; margin-top:5px; font-style:italic; }
  pre.mermaid { background:#fafafa; border:1px solid #eee; border-radius:8px; text-align:center; page-break-inside:avoid; margin:1em 0; padding:10px; }
  pre.mermaid svg { max-width:100%; height:auto; }

  strong { color:#3d3116; }
  .status-pill { display:inline-block; padding:2px 9px; border-radius:999px; font-size:8.5pt; font-weight:800; letter-spacing:.02em; white-space:nowrap; }
`;

const html = `<!DOCTYPE html><html lang="id"><head><meta charset="utf-8">
<title>Manual Book — AUROMOS</title><style>${css}</style></head><body>
${bodyHtml}
<script>${mermaidSrc}</script>
<script>
  mermaid.initialize({ startOnLoad:false, theme:"base", themeVariables:{ fontSize:"13px" }, flowchart:{ htmlLabels:true, useMaxWidth:true } });
  window.__mermaidDone = false;
  (async () => {
    try { await mermaid.run({ querySelector: "pre.mermaid" }); }
    catch(e){ console.error("mermaid err", e); }
    window.__mermaidDone = true;
  })();
</script>
</body></html>`;

writeFileSync(HTML_OUT, html, "utf8");
console.log("HTML dibuat:", HTML_OUT);

const browser = await puppeteer.launch({
  executablePath: chromePath, headless: "new",
  args: ["--no-sandbox", "--disable-gpu", "--allow-file-access-from-files"],
});
const page = await browser.newPage();
page.on("console", (m) => { if (m.type() === "error") console.log("  [page error]", m.text()); });
await page.goto(pathToFileURL(HTML_OUT).href, { waitUntil: "networkidle0", timeout: 60000 });
await page.waitForFunction("window.__mermaidDone === true", { timeout: 30000 }).catch(() => console.log("  mermaid wait timeout"));
await new Promise((r) => setTimeout(r, 800));
const svgCount = await page.evaluate(() => document.querySelectorAll("pre.mermaid svg").length);
console.log("Diagram Mermaid ter-render:", svgCount);
await page.pdf({
  path: PDF_PATH, format: "A4", printBackground: true,
  margin: { top: "16mm", bottom: "16mm", left: "14mm", right: "14mm" },
});
await browser.close();
console.log("PDF dibuat:", PDF_PATH);
