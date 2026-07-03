import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Badge from '../components/Badge';

// Badge dipakai konsisten utk status di seluruh tabel/detail (lihat CLAUDE.md:
// Approval→warning, Disetujui→success, Ditolak/Dibatalkan→danger, Return→info).

describe('Badge', () => {
    it('menampilkan teks anak', () => {
        render(<Badge>Aktif</Badge>);
        expect(screen.getByText('Aktif')).toBeInTheDocument();
    });

    it('memakai kelas tone success (hijau) utk "Disetujui"', () => {
        render(<Badge tone="success">Disetujui</Badge>);
        const el = screen.getByText('Disetujui');
        expect(el).toHaveClass('bg-success-50', 'text-success-700', 'border-success-200');
    });

    it('memakai kelas tone danger (merah) utk "Ditolak"', () => {
        render(<Badge tone="danger">Ditolak</Badge>);
        expect(screen.getByText('Ditolak')).toHaveClass('text-danger-700');
    });

    it('fallback ke tone gray utk tone tak dikenal', () => {
        render(<Badge tone="entah">X</Badge>);
        expect(screen.getByText('X')).toHaveClass('bg-gray-50', 'text-gray-700');
    });

    it('meneruskan className tambahan & atribut lain', () => {
        render(<Badge className="ml-2" data-testid="b" title="halo">Y</Badge>);
        const el = screen.getByTestId('b');
        expect(el).toHaveClass('ml-2');
        expect(el).toHaveAttribute('title', 'halo');
    });
});
