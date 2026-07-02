// Setup global untuk semua test FE.
// - matcher jest-dom (toBeInTheDocument, toHaveClass, dll)
// - auto-cleanup DOM setelah tiap test supaya tidak bocor antar-test
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
    cleanup();
});
