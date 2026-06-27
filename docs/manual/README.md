# Generator Manual Book (PDF)

Folder ini membuat **`MANUAL_BOOK.pdf`** dari **`MANUAL_BOOK.md`** di root project.
Output: diagram Mermaid di-render jadi gambar, screenshot dari `docs/manual-img/` disisipkan, lalu seluruhnya dicetak ke PDF A4.

## Prasyarat

- **Node.js** atau **Bun** terpasang.
- **Google Chrome** atau **Microsoft Edge** terpasang (dipakai untuk mencetak PDF).
  Skrip mendeteksi browser otomatis. Jika tidak ketemu, set env var:
  ```
  PUPPETEER_EXECUTABLE_PATH="C:/Program Files/Google/Chrome/Application/chrome.exe"
  ```

## Cara build

```bash
cd docs/manual

# install dependency sekali saja
bun install        # atau: npm install

# generate PDF
bun run build      # atau: npm run build  (atau: node build-pdf.mjs)
```

Hasil: **`MANUAL_BOOK.pdf`** di root project ter-update.

## Alur kerja

1. Edit teks manual di **`MANUAL_BOOK.md`** (root project).
2. Untuk mengganti screenshot, timpa file di **`docs/manual-img/`** (nama file harus sama
   dengan yang dirujuk di markdown, mis. `k03-pembelian-form.png`).
3. Jalankan `bun run build`.

## Catatan

- Diagram ditulis sebagai blok ```` ```mermaid ```` di markdown — otomatis jadi flowchart.
- Gambar ditulis `![caption](docs/manual-img/nama.png)` — path relatif dari root project.
- File `manual-final.html` yang dihasilkan hanyalah berkas perantara (boleh diabaikan/di-gitignore).
