import { useState } from 'react';
import { ArrowRight, Scan, X, Image as ImageIcon } from "@phosphor-icons/react";
import HeaderSection from "../../../components/HeaderSection"; // Sesuaikan path
import ModalScanBarcode from "../../../components/ModaScanBarcode"; // Sesuaikan path

const FormAdd = ({ setCurentState }) => {
    // State form dasar
    const [formData, setFormData] = useState({
        cabang_asal: 'Blok M 1', // Sesuai gambar, biasanya auto-fill/disabled
        cabang_tujuan: 'Blok M 2',
        catatan: 'Pindah tempat'
    });

    // State untuk daftar barang
    const [selectedItems, setSelectedItems] = useState([
        { id: 1, code: 'GLD0100000', name: 'Kalung Italy Rantai', weight: '5g', karat: '18K', price: 'Rp 19.500.000' },
        { id: 2, code: 'GLD0100001', name: 'Gelang Flower', weight: '8g', karat: '20K', price: 'Rp 19.500.000' }
    ]);

    // State untuk Modal Scan
    const [isScanModalOpen, setIsScanModalOpen] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleRemoveItem = (idToRemove) => {
        setSelectedItems(prev => prev.filter(item => item.id !== idToRemove));
    };

    const handleScanSuccess = (scannedCode) => {
        // Simulasi menambahkan barang dari hasil scan
        // Di *real case*, Anda mungkin perlu fetch ke API/Database untuk get detail item berdasarkan barcode
        const newItem = {
            id: Date.now(),
            code: scannedCode,
            name: 'Item Hasil Scan',
            weight: '0g',
            karat: '24K',
            price: 'Rp 0'
        };
        setSelectedItems(prev => [...prev, newItem]);
    };

    return (
        <div className="w-full h-full flex flex-col gap-6 bg-gray-50/50 p-6 min-h-screen">
            {/* Bagian Header Tetap Sama */}
            <HeaderSection
                title="Input Transfer"
                description="Lengkapi informasi transfer dan pilih item inventory yang akan ditransfer antar cabang."
            />

            <div className="w-full flex flex-col gap-6">

                {/* --- CARD 1: INFORMASI TRANSFER --- */}
                <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-1 h-5 bg-blue-500 rounded-full"></div>
                        <h2 className="text-lg font-semibold text-gray-900">Informasi Transfer</h2>
                    </div>

                    <div className="flex flex-col gap-5">
                        {/* Row Cabang Asal & Tujuan */}
                        <div className="flex items-center gap-4">
                            <div className="flex-1 flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-gray-700">Cabang Asal</label>
                                <input
                                    type="text"
                                    value={formData.cabang_asal}
                                    disabled
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 outline-none"
                                />
                            </div>

                            <div className="mt-6 text-gray-400">
                                <ArrowRight size={20} weight="bold" />
                            </div>

                            <div className="flex-1 flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-gray-700">
                                    Cabang Tujuan<span className="text-red-500 ml-1">*</span>
                                </label>
                                <select
                                    name="cabang_tujuan"
                                    value={formData.cabang_tujuan}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer"
                                >
                                    <option value="" disabled>Pilih Cabang Tujuan</option>
                                    <option value="Blok M 2">Blok M 2</option>
                                    <option value="Blok M 3">Blok M 3</option>
                                </select>
                            </div>
                        </div>

                        {/* Textarea Catatan */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-gray-700">
                                Catatan<span className="text-red-500 ml-1">*</span>
                            </label>
                            <textarea
                                name="catatan"
                                value={formData.catatan}
                                onChange={handleInputChange}
                                placeholder="Masukkan catatan..."
                                rows="3"
                                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                            ></textarea>
                        </div>
                    </div>
                </div>

                {/* --- CARD 2: DAFTAR BARANG --- */}
                <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-1 h-5 bg-blue-500 rounded-full"></div>
                        <h2 className="text-lg font-semibold text-gray-900">Daftar Barang</h2>
                    </div>

                    <div className="flex flex-col gap-6">
                        {/* Row Input Barang (Scan & Select) */}
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setIsScanModalOpen(true)}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 border border-blue-500 text-blue-500 bg-white rounded-lg hover:bg-blue-50 transition-colors font-medium text-sm cursor-pointer"
                            >
                                <Scan size={20} />
                                Scan Barcode
                            </button>

                            <span className="text-sm text-gray-400 font-medium">atau</span>

                            <div className="flex-[2]">
                                <select className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer">
                                    <option value="">Pilih item..</option>
                                    <option value="item1">Kalung Italy Rantai</option>
                                    <option value="item2">Gelang Flower</option>
                                </select>
                            </div>
                        </div>

                        {/* List Selected Items */}
                        <div className="flex flex-col gap-3">
                            {selectedItems.map((item) => (
                                <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-gray-200 rounded-xl bg-white shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md text-xs font-semibold tracking-wide border border-blue-100">
                                            {item.code}
                                        </div>
                                        <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center text-orange-400 overflow-hidden">
                                            {/* Ganti dengan <img /> asli jika ada gambarnya */}
                                            <ImageIcon size={24} weight="fill" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-gray-900">{item.name}</span>
                                            <span className="text-xs text-gray-500">{item.weight} • {item.karat}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6 justify-between sm:justify-end">
                                        <span className="text-sm font-bold text-gray-900">{item.price}</span>
                                        <button
                                            onClick={() => handleRemoveItem(item.id)}
                                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                                        >
                                            <X size={16} weight="bold" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {selectedItems.length === 0 && (
                                <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl">
                                    Belum ada barang yang dipilih.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* --- FOOTER BUTTONS --- */}
                <div className="flex items-center justify-between mt-2 mb-8">
                    <button
                        onClick={() => setCurentState('main')}
                        className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm cursor-pointer"
                    >
                        Batal
                    </button>
                    <button
                        className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-sm cursor-pointer"
                    >
                        Ajukan Transfer Item
                    </button>
                </div>
            </div>

            {/* Modal Scanner */}
            <ModalScanBarcode
                isOpen={isScanModalOpen}
                onClose={() => setIsScanModalOpen(false)}
                onScanSuccess={handleScanSuccess}
            />
        </div>
    );
};

export default FormAdd;
