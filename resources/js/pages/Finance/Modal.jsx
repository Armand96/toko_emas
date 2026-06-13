import { useEffect, useState } from 'react';
import { PaperclipIcon, XIcon } from '@phosphor-icons/react';
import ModalCustom from '../../components/modalCustom';

const CABANG_OPTIONS = ['Blok M', 'H Ten'];
const BANK_OPTIONS = ['BCA - Cabang 1', 'BNI - Cabang 1', 'Mandiri - Cabang 1'];
const METODE_OPTIONS = ['Cash', 'Transfer', 'Qris'];
const KATEGORI_OPTIONS = ['Operasional', 'Modal Masuk', 'Gaji', 'Lain-lain'];

const emptyForm = {
    tipe: 'Cash In',
    cabang: '',
    bank: '',
    nominal: '',
    metode_bayar: '',
    kategori: '',
    attachment: null,
    keterangan: '',
};

const Field = ({ label, required, children }) => (
    <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-900">
            {label}{required && <span className="text-danger-500 ml-0.5">*</span>}
        </label>
        {children}
    </div>
);

const selectClass = "w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 cursor-pointer";
const inputClass = "w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500";

const ModalTransaksi = ({ isOpen, onClose, mode = 'add', data = null, onSubmit }) => {
    const [form, setForm] = useState(emptyForm);

    useEffect(() => {
        if (!isOpen) return;
        if (mode === 'edit' && data) {
            setForm({
                tipe: data.tipe || 'Cash In',
                cabang: data.cabang || '',
                bank: data.bank || '',
                nominal: data.jumlah ?? '',
                metode_bayar: data.metode_bayar || '',
                kategori: data.kategori || '',
                attachment: data.attachment || null,
                keterangan: data.keterangan === '-' ? '' : (data.keterangan || ''),
            });
        } else {
            setForm(emptyForm);
        }
    }, [isOpen, mode, data]);

    const handleChange = (name, value) => setForm(prev => ({ ...prev, [name]: value }));

    const isValid = form.cabang && form.bank && form.nominal && form.metode_bayar && form.kategori;

    return (
        <ModalCustom
            title={mode === 'edit' ? 'Edit Transaksi' : 'Tambah Transaksi'}
            isOpen={isOpen}
            onClose={onClose}
            customFooter={
                <div className="flex justify-between items-center px-6 py-4 border-t border-neutral-200">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Batal
                    </button>
                    <button
                        disabled={!isValid}
                        onClick={() => onSubmit?.(form)}
                        className={`px-6 py-2 font-medium rounded-lg text-white transition-colors ${isValid ? 'bg-primary-500 hover:bg-primary-600' : 'bg-gray-300 cursor-not-allowed'}`}
                    >
                        {mode === 'edit' ? 'Simpan' : 'Tambah'}
                    </button>
                </div>
            }
        >
            <div className="flex flex-col gap-5">
                {/* Toggle Cash In / Cash Out */}
                <div className="flex gap-2 p-1 bg-gray-50 border border-gray-200 rounded-lg w-full">
                    <button
                        onClick={() => handleChange('tipe', 'Cash In')}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${form.tipe === 'Cash In' ? 'bg-white text-primary-600 border border-primary-200 shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                        Cash In
                    </button>
                    <button
                        onClick={() => handleChange('tipe', 'Cash Out')}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${form.tipe === 'Cash Out' ? 'bg-white text-primary-600 border border-primary-200 shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                        Cash Out
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
                    <Field label="Cabang" required>
                        <select value={form.cabang} onChange={(e) => handleChange('cabang', e.target.value)} className={selectClass}>
                            <option value="">Pilih cabang</option>
                            {CABANG_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </Field>

                    <Field label="Bank" required>
                        <select value={form.bank} onChange={(e) => handleChange('bank', e.target.value)} className={selectClass}>
                            <option value="">Pilih bank</option>
                            {BANK_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
                        </select>
                    </Field>

                    <Field label="Nominal" required>
                        <input
                            type="number"
                            value={form.nominal}
                            onChange={(e) => handleChange('nominal', e.target.value)}
                            placeholder="Rp 0"
                            className={inputClass}
                        />
                    </Field>

                    <Field label="Metode Bayar" required>
                        <select value={form.metode_bayar} onChange={(e) => handleChange('metode_bayar', e.target.value)} className={selectClass}>
                            <option value="">Pilih metode bayar</option>
                            {METODE_OPTIONS.map((m) => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </Field>

                    <Field label="Kategori" required>
                        <select value={form.kategori} onChange={(e) => handleChange('kategori', e.target.value)} className={selectClass}>
                            <option value="">Pilih kategori</option>
                            {KATEGORI_OPTIONS.map((k) => <option key={k} value={k}>{k}</option>)}
                        </select>
                    </Field>

                    <Field label="Attachment">
                        <label className="flex items-center justify-between gap-2 px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-400 cursor-pointer hover:bg-gray-50 transition-colors">
                            <span className="flex items-center gap-2 truncate">
                                <PaperclipIcon size={16} />
                                {form.attachment?.name || 'Upload attachment'}
                            </span>
                            {form.attachment ? (
                                <XIcon
                                    size={16}
                                    className="text-gray-400 hover:text-danger-500 flex-shrink-0"
                                    onClick={(e) => { e.preventDefault(); handleChange('attachment', null); }}
                                />
                            ) : (
                                <XIcon size={16} className="text-gray-300 flex-shrink-0" />
                            )}
                            <input
                                type="file"
                                className="hidden"
                                onChange={(e) => handleChange('attachment', e.target.files?.[0] || null)}
                            />
                        </label>
                    </Field>

                    <div className="md:col-span-2">
                        <Field label="Keterangan">
                            <textarea
                                value={form.keterangan}
                                onChange={(e) => handleChange('keterangan', e.target.value)}
                                rows={3}
                                placeholder="Masukkan keterangan ..."
                                className={`${inputClass} resize-none`}
                            />
                        </Field>
                    </div>
                </div>
            </div>
        </ModalCustom>
    );
};

export default ModalTransaksi;
