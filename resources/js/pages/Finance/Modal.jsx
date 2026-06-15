import { useEffect, useState } from 'react';
import { PaperclipIcon, XIcon } from '@phosphor-icons/react';
import ModalCustom from '../../components/modalCustom';
import HelperFunctions from '../../utils/HelperFunctions';
import BranchApis from '../../Services/Branch.apis';
import BankApis from '../../Services/Bank.apis';
import FinanceApis from '../../Services/Finance.apis';

const METODE_OPTIONS = [
    { value: 'CASH', label: 'Cash' },
    { value: 'TRANSFER', label: 'Transfer' },
];

const emptyForm = {
    type: 'CASH IN',
    branch_id: '',
    bank_cabang_id: '',
    nominal: '',
    payment_method: '',
    category_finance_id: '',
    attachment: null,
    note: '',
};

const Field = ({ label, required, children }) => (
    <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-900">
            {label}{required && <span className="text-danger-500 ml-0.5">*</span>}
        </label>
        {children}
    </div>
);

const selectClass = "w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed";
const inputClass = "w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed";

const ModalTransaksi = ({ isOpen, onClose, mode = 'add', data = null, onSubmit }) => {
    const [form, setForm] = useState(emptyForm);
    const [branchOptions, setBranchOptions] = useState([]);
    const [bankOptions, setBankOptions] = useState([]);
    const [categoryOptions, setCategoryOptions] = useState([]);

    const isView = mode === 'view';

    useEffect(() => {
        if (!isOpen) return;

        BranchApis.GetBranch(`?per_page=10000000`)
            .then((res) => setBranchOptions(res?.data || []))
            .catch((err) => console.error(err));

        BankApis.GetBankBranch(`?per_page=10000000`)
            .then((res) => setBankOptions(res?.data || []))
            .catch((err) => console.error(err));

        FinanceApis.GetCategoryFinance(`?per_page=10000000&is_active=1`)
            .then((res) => setCategoryOptions(res?.data || []))
            .catch((err) => console.error(err));
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        if ((mode === 'edit' || mode === 'view') && data) {
            setForm({
                id: data.id,
                type: data.type || 'CASH IN',
                branch_id: data.branch_id ?? '',
                bank_cabang_id: data.bank_cabang_id ?? '',
                nominal: data.nominal ?? '',
                payment_method: data.payment_method || '',
                category_finance_id: data.category_finance_id ?? '',
                attachment: data.attachment ? HelperFunctions.getStorageUrl(data.attachment) : null,
                note: data.note || '',
            });
        } else {
            setForm(emptyForm);
        }
    }, [isOpen, mode, data]);

    const handleChange = (name, value) => setForm(prev => ({ ...prev, [name]: value }));

    const isValid = form.branch_id && form.nominal && form.payment_method && form.category_finance_id
        && (form.payment_method !== 'TRANSFER' || form.bank_cabang_id);

    const bankDropdown = HelperFunctions.formatDropdownBank(bankOptions);

    return (
        <ModalCustom
            title={mode === 'edit' ? 'Edit Transaksi' : mode === 'view' ? 'Detail Transaksi' : 'Tambah Transaksi'}
            isOpen={isOpen}
            onClose={onClose}
            customFooter={
                <div className="flex justify-between items-center px-6 py-4 border-t border-neutral-200">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        {isView ? 'Tutup' : 'Batal'}
                    </button>
                    {!isView && (
                        <button
                            disabled={!isValid}
                            onClick={() => onSubmit?.(form)}
                            className={`px-6 py-2 font-medium rounded-lg text-white transition-colors ${isValid ? 'bg-primary-500 hover:bg-primary-600' : 'bg-gray-300 cursor-not-allowed'}`}
                        >
                            {mode === 'edit' ? 'Simpan' : 'Tambah'}
                        </button>
                    )}
                </div>
            }
        >
            <div className="flex flex-col gap-5">
                {/* Toggle Cash In / Cash Out */}
                <div className="flex gap-2 p-1 bg-gray-50 border border-gray-200 rounded-lg w-full">
                    <button
                        disabled={isView}
                        onClick={() => handleChange('type', 'CASH IN')}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${form.type === 'CASH IN' ? 'bg-white text-primary-600 border border-primary-200 shadow-sm' : 'text-gray-500 hover:bg-gray-100'} ${isView ? 'cursor-not-allowed' : ''}`}
                    >
                        Cash In
                    </button>
                    <button
                        disabled={isView}
                        onClick={() => handleChange('type', 'CASH OUT')}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${form.type === 'CASH OUT' ? 'bg-white text-primary-600 border border-primary-200 shadow-sm' : 'text-gray-500 hover:bg-gray-100'} ${isView ? 'cursor-not-allowed' : ''}`}
                    >
                        Cash Out
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
                    <Field label="Cabang" required>
                        <select disabled={isView} value={form.branch_id} onChange={(e) => handleChange('branch_id', e.target.value)} className={selectClass}>
                            <option value="">Pilih cabang</option>
                            {branchOptions.map((b) => <option key={b.id} value={b.id}>{b.branch_name}</option>)}
                        </select>
                    </Field>

                    <Field label="Kategori" required>
                        <select disabled={isView} value={form.category_finance_id} onChange={(e) => handleChange('category_finance_id', e.target.value)} className={selectClass}>
                            <option value="">Pilih kategori</option>
                            {categoryOptions.map((c) => <option key={c.id} value={c.id}>{c.category_name}</option>)}
                        </select>
                    </Field>

                    <Field label="Metode Bayar" required>
                        <select disabled={isView} value={form.payment_method} onChange={(e) => handleChange('payment_method', e.target.value)} className={selectClass}>
                            <option value="">Pilih metode bayar</option>
                            {METODE_OPTIONS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                        </select>
                    </Field>

                    {form.payment_method === 'TRANSFER' && (
                        <Field label="Bank" required>
                            <select disabled={isView} value={form.bank_cabang_id} onChange={(e) => handleChange('bank_cabang_id', e.target.value)} className={selectClass}>
                                <option value="">Pilih bank</option>
                                {bankDropdown.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
                            </select>
                        </Field>
                    )}

                    <Field label="Nominal" required>
                        <input
                            type="text"
                            inputMode="numeric"
                            disabled={isView}
                            value={HelperFunctions.formatNumberInput(form.nominal)}
                            onChange={(e) => handleChange('nominal', HelperFunctions.unformatNumberInput(e.target.value))}
                            placeholder="Rp 0"
                            className={inputClass}
                        />
                    </Field>

                    <Field label="Attachment">
                        {isView ? (
                            typeof form.attachment === 'string' && form.attachment ? (
                                <a href={form.attachment} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-primary-600 hover:underline">
                                    <PaperclipIcon size={16} /> Lihat lampiran
                                </a>
                            ) : (
                                <div className="px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-400">-</div>
                            )
                        ) : (
                            <label className="flex items-center justify-between gap-2 px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-400 cursor-pointer hover:bg-gray-50 transition-colors">
                                <span className="flex items-center gap-2 truncate">
                                    <PaperclipIcon size={16} />
                                    {form.attachment instanceof File ? form.attachment.name : 'Upload attachment'}
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
                        )}
                    </Field>

                    <div className="md:col-span-2">
                        <Field label="Keterangan">
                            <textarea
                                disabled={isView}
                                value={form.note}
                                onChange={(e) => handleChange('note', e.target.value)}
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
