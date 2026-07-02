import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ActionButton from '../components/ActionButton';

// ActionButton dipakai di kolom "Aksi" tiap tabel. Variant menentukan
// ikon + title + tone. Test perilaku (klik, disabled, guard tanpa ikon).

describe('ActionButton', () => {
    it('merender preset variant (title dari VARIANTS)', () => {
        render(<ActionButton variant="edit" />);
        expect(screen.getByRole('button')).toHaveAttribute('title', 'Ubah');
    });

    it('memanggil onClick saat diklik', async () => {
        const onClick = vi.fn();
        render(<ActionButton variant="view" onClick={onClick} />);
        await userEvent.click(screen.getByRole('button'));
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('tidak memanggil onClick saat disabled', async () => {
        const onClick = vi.fn();
        render(<ActionButton variant="delete" onClick={onClick} disabled />);
        const btn = screen.getByRole('button');
        expect(btn).toBeDisabled();
        await userEvent.click(btn);
        expect(onClick).not.toHaveBeenCalled();
    });

    it('override title/tone lewat prop langsung', () => {
        render(<ActionButton variant="edit" title="Batalkan" tone="danger" />);
        const btn = screen.getByRole('button');
        expect(btn).toHaveAttribute('title', 'Batalkan');
        expect(btn).toHaveClass('!text-danger-500');
    });

    it('render null bila tidak ada ikon maupun variant', () => {
        const { container } = render(<ActionButton title="tanpa ikon" />);
        expect(container).toBeEmptyDOMElement();
    });
});
