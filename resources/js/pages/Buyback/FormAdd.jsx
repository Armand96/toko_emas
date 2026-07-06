import { useState, useMemo, useRef, useEffect } from "react";
import { MagnifyingGlassIcon, PlusCircleIcon } from "@phosphor-icons/react";
import HeaderSection from "../../components/HeaderSection";
import FormSectionCard from "../../components/FormSectionCard";
import EmptyState from "../../components/EmptyState";
import InventoryItemCard from "../../components/InventoryItemCard";
import ModalCustom from "../../components/modalCustom";
import Dropdown from "../../components/FormElement/SingleElement/Dropdown";
import Input from "../../components/FormElement/SingleElement/Input";
import PhotoInput from "../../components/FormElement/SingleElement/PhotoInput";
import CurrencyInput from "../../components/FormElement/SingleElement/CurrencyInput";
import CodeBadge from "../../components/CodeBadge";
import HelperFunctions from "../../utils/HelperFunctions";
import LoadingStore from "../../Store/LoadingStore";
import { showAlert } from "../../utils/showAlert";
import { useDebounce } from "use-debounce";
import CustomerApis from "../../Services/Customer.apis";
import BankApis from "../../Services/Bank.apis";
import BuybackApis from "../../Services/Buyback.apis";
import OptionsStore from "../../Store/OptionsStore";
import AuthStore from "../../Store/AuthStore";

const emptyItem = {
    product_id: null,
    category_id: null,
    subcategory_id: null,
    berat: "",
    karat: "",
    no_seri: "",
    price: "",
    foto: null,
    _produk_label: "",
};

const requiredItem = [
    ["product_id", "Produk wajib dipilih"],
    ["berat", "Berat wajib diisi"],
    ["karat", "Karat wajib diisi"],
    ["price", "Harga beli wajib diisi"],
];

const FormAdd = ({ setCurentState }) => {
    const setLoading = LoadingStore((state) => state.setLoading);
    const ensureProducts = OptionsStore((s) => s.ensureProducts);
    const user = AuthStore((s) => s.user);

    // ── DATA CUSTOMER ──────────────────────────────────────────
    const [customerType, setCustomerType] = useState('baru'); // 'baru' | 'terdaftar'
    const [customerData, setCustomerData] = useState({ nama: "", hp: "", alamat: "" });

    const [searchQuery, setSearchQuery] = useState("");
    const [searchQueryBounce] = useDebounce(searchQuery, 500);
    const [memberOptions, setMemberOptions] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedMember, setSelectedMember] = useState(null);
    const searchRef = useRef(null);

    useEffect(() => {
        if (customerType !== 'terdaftar') return;
        CustomerApis.GetCustomer(`?customer_name=${searchQueryBounce}&per_page=20`)
            .then((res) => setMemberOptions(res?.data || []))
            .catch((err) => console.error(err));
    }, [customerType, searchQueryBounce]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setIsSearching(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // ── BARANG (item dibeli dari customer) ─────────────────────
    const [items, setItems] = useState([]);
    const [productOptions, setProductOptions] = useState([]);

    useEffect(() => {
        ensureProducts()
            .then((data) => {
                setProductOptions((data || []).map((p) => {
                    const categoryName = p.category?.parent?.category_name || p.category?.category_name || "";
                    const subcategoryName = p.subcategory?.category_name || "";
                    const detail = [categoryName, subcategoryName].filter(Boolean).join(" · ");
                    return {
                        value: p.id,
                        label: detail ? `${p.product_name} · ${detail}` : p.product_name,
                        details: p,
                    };
                }));
            })
            .catch((err) => console.error(err));
    }, []);

    // Modal Tambah Item
    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    const [item, setItem] = useState(emptyItem);
    const [itemErrors, setItemErrors] = useState({});

    const openItemModal = () => {
        setItem(emptyItem);
        setItemErrors({});
        setIsItemModalOpen(true);
    };

    const handleItemChange = (e) => {
        const { name, value } = e.target;

        if (name === "foto") {
            const file = e.target.files ? e.target.files[0] : value;
            const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
            if (file && !allowedTypes.includes(file.type)) {
                showAlert({ title: "Format tidak didukung", message: "Foto harus berformat JPG, JPEG, PNG, atau GIF", type: "warning" });
                return;
            }
            if (file && file.size > 3 * 1024 * 1024) {
                showAlert({ title: "Ukuran file terlalu besar", message: "Ukuran foto maksimal 3 MB", type: "warning" });
                return;
            }
            setItem((prev) => ({ ...prev, foto: file ?? null }));
            return;
        }

        if (name === "berat" || name === "karat") {
            const normalized = value.replace(/,/g, ".").replace(/[^0-9.]/g, "");
            setItem((prev) => ({ ...prev, [name]: normalized }));
            if (itemErrors[name]) setItemErrors((prev) => ({ ...prev, [name]: "" }));
            return;
        }

        if (name === "price") {
            setItem((prev) => ({ ...prev, price: value }));
            if (itemErrors.price) setItemErrors((prev) => ({ ...prev, price: "" }));
            return;
        }

        if (name === "product_id") {
            const found = productOptions.find((p) => p.value === value);
            const d = found?.details || {};
            setItem((prev) => ({
                ...prev,
                product_id: value,
                category_id: d.category_id ?? null,
                subcategory_id: d.subcategory_id ?? null,
                _produk_label: found?.details?.product_name ?? "",
            }));
            setItemErrors((prev) => ({ ...prev, product_id: "" }));
            return;
        }

        setItem((prev) => ({ ...prev, [name]: value }));
        if (itemErrors[name]) setItemErrors((prev) => ({ ...prev, [name]: "" }));
    };

    const validateItem = () => {
        const errs = {};
        requiredItem.forEach(([key, msg]) => {
            const v = item[key];
            if (v === null || v === undefined || v === "") errs[key] = msg;
        });
        setItemErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSaveItem = () => {
        if (!validateItem()) return;
        setItems((prev) => [
            ...prev,
            {
                ...item,
                price: Number(item.price || 0),
                _rowId: Date.now() + Math.random(),
                _preview: item.foto ? URL.createObjectURL(item.foto) : null,
            },
        ]);
        setIsItemModalOpen(false);
        setItem(emptyItem);
        setItemErrors({});
    };

    const handleRemoveItem = (rowId) => {
        setItems((prev) => prev.filter((it) => it._rowId !== rowId));
    };

    // ── PEMBAYARAN ─────────────────────────────────────────────
    const [paymentMethod, setPaymentMethod] = useState('tunai');
    const [bankOptions, setBankOptions] = useState([]);
    const [selectedBankId, setSelectedBankId] = useState(null);
    const [namaPenerima, setNamaPenerima] = useState('');
    const [bankPenerima, setBankPenerima] = useState('');
    const [rekeningPenerima, setRekeningPenerima] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (paymentMethod === 'transfer' && user?.branch_id) {
            BankApis.GetBankBranch(`?per_page=10000000&branch_id=${user.branch_id}`)
                .then((res) => {
                    setBankOptions(res?.data || []);
                    setSelectedBankId(null);
                })
                .catch((err) => console.error(err));
        }
    }, [paymentMethod, user?.branch_id]);

    useEffect(() => {
        if (paymentMethod !== 'transfer') return;
        if (selectedMember) setNamaPenerima(selectedMember.customer_name);
        else if (customerType === 'baru') setNamaPenerima(customerData.nama);
    }, [selectedMember, customerType, customerData.nama, paymentMethod]);

    const subTotal = useMemo(() => items.reduce((sum, it) => sum + Number(it.price || 0), 0), [items]);

    const isFormValid = useMemo(() => {
        if (items.length === 0) return false;
        if (customerType === 'baru') {
            if (!customerData.nama || !customerData.hp || !customerData.alamat) return false;
        } else if (!selectedMember) {
            return false;
        }
        if (paymentMethod === 'transfer') {
            if (!selectedBankId || !namaPenerima || !bankPenerima || !rekeningPenerima) return false;
        }
        return true;
    }, [items, customerType, customerData, selectedMember, paymentMethod, selectedBankId, namaPenerima, bankPenerima, rekeningPenerima]);

    const handleSubmit = async () => {
        if (submitting) return;
        if (items.length === 0) {
            showAlert({ icon: 'warning', title: 'Perhatian', message: 'Belum ada barang yang ditambahkan.' });
            return;
        }
        if (customerType === 'baru' && (!customerData.nama || !customerData.hp || !customerData.alamat)) {
            showAlert({ icon: 'warning', title: 'Perhatian', message: 'Lengkapi data customer baru.' });
            return;
        }
        if (customerType === 'terdaftar' && !selectedMember) {
            showAlert({ icon: 'warning', title: 'Perhatian', message: 'Pilih customer terdaftar.' });
            return;
        }
        if (paymentMethod === 'transfer' && (!selectedBankId || !namaPenerima || !bankPenerima || !rekeningPenerima)) {
            showAlert({ icon: 'warning', title: 'Perhatian', message: 'Lengkapi data transfer.' });
            return;
        }

        setSubmitting(true);
        setLoading(true);
        try {
            let customerId = selectedMember?.id;
            if (customerType === 'baru') {
                const customerRes = await CustomerApis.PostCustomer({
                    customer_name: customerData.nama,
                    phone_number: customerData.hp,
                    address: customerData.alamat,
                });
                customerId = customerRes?.data?.data?.id;
            }

            const payload = {
                customer_id: customerId,
                user_id: user?.id,
                branch_id: user?.branch_id,
                payment_type: paymentMethod === 'tunai' ? 'TUNAI' : 'TRANSFER',
                item: items.map((it) => ({
                    product_id: Number(it.product_id),
                    category_id: it.category_id ? Number(it.category_id) : null,
                    subcategory_id: it.subcategory_id ? Number(it.subcategory_id) : null,
                    berat: Number(it.berat),
                    karat: Number(it.karat),
                    serial_number: it.no_seri || null,
                    price: Number(it.price),
                })),
            };

            if (paymentMethod === 'transfer') {
                payload.sender_bank_id = selectedBankId; // bank keluar (kas toko)
                payload.receiver_name = namaPenerima;
                payload.receiver_bank_name = bankPenerima;
                payload.receiver_rekening = rekeningPenerima;
            }

            await BuybackApis.PostBuyback(payload);

            showAlert({ icon: 'success', isAutoClose: false, title: 'Berhasil', message: 'Transaksi buyback berhasil diajukan.' });
            setCurentState('main');
        } catch (error) {
            console.error(error);
            showAlert({ icon: 'error', title: 'Gagal', message: error?.response?.data?.message || 'Gagal mengajukan transaksi buyback.' });
        } finally {
            setSubmitting(false);
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 w-full">
            <HeaderSection
                title="Input Buyback"
                description="Lengkapi informasi buyback dan detail item inventory."
            />

            {/* SECTION 1: DATA CUSTOMER */}
            <FormSectionCard title="Data Customer">
                <div className="flex gap-2 p-1 bg-gray-50 border border-gray-200 rounded-lg w-full mb-6">
                    <button
                        onClick={() => setCustomerType('baru')}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${customerType === 'baru' ? 'bg-primary-50 text-primary-600 border border-primary-200 shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                        Input Customer Baru
                    </button>
                    <button
                        onClick={() => setCustomerType('terdaftar')}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${customerType === 'terdaftar' ? 'bg-primary-50 text-primary-600 border border-primary-200 shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                        Member Terdaftar
                    </button>
                </div>

                {customerType === 'baru' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5 min-w-0">
                            <label className="text-sm font-medium text-gray-700">Nama Customer<span className="text-red-500"> *</span></label>
                            <input
                                type="text"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                value={customerData.nama}
                                onChange={(e) => setCustomerData({ ...customerData, nama: e.target.value })}
                                placeholder="Masukkan nama customer"
                            />
                        </div>
                        <div className="flex flex-col gap-1.5 min-w-0">
                            <label className="text-sm font-medium text-gray-700">No. HP<span className="text-red-500"> *</span></label>
                            <input
                                type="text"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                value={customerData.hp}
                                onChange={(e) => setCustomerData({ ...customerData, hp: HelperFunctions.formatOnlyNumber(e.target.value) })}
                                placeholder="Contoh: 08xxxxxxxxxx"
                            />
                        </div>
                        <div className="flex flex-col gap-1.5 sm:col-span-2 min-w-0">
                            <label className="text-sm font-medium text-gray-700">Alamat<span className="text-red-500"> *</span></label>
                            <input
                                type="text"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                value={customerData.alamat}
                                onChange={(e) => setCustomerData({ ...customerData, alamat: e.target.value })}
                                placeholder="Masukkan alamat customer"
                            />
                        </div>
                    </div>
                )}

                {customerType === 'terdaftar' && (
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-700">Customer<span className="text-error-500">*</span></label>

                        {!selectedMember ? (
                            <div className="relative" ref={searchRef}>
                                <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2.5 bg-white focus-within:ring-1 focus-within:ring-primary-500 focus-within:border-primary-500 transition-all">
                                    <input
                                        type="text"
                                        className="w-full outline-none text-sm bg-transparent"
                                        placeholder="Cari nama / no. HP customer"
                                        value={searchQuery}
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value);
                                            setIsSearching(true);
                                        }}
                                        onFocus={() => setIsSearching(true)}
                                    />
                                    <MagnifyingGlassIcon size={20} className="text-gray-400" />
                                </div>

                                {isSearching && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                        {memberOptions.length > 0 ? (
                                            memberOptions.map(member => (
                                                <div
                                                    key={member.id}
                                                    className="px-4 py-3 hover:bg-primary-50 cursor-pointer border-b border-gray-100 last:border-0 transition-colors"
                                                    onClick={() => {
                                                        setSelectedMember(member);
                                                        setSearchQuery("");
                                                        setIsSearching(false);
                                                    }}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        {member.customer_code && (
                                                            <CodeBadge variant="table">{member.customer_code}</CodeBadge>
                                                        )}
                                                        <span className="font-semibold text-sm text-gray-800">{member.customer_name}</span>
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-0.5 truncate">
                                                        {member.phone_number}{member.address ? ` • ${member.address}` : ''}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-4 py-3 text-sm text-gray-500 text-center">Data member tidak ditemukan</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center justify-between p-3.5 border border-gray-200 rounded-lg bg-white shadow-sm">
                                <div className="flex items-center gap-4">
                                    {selectedMember.customer_code && (
                                        <CodeBadge variant="table">{selectedMember.customer_code}</CodeBadge>
                                    )}
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-gray-800">{selectedMember.customer_name}</span>
                                        <span className="text-xs text-gray-500 mt-0.5">{selectedMember.phone_number} • {selectedMember.address}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedMember(null)}
                                    className="text-red-500 text-sm font-medium hover:text-red-600 transition-colors px-2"
                                >
                                    Ganti
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </FormSectionCard>

            {/* SECTION 2: BARANG */}
            <FormSectionCard title="Barang">
                <div className="flex flex-col gap-3">
                    {items.map((it) => (
                        <InventoryItemCard
                            key={it._rowId}
                            code={it.no_seri || '-'}
                            name={it._produk_label}
                            specs={[
                                it.berat ? `${it.berat} gr` : '',
                                it.karat ? `${it.karat}K` : '',
                            ].filter(Boolean).join(' • ')}
                            image={it._preview}
                            price={it.price}
                            onRemove={() => handleRemoveItem(it._rowId)}
                        />
                    ))}

                    {items.length === 0 && (
                        <EmptyState message="Belum ada barang yang ditambahkan." />
                    )}

                    <button
                        onClick={openItemModal}
                        className="w-full py-3 border-2 border-dashed border-primary-300 text-primary-600 rounded-lg font-medium hover:bg-primary-50 transition-colors flex items-center justify-center gap-2"
                    >
                        <PlusCircleIcon size={20} /> Tambah Item
                    </button>
                </div>
            </FormSectionCard>

            {/* SECTION 3: PEMBAYARAN */}
            <FormSectionCard title="Pembayaran" divider>
                <div className="flex flex-col mb-6">
                    <div className="flex justify-between py-3">
                        <span className="text-sm text-gray-500">Sub Total</span>
                        <span className="font-medium text-gray-800">{HelperFunctions.formatCurrency(subTotal)}</span>
                    </div>
                    <div className="flex justify-between py-4">
                        <span className="text-base font-bold text-gray-800">Total</span>
                        <span className="text-lg font-bold text-gray-900">{HelperFunctions.formatCurrency(subTotal)}</span>
                    </div>
                </div>

                <div className="flex flex-col gap-1.5 mb-6">
                    <label className="text-sm font-medium text-gray-700">Metode Pembayaran</label>
                    <div className="flex gap-2 p-1 bg-gray-50 border border-gray-200 rounded-lg w-full">
                        <button
                            onClick={() => setPaymentMethod('tunai')}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${paymentMethod === 'tunai' ? 'bg-primary-50 text-primary-600 border border-primary-200 shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}
                        >
                            Tunai
                        </button>
                        <button
                            onClick={() => setPaymentMethod('transfer')}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${paymentMethod === 'transfer' ? 'bg-primary-50 text-primary-600 border border-primary-200 shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}
                        >
                            Transfer
                        </button>
                    </div>

                    {paymentMethod === 'transfer' && (
                        <div className="flex flex-col gap-4 mt-2">
                            {/* Rekening customer (penerima uang) */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-medium text-gray-900">Nama Penerima<span className="text-red-500"> *</span></label>
                                    <input
                                        type="text"
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                                        value={namaPenerima}
                                        onChange={(e) => setNamaPenerima(e.target.value)}
                                        placeholder="Masukkan nama penerima"
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-medium text-gray-900">Bank<span className="text-red-500"> *</span></label>
                                    <input
                                        type="text"
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                                        value={bankPenerima}
                                        onChange={(e) => setBankPenerima(e.target.value)}
                                        placeholder="Contoh: BCA"
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-gray-900">No. Rekening<span className="text-red-500"> *</span></label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                                    value={rekeningPenerima}
                                    onChange={(e) => setRekeningPenerima(e.target.value.replace(/\D/g, ''))}
                                    placeholder="Masukkan no. rekening penerima"
                                />
                            </div>

                            {/* Bank Keluar (kas toko) */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-gray-900">Bank Keluar<span className="text-red-500"> *</span></label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {bankOptions.map((bc) => (
                                        <div
                                            key={bc.id}
                                            onClick={() => setSelectedBankId(bc.id)}
                                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                                                selectedBankId === bc.id
                                                    ? 'border-primary-500 bg-primary-50/50'
                                                    : 'border-gray-200 bg-white hover:bg-gray-50'
                                            }`}
                                        >
                                            <div className="w-10 h-10 bg-neutral-500 rounded-md flex items-center justify-center text-white font-extrabold italic text-sm shadow-sm flex-shrink-0">
                                                {bc.bank?.bank_code ?? bc.bank?.bank_name?.slice(0, 3)?.toUpperCase() ?? '-'}
                                            </div>
                                            <div className="flex flex-col overflow-hidden">
                                                <span className="text-sm font-bold text-gray-900 truncate">{bc.nama_pemilik}</span>
                                                <span className="text-[11px] font-medium text-gray-500 mt-0.5 truncate">{bc.nomor_rekening} • {bc.bank?.bank_name}</span>
                                            </div>
                                        </div>
                                    ))}
                                    {bankOptions.length === 0 && (
                                        <p className="text-sm text-gray-500 col-span-2">Tidak ada rekening tersedia.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </FormSectionCard>

            {/* Action Buttons */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => setCurentState('main')}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                    Batal
                </button>
                <button
                    onClick={handleSubmit}
                    className={`px-6 py-2 rounded-lg font-medium text-white transition-colors ${isFormValid && !submitting ? 'bg-primary-500 hover:bg-primary-600' : 'bg-gray-300 cursor-not-allowed'}`}
                    disabled={!isFormValid || submitting}
                >
                    Ajukan Transaksi Buyback
                </button>
            </div>

            {/* MODAL TAMBAH ITEM */}
            <ModalCustom
                isOpen={isItemModalOpen}
                onClose={() => setIsItemModalOpen(false)}
                title="Tambah Item"
                confirmTextButton="Tambah"
                cancelTextButton="Batal"
                handleOnSubmit={handleSaveItem}
            >
                <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Dropdown
                            label="Produk (master)"
                            name="product_id"
                            value={item.product_id}
                            options={productOptions}
                            placeholder="Pilih produk"
                            isRequired
                            error={itemErrors.product_id}
                            onChange={handleItemChange}
                        />
                        <PhotoInput
                            label="Foto Item"
                            name="foto"
                            value={item.foto}
                            helperText="Foto berformat JPG, JPEG, atau PNG."
                            accept="image/*"
                            onChange={handleItemChange}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Berat (gr)"
                            name="berat"
                            type="text"
                            inputMode="decimal"
                            value={item.berat}
                            placeholder="0"
                            isRequired
                            error={itemErrors.berat}
                            onChange={handleItemChange}
                        />
                        <Input
                            label="Karat"
                            name="karat"
                            type="text"
                            inputMode="numeric"
                            value={item.karat}
                            placeholder="0"
                            isRequired
                            error={itemErrors.karat}
                            onChange={handleItemChange}
                        />
                    </div>

                    <Input
                        label="No. Seri (opsional)"
                        name="no_seri"
                        type="text"
                        value={item.no_seri}
                        placeholder="Contoh: ABCD1234"
                        onChange={handleItemChange}
                    />

                    <CurrencyInput
                        label="Harga Beli"
                        name="price"
                        value={item.price}
                        placeholder="0"
                        isRequired
                        error={itemErrors.price}
                        onChange={handleItemChange}
                    />
                </div>
            </ModalCustom>
        </div>
    );
};

export default FormAdd;
