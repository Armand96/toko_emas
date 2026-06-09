import { useState, useMemo, useRef, useEffect } from "react";
import { Scan, X, CaretRight, MagnifyingGlass } from "@phosphor-icons/react";
import HeaderSection from "../../components/HeaderSection";
import ModalScanBarcode from "./ModaScanBarcode"; // Sesuaikan path
import HelperFunctions from "../../utils/HelperFunctions";

// --- Dummy Data Member ---
const DUMMY_MEMBERS = [
    { id: 'MBR-0001', nama: 'Rohmatun Putri', hp: '08123456789', alamat: 'Jl. Merdeka Timur No. 24, Cempaka Putih, Jakarta Pusat' },
    { id: 'MBR-0002', nama: 'Siti Aminah', hp: '082145678901', alamat: 'Jl. Merdeka Timur No. 24, Cempaka Putih, Jakarta Pusat' },
    { id: 'MBR-0003', nama: 'Budi Santoso', hp: '085311223344', alamat: 'Jl. Mawar No. 5, Bandung' },
];

const FormAdd = ({ setCurentState }) => {
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
    const [isSearching, setIsSearching] = useState(false);
    const [selectedMember, setSelectedMember] = useState(null);
    const searchRef = useRef(null);

    // Filter member berdasarkan input (nama, id, atau hp)
    const filteredMembers = useMemo(() => {
        if (!searchQuery) return DUMMY_MEMBERS;
        const lowerQuery = searchQuery.toLowerCase();
        return DUMMY_MEMBERS.filter(member =>
            member.nama.toLowerCase().includes(lowerQuery) ||
            member.id.toLowerCase().includes(lowerQuery) ||
            member.hp.includes(lowerQuery)
        );
    }, [searchQuery]);

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
    const [cartItems, setCartItems] = useState([
        {
            id: 'GLD0100000',
            name: 'Kalung Italy Rantai',
            specs: '5g • 18K',
            price: 19500000,
            image: 'https://via.placeholder.com/40/FDF3E7/D97706?text=K'
        }
    ]);

    // State Pembayaran
    const [paymentMethod, setPaymentMethod] = useState('tunai');
    const [selectedBank, setSelectedBank] = useState('bca'); // State untuk bank transfer
    const [namaPengirim, setNamaPengirim] = useState(''); // State untuk nama pengirim transfer

    const [uangDibayar, setUangDibayar] = useState(39000000);
    const [isScanModalOpen, setIsScanModalOpen] = useState(false);

    const subTotal = useMemo(() => cartItems.reduce((sum, item) => sum + item.price, 0), [cartItems]);
    const kembalian = useMemo(() => (uangDibayar || 0) - subTotal, [uangDibayar, subTotal]);

    const formatRp = (number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0
        }).format(number);
    };

    const handleRemoveItem = (idToRemove) => {
        setCartItems(cartItems.filter(item => item.id !== idToRemove));
    };

    const handleScanSuccess = (decodedText) => {
        console.log(`Barcode Scanned: ${decodedText}`);
        if (cartItems.some(item => item.id === decodedText)) {
            alert('Produk ini sudah ada di keranjang!');
            setIsScanModalOpen(false);
            return;
        }
        const newProduct = {
            id: decodedText,
            name: 'Produk Hasil Scan',
            specs: 'Unknown specs',
            price: 5000000,
            image: 'https://via.placeholder.com/40/FDF3E7/D97706?text=S'
        };
        setCartItems([...cartItems, newProduct]);
        setIsScanModalOpen(false);
    };

    // Auto-fill nama pengirim jika pilih member terdaftar
    useEffect(() => {
        if (selectedMember && paymentMethod === 'transfer') {
            setNamaPengirim(selectedMember.nama);
        } else if (customerType === 'baru' && paymentMethod === 'transfer') {
            setNamaPengirim(customerData.nama);
        }
    }, [selectedMember, customerType, customerData.nama, paymentMethod]);

    return (
        <div className="flex flex-col gap-6 w-full pb-20">
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
                                        placeholder="Cari nama / no. HP / kode member"
                                        value={searchQuery}
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value);
                                            setIsSearching(true);
                                        }}
                                        onFocus={() => setIsSearching(true)}
                                    />
                                    <MagnifyingGlass size={20} className="text-gray-400" />
                                </div>

                                {isSearching && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                        {filteredMembers.length > 0 ? (
                                            filteredMembers.map(member => (
                                                <div
                                                    key={member.id}
                                                    className="px-4 py-3 hover:bg-primary-50 cursor-pointer border-b border-gray-100 last:border-0 transition-colors"
                                                    onClick={() => {
                                                        setSelectedMember(member);
                                                        setSearchQuery("");
                                                        setIsSearching(false);
                                                    }}
                                                >
                                                    <div className="font-semibold text-sm text-gray-800">{member.nama}</div>
                                                    <div className="text-xs text-gray-500 mt-0.5">{member.id} • {member.hp}</div>
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
                                    <div className="px-3 py-1.5 bg-gray-50 text-gray-500 border border-gray-200 rounded-md text-sm font-medium">
                                        {selectedMember.id}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-gray-800">{selectedMember.nama}</span>
                                        <span className="text-xs text-gray-500 mt-0.5">{selectedMember.hp} • {selectedMember.alamat}</span>
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
                        <Scan size={20} />
                        Scan Barcode
                    </button>
                    <span className="text-gray-400 text-sm">atau</span>
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            placeholder="Pilih item.."
                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 outline-none cursor-pointer pr-10"
                            readOnly
                        />
                        <CaretRight size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                </div>

                {/* List Items */}
                <div className="flex flex-col gap-3">
                    {cartItems.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50/50">
                            <div className="flex items-center gap-4">
                                <div className="px-3 py-1 bg-gray-100 rounded text-xs font-medium text-gray-500 border border-gray-200">
                                    {item.id}
                                </div>
                                <img src={item.image} alt={item.name} className="w-10 h-10 rounded-md object-cover border border-gray-200" />
                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold text-gray-800">{item.name}</span>
                                    <span className="text-xs text-gray-500">{item.specs}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <span className="font-semibold text-gray-800">{formatRp(item.price)}</span>
                                <button
                                    onClick={() => handleRemoveItem(item.id)}
                                    className="p-1.5 text-error-500 hover:bg-error-50 rounded-md transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>
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

                    {/* --- PILIHAN REKENING & NAMA PENGIRIM (HANYA MUNCUL JIKA TRANSFER) --- */}
                    {paymentMethod === 'transfer' && (
                        <div className="flex flex-col gap-4 mt-2">
                            {/* Pilihan Bank */}
                            <div className="grid grid-cols-2 gap-4">
                                {/* Card BCA */}
                                <div
                                    onClick={() => setSelectedBank('bca')}
                                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                                        selectedBank === 'bca'
                                            ? 'border-primary-500 bg-primary-50/50'
                                            : 'border-gray-200 bg-white hover:bg-gray-50'
                                    }`}
                                >
                                    {/* Logo Tiruan BCA (Menggunakan CSS) */}
                                    <div className="w-10 h-10 bg-[#005EAA] rounded-md flex items-center justify-center text-white font-extrabold italic text-sm shadow-sm flex-shrink-0">
                                        BCA
                                    </div>
                                    <div className="flex flex-col overflow-hidden">
                                        <span className="text-sm font-bold text-gray-900 truncate">ABDULLOH ISMAIL</span>
                                        <span className="text-[11px] font-medium text-gray-500 mt-0.5 truncate">122378561274 • BANK CENTRAL ASIA</span>
                                    </div>
                                </div>

                                {/* Card BNI */}
                                <div
                                    onClick={() => setSelectedBank('bni')}
                                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                                        selectedBank === 'bni'
                                            ? 'border-primary-500 bg-primary-50/50'
                                            : 'border-gray-200 bg-white hover:bg-gray-50'
                                    }`}
                                >
                                    {/* Logo Tiruan BNI (Menggunakan CSS) */}
                                    <div className="w-10 h-10 bg-[#F05A28] rounded-md flex items-center justify-center text-white font-extrabold italic text-sm shadow-sm flex-shrink-0">
                                        BNI
                                    </div>
                                    <div className="flex flex-col overflow-hidden">
                                        <span className="text-sm font-bold text-gray-900 truncate">ABDULLOH ISMAIL</span>
                                        <span className="text-[11px] font-medium text-gray-500 mt-0.5 truncate">122378561274 • BANK NEGARA INDONESIA</span>
                                    </div>
                                </div>
                            </div>

                            {/* Input Nama Pengirim */}
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
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
                    <button
                        onClick={() => setCurentState('main')}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                    >
                        Batal
                    </button>
                    <button
                        className={`px-6 py-2 rounded-lg font-medium text-white transition-colors ${subTotal > 0 ? 'bg-primary-500 hover:bg-primary-600' : 'bg-gray-300 cursor-not-allowed'}`}
                        disabled={subTotal === 0}
                    >
                        Ajukan Transaksi Penjualan
                    </button>
                </div>
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
