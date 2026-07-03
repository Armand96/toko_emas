// Setup untuk INTEGRATION suite (FE services → backend asli).
//
// Kenapa perlu paksa adapter: di jsdom, axios memilih adapter "xhr" yang tunduk
// pada CORS/same-origin & sering flaky untuk request nyata. Kita paksa adapter
// "http" (Node) supaya request benar-benar keluar dgn andal — tanpa mengubah
// satu baris pun kode aplikasi. Dijalankan SEBELUM modul test (dan Apis.js)
// diimpor, jadi client axios yang dibuat Apis.js mewarisi default ini.
import axios from 'axios';
import 'vitest-canvas-mock'; // canvas stub → chart.js (report pages) bisa render
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

axios.defaults.adapter = 'http';

// jsdom tak punya API browser ini; sejumlah komponen (react-select, tabel,
// modal) memakainya saat render. Beri stub no-op supaya tidak crash.
if (typeof globalThis.ResizeObserver === 'undefined') {
    globalThis.ResizeObserver = class {
        observe() {}
        unobserve() {}
        disconnect() {}
    };
}
if (typeof Element !== 'undefined' && !Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {};
}
if (typeof globalThis.matchMedia === 'undefined') {
    globalThis.matchMedia = (query) => ({
        matches: false, media: query, onchange: null,
        addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent() { return false; },
    });
}

// Page-driven test me-render komponen React → bersihkan DOM tiap test.
afterEach(() => cleanup());
