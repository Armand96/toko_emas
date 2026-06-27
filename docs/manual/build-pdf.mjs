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
const bodyHtml = marked.parse(md);
const mermaidSrc = readFileSync(MERMAID_JS, "utf8");

const css = `
  @page { size: A4; margin: 16mm 14mm; }
  * { box-sizing: border-box; }
  body { font-family: "Segoe UI", Arial, sans-serif; color:#1f2937; line-height:1.6; font-size:10.5pt; margin:0; }
  h1 { font-size:22pt; color:#7c5e10; border-bottom:3px solid #d4af37; padding-bottom:8px; margin-top:.3em; }
  h2 { font-size:15pt; color:#92710f; border-bottom:1px solid #e5d9a8; padding-bottom:4px; margin-top:1.5em; page-break-after:avoid; }
  h3 { font-size:12.5pt; color:#5b4708; margin-top:1em; page-break-after:avoid; }
  p,li { font-size:10.5pt; }
  a { color:#92710f; text-decoration:none; }
  table { border-collapse:collapse; width:100%; margin:.7em 0; page-break-inside:avoid; }
  th,td { border:1px solid #d8d8d8; padding:5px 9px; text-align:left; font-size:9.5pt; vertical-align:top; }
  th { background:#f3ecd2; color:#5b4708; font-weight:600; }
  tr:nth-child(even) td { background:#faf7ee; }
  code { background:#f3f0e6; padding:1px 5px; border-radius:3px; font-size:9pt; font-family:Consolas,monospace; }
  pre:not(.mermaid) { background:#2d2a22; color:#f5f0e0; padding:11px 13px; border-radius:6px; overflow-x:auto; page-break-inside:avoid; font-size:9pt; }
  pre:not(.mermaid) code { background:transparent; color:inherit; padding:0; }
  blockquote { border-left:4px solid #d4af37; background:#fdfaf0; margin:.7em 0; padding:6px 13px; color:#57503c; }
  hr { border:none; border-top:1px solid #e5d9a8; margin:1.4em 0; }
  ul,ol { padding-left:1.4em; }
  figure.shot { margin:1em 0; page-break-inside:avoid; text-align:center; }
  figure.shot img { max-width:100%; border:1px solid #d8d8d8; border-radius:6px; box-shadow:0 2px 8px rgba(0,0,0,.08); }
  figure.shot figcaption { font-size:8.5pt; color:#8a8478; margin-top:4px; font-style:italic; }
  pre.mermaid { background:transparent; text-align:center; page-break-inside:avoid; margin:1em 0; }
  pre.mermaid svg { max-width:100%; height:auto; }
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
