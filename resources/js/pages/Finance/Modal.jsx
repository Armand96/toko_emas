import { useEffect, useState } from 'react';
import { PaperclipIcon, XIcon } from '@phosphor-icons/react';
import ModalCustom from '../../components/modalCustom';
import InputGroup from '../../components/FormElement/InputGroup';
import HelperFunctions from '../../utils/HelperFunctions';
import FinanceApis from '../../Services/Finance.apis';
import OptionsStore from '../../Store/OptionsStore';
import { showAlert } from '../../utils/showAlert';

const MAX_ATTACHMENT_SIZE = 2 * 1024 * 1024; // 2 MB

const METODE_OPTIONS = [
    { value: 'TUNAI', label: 'Tunai' },
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

const ModalTransaksi = ({ isOpen, onClose, mode = 'add', data = null, onSubmit }) => {
    const ensureBranches = OptionsStore((s) => s.ensureBranches);
    const ensureBanks = OptionsStore((s) => s.ensureBanks);
    const [form, setForm] = useState(emptyForm);
    const [branchOptions, setBranchOptions] = useState([]);
    const [allBankOptions, setAllBankOptions] = useState([]);
    const [categoryOptions, setCategoryOptions] = useState([]);

    const isView = mode === 'view';

    useEffect(() => {
        if (!isOpen) return;

        ensureBranches()
            .then((data) => setBranchOptions(HelperFunctions.formatDropdown(data, 'id', 'branch_name')))
            .catch((err) => console.error(err));

        ensureBanks()
            .then((data) => setAllBankOptions(HelperFunctions.formatDropdownBank(data)))
            .catch((err) => console.error(err));

        FinanceApis.GetCategoryFinance(`?per_page=10000000&is_active=1`)
            .then((res) => setCategoryOptions(HelperFunctions.formatDropdown(res?.data || [], 'id', 'category_name')))
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
                nominal: String(Math.round(Number(data.nominal) || 0)),
                payment_method: data.payment_method || '',
                category_finance_id: data.category_finance_id ?? '',
                attachment: data.attachment ? HelperFunctions.getStorageUrl(data.attachment) : null,
                note: data.note || '',
            });
        } else {
            setForm(emptyForm);
        }
    }, [isOpen, mode, data]);

    const bankOptions = form.branch_id
        ? allBankOptions.filter(b => String(b.details?.branch_id) === String(form.branch_id))
        : allBankOptions;

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'branch_id') {
            setForm(prev => ({ ...prev, branch_id: value, bank_cabang_id: '' }));
        } else {
            setForm(prev => ({ ...prev, [name]: value }));
        }
    };

    const isTransfer = form.payment_method === 'TRANSFER';
    const isCashOut = form.type === 'CASH OUT';
    const isValid = form.branch_id && form.nominal && form.payment_method && form.category_finance_id
        && (!isTransfer || form.bank_cabang_id)
        && (isCashOut ? !!form.attachment : (!isTransfer || form.attachment))
        && !!form.note?.trim();

    const fieldsModal = [
        {
            label: "Cabang",
            name: "branch_id",
            type: "dropdown",
            placeholder: "Pilih cabang",
            options: branchOptions,
            isRequired: !isView,
            isDisable: isView,
        },
        {
            label: "Kategori",
            name: "category_finance_id",
            type: "dropdown",
            placeholder: "Pilih kategori",
            options: categoryOptions,
            isRequired: !isView,
            isDisable: isView,
        },
        {
            label: "Metode Bayar",
            name: "payment_method",
            type: "dropdown",
            placeholder: "Pilih metode bayar",
            options: METODE_OPTIONS,
            isRequired: !isView,
            isDisable: isView,
        },
        ...(form.payment_method === 'TRANSFER' ? [{
            label: "Bank",
            name: "bank_cabang_id",
            type: "dropdown",
            placeholder: "Pilih bank",
            options: bankOptions,
            isRequired: !isView,
            isDisable: isView,
        }] : []),
        {
            label: "Nominal",
            name: "nominal",
            type: "currency",
            placeholder: "0",
            isRequired: !isView,
            isDisable: isView,
        },
    ];

    const fieldsNote = [
        {
            label: "Keterangan",
            name: "note",
            type: "textarea",
            placeholder: "Masukkan keterangan ...",
            isRequired: !isView,
            isDisable: isView,
            rows: 3,
        },
    ];

    const handleNominalChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    return (
        <ModalCustom
            title={mode === 'edit' ? 'Edit Transaksi' : mode === 'view' ? 'Detail Transaksi' : 'Tambah Transaksi'}
            isOpen={isOpen}
            onClose={onClose}
            footer={!isView}
            confirmTextButton={mode === 'edit' ? 'Simpan' : 'Tambah'}
            cancelTextButton="Batal"
            handleOnSubmit={() => onSubmit?.(form)}
            disabledBtn={!isValid}
        >
            <div className="flex flex-col gap-5">
                {/* Toggle Cash In / Cash Out */}
                <div className="flex gap-2 p-1 bg-gray-50 border border-gray-200 rounded-lg w-full">
                    <button
                        disabled={isView}
                        onClick={() => setForm(prev => ({ ...prev, type: 'CASH IN' }))}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${form.type === 'CASH IN' ? 'bg-white text-primary-600 border border-primary-200 shadow-sm' : 'text-gray-500 hover:bg-gray-100'} ${isView ? 'cursor-not-allowed' : ''}`}
                    >
                        Cash In
                    </button>
                    <button
                        disabled={isView}
                        onClick={() => setForm(prev => ({ ...prev, type: 'CASH OUT' }))}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${form.type === 'CASH OUT' ? 'bg-white text-primary-600 border border-primary-200 shadow-sm' : 'text-gray-500 hover:bg-gray-100'} ${isView ? 'cursor-not-allowed' : ''}`}
                    >
                        Cash Out
                    </button>
                </div>

                <InputGroup
                    cols="2"
                    fields={fieldsModal}
                    formData={form}
                    onChange={handleNominalChange}
                />

                {/* Attachment */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-900">
                        Attachment{(isCashOut || isTransfer) && !isView && <span className="text-danger-500 ml-0.5">*</span>}
                    </label>
                    {isView ? (
                        typeof form.attachment === 'string' && form.attachment ? (
                            <a href={form.attachment} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-primary-600 hover:underline">
                                <PaperclipIcon size={16} /> Lihat lampiran
                            </a>
                        ) : (
                            <div className="px-3 py-2.5 bg-[#F3F4F6] border border-[#E2E8F0] rounded-lg text-sm text-[#45556C]">-</div>
                        )
                    ) : (
                        <label className="flex items-center justify-between gap-2 px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-400 cursor-pointer hover:bg-gray-50 transition-colors">
                            <span className="flex items-center gap-2 truncate">
                                <PaperclipIcon size={16} />
                                {form.attachment instanceof File
                                    ? form.attachment.name
                                    : typeof form.attachment === 'string' && form.attachment
                                        ? form.attachment.split('/').pop()
                                        : 'Upload attachment'}
                            </span>
                            {form.attachment ? (
                                <XIcon
                                    size={16}
                                    className="text-gray-400 hover:text-danger-500 flex-shrink-0"
                                    onClick={(e) => { e.preventDefault(); setForm(prev => ({ ...prev, attachment: null })); }}
                                />
                            ) : (
                                <XIcon size={16} className="text-gray-300 flex-shrink-0" />
                            )}
                            <input
                                type="file"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0] || null;
                                    if (file && file.size > MAX_ATTACHMENT_SIZE) {
                                        showAlert({ icon: 'error', title: 'File Terlalu Besar', message: 'Ukuran attachment maksimal 2 MB.', confirmText: 'OK' });
                                        e.target.value = '';
                                        return;
                                    }
                                    setForm(prev => ({ ...prev, attachment: file }));
                                }}
                            />
                        </label>
                    )}
                </div>

                <InputGroup
                    cols="1"
                    fields={fieldsNote}
                    formData={form}
                    onChange={handleChange}
                />
            </div>
        </ModalCustom>
    );
};

export default ModalTransaksi;
