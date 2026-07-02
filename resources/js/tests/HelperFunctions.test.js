import { describe, it, expect } from 'vitest';
import HelperFunctions from '../utils/HelperFunctions';

// Fungsi-fungsi pure di HelperFunctions — dipakai di banyak form & tabel.
// Kalau ini pecah, format rupiah / input angka / dropdown ikut rusak.

describe('formatCurrency', () => {
    it('memformat angka jadi rupiah tanpa desimal', () => {
        // NBSP dari Intl → longgarkan pengecekan spasi
        expect(HelperFunctions.formatCurrency(1500000).replace(/\s/g, ' ')).toBe('Rp 1.500.000');
    });

    it('menangani 0', () => {
        expect(HelperFunctions.formatCurrency(0).replace(/\s/g, ' ')).toBe('Rp 0');
    });
});

describe('formatNumberInput / unformatNumberInput', () => {
    it('menambahkan pemisah ribuan id-ID', () => {
        expect(HelperFunctions.formatNumberInput('1500000')).toBe('1.500.000');
    });

    it('membuang karakter non-digit sebelum format', () => {
        expect(HelperFunctions.formatNumberInput('Rp 1.500.000abc')).toBe('1.500.000');
    });

    it('mengembalikan string kosong utk input kosong / non-numeric', () => {
        expect(HelperFunctions.formatNumberInput('')).toBe('');
        expect(HelperFunctions.formatNumberInput('abc')).toBe('');
        expect(HelperFunctions.formatNumberInput(null)).toBe('');
    });

    it('unformat mengembalikan digit murni (roundtrip)', () => {
        const formatted = HelperFunctions.formatNumberInput('2500000');
        expect(HelperFunctions.unformatNumberInput(formatted)).toBe('2500000');
    });
});

describe('formatDropdown', () => {
    const data = [
        { id: 1, name: 'Jakarta' },
        { id: 2, name: 'Bogor' },
    ];

    it('memetakan ke { value, label, details }', () => {
        expect(HelperFunctions.formatDropdown(data)).toEqual([
            { value: 1, label: 'Jakarta', details: data[0] },
            { value: 2, label: 'Bogor', details: data[1] },
        ]);
    });

    it('menyisipkan opsi "Pilih" saat isNull=true', () => {
        const res = HelperFunctions.formatDropdown(data, 'id', 'name', true);
        expect(res[0]).toEqual({ value: '', label: 'Pilih' });
        expect(res).toHaveLength(3);
    });

    it('mengembalikan [] utk input bukan array', () => {
        expect(HelperFunctions.formatDropdown(null)).toEqual([]);
        expect(HelperFunctions.formatDropdown(undefined)).toEqual([]);
    });

    it('mendukung key custom', () => {
        const src = [{ kode: 'A1', judul: 'Cincin' }];
        expect(HelperFunctions.formatDropdown(src, 'kode', 'judul')).toEqual([
            { value: 'A1', label: 'Cincin', details: src[0] },
        ]);
    });
});

describe('formatDropdownBank', () => {
    it('menyusun label dari relasi bank + rekening + pemilik', () => {
        const banks = [{ id: 7, bank: { bank_name: 'BCA' }, nomor_rekening: '123', nama_pemilik: 'Toko Emas' }];
        expect(HelperFunctions.formatDropdownBank(banks)[0].label).toBe('BCA - 123 - Toko Emas');
    });

    it('memakai "-" saat field relasi kosong', () => {
        const banks = [{ id: 8, bank: null, nomor_rekening: null, nama_pemilik: null }];
        expect(HelperFunctions.formatDropdownBank(banks)[0].label).toBe('- - - - -');
    });
});

describe('getStorageUrl', () => {
    it('mengembalikan null utk path kosong', () => {
        expect(HelperFunctions.getStorageUrl(null)).toBeNull();
        expect(HelperFunctions.getStorageUrl('')).toBeNull();
    });

    it('menggabungkan BASE_URL + /storage/ + path (tanpa double slash)', () => {
        expect(HelperFunctions.getStorageUrl('produk/a.png'))
            .toBe('https://api.example.com/storage/produk/a.png');
    });
});
