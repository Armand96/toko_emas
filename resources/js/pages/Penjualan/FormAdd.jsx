import { useState, useMemo, useRef, useEffect } from "react";
import { useDebounce } from "use-debounce";
import { ScanIcon, CaretRightIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";
import HeaderSection from "../../components/HeaderSection";
import ModalScanBarcode from "./ModaScanBarcode";
import InventoryItemCard from "../../components/InventoryItemCard";
import HelperFunctions from "../../utils/HelperFunctions";
import LoadingStore from "../../Store/LoadingStore";
import { showAlert } from "../../utils/showAlert";
import CustomerApis from "../../Services/Customer.apis";
import InventoryApis from "../../Services/Inventory.apis";
import BankApis from "../../Services/Bank.apis";
import PenjualanApis from "../../Services/Penjualan.apis";
import OptionsStore from "../../Store/OptionsStore";
import AuthStore from "../../Store/AuthStore";
import CurrencyInput from "../../components/FormElement/SingleElement/CurrencyInput";
import Dropdown from "../../components/FormElement/SingleElement/Dropdown";

const FormAdd = ({ setCurentState }) => {
    const setLoading = LoadingStore((state) => state.setLoading);
    const ensureProducts = OptionsStore((s) => s.ensureProducts);
    const user = AuthStore((s) => s.user);

    // State Tab Customer
    const [customerType, setCustomerType] = useState('baru'); // 'baru' | 'terdaftar'

    // State Customer Baru
    const [customerData, setCustomerData] = useState({
        nama: "",
        hp: "",
        alamat: ""
    });

    // State Member Terdaftar (Search & Suggestion)
    const [searchQuery, setSearchQuery] = useState("");
    const [searchQueryBounce] = useDebounce(searchQuery, 500);
    const [memberOptions, setMemberOptions] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedMember, setSelectedMember] = useState(null);
    const searchRef = useRef(null);

    // Ambil opsi member saat tab "terdaftar" aktif & setiap kata kunci berubah (debounced).
    useEffect(() => {
        if (customerType !== 'terdaftar') return;
        CustomerApis.GetCustomer(`?customer_name=${searchQueryBounce}&per_page=20`)
            .then((res) => setMemberOptions(res?.data || []))
            .catch((err) => console.error(err));
    }, [customerType, searchQueryBounce]);

    // Handle klik di luar untuk menutup dropdown suggestion
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setIsSearching(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // State Keranjang Penjualan
    const [cartItems, setCartItems] = useState([]);

    // State Pilih Item (dropdown)
    const [inventoryOptions, setInventoryOptions] = useState([]);
    const [productOptions, setProductOptions] = useState([]);

    useEffect(() => {
        const branchFilter = user?.branch_id ? `&branch_id=${user.branch_id}` : '';
        InventoryApis.GetInventory(`?status=AVAILABLE&per_page=10000000${branchFilter}`)
            .then((res) => setInventoryOptions(res?.data || []))
            .catch((err) => console.error(err));

        ensureProducts()
            .then((data) => setProductOptions(data))
            .catch((err) => console.error(err));
    }, [user?.branch_id]);

    const getProductName = (productId) => {
        const product = productOptions.find((p) => p.id === productId);
        return product?.product_name ?? 'Produk';
    };

    // State Pembayaran
    const [paymentMethod, setPaymentMethod] = useState('tunai');
    const [bankOptions, setBankOptions] = useState([]);
    const [selectedBankId, setSelectedBankId] = useState(null);
    const [namaPengirim, setNamaPengirim] = useState('');
    const [rekeningPengirim, setRekeningPengirim] = useState('');

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

    const [uangDibayar, setUangDibayar] = useState(0);
    const [isScanModalOpen, setIsScanModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const subTotal = useMemo(() => cartItems.reduce((sum, item) => sum + Number(item.price || 0), 0), [cartItems]);
    const kembalian = useMemo(() => (uangDibayar || 0) - subTotal, [uangDibayar, subTotal]);

    const isFormValid = useMemo(() => {
        if (cartItems.length === 0) return false;

        if (customerType === 'baru') {
            if (!customerData.nama || !customerData.hp || !customerData.alamat) return false;
        } else if (!selectedMember) {
            return false;
        }

        if (paymentMethod === 'tunai') {
            if (!uangDibayar || uangDibayar < subTotal) return false;
        } else {
            if (!selectedBankId || !namaPengirim || !rekeningPengirim) return false;
        }

        return true;
    }, [cartItems, customerType, customerData, selectedMember, paymentMethod, uangDibayar, subTotal, selectedBankId, namaPengirim, rekeningPengirim]);

    const mapInventoryToCartItem = (inv) => ({
        inventory_code: inv.inventory_code,
        product_id: inv.product_id,
        branch_id: inv.branch_id,
        name: getProductName(inv.product_id),
        specs: `${inv.berat ? `${inv.berat}g` : ''}${inv.karat ? ` • ${inv.karat}K` : ''}`,
        price: Number(inv.jual || 0),
        image: HelperFunctions.getStorageUrl(inv.thumb_path),
    });

    const handleSelectItem = (e) => {
        const inventoryId = e.target.value;
        if (!inventoryId) return;

        if (cartItems.some((item) => item.inventory_code === inventoryId)) {
            showAlert({ icon: 'warning', title: 'Perhatian', message: 'Produk ini sudah ada di keranjang!' });
            return;
        }

        const found = inventoryOptions.find((inv) => inv.inventory_code === inventoryId);
        if (!found) return;

        setCartItems((prev) => [...prev, mapInventoryToCartItem(found)]);
    };

    const itemDropdownOptions = useMemo(() => {
        return inventoryOptions
            .filter((inv) => !cartItems.some((item) => item.inventory_code === inv.inventory_code))
            .map((inv) => ({
                value: inv.inventory_code,
                label: `${inv.inventory_code} - ${getProductName(inv.product_id)} (${inv.berat ?? '-'}g • ${inv.karat ?? '-'}K)`,
            }));
    }, [inventoryOptions, cartItems, productOptions]);

    const handleRemoveItem = (idToRemove) => {
        setCartItems(cartItems.filter(item => item.inventory_code !== idToRemove));
    };

    const handleScanSuccess = async (decodedText) => {
        if (cartItems.some(item => item.inventory_code === decodedText)) {
            showAlert({ icon: 'warning', title: 'Perhatian', message: 'Produk ini sudah ada di keranjang!' });
            setIsScanModalOpen(false);
            return;
        }

        const found = inventoryOptions.find((inv) => inv.inventory_code === decodedText || inv.barcode === decodedText);
        if (found) {
            setCartItems((prev) => [...prev, mapInventoryToCartItem(found)]);
            setIsScanModalOpen(false);
            return;
        }

        setLoading(true);
        try {
            const res = await InventoryApis.GetInventory(`?search=${decodedText}&status=AVAILABLE&per_page=10`);
            const match = (res?.data || []).find((inv) => inv.inventory_code === decodedText || inv.barcode === decodedText);
            if (match) {
                setCartItems((prev) => [...prev, mapInventoryToCartItem(match)]);
            } else {
                showAlert({ icon: 'error', title: 'Tidak Ditemukan', message: `Item dengan kode ${decodedText} tidak ditemukan di inventory.` });
            }
        } catch (error) {
            console.error(error);
            showAlert({ icon: 'error', title: 'Gagal', message: 'Gagal mencari item di inventory.' });
        } finally {
            setLoading(false);
            setIsScanModalOpen(false);
        }
    };

    // Auto-fill nama pengirim jika pilih member terdaftar
    useEffect(() => {
        if (selectedMember && paymentMethod === 'transfer') {
            setNamaPengirim(selectedMember.customer_name);
        } else if (customerType === 'baru' && paymentMethod === 'transfer') {
            setNamaPengirim(customerData.nama);
        }
    }, [selectedMember, customerType, customerData.nama, paymentMethod]);

    const handleSubmit = async () => {
        if (cartItems.length === 0) {
            showAlert({ icon: 'warning', title: 'Perhatian', message: 'Keranjang penjualan masih kosong.' });
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

        if (paymentMethod === 'tunai' && (!uangDibayar || uangDibayar < subTotal)) {
            showAlert({ icon: 'warning', title: 'Perhatian', message: 'Uang dibayar belum diisi atau kurang dari total.' });
            return;
        }

        if (paymentMethod === 'transfer' && (!selectedBankId || !namaPengirim || !rekeningPengirim)) {
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
                item: cartItems.map((item) => ({
                    inventory_code: item.inventory_code,
                    product_id: item.product_id,
                    price: item.price,
                })),
            };

            if (paymentMethod === 'tunai') {
                payload.nominal_paid = uangDibayar;
                payload.exchange = kembalian > 0 ? kembalian : 0;
            } else {
                payload.receiver_bank_id = selectedBankId;
                payload.sender_bank_name = namaPengirim;
                payload.sender_rekening = rekeningPengirim;
            }

            await PenjualanApis.PostPenjualan(payload);

            showAlert({ icon: 'success', isAutoClose: false, title: 'Berhasil', message: 'Transaksi penjualan berhasil diajukan.' });
            setCurentState('main');
        } catch (error) {
            console.error(error);
            showAlert({ icon: 'error', title: 'Gagal', message: error?.response?.data?.message || 'Gagal mengajukan transaksi penjualan.' });
        } finally {
            setSubmitting(false);
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 w-full">
            <HeaderSection
                title="Input Penjualan"
                description="Masukkan detail transaksi penjualan dan pilih item yang akan dijual."
            />

            {/* SECTION 1: DATA CUSTOMER */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                    <div className="w-1 h-5 bg-primary-500 rounded-full"></div>
                    <h3 className="text-lg font-semibold text-gray-800">Data Customer</h3>
                </div>

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
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-gray-700">Nama Customer<span className="text-error-500">*</span></label>
                            <input
                                type="text"
                                className="input-field border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                value={customerData.nama}
                                onChange={(e) => setCustomerData({ ...customerData, nama: e.target.value })}
                                placeholder="Masukkan nama customer"
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-gray-700">No. HP<span className="text-error-500">*</span></label>
                            <input
                                type="text"
                                className="input-field border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                value={customerData.hp}
                                onChange={(e) => setCustomerData({ ...customerData, hp: e.target.value })}
                                placeholder="Contoh: 08xxxxxxxxxx"
                            />
                        </div>
                        <div className="flex flex-col gap-1.5 col-span-2">
                            <label className="text-sm font-medium text-gray-700">Alamat<span className="text-error-500">*</span></label>
                            <input
                                type="text"
                                className="input-field border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
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
                                                    <div className="font-semibold text-sm text-gray-800">{member.customer_name}</div>
                                                    <div className="text-xs text-gray-500 mt-0.5">{member.phone_number}</div>
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
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-gray-800">{selectedMember.customer_name}</span>
                                        <span className="text-xs text-gray-500 mt-0.5">{selectedMember.phone_number} • {selectedMember.address}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedMember(null)}
                                    className="text-error-500 text-sm font-medium hover:text-error-600 transition-colors px-2"
                                >
                                    Ganti
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* SECTION 2: KERANJANG PENJUALAN */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                    <div className="w-1 h-5 bg-primary-500 rounded-full"></div>
                    <h3 className="text-lg font-semibold text-gray-800">Keranjang Penjualan</h3>
                </div>

                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => setIsScanModalOpen(true)}
                        className="flex flex-1 items-center justify-center gap-2 py-2.5 border border-primary-500 text-primary-600 rounded-lg font-medium hover:bg-primary-50 transition-colors"
                    >
                        <ScanIcon size={20} />
                        Scan QR Code
                    </button>
                    <span className="text-gray-400 text-sm">atau</span>
                    <div className="flex-1">
                        <Dropdown
                            name="item_select"
                            value=""
                            options={itemDropdownOptions}
                            placeholder="Pilih item.."
                            onChange={handleSelectItem}
                        />
                    </div>
                </div>

                {/* List Items */}
                <div className="flex flex-col gap-3">
                    {cartItems.map((item) => (
                        <InventoryItemCard
                            key={item.inventory_code}
                            code={item.inventory_code}
                            name={item.name}
                            specs={item.specs}
                            image={item.image}
                            price={item.price}
                            onRemove={() => handleRemoveItem(item.inventory_code)}
                        />
                    ))}

                    {cartItems.length === 0 && (
                        <p className="text-center text-gray-500 py-4">Belum ada item yang ditambahkan.</p>
                    )}
                </div>
            </div>

            {/* SECTION 3: PEMBAYARAN */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                    <div className="w-1 h-5 bg-primary-500 rounded-full"></div>
                    <h3 className="text-lg font-semibold text-gray-800">Pembayaran</h3>
                </div>

                <div className="flex flex-col mb-6">
                    <div className="flex justify-between py-3 border-b border-dashed border-gray-200">
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

                    {/* --- UANG DIBAYAR & KEMBALIAN (HANYA MUNCUL JIKA TUNAI) --- */}
                    {paymentMethod === 'tunai' && (
                        <div className="grid grid-cols-2 gap-4 mt-2">
                            <CurrencyInput
                                label="Uang Dibayar"
                                name="uangDibayar"
                                value={uangDibayar}
                                isRequired
                                placeholder="0"
                                onChange={(e) => setUangDibayar(Number(e.target.value))}
                            />
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-gray-700">Kembalian</label>
                                <div className="w-full border border-gray-200 rounded-lg px-3 py-2.5 bg-gray-50 text-gray-800 font-medium">
                                    {HelperFunctions.formatCurrency(kembalian > 0 ? kembalian : 0)}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- PILIHAN REKENING & NAMA PENGIRIM (HANYA MUNCUL JIKA TRANSFER) --- */}
                    {paymentMethod === 'transfer' && (
                        <div className="flex flex-col gap-4 mt-2">
                            {/* Pilihan Rekening Tujuan */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-gray-900">Rekening Tujuan<span className="text-error-500">*</span></label>
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

                            {/* Input Nama & Rekening Pengirim */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-medium text-gray-900">Nama Pengirim<span className="text-error-500">*</span></label>
                                    <input
                                        type="text"
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                                        value={namaPengirim}
                                        onChange={(e) => setNamaPengirim(e.target.value)}
                                        placeholder="Masukkan nama pengirim"
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-medium text-gray-900">No. Rekening Pengirim<span className="text-error-500">*</span></label>
                                    <input
                                        type="text"
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                                        value={rekeningPengirim}
                                        onChange={(e) => setRekeningPengirim(e.target.value)}
                                        placeholder="Masukkan no. rekening pengirim"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

            </div>

            {/* Action Buttons (inline di paling bawah konten) */}
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
                    Ajukan Transaksi Penjualan
                </button>
            </div>

            {/* Panggil ModalScanBarcode */}
            <ModalScanBarcode
                isOpen={isScanModalOpen}
                onClose={() => setIsScanModalOpen(false)}
                onScanSuccess={handleScanSuccess}
            />
        </div>
    );
};

export default FormAdd;
