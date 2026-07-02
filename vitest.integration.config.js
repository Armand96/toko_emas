import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

/**
 * Konfigurasi vitest untuk INTEGRATION test FRONTEND → BACKEND ASLI.
 *
 * Beda dari vitest.config.js (unit): suite ini mengimpor modul Service FE yang
 * sesungguhnya (Services/*.apis.js + utils/Apis.js) lalu menembak Laravel asli.
 * Payload, params, endpoint, interceptor auth — semua datang dari kode FE,
 * bukan fetch tulis tangan. Ini menguji kontrak FE↔BE end-to-end.
 *
 * Prasyarat: server hidup + DB fresh seed + user test.
 *   php artisan migrate:fresh --seed --force
 *   php artisan tinker docs/testing/_seed_test_users.php
 *   php artisan serve
 *
 * Jalankan:  bun run test:e2e
 * Override base URL: API_BASE=http://host:port bun run test:e2e
 */
export default defineConfig({
    plugins: [react()],
    test: {
        // jsdom: authConfig.js & js-cookie butuh window/document saat import.
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./resources/js/tests/integration/setup.integration.js'],
        include: ['resources/js/tests/integration/**/*.test.{js,jsx}'],
        css: false,
        // Base URL FE = origin backend (Apis.js menambah sendiri prefix "api/…").
        env: { VITE_API_BASE_URL: process.env.API_BASE || 'http://127.0.0.1:8000' },
        // Flow stateful & berurutan → matikan paralelisme.
        fileParallelism: false,
        sequence: { concurrent: false },
        testTimeout: 30000,
        hookTimeout: 30000,
    },
});
