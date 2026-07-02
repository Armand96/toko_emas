import { defineConfig, configDefaults } from 'vitest/config';
import react from '@vitejs/plugin-react';

/**
 * Konfigurasi vitest untuk UNIT/COMPONENT test FRONTEND (React).
 * Tidak menembak backend — murni menguji komponen & logic FE di jsdom.
 *
 * Jalankan:  bun run test          (sekali jalan)
 *            bun run test:watch    (mode watch)
 *            bun run test:ui       (UI, kalau @vitest/ui dipasang)
 */
export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        globals: true, // expect/describe/it global tanpa import
        setupFiles: ['./resources/js/tests/setup.js'],
        include: ['resources/js/**/*.test.{js,jsx}'],
        // Suite integrasi (nembak backend asli) punya config sendiri — jangan
        // ikut di run unit yang cepat & offline.
        exclude: [...configDefaults.exclude, 'resources/js/tests/integration/**'],
        css: false,
        // Nilai env yang biasanya di-inject Vite, supaya deterministik saat test.
        env: { VITE_API_BASE_URL: 'https://api.example.com' },
        clearMocks: true,
        restoreMocks: true,
    },
});
