/**
 * Util kecil untuk menggerakkan komponen form FE di test halaman.
 * Halaman punya beberapa react-select sekaligus → pilih berdasarkan LABEL-nya,
 * bukan index, supaya tahan perubahan tata letak.
 */
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import selectEvent from 'react-select-event';

/** Input react-select di dalam wrapper Dropdown dgn <label> berteks labelRe. */
export function reactSelectInput(labelRe) {
    // selector 'label' → hindari bentrok dgn header tabel yg teksnya sama.
    const label = screen.getByText(labelRe, { selector: 'label' });
    const wrapper = label.parentElement; // <div> pembungkus label + <Select>
    return wrapper.querySelector('input[id^="react-select"]');
}

/** Pilih opsi (string/regex) pada react-select yg diberi label labelRe. */
export async function selectByLabel(labelRe, optionMatcher, { timeout = 15000 } = {}) {
    await waitFor(() => selectByLabelOnce(labelRe, optionMatcher), { timeout });
}
function selectByLabelOnce(labelRe, optionMatcher) {
    return selectEvent.select(reactSelectInput(labelRe), optionMatcher);
}

export const escapeRegExp = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Pilih opsi pada react-select TERAKHIR di halaman (dropdown "Pilih item.." yg
 * tak berlabel). Menunggu opsi selesai di-fetch (inventory) lalu memilih.
 */
export async function selectItemDropdown(codeOrRe, { timeout = 15000 } = {}) {
    const matcher = codeOrRe instanceof RegExp ? codeOrRe : new RegExp(escapeRegExp(codeOrRe));
    await waitFor(() => {
        const boxes = screen.getAllByRole('combobox');
        return selectEvent.select(boxes[boxes.length - 1], matcher);
    }, { timeout });
}

/**
 * Set nilai <input name=...> (Input/CurrencyInput/textarea) lewat event change.
 * Ambil elemen TERAKHIR yg cocok: beberapa halaman punya kotak "Cari" dengan
 * name yg sama dgn field modal — modal (portal) selalu belakangan di DOM, jadi
 * elemen terakhir = field modal yg kita maksud.
 */
export function setField(name, value) {
    const els = document.querySelectorAll(`input[name="${name}"], textarea[name="${name}"]`);
    const el = els[els.length - 1];
    if (!el) throw new Error(`Field name="${name}" tidak ditemukan di DOM`);
    fireEvent.change(el, { target: { value: String(value) } });
    return el;
}

/**
 * Klik tombol di dialog konfirmasi showAlert (AlertModal, render via portal).
 * Cari kotak dialog via judulnya lalu klik tombol di dalamnya — supaya tidak
 * bentrok dgn tombol berteks sama di modal/halaman di belakangnya.
 */
export async function clickAlertButton(titleRe, buttonRe, { timeout = 10000 } = {}) {
    // judul AlertModal selalu <h2> → hindari bentrok dgn tombol berteks sama.
    const heading = await screen.findByText(titleRe, { selector: 'h2' }, { timeout });
    const box = heading.closest('.bg-white') || heading.parentElement;
    fireEvent.click(within(box).getByRole('button', { name: buttonRe }));
}

/** Klik tombol view (title "Lihat") pada baris tabel yg memuat teks tertentu. */
export function openRowByText(text) {
    const cell = screen.getByText(text);
    const row = cell.closest('tr');
    fireEvent.click(within(row).getByTitle('Lihat'));
    return row;
}

export { selectEvent, fireEvent, waitFor, within };
